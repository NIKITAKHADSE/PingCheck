import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import { createDbAccess } from '../src/db-access.js';
import { rememberConnection, consumeConnection, saveInstagramAccount, publicInstagramAccount } from '../src/instagram-connection.js';
import { createOAuthState, verifyOAuthState, getWebhookSubscription, subscribeWebhooks, getProfile } from '../src/meta.js';
import { config } from '../src/config.js';

const data = () => ({ users: [{ id: 'u', workspaceId: 'w' }], workspaces: [{ id: 'w' }, { id: 'other' }], oauthStates: [], instagramAccounts: [], integrations: [], automations: [] });

test('connection requests are single use and require an existing workspace user', () => {
  const d = data();
  rememberConnection(d, 'secret-state', 'u', 'w', 'http://localhost:5173');
  assert.equal(JSON.stringify(d).includes('secret-state'), false);
  assert.equal(d.oauthStates[0].id, d.oauthStates[0].hash);
  assert.match(d.oauthStates[0].id, /^[a-f0-9]{64}$/);
  assert.equal(consumeConnection(d, 'secret-state', 'other'), null);
  // A mismatched workspace cannot authorize a connection.
  rememberConnection(d, 'new-state', 'u', 'w', 'http://localhost:5173');
  assert.equal(consumeConnection(d, 'new-state', 'w').clientUrl, 'http://localhost:5173');
  assert.equal(consumeConnection(d, 'new-state', 'w'), null);
  rememberConnection(d, 'deleted-user', 'u', 'w', 'http://localhost:5173');
  d.users = [];
  assert.equal(consumeConnection(d, 'deleted-user', 'w'), null);
});

test('OAuth rejects tampering, invalid and future timestamps', () => {
  assert.equal(verifyOAuthState(createOAuthState('w')).workspaceId, 'w');
  assert.equal(verifyOAuthState('invalid'), null);
  for (const timestamp of ['not-a-time', Date.now() + 60000, Date.now() - 16 * 60000]) {
    const raw = `w.${timestamp}.nonce`;
    const sig = crypto.createHmac('sha256', config.sessionSecret).update(raw).digest('hex');
    assert.equal(verifyOAuthState(Buffer.from(`${raw}.${sig}`).toString('base64url')), null);
  }
});

test('reconnecting preserves account IDs and blocks cross-workspace ownership', () => {
  const d = data();
  const account = { workspaceId: 'w', instagramUserId: 'ig', tokenCiphertext: 'old-secret', connectedAt: 'original-date', webhookSubscribed: true };
  const first = saveInstagramAccount(d, account);
  d.automations.push({ workspaceId: 'w', instagramAccountId: first.id });
  const next = saveInstagramAccount(d, { ...account, tokenCiphertext: 'new-secret', connectedAt: 'new-date' });
  assert.equal(next.id, first.id);
  assert.equal(next.connectedAt, 'original-date');
  assert.equal(d.automations[0].instagramAccountId, first.id);
  assert.equal(d.instagramAccounts.length, 1);
  assert.equal(d.integrations.length, 1);
  assert.throws(() => saveInstagramAccount(d, { ...account, workspaceId: 'other' }), /another workspace/);
  assert.equal(d.instagramAccounts[0].workspaceId, 'w');
});

test('public account status excludes secrets and reports expiry', () => {
  const output = publicInstagramAccount({ tokenCiphertext: 'private-token', tokenExpiresAt: '2000-01-01', connectionStatus: 'CONNECTED' });
  assert.equal(output.connectionStatus, 'EXPIRED');
  assert.equal(output.expired, true);
  assert.equal(JSON.stringify(output).includes('private-token'), false);
  assert.equal(publicInstagramAccount({}).connectionStatus, 'UNCHECKED');
});

test('subscription check requires this app and all configured fields', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (_url, options) => {
    assert.ok(options.signal);
    assert.equal(options.headers.Authorization, 'Bearer token');
    return Response.json({ data: [{ id: config.meta.appId, subscribed_fields: config.meta.webhookFields }] });
  };
  assert.equal((await getWebhookSubscription('token', 'ig')).subscribed, true);
  globalThis.fetch = async () => Response.json({ data: [{ id: 'unrelated-app', subscribed_fields: config.meta.webhookFields }] });
  assert.equal((await getWebhookSubscription('token', 'ig')).subscribed, false);
  const confirmed = await getWebhookSubscription('token', 'ig', { justSubscribed: true });
  assert.equal(confirmed.subscribed, true);
  assert.equal(confirmed.appId, 'unrelated-app');
  assert.equal((await getWebhookSubscription('token', 'ig', { appId: confirmed.appId })).subscribed, true);
  globalThis.fetch = async () => Response.json({ data: ['one', 'two'].map(id => ({ id, subscribed_fields: config.meta.webhookFields })) });
  assert.equal((await getWebhookSubscription('token', 'ig', { justSubscribed: true })).subscribed, false);
  globalThis.fetch = async () => Response.json({ data: [{ id: config.meta.appId, subscribed_fields: [] }] });
  assert.equal((await getWebhookSubscription('token', 'ig')).subscribed, false);
  globalThis.fetch = async () => Response.json({ success: false });
  await assert.rejects(subscribeWebhooks('token', 'ig'), /did not confirm/);
  globalThis.fetch = async () => { throw new Error('token-containing-network-error'); };
  await assert.rejects(getProfile('token'), /could not be reached/);
});

test('database queue preserves concurrent changes, isolates reads and recovers from errors', async () => {
  let persisted = { items: [] };
  const db = { data: null,
    async read() { const snapshot = structuredClone(persisted); await new Promise(resolve => setImmediate(resolve)); this.data = snapshot; },
    async write() { persisted = structuredClone(this.data); }
  };
  const store = createDbAccess(db, { items: [] });
  await Promise.all([store.mutate(d => d.items.push('A')), store.readDb(), store.mutate(d => d.items.push('B'))]);
  assert.deepEqual(persisted.items, ['A', 'B']);
  const snapshot = await store.readDb();
  snapshot.items.push('outside');
  assert.deepEqual((await store.readDb()).items, ['A', 'B']);
  await assert.rejects(store.mutate(d => { d.items.push('failed'); throw new Error('failure'); }), /failure/);
  await store.mutate(d => d.items.push('C'));
  assert.deepEqual(persisted.items, ['A', 'B', 'C']);
});

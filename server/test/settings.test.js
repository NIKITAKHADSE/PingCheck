import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createSettingsRouter, validatePreferences, automationTemplate } from '../src/settings.js';

test('preferences reject invalid names, time zones and display values', () => {
  const valid = { name: ' Shop ', timeZone: 'Asia/Calcutta', dateStyle: 'medium' };
  assert.equal(validatePreferences(valid).name, 'Shop');
  for (const patch of [{ name: '' }, { name: 'x'.repeat(101) }, { timeZone: 'invalid' }, { dateStyle: 'custom' }]) assert.throws(() => validatePreferences({ ...valid, ...patch }));
});
test('template excludes account bindings, credentials and metrics', () => {
  const result = automationTemplate({ name: 'Flow', keyword: 'PRICE', instagramAccountId: 'private', workspaceId: 'w', token: 'secret', mediaId: 'post', runs: 22 });
  assert.deepEqual(result, { name: 'Flow', keyword: 'PRICE' });
});
test('settings API scopes changes, creates draft copies and protects deletion', async t => {
  const data = {
    users: [{ id: 'u', workspaceId: 'w' }, { id: 'other', workspaceId: 'other' }],
    workspaces: [{ id: 'w', name: 'Shop' }, { id: 'other', name: 'Other' }],
    workspaceMembers: [{ workspaceId: 'w', userId: 'u', role: 'OWNER' }, { workspaceId: 'other', userId: 'other', role: 'OWNER' }],
    automations: [{ id: 'a', workspaceId: 'w', name: 'Price', keyword: 'PRICE', status: 'ACTIVE', mediaId: 'old-post' }, { id: 'b', workspaceId: 'other', name: 'Private' }],
    instagramAccounts: [{ id: 'ig', workspaceId: 'w', instagramUserId: '123', username: 'shop' }, { id: 'foreign', workspaceId: 'other', instagramUserId: '456' }],
    contacts: [], conversations: [], messages: [], automationRuns: [], webhookEvents: [], activity: [], campaigns: [], knowledgeSources: [], teamInvites: [], integrations: [],
    sessions: [{ userId: 'u' }, { userId: 'other' }]
  };
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.workspaceId = 'w'; req.user = { id: req.headers['x-viewer'] ? 'viewer' : 'u' }; next(); });
  app.use(createSettingsRouter({ readDb: async () => data, mutate: async fn => fn(data) }));
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  t.after(() => { server.closeAllConnections(); server.close(); });
  const request = (path, method = 'GET', body, headers = {}) => fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
  assert.equal((await request('/', 'PUT', { name: 'Shop', timeZone: 'UTC', dateStyle: 'long' }, { 'x-viewer': '1' })).status, 403);
  assert.equal((await request('/', 'PUT', { name: 'Shop', timeZone: 'UTC', dateStyle: 'long' })).status, 200);
  assert.equal(data.workspaces[0].timeZone, 'UTC');
  assert.equal((await request('/clone', 'POST', { accountId: 'foreign' })).status, 400);
  assert.equal((await (await request('/clone', 'POST', { accountId: 'ig' })).json()).count, 1);
  const copy = data.automations.find(a => a.clonedFrom === 'a');
  assert.equal(copy.status, 'DRAFT'); assert.equal(copy.mediaId, ''); assert.equal(copy.instagramAccountId, '123');
  assert.equal((await (await request('/clone', 'POST', { accountId: 'ig' })).json()).count, 0);
  const template = await (await request('/template')).json();
  assert.ok(!JSON.stringify(template).includes('Private'));
  assert.equal((await request('/', 'DELETE', { confirmation: 'wrong' })).status, 400);
  data.workspaceMembers.push({ workspaceId: 'w', userId: 'teammate', role: 'AGENT' });
  assert.equal((await request('/', 'DELETE', { confirmation: 'Shop' })).status, 400);
  data.workspaceMembers.pop();
  assert.equal((await request('/', 'DELETE', { confirmation: 'Shop' })).status, 200);
  assert.deepEqual(data.users.map(u => u.id), ['other']);
  assert.deepEqual(data.automations.map(a => a.id), ['b']);
  assert.deepEqual(data.sessions.map(s => s.userId), ['other']);
});

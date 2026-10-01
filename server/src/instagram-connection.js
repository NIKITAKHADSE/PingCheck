import crypto from 'node:crypto';
import { nanoid } from 'nanoid';

const stateHash = state => crypto.createHash('sha256').update(state).digest('hex');

export function rememberConnection(data, state, userId, workspaceId, clientUrl) {
  data.oauthStates ||= [];
  data.oauthStates = data.oauthStates.filter(item => Date.parse(item.expiresAt) > Date.now());
  const hash = stateHash(state);
  // app_records persists collection items by `id`. Using the state hash as the
  // record ID keeps the raw OAuth state secret while allowing serverless
  // callbacks to load and consume the request in a later invocation.
  data.oauthStates.push({ id: hash, hash, userId, workspaceId, clientUrl,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() });
}

export function consumeConnection(data, state, workspaceId) {
  const hash = stateHash(state);
  const pending = (data.oauthStates || []).find(item => item.hash === hash && item.workspaceId === workspaceId && Date.parse(item.expiresAt) > Date.now());
  data.oauthStates = (data.oauthStates || []).filter(item => item.hash !== hash && Date.parse(item.expiresAt) > Date.now());
  if (!pending || !data.workspaces.some(w => w.id === workspaceId) ||
      !data.users.some(u => u.id === pending.userId && u.workspaceId === workspaceId)) return null;
  return pending;
}

export function saveInstagramAccount(data, account) {
  if (!data.workspaces.some(w => w.id === account.workspaceId)) throw new Error('This workspace no longer exists. Sign in again.');
  const sameIdentity = data.instagramAccounts.filter(a => String(a.instagramUserId) === String(account.instagramUserId));
  if (sameIdentity.some(a => a.workspaceId !== account.workspaceId)) {
    throw new Error('This Instagram account is already connected to another workspace. Disconnect it there before connecting it here.');
  }
  const existing = sameIdentity[0];
  const saved = { ...account, id: existing?.id || nanoid(), connectedAt: existing?.connectedAt || account.connectedAt,
    reconnectedAt: existing ? new Date().toISOString() : null };
  data.instagramAccounts = data.instagramAccounts.filter(a => !sameIdentity.includes(a));
  data.instagramAccounts.unshift(saved);
  // Repair references from older duplicate records while preserving external IDs.
  const oldIds = new Set(sameIdentity.map(a => a.id));
  for (const automation of data.automations) {
    if (automation.workspaceId === saved.workspaceId && oldIds.has(automation.instagramAccountId)) automation.instagramAccountId = saved.id;
  }
  data.integrations = data.integrations.filter(i => !(i.workspaceId === saved.workspaceId && i.provider === 'INSTAGRAM' && String(i.instagramUserId) === String(saved.instagramUserId)));
  data.integrations.push({ id: nanoid(), workspaceId: saved.workspaceId, provider: 'INSTAGRAM',
    status: saved.webhookSubscribed ? 'CONNECTED' : 'CONNECTED_WITH_WARNING', accountId: saved.id,
    instagramUserId: saved.instagramUserId, connectedAt: saved.connectedAt });
  return saved;
}

export function publicInstagramAccount(account) {
  const expired = Boolean(account.tokenExpiresAt && Date.parse(account.tokenExpiresAt) <= Date.now());
  return { id: account.id, instagramUserId: account.instagramUserId, username: account.username,
    name: account.displayName, accountType: account.accountType, profilePictureUrl: account.profilePictureUrl,
    connectedAt: account.connectedAt, tokenExpiresAt: account.tokenExpiresAt || null, expired,
    webhookSubscribed: Boolean(account.webhookSubscribed), webhookError: account.webhookError || '',
    lastCheckedAt: account.lastCheckedAt || null, connectionError: account.connectionError || '',
    connectionStatus: expired ? 'EXPIRED' : account.connectionStatus || 'UNCHECKED' };
}

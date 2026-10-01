import crypto from 'node:crypto';
import { config } from './config.js';

const OAUTH_URL = 'https://www.instagram.com/oauth/authorize';
const TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const GRAPH = 'https://graph.instagram.com';

async function metaFetch(url, options = {}) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
  } catch {
    throw new Error('Instagram could not be reached or took too long to respond. Please try again.');
  }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function apiError(payload, fallback) {
  if (payload?.error?.code === 200 && /api access blocked/i.test(String(payload.error.message || ''))) {
    return 'Meta has blocked API access for this app or Instagram account. In Meta App Dashboard, make sure the app is active, add this Instagram account as an app role/tester while in Development mode (or switch the approved app to Live), then reconnect the account in PingCheck.';
  }
  return payload?.error?.message || payload?.error_message || payload?.message || fallback;
}

export function metaConfigured() {
  return metaConfigurationIssues().length === 0;
}

function isPlaceholder(value) {
  return /(?:^|[._-])(your|replace|change[-_ ]?me|example)(?:[._-]|$)/i.test(String(value || ''));
}

export function metaConfigurationIssues() {
  const issues = [];
  if (!config.meta.appId || isPlaceholder(config.meta.appId)) issues.push('META_APP_ID is missing or still a placeholder.');
  else if (!/^\d+$/.test(config.meta.appId)) issues.push('META_APP_ID must be the numeric Instagram App ID from Meta App Dashboard > Instagram > API setup. Do not use the App Secret or an OAuth client secret here.');
  if (!config.meta.appSecret || isPlaceholder(config.meta.appSecret)) issues.push('META_APP_SECRET is missing or still a placeholder.');
  if (!config.meta.verifyToken || isPlaceholder(config.meta.verifyToken)) issues.push('META_VERIFY_TOKEN is missing or still a placeholder.');
  if (!config.encryptionKey || isPlaceholder(config.encryptionKey)) issues.push('TOKEN_ENCRYPTION_KEY is required to securely connect Instagram.');
  if (!config.sessionSecret || config.sessionSecret === 'flowvik-local-session-secret' || isPlaceholder(config.sessionSecret)) issues.push('Set a private SESSION_SECRET before connecting Instagram.');

  let appUrl;
  let redirectUrl;
  try { appUrl = new URL(config.appUrl); } catch { issues.push('APP_URL is not a valid URL.'); }
  try { redirectUrl = new URL(config.meta.redirectUri); } catch { issues.push('META_REDIRECT_URI is not a valid URL.'); }
  if (appUrl && (appUrl.protocol !== 'https:' || isPlaceholder(appUrl.hostname))) {
    issues.push('APP_URL must be your active public HTTPS tunnel/domain, not localhost or a placeholder.');
  }
  if (redirectUrl && (redirectUrl.protocol !== 'https:' || isPlaceholder(redirectUrl.hostname))) {
    issues.push('META_REDIRECT_URI must use your active public HTTPS tunnel/domain.');
  }
  if (appUrl && redirectUrl && appUrl.origin !== redirectUrl.origin) {
    issues.push('APP_URL and META_REDIRECT_URI must use the same origin.');
  }
  if (redirectUrl && redirectUrl.pathname !== '/api/integrations/meta/callback') {
    issues.push('META_REDIRECT_URI must end with /api/integrations/meta/callback.');
  }
  return issues;
}

export function createOAuthState(workspaceId) {
  const raw = `${workspaceId}.${Date.now()}.${crypto.randomBytes(10).toString('hex')}`;
  const sig = crypto.createHmac('sha256', config.sessionSecret).update(raw).digest('hex');
  return Buffer.from(`${raw}.${sig}`).toString('base64url');
}

export function verifyOAuthState(encoded) {
  try {
    const decoded = Buffer.from(encoded, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length !== 4) return null;
    const sig = parts.pop();
    const raw = parts.join('.');
    const expected = crypto.createHmac('sha256', config.sessionSecret).update(raw).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const [workspaceId, timestamp] = parts;
    const age = Date.now() - Number(timestamp);
    if (!workspaceId || !Number.isFinite(age) || age < 0 || age > 15 * 60 * 1000) return null;
    return { workspaceId };
  } catch {
    return null;
  }
}

export function buildOAuthUrl(state) {
  const url = new URL(OAUTH_URL);
  url.searchParams.set('client_id', config.meta.appId);
  url.searchParams.set('redirect_uri', config.meta.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  url.searchParams.set('scope', config.meta.scopes.join(','));
  url.searchParams.set('enable_fb_login', '0');
  url.searchParams.set('force_authentication', '1');
  return url.toString();
}

export async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: config.meta.appId,
    client_secret: config.meta.appSecret,
    grant_type: 'authorization_code',
    redirect_uri: config.meta.redirectUri,
    code
  });
  const response = await metaFetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const payload = await readJson(response);
  if (!response.ok || !payload.access_token) throw new Error(apiError(payload, 'Instagram authorization failed.'));
  return payload;
}

export async function exchangeLongLivedToken(shortToken) {
  const url = new URL(`${GRAPH}/access_token`);
  url.searchParams.set('grant_type', 'ig_exchange_token');
  url.searchParams.set('client_secret', config.meta.appSecret);
  url.searchParams.set('access_token', shortToken);
  const response = await metaFetch(url);
  const payload = await readJson(response);
  if (!response.ok || !payload.access_token) throw new Error(apiError(payload, 'Long-lived token exchange failed.'));
  return payload;
}

export async function getProfile(accessToken) {
  const url = new URL(`${GRAPH}/${config.meta.version}/me`);
  url.searchParams.set('fields', 'user_id,username,name,account_type,profile_picture_url');
  url.searchParams.set('access_token', accessToken);
  const response = await metaFetch(url);
  const payload = await readJson(response);
  if (!response.ok) throw new Error(apiError(payload, 'Could not load Instagram profile.'));
  return payload;
}

export async function subscribeWebhooks(accessToken, instagramUserId = 'me') {
  const url = new URL(`${GRAPH}/${config.meta.version}/${encodeURIComponent(instagramUserId)}/subscribed_apps`);
  url.searchParams.set('subscribed_fields', config.meta.webhookFields.join(','));
  const response = await metaFetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const payload = await readJson(response);
  if (!response.ok || payload.success !== true) throw new Error(apiError(payload, 'Instagram did not confirm the webhook subscription. Please retry the connection check.'));
  return payload;
}

export async function getWebhookSubscription(accessToken, instagramUserId, { appId = config.meta.appId, justSubscribed = false } = {}) {
  const response = await metaFetch(`${GRAPH}/${config.meta.version}/${encodeURIComponent(instagramUserId)}/subscribed_apps`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(apiError(payload, 'Could not check Instagram webhook subscriptions.'));
  const apps = Array.isArray(payload.data) ? payload.data : [];
  // Instagram Login and subscription responses can use different app IDs.
  // After a confirmed subscription, a single returned app is unambiguous.
  // Never guess which app is ours when multiple unmatched apps are returned.
  const app = apps.find(item => String(item.id) === String(appId)) || (justSubscribed && apps.length === 1 ? apps[0] : null);
  const fields = Array.isArray(app?.subscribed_fields) ? app.subscribed_fields : [];
  return { subscribed: Boolean(app) && config.meta.webhookFields.every(field => fields.includes(field)), fields, appId: app?.id ? String(app.id) : '' };
}

export async function listMedia(accessToken, limit = 25, after = '') {
  const url = new URL(`${GRAPH}/${config.meta.version}/me/media`);
  url.searchParams.set('fields', 'id,caption,media_type,media_product_type,permalink,timestamp,thumbnail_url,media_url');
  url.searchParams.set('limit', String(limit));
  if (after) url.searchParams.set('after', after);
  url.searchParams.set('access_token', accessToken);
  const response = await metaFetch(url);
  const payload = await readJson(response);
  if (!response.ok) throw new Error(apiError(payload, 'Could not load Instagram media.'));
  return { media: Array.isArray(payload.data) ? payload.data : [], nextCursor: payload.paging?.next ? payload.paging?.cursors?.after || '' : '' };
}

export async function sendPrivateReply(accessToken, instagramUserId, commentId, text) {
  if (!instagramUserId) throw new Error('Instagram account ID is required to send a private reply.');
  if (!commentId) throw new Error('Instagram comment ID is required to send a private reply.');

  const response = await metaFetch(`${GRAPH}/${config.meta.version}/${encodeURIComponent(instagramUserId)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text } })
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(apiError(payload, 'Instagram private reply failed.'));
  return payload;
}

export async function sendPublicCommentReply(accessToken, commentId, text) {
  if (!text) return null;
  const response = await metaFetch(`${GRAPH}/${config.meta.version}/${commentId}/replies`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: text })
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(apiError(payload, 'Public comment reply failed.'));
  return payload;
}

export function normalizeWebhook(payload) {
  const out = [];
  for (const entry of payload?.entry || []) {
    const accountId = String(entry?.id || '');
    for (const change of entry?.changes || []) {
      if (change?.field !== 'comments') continue;
      const value = change?.value || {};
      const mediaId = value?.media?.id ? String(value.media.id) : '';
      const adId = value?.ad_id || value?.ad?.id || value?.media?.ad_id || '';
      out.push({
        type: 'COMMENT',
        externalId: String(value.id || crypto.randomUUID()),
        accountId,
        commentId: String(value.id || ''),
        text: String(value.text || ''),
        senderId: value?.from?.id ? String(value.from.id) : '',
        senderUsername: value?.from?.username || '',
        mediaId,
        adId: adId ? String(adId) : '',
        sourceType: adId ? 'AD' : 'INSTAGRAM',
        payload: value
      });
    }
    for (const item of entry?.messaging || []) {
      if (!item?.message) continue;
      out.push({
        type: 'MESSAGE',
        externalId: String(item.message.mid || crypto.randomUUID()),
        accountId,
        senderId: item?.sender?.id ? String(item.sender.id) : '',
        text: String(item?.message?.text || ''),
        payload: item
      });
    }
  }
  return out;
}

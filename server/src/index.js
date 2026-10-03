import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import dns from 'node:dns';
import { nanoid } from 'nanoid';
import { OAuth2Client } from 'google-auth-library';
import { config } from './config.js';
import { readDb, mutate } from './db.js';
import {
  encryptSecret, decryptSecret, validateMetaSignature,
  hashPassword, verifyPassword, randomToken
} from './security.js';
import {
  metaConfigured, metaConfigurationIssues, createOAuthState, verifyOAuthState, buildOAuthUrl, exchangeCode,
  exchangeLongLivedToken, getProfile, subscribeWebhooks, getWebhookSubscription, normalizeWebhook, listMedia
} from './meta.js';
import { handleCommentEvent, matchesAutomation } from './automation.js';
import { organizeAutomation } from './automation-library.js';
import { answerQuestion, workspaceContext } from './ai.js';
import { dashboardSnapshot, liveAutomations } from './dashboard.js';
import settingsRouter from './settings.js';
import { privacyPage } from './privacy.js';
import { rememberConnection, consumeConnection, saveInstagramAccount, publicInstagramAccount } from './instagram-connection.js';

// Prefer IPv4 for outbound Meta API calls on Windows networks where IPv6 DNS
// answers are available but the IPv6 route is blocked or unavailable.
dns.setDefaultResultOrder('ipv4first');

const app = express();
app.get('/privacy', (_req, res) => {
  res.set('Cache-Control', 'no-store').type('html').send(privacyPage(process.env.PRIVACY_CONTACT_EMAIL || ''));
});
const googleClient = new OAuth2Client();
const now = () => new Date().toISOString();
const ok = (res, data = {}) => res.json({ ok: true, ...data });

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.clientUrls.includes(origin)) return callback(null, true);
    if (config.demoMode && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); }
}));

function safeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    workspaceId: user.workspaceId,
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider || 'LOCAL',
    picture: user.picture || ''
  };
}

async function createSession(userId) {
  const token = randomToken(32);
  await mutate((d) => {
    d.sessions = d.sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now());
    d.sessions.push({
      id: nanoid(), token, userId,
      createdAt: now(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  });
  return token;
}

async function requireAuth(req, res, next) {
  try {
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ ok: false, error: 'Please sign in again.' });
    const data = await readDb();
    const session = data.sessions.find((s) => s.token === token && new Date(s.expiresAt).getTime() > Date.now());
    if (!session) return res.status(401).json({ ok: false, error: 'Your session expired. Please sign in again.' });
    const user = data.users.find((u) => u.id === session.userId);
    if (!user) return res.status(401).json({ ok: false, error: 'User account not found.' });
    req.user = user;
    req.workspaceId = user.workspaceId;
    req.sessionToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

function makeWorkspaceName(name, email) {
  const base = String(name || email?.split('@')[0] || 'My').trim();
  return `${base}'s Workspace`;
}

async function createUserWithWorkspace({ name, email, passwordHash = '', provider = 'LOCAL', googleSub = '', picture = '' }) {
  const workspaceId = nanoid();
  const userId = nanoid();
  const workspace = { id: workspaceId, name: makeWorkspaceName(name, email), plan: 'FREE', createdAt: now() };
  const user = {
    id: userId, workspaceId, name, email: email.toLowerCase(), passwordHash,
    role: 'OWNER', provider, googleSub, picture, createdAt: now()
  };
  await mutate((d) => {
    d.workspaces.push(workspace);
    d.users.push(user);
    d.workspaceMembers.push({ id: nanoid(), workspaceId, userId, role: 'OWNER', createdAt: now() });
  });
  return user;
}

app.get('/health', (_req, res) => ok(res, {
  service: 'PingCheck Node API',
  version: '5.0.0',
  demoMode: config.demoMode,
  metaConfigured: metaConfigured(),
  googleConfigured: Boolean(config.googleClientId)
}));

app.get('/api/auth/config', (_req, res) => ok(res, {
  googleClientId: config.googleClientId || '',
  googleConfigured: Boolean(config.googleClientId),
  demoMode: config.demoMode
}));

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const data = await readDb();
  const user = data.users.find((u) => u.email.toLowerCase() === email);
  if (!user || !verifyPassword(password, user.passwordHash || user.password || '')) {
    return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
  }
  const token = await createSession(user.id);
  return ok(res, { token, user: safeUser(user) });
});

app.post('/api/auth/signup', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (name.length < 2) return res.status(400).json({ ok: false, error: 'Enter your name.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ ok: false, error: 'Enter a valid email.' });
  if (password.length < 6) return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters.' });
  const data = await readDb();
  if (data.users.some((u) => u.email.toLowerCase() === email)) {
    return res.status(409).json({ ok: false, error: 'An account with this email already exists.' });
  }
  const user = await createUserWithWorkspace({ name, email, passwordHash: hashPassword(password), provider: 'LOCAL' });
  const token = await createSession(user.id);
  return res.status(201).json({ ok: true, token, user: safeUser(user) });
});

app.post('/api/auth/google', async (req, res) => {
  if (!config.googleClientId) return res.status(400).json({ ok: false, error: 'GOOGLE_CLIENT_ID is not configured in .env.' });
  const credential = String(req.body?.credential || '');
  if (!credential) return res.status(400).json({ ok: false, error: 'Google credential is missing.' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email || payload.email_verified === false) {
      return res.status(401).json({ ok: false, error: 'Google account could not be verified.' });
    }
    let data = await readDb();
    let user = data.users.find((u) => u.googleSub === payload.sub || u.email.toLowerCase() === payload.email.toLowerCase());
    if (!user) {
      user = await createUserWithWorkspace({
        name: payload.name || payload.given_name || 'Google User',
        email: payload.email,
        provider: 'GOOGLE',
        googleSub: payload.sub,
        picture: payload.picture || ''
      });
    } else {
      await mutate((d) => {
        const current = d.users.find((u) => u.id === user.id);
        if (current) {
          current.googleSub = current.googleSub || payload.sub;
          current.provider = current.provider === 'LOCAL' ? 'LOCAL+GOOGLE' : 'GOOGLE';
          current.picture = payload.picture || current.picture || '';
          current.name = current.name || payload.name || 'Google User';
        }
      });
      data = await readDb();
      user = data.users.find((u) => u.id === user.id);
    }
    const token = await createSession(user.id);
    return ok(res, { token, user: safeUser(user) });
  } catch (error) {
    console.error('Google auth error:', error.message);
    return res.status(401).json({ ok: false, error: 'Google sign-in failed. Check GOOGLE_CLIENT_ID and authorized origins.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const data = await readDb();
  const workspace = data.workspaces.find((w) => w.id === req.workspaceId) || null;
  ok(res, { user: safeUser(req.user), workspace });
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  await mutate((d) => { d.sessions = d.sessions.filter((s) => s.token !== req.sessionToken); });
  ok(res);
});

app.get('/api/dashboard', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  ok(res, dashboardSnapshot(await readDb(), req.workspaceId));
});

app.get('/api/automations', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const data = await readDb();
  ok(res, { automations: liveAutomations(data, req.workspaceId), folders: data.workspaces.find(w => w.id === req.workspaceId)?.automationFolders || [] });
});

app.post('/api/automation-folders', requireAuth, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name || name.length > 80) return res.status(400).json({ ok: false, error: 'Enter a folder name between 1 and 80 characters.' });
  let folder;
  await mutate(d => {
    const workspace = d.workspaces.find(w => w.id === req.workspaceId);
    if (!workspace) return;
    workspace.automationFolders ||= [];
    folder = workspace.automationFolders.find(f => f.name.toLowerCase() === name.toLowerCase());
    if (!folder) {
      folder = { id: nanoid(), name };
      workspace.automationFolders.push(folder);
    }
  });
  if (!folder) return res.status(404).json({ ok: false, error: 'Workspace not found.' });
  ok(res, { folder });
});

app.post('/api/automations/:id/organize', requireAuth, async (req, res) => {
  let item;
  try {
    await mutate(d => {
      item = d.automations.find(a => a.id === req.params.id && a.workspaceId === req.workspaceId);
      if (item) organizeAutomation(item, req.body || {}, d.workspaces.find(w => w.id === req.workspaceId)?.automationFolders || []);
    });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }
  if (!item) return res.status(404).json({ ok: false, error: 'Automation not found.' });
  ok(res, { automation: item });
});

app.get('/api/automations/:id', requireAuth, async (req, res) => {
  const item = (await readDb()).automations.find((a) => a.id === req.params.id && a.workspaceId === req.workspaceId);
  if (!item) return res.status(404).json({ ok: false, error: 'Automation not found.' });
  ok(res, { automation: item });
});

app.post('/api/automations', requireAuth, async (req, res) => {
  const item = {
    id: nanoid(), workspaceId: req.workspaceId,
    name: req.body?.name || 'Untitled Automation', status: 'DRAFT',
    triggerType: 'INSTAGRAM_COMMENT', triggerScope: req.body?.triggerScope || 'ALL',
    instagramAccountId: req.body?.instagramAccountId || '',
    keyword: req.body?.keyword || 'PRICE', matchType: req.body?.matchType || 'CONTAINS',
    mediaId: req.body?.mediaId || '', publicReply: req.body?.publicReply || 'Sent you a DM! 🚀',
    privateReply: req.body?.privateReply || 'Hey {{first_name}} 👋 Thanks for your comment! Here are the details.',
    runs: 0, leads: 0,
    nodes: Array.isArray(req.body?.nodes) ? req.body.nodes : [],
    edges: Array.isArray(req.body?.edges) ? req.body.edges : [],
    createdAt: now(), updatedAt: now()
  };
  await mutate((d) => d.automations.unshift(item));
  res.status(201).json({ ok: true, automation: item });
});

app.put('/api/automations/:id', requireAuth, async (req, res) => {
  let item;
  await mutate((d) => {
    item = d.automations.find((a) => a.id === req.params.id && a.workspaceId === req.workspaceId);
    if (item) {
      const allowed = ['name','triggerScope','instagramAccountId','keyword','matchType','mediaId','publicReply','privateReply','nodes','edges'];
      for (const key of allowed) if (key in req.body) item[key] = req.body[key];
      item.updatedAt = now();
    }
  });
  if (!item) return res.status(404).json({ ok: false, error: 'Automation not found.' });
  ok(res, { automation: item });
});

app.delete('/api/automations/:id', requireAuth, async (req, res) => {
  await mutate((d) => { d.automations = d.automations.filter((a) => !(a.id === req.params.id && a.workspaceId === req.workspaceId)); });
  ok(res);
});

app.post('/api/automations/:id/publish', requireAuth, async (req, res) => {
  let item;
  const data = await readDb();
  const existing = data.automations.find((a) => a.id === req.params.id && a.workspaceId === req.workspaceId);
  if (!existing) return res.status(404).json({ ok: false, error: 'Automation not found.' });
  if (existing.trashedAt) return res.status(400).json({ ok: false, error: 'Restore this automation from Trash before publishing.' });
  if (!String(existing.privateReply || '').trim()) {
    return res.status(400).json({ ok: false, error: 'Add a details message before publishing.' });
  }
  await mutate((d) => {
    item = d.automations.find((a) => a.id === req.params.id && a.workspaceId === req.workspaceId);
    if (item) { item.status = 'ACTIVE'; item.updatedAt = now(); }
  });
  ok(res, { automation: item });
});

app.post('/api/automations/:id/pause', requireAuth, async (req, res) => {
  let item;
  await mutate((d) => {
    item = d.automations.find((a) => a.id === req.params.id && a.workspaceId === req.workspaceId);
    if (item) { item.status = 'PAUSED'; item.updatedAt = now(); }
  });
  if (!item) return res.status(404).json({ ok: false, error: 'Automation not found.' });
  ok(res, { automation: item });
});

app.post('/api/automations/:id/test', requireAuth, async (req, res) => {
  const data = await readDb();
  const item = data.automations.find((a) => a.id === req.params.id && a.workspaceId === req.workspaceId);
  if (!item) return res.status(404).json({ ok: false, error: 'Automation not found.' });
  const testText = req.body?.text || item.keyword || 'PRICE';
  const event = {
    accountDbId: req.body?.instagramAccountId || item.instagramAccountId || '',
    mediaId: req.body?.mediaId || item.mediaId || '',
    sourceType: req.body?.sourceType || 'INSTAGRAM'
  };
  ok(res, {
    matched: matchesAutomation({ ...item, status: 'ACTIVE' }, testText, event),
    input: testText,
    replyPreview: item.privateReply
  });
});

app.get('/api/contacts', requireAuth, async (req, res) => {
  ok(res, { contacts: (await readDb()).contacts.filter((c) => c.workspaceId === req.workspaceId) });
});

app.post('/api/contacts', requireAuth, async (req, res) => {
  const contact = {
    id: nanoid(), workspaceId: req.workspaceId, name: req.body?.name || 'New Contact',
    username: req.body?.username || '', status: req.body?.status || 'CONTACT',
    tags: Array.isArray(req.body?.tags) ? req.body.tags : [], source: req.body?.source || 'Manual',
    lastInteractionAt: now(), createdAt: now()
  };
  await mutate((d) => d.contacts.unshift(contact));
  res.status(201).json({ ok: true, contact });
});

app.delete('/api/contacts/:id', requireAuth, async (req, res) => {
  await mutate((d) => { d.contacts = d.contacts.filter((x) => !(x.id === req.params.id && x.workspaceId === req.workspaceId)); });
  ok(res);
});

app.get('/api/conversations', requireAuth, async (req, res) => {
  const data = await readDb();
  const conversations = data.conversations
    .filter((c) => c.workspaceId === req.workspaceId)
    .map((c) => ({
      ...c,
      contact: data.contacts.find((x) => x.id === c.contactId),
      messages: data.messages.filter((m) => m.conversationId === c.id)
    }));
  ok(res, { conversations });
});

app.get('/api/analytics', requireAuth, async (req, res) => {
  const data = await readDb();
  const automations = data.automations.filter((a) => a.workspaceId === req.workspaceId);
  const points = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    runs: automations.length ? 120 + i * 37 + (i % 2) * 44 : 0,
    leads: automations.length ? 22 + i * 9 + (i % 3) * 6 : 0
  }));
  ok(res, { points, topAutomations: [...automations].sort((a,b) => Number(b.runs)-Number(a.runs)).slice(0,5) });
});

app.get('/api/templates', requireAuth, (_req, res) => {
  ok(res, { templates: [
    { id: 'price', name: 'Comment → Product Price', category: 'Sales', keyword: 'PRICE', privateReply: 'Hey {{first_name}} 👋 Thanks for commenting! Here are the price and product details.' },
    { id: 'guide', name: 'Comment → Free Guide', category: 'Lead Generation', keyword: 'GUIDE', privateReply: 'Hey {{first_name}} 👋 Your guide is ready. Here are the details.' },
    { id: 'ads', name: 'Ad Comment → Details', category: 'Ads', keyword: 'DETAILS', privateReply: 'Hey {{first_name}} 👋 Thanks for your interest in the ad. Here are the details.' },
    { id: 'info', name: 'Comment → More Information', category: 'Engagement', keyword: 'INFO', privateReply: 'Hey {{first_name}} 👋 Here is the information you requested.' }
  ]});
});

app.post('/api/templates/:id/use', requireAuth, async (req, res) => {
  const templates = {
    price: ['Comment → Product Price','PRICE','Hey {{first_name}} 👋 Thanks for commenting! Here are the price and product details.'],
    guide: ['Comment → Free Guide','GUIDE','Hey {{first_name}} 👋 Your guide is ready. Here are the details.'],
    ads: ['Ad Comment → Details','DETAILS','Hey {{first_name}} 👋 Thanks for your interest in the ad. Here are the details.'],
    info: ['Comment → More Information','INFO','Hey {{first_name}} 👋 Here is the information you requested.']
  };
  const t = templates[req.params.id];
  if (!t) return res.status(404).json({ ok: false, error: 'Template not found.' });
  const item = {
    id: nanoid(), workspaceId: req.workspaceId, name: t[0], status: 'DRAFT', triggerType: 'INSTAGRAM_COMMENT',
    triggerScope: 'ALL', instagramAccountId: '', keyword: t[1], matchType: 'CONTAINS', mediaId: '',
    publicReply: 'Sent you a DM! 🚀', privateReply: t[2], runs: 0, leads: 0,
    nodes: [], edges: [], createdAt: now(), updatedAt: now()
  };
  await mutate((d) => d.automations.unshift(item));
  res.status(201).json({ ok: true, automation: item });
});

app.get('/api/campaigns', requireAuth, async (req, res) => {
  ok(res, { campaigns: (await readDb()).campaigns.filter((c) => c.workspaceId === req.workspaceId) });
});

app.post('/api/campaigns', requireAuth, async (req, res) => {
  const campaign = { id: nanoid(), workspaceId: req.workspaceId, name: req.body?.name || 'Untitled Campaign', audience: req.body?.audience || 'All contacts', status: 'DRAFT', createdAt: now() };
  await mutate((d) => d.campaigns.unshift(campaign));
  res.status(201).json({ ok: true, campaign });
});

app.get('/api/knowledge', requireAuth, async (req, res) => {
  ok(res, { sources: (await readDb()).knowledgeSources.filter((s) => s.workspaceId === req.workspaceId) });
});

app.post('/api/knowledge', requireAuth, async (req, res) => {
  const source = { id: nanoid(), workspaceId: req.workspaceId, title: req.body?.title || 'Untitled Source', type: req.body?.type || 'TEXT', content: req.body?.content || '', createdAt: now() };
  await mutate((d) => d.knowledgeSources.unshift(source));
  res.status(201).json({ ok: true, source });
});

app.get('/api/ai/status', requireAuth, (req, res) => {
  ok(res, { configured: Boolean(config.ai.apiKey) });
});

const aiRequests = new Map();
app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const time = Date.now();
  for (const [key, value] of aiRequests) if (value.reset <= time && !value.pending) aiRequests.delete(key);
  const usage = aiRequests.get(req.workspaceId) || { count: 0, reset: time + 60000, pending: false };
  if (usage.pending || usage.count >= 10) return res.status(429).json({ ok: false, error: 'Please wait before sending another AI question.' });
  usage.count++;
  usage.pending = true;
  aiRequests.set(req.workspaceId, usage);
  try {
    const context = workspaceContext(await readDb(), req.workspaceId);
    const reply = await answerQuestion({ messages: req.body?.messages, context, ...config.ai });
    ok(res, { reply });
  } catch (error) {
    res.status(error.status || 502).json({ ok: false, error: error.message });
  } finally { usage.pending = false; }
});

app.post('/api/ai/generate', requireAuth, async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  const upper = prompt.toUpperCase();
  const keyword = ['PRICE','DETAILS','GUIDE','INFO','MENU','BOOK'].find((k) => upper.includes(k)) || 'DETAILS';
  ok(res, {
    draft: {
      name: `Comment → ${keyword[0]}${keyword.slice(1).toLowerCase()}`,
      keyword,
      matchType: 'CONTAINS',
      privateReply: `Hey {{first_name}} 👋 Thanks for commenting ${keyword}. Here are the details you requested.`
    }
  });
});

app.get('/api/team', requireAuth, async (req, res) => {
  const data = await readDb();
  const members = data.workspaceMembers.filter((m) => m.workspaceId === req.workspaceId).map((m) => ({
    ...m,
    user: safeUser(data.users.find((u) => u.id === m.userId))
  }));
  ok(res, { members, invites: data.teamInvites.filter((i) => i.workspaceId === req.workspaceId) });
});

app.post('/api/team/invite', requireAuth, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ ok: false, error: 'Enter a valid email.' });
  const invite = { id: nanoid(), workspaceId: req.workspaceId, email, role: req.body?.role || 'AGENT', status: 'PENDING', createdAt: now() };
  await mutate((d) => d.teamInvites.unshift(invite));
  res.status(201).json({ ok: true, invite });
});

app.use('/api/settings', requireAuth, settingsRouter);

app.get('/api/workspace', requireAuth, async (req, res) => {
  const data = await readDb();
  const workspace = data.workspaces.find((w) => w.id === req.workspaceId);
  ok(res, { workspace });
});

app.put('/api/workspace', requireAuth, async (req, res) => {
  let workspace;
  await mutate((d) => {
    workspace = d.workspaces.find((w) => w.id === req.workspaceId);
    if (workspace && String(req.body?.name || '').trim()) workspace.name = String(req.body.name).trim();
  });
  ok(res, { workspace });
});

app.get('/api/integrations/meta/status', requireAuth, async (req, res) => {
  const data = await readDb();
  const accounts = data.instagramAccounts.filter((a) => a.workspaceId === req.workspaceId);
  ok(res, {
    demoMode: config.demoMode,
    configured: metaConfigured(),
    configurationIssues: metaConfigurationIssues(),
    connected: accounts.length > 0,
    accountCount: accounts.length,
    accounts: accounts.map(publicInstagramAccount),
    redirectUri: config.meta.redirectUri,
    webhookUrl: `${config.appUrl}/api/webhooks/instagram`,
    graphVersion: config.meta.version,
    scopes: config.meta.scopes,
    webhookFields: config.meta.webhookFields,
    adsPrivateReplySupported: true
  });
});

app.get('/api/integrations/meta/connect', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  if (config.demoMode) return res.status(400).json({ ok: false, error: 'Set DEMO_MODE=false in .env, restart PingCheck, then connect a real Instagram account.' });
  const configurationIssues = metaConfigurationIssues();
  if (configurationIssues.length) return res.status(400).json({ ok: false, error: configurationIssues.join(' ') });
  const state = createOAuthState(req.workspaceId);
  const clientUrl = config.clientUrls.includes(req.headers.origin) ? req.headers.origin : config.clientUrl;
  await mutate(d => rememberConnection(d, state, req.user.id, req.workspaceId, clientUrl));
  const url = buildOAuthUrl(state);
  ok(res, { url });
});

app.get('/api/integrations/meta/callback', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const encodedState = String(req.query.state || '');
  const state = verifyOAuthState(encodedState);
  const pending = state ? await mutate(d => consumeConnection(d, encodedState, state.workspaceId)) : null;
  const clientUrl = pending && config.clientUrls.includes(pending.clientUrl) ? pending.clientUrl : config.clientUrl;
  const redirect = value => res.redirect(`${clientUrl}/dashboard/integrations?meta=${encodeURIComponent(value)}`);
  if (!pending) return redirect('error:This connection request expired or was already used. Click Connect Instagram again.');
  const error = req.query.error || req.query.error_reason;
  if (error) return redirect('error:Instagram login was cancelled or permission was not granted. Please try again.');
  const code = String(req.query.code || '');
  if (!code) return redirect('error:Instagram did not return an authorization code. Please connect again.');

  try {
    const shortToken = await exchangeCode(code);
    const longToken = await exchangeLongLivedToken(shortToken.access_token);
    const profile = await getProfile(longToken.access_token);
    const instagramUserId = String(profile.user_id || profile.id || shortToken.user_id || '');
    if (!instagramUserId) throw new Error('Instagram account ID was not returned by Meta.');
    const existingData = await readDb();
    if (existingData.instagramAccounts.some(a => String(a.instagramUserId) === instagramUserId && a.workspaceId !== state.workspaceId)) {
      throw new Error('This Instagram account is already connected to another workspace. Disconnect it there first.');
    }

    let webhookSubscribed = false;
    let webhookError = '';
    let webhookAppId = '';
    try {
      await subscribeWebhooks(longToken.access_token, instagramUserId);
      const subscription = await getWebhookSubscription(longToken.access_token, instagramUserId, { justSubscribed: true });
      webhookSubscribed = subscription.subscribed;
      webhookAppId = subscription.appId;
      if (!webhookSubscribed) webhookError = 'Instagram accepted the subscription, but its app and fields could not be verified. Retry webhooks.';
    } catch (subscriptionError) {
      webhookError = subscriptionError.message;
    }

    const account = {
      id: nanoid(), workspaceId: state.workspaceId, instagramUserId,
      username: profile.username || `instagram_${instagramUserId}`,
      displayName: profile.name || '', accountType: profile.account_type || 'PROFESSIONAL',
      profilePictureUrl: profile.profile_picture_url || '',
      tokenCiphertext: encryptSecret(longToken.access_token),
      tokenExpiresAt: longToken.expires_in ? new Date(Date.now() + Number(longToken.expires_in) * 1000).toISOString() : null,
      scopes: config.meta.scopes, webhookSubscribed, webhookError, webhookAppId, connectedAt: now(),
      lastCheckedAt: now(), connectionError: '', connectionStatus: webhookSubscribed ? 'CONNECTED' : 'WEBHOOK_WARNING'
    };

    await mutate(d => saveInstagramAccount(d, account));

    const suffix = webhookSubscribed ? 'connected' : `warning:${webhookError}`;
    redirect(suffix);
  } catch (error) {
    console.error('Meta callback error:', error);
    redirect(`error:${error.message}`);
  }
});

app.post('/api/integrations/meta/accounts/:id/check', requireAuth, async (req, res) => {
  const account = (await readDb()).instagramAccounts.find(a => a.id === req.params.id && a.workspaceId === req.workspaceId);
  if (!account) return res.status(404).json({ ok: false, error: 'Instagram account not found.' });
  const update = { lastCheckedAt: now(), connectionError: '', webhookError: '', webhookSubscribed: false };
  try {
    if (account.tokenExpiresAt && Date.parse(account.tokenExpiresAt) <= Date.now()) throw new Error('Instagram access has expired. Reconnect this account.');
    const token = decryptSecret(account.tokenCiphertext);
    const profile = await getProfile(token);
    if (String(profile.user_id || profile.id) !== String(account.instagramUserId)) throw new Error('Instagram account identity has changed. Please reconnect.');
    update.username = profile.username || account.username;
    update.profilePictureUrl = profile.profile_picture_url || account.profilePictureUrl;
    update.connectionStatus = 'WEBHOOK_WARNING';
    try {
      if (req.body?.repairWebhooks === true) await subscribeWebhooks(token, account.instagramUserId);
      const subscription = await getWebhookSubscription(token, account.instagramUserId, {
        appId: account.webhookAppId || config.meta.appId, justSubscribed: req.body?.repairWebhooks === true
      });
      update.webhookSubscribed = subscription.subscribed;
      update.webhookAppId = subscription.appId;
      update.webhookError = subscription.subscribed ? '' : 'The app subscription and required fields could not be verified. Retry webhooks.';
      update.connectionStatus = subscription.subscribed ? 'CONNECTED' : 'WEBHOOK_WARNING';
    } catch (error) { update.webhookError = error.message; }
  } catch (error) {
    update.connectionStatus = 'ERROR';
    update.connectionError = error.message;
  }
  const saved = await mutate(d => {
    const current = d.instagramAccounts.find(a => a.id === account.id && a.workspaceId === req.workspaceId);
    if (!current) return null;
    // A check started before reconnection must not overwrite the new connection.
    if (current.tokenCiphertext === account.tokenCiphertext) {
      Object.assign(current, update);
      for (const integration of d.integrations.filter(i => i.accountId === current.id)) integration.status = update.connectionStatus;
    }
    return publicInstagramAccount(current);
  });
  if (!saved) return res.status(404).json({ ok: false, error: 'This account was disconnected during the check.' });
  ok(res, { account: saved });
});

app.delete('/api/integrations/meta/accounts/:id', requireAuth, async (req, res) => {
  await mutate((d) => {
    const account = d.instagramAccounts.find((a) => a.id === req.params.id && a.workspaceId === req.workspaceId);
    d.instagramAccounts = d.instagramAccounts.filter((a) => !(a.id === req.params.id && a.workspaceId === req.workspaceId));
    if (account) d.integrations = d.integrations.filter((i) => i.accountId !== account.id);
  });
  ok(res);
});

app.get('/api/integrations/meta/accounts/:id/media', requireAuth, async (req, res) => {
  const data = await readDb();
  const account = data.instagramAccounts.find((a) =>
    a.workspaceId === req.workspaceId &&
    (String(a.id) === String(req.params.id) || String(a.instagramUserId) === String(req.params.id))
  );
  if (!account) return res.status(404).json({ ok: false, error: 'Instagram account not found.' });
  try {
    const page = await listMedia(decryptSecret(account.tokenCiphertext), 25, String(req.query.after || ''));
    ok(res, page);
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.get('/api/webhooks/instagram', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.meta.verifyToken) {
    return res.status(200).send(String(req.query['hub.challenge'] || ''));
  }
  return res.status(403).send('Forbidden');
});

app.post('/api/webhooks/instagram', async (req, res) => {
  if (!validateMetaSignature(req.rawBody || JSON.stringify(req.body || {}), req.headers['x-hub-signature-256'])) {
    return res.status(401).json({ ok: false, error: 'Invalid Meta webhook signature.' });
  }
  const events = normalizeWebhook(req.body);
  const data = await readDb();
  const known = new Set(data.webhookEvents.map((x) => x.externalId));
  const fresh = events.filter((x) => !known.has(x.externalId));
  await mutate((d) => {
    for (const event of fresh) d.webhookEvents.push({
      id: nanoid(), externalId: event.externalId, type: event.type,
      accountId: event.accountId, payload: event.payload, receivedAt: now()
    });
  });
  res.status(200).json({ ok: true, received: events.length, accepted: fresh.length });
  for (const event of fresh) {
    if (event.type === 'COMMENT' && event.commentId) {
      setImmediate(() => handleCommentEvent(event).catch((e) => console.error('Automation error:', e)));
    }
  }
});

app.post('/api/dev/simulate-comment', requireAuth, async (req, res) => {
  const data = await readDb();
  const account = data.instagramAccounts.find((a) => a.workspaceId === req.workspaceId);
  const event = {
    type: 'COMMENT', externalId: `sim-${crypto.randomUUID()}`,
    accountId: account?.instagramUserId || 'demo-instagram-account',
    commentId: `demo-comment-${Date.now()}`,
    text: req.body?.text || 'PRICE',
    senderId: 'demo-user-1', senderUsername: 'demo_customer',
    mediaId: req.body?.mediaId || 'demo-reel-1',
    adId: req.body?.sourceType === 'AD' ? 'demo-ad-1' : '',
    sourceType: req.body?.sourceType === 'AD' ? 'AD' : 'INSTAGRAM',
    payload: {}
  };
  if (!account || config.demoMode) {
    const matches = data.automations.filter((a) =>
      a.workspaceId === req.workspaceId && matchesAutomation({ ...a, status: a.status }, event.text, { ...event, accountDbId: account?.id || '' })
    );
    return ok(res, {
      simulated: true,
      metaCallSkipped: true,
      matched: matches.map((a) => a.name),
      message: `${matches.length} active automation(s) matched. No real Meta DM was sent in demo/no-account mode.`
    });
  }
  const result = await handleCommentEvent(event);
  ok(res, { simulated: true, result });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err.message || 'Server error.' });
});

if (!process.env.NETLIFY) {
  app.listen(config.port, config.host, () => {
    console.log(`\nPingCheck Node API running on http://localhost:${config.port}`);
    console.log(`Demo mode: ${config.demoMode ? 'ON' : 'OFF'}`);
    console.log(`Google configured: ${config.googleClientId ? 'YES' : 'NO'}`);
    console.log(`Meta configured: ${metaConfigured() ? 'YES' : 'NO'}\n`);
  });
}

export default app;

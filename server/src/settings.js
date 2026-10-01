import { Router } from 'express';
import { nanoid } from 'nanoid';
import { readDb as readSettingsDb, mutate as mutateSettingsDb } from './db.js';
import { dashboardSnapshot } from './dashboard.js';

export function validatePreferences(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 100) throw new Error('Workspace name must be 1–100 characters.');
  if (typeof body.timeZone !== 'string' || body.timeZone.length > 100) throw new Error('Choose a valid time zone.');
  try { new Intl.DateTimeFormat('en', { timeZone: body.timeZone }).format(); }
  catch { throw new Error('Choose a valid time zone.'); }
  if (!['short', 'medium', 'long'].includes(body.dateStyle)) throw new Error('Choose a valid date format.');
  return { name, timeZone: body.timeZone, dateStyle: body.dateStyle };
}

export function automationTemplate(a) {
  const fields = ['name', 'triggerType', 'triggerScope', 'keyword', 'matchType', 'publicReply', 'privateReply', 'nodes', 'edges'];
  return Object.fromEntries(fields.filter(k => a[k] !== undefined).map(k => [k, structuredClone(a[k])]));
}

export function createSettingsRouter({ readDb = readSettingsDb, mutate = mutateSettingsDb } = {}) {
const router = Router();
async function owner(req, res, next) {
  const data = await readDb();
  if (!data.workspaceMembers.some(m => m.workspaceId === req.workspaceId && m.userId === req.user.id && m.role === 'OWNER')) {
    return res.status(403).json({ error: 'Only the workspace owner can make this change.' });
  }
  next();
}
router.get('/', async (req, res) => {
  const data = await readDb();
  const workspace = data.workspaces.find(w => w.id === req.workspaceId);
  const canManage = data.workspaceMembers.some(m => m.workspaceId === req.workspaceId && m.userId === req.user.id && m.role === 'OWNER');
  res.set('Cache-Control', 'no-store').json({ workspace: { ...workspace, timeZone: workspace.timeZone || 'Asia/Calcutta', dateStyle: workspace.dateStyle || 'medium' }, canManage,
    accounts: data.instagramAccounts.filter(a => a.workspaceId === req.workspaceId).map(a => ({ id: a.id, username: a.username })),
    activity: dashboardSnapshot(data, req.workspaceId).activity });
});
router.put('/', owner, async (req, res) => {
  let preferences;
  try { preferences = validatePreferences(req.body || {}); } catch (e) { return res.status(400).json({ error: e.message }); }
  let workspace;
  await mutate(d => {
    workspace = d.workspaces.find(w => w.id === req.workspaceId);
    Object.assign(workspace, preferences, { updatedAt: new Date().toISOString() });
  });
  res.json({ workspace });
});
router.get('/template', owner, async (req, res) => {
  const data = await readDb();
  res.set('Cache-Control', 'no-store').json({ version: 1, exportedAt: new Date().toISOString(), automations: data.automations.filter(a => a.workspaceId === req.workspaceId).map(automationTemplate) });
});
router.post('/clone', owner, async (req, res) => {
  let count = 0;
  let error = '';
  await mutate(d => {
    const target = d.instagramAccounts.find(a => a.id === req.body?.accountId && a.workspaceId === req.workspaceId);
    if (!target) { error = 'Choose a connected Instagram account in this workspace.'; return; }
    const source = d.automations.filter(a => a.workspaceId === req.workspaceId && !a.clonedFrom);
    if (!source.length) { error = 'Create an automation before cloning.'; return; }
    if (source.length > 100) { error = 'Clone supports up to 100 source automations.'; return; }
    for (const a of source) {
      if (d.automations.some(existing => existing.workspaceId === req.workspaceId && existing.clonedFrom === a.id && existing.instagramAccountId === target.instagramUserId)) continue;
      const now = new Date().toISOString();
      d.automations.unshift({ ...automationTemplate(a), id: nanoid(), workspaceId: req.workspaceId, name: `${a.name} — @${target.username}`, clonedFrom: a.id,
        instagramAccountId: target.instagramUserId, mediaId: '', status: 'DRAFT', runs: 0, leads: 0, createdAt: now, updatedAt: now });
      count++;
    }
  });
  if (error) return res.status(400).json({ error });
  res.json({ count });
});
router.delete('/', owner, async (req, res) => {
  let error = '';
  await mutate(d => {
    const workspace = d.workspaces.find(w => w.id === req.workspaceId);
    if (req.body?.confirmation !== workspace?.name) { error = 'Type the exact workspace name to confirm deletion.'; return; }
    if (d.workspaceMembers.some(m => m.workspaceId === req.workspaceId && m.userId !== req.user.id) || d.users.some(u => u.workspaceId === req.workspaceId && u.id !== req.user.id)) {
      error = 'This workspace has other members. Account deletion is available only for a workspace with one member.'; return;
    }
    const automationIds = new Set(d.automations.filter(a => a.workspaceId === req.workspaceId).map(a => a.id));
    const conversationIds = new Set(d.conversations.filter(c => c.workspaceId === req.workspaceId).map(c => c.id));
    const accountIds = new Set(d.instagramAccounts.filter(a => a.workspaceId === req.workspaceId).map(a => a.instagramUserId));
    d.messages = d.messages.filter(m => !conversationIds.has(m.conversationId));
    d.automationRuns = d.automationRuns.filter(r => !automationIds.has(r.automationId));
    const otherAccountIds = new Set(d.instagramAccounts.filter(a => a.workspaceId !== req.workspaceId).map(a => a.instagramUserId));
    d.webhookEvents = d.webhookEvents.filter(e => !accountIds.has(e.accountId) || otherAccountIds.has(e.accountId));
    for (const key of ['contacts', 'conversations', 'automations', 'instagramAccounts', 'integrations', 'activity', 'campaigns', 'knowledgeSources', 'teamInvites', 'workspaceMembers']) d[key] = d[key].filter(item => item.workspaceId !== req.workspaceId);
    d.workspaces = d.workspaces.filter(w => w.id !== req.workspaceId);
    d.sessions = d.sessions.filter(s => s.userId !== req.user.id);
    d.oauthStates = (d.oauthStates || []).filter(s => s.workspaceId !== req.workspaceId && s.userId !== req.user.id);
    d.workspaceMembers = d.workspaceMembers.filter(m => m.userId !== req.user.id);
    d.users = d.users.filter(u => u.id !== req.user.id);
  });
  if (error) return res.status(400).json({ error });
  res.json({ ok: true });
});
return router;
}
export default createSettingsRouter();

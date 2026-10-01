export function liveAutomations(data, workspaceId) {
  const runs = (data.automationRuns || []).filter(r => !r.isDemo && r.status === 'COMPLETED' && r.commentId && !String(r.commentId).startsWith('demo-comment-'));
  return data.automations.filter(a => a.workspaceId === workspaceId).map(a => {
    const completed = runs.filter(r => r.automationId === a.id);
    return { ...a, runs: completed.length, leads: new Set(completed.map(r => r.contactId).filter(Boolean)).size };
  });
}

// Older setup versions did not mark their sample records. Match the exact
// seed content AND workspace creation time; never discard ordinary contacts.
function legacySamples(data, workspaceId) {
  const demo = (data.users || []).some(u => u.workspaceId === workspaceId && u.email === 'demo@flowvik.app');
  const createdAt = (data.workspaces || []).find(w => w.id === workspaceId)?.createdAt;
  const names = new Map([
    ['@rahul123', 'Rahul Sharma'], ['@priya.creates', 'Priya Patel'],
    ['@amit.builds', 'Amit Joshi'], ['@sneha.more', 'Sneha More'], ['@arjun.shah', 'Arjun Shah']
  ]);
  const entries = new Map([
    ['COMMENT', 'New Instagram comment received'],
    ['AUTOMATION', 'Comment \u2192 Product Price triggered'],
    ['LEAD', 'New lead created from Instagram']
  ]);
  return {
    contact: c => demo && createdAt && c.createdAt === createdAt && !c.externalId && c.source === 'Instagram Reel' && names.get(c.username) === c.name,
    activity: a => demo && createdAt && a.at === createdAt && entries.get(a.type) === a.text
  };
}

export function dashboardSnapshot(data, workspaceId) {
  const automations = liveAutomations(data, workspaceId);
  const legacy = legacySamples(data, workspaceId);
  const excludedContacts = new Set(data.contacts.filter(c => c.workspaceId === workspaceId && (c.isDemo || legacy.contact(c) || c.externalId === 'demo-user-1')).map(c => c.id));
  const contacts = data.contacts.filter(c => c.workspaceId === workspaceId && !excludedContacts.has(c.id));
  const conversations = new Set(data.conversations.filter(c => c.workspaceId === workspaceId && !excludedContacts.has(c.contactId)).map(c => c.id));
  const messages = data.messages.filter(m => conversations.has(m.conversationId) && m.direction === 'OUT' && !m.isDemo);
  return {
    stats: [
      { label: 'Messages sent', value: messages.length, detail: 'Recorded outgoing messages · all time' },
      { label: 'Contacts', value: contacts.length, detail: 'Workspace contacts · all time' },
      { label: 'Leads', value: contacts.filter(c => c.status === 'LEAD').length, detail: 'Unique contacts marked as leads' },
      { label: 'Conversions', value: null, detail: 'Not tracked — no sales data connected' }
    ],
    automations: [...automations].sort((a, b) => b.runs - a.runs).slice(0, 5),
    activity: data.activity.filter(a => a.workspaceId === workspaceId && !a.isDemo && !legacy.activity(a)).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 8),
    updatedAt: new Date().toISOString()
  };
}

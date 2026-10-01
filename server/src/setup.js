import { nanoid } from 'nanoid';
import { closeDb, db } from './db.js';
import { hashPassword } from './security.js';

await db.read();
const now = new Date().toISOString();

if (!Array.isArray(db.data.users)) db.data.users = [];
if (!Array.isArray(db.data.workspaces)) db.data.workspaces = [];
if (!Array.isArray(db.data.workspaceMembers)) db.data.workspaceMembers = [];
if (!Array.isArray(db.data.contacts)) db.data.contacts = [];
if (!Array.isArray(db.data.automations)) db.data.automations = [];
if (!Array.isArray(db.data.activity)) db.data.activity = [];

let demo = db.data.users.find((u) => u.email === 'demo@flowvik.app');
if (!demo) {
  const workspaceId = nanoid();
  const userId = nanoid();
  db.data.workspaces.push({ id: workspaceId, name: 'Demo Workspace', plan: 'PRO', createdAt: now });
  demo = {
    id: userId,
    workspaceId,
    name: 'PingCheck Admin',
    email: 'demo@flowvik.app',
    passwordHash: hashPassword('demo12345'),
    role: 'OWNER',
    provider: 'LOCAL',
    createdAt: now
  };
  db.data.users.push(demo);
  db.data.workspaceMembers.push({ id: nanoid(), workspaceId, userId, role: 'OWNER', createdAt: now });

  const contacts = [
    ['Rahul Sharma', '@rahul123', 'LEAD', ['Interested', 'Hot Lead']],
    ['Priya Patel', '@priya.creates', 'CONTACT', ['Product']],
    ['Amit Joshi', '@amit.builds', 'CUSTOMER', ['Customer']],
    ['Sneha More', '@sneha.more', 'LEAD', ['Guide Lead']],
    ['Arjun Shah', '@arjun.shah', 'CONTACT', ['Interested']]
  ];
  for (const [name, username, status, tags] of contacts) {
    db.data.contacts.push({
      id: nanoid(), workspaceId, name, username, status, tags,
      source: 'Instagram Reel', isDemo: true, lastInteractionAt: now, createdAt: now
    });
  }

  const autoSeed = [
    { name: 'Comment → Product Price', keyword: 'PRICE', reply: 'Hey {{first_name}} 👋 Thanks for commenting! Here are the details you requested.', status: 'ACTIVE' },
    { name: 'Comment → Free Guide', keyword: 'GUIDE', reply: 'Hey {{first_name}} 👋 Your free guide is ready. Tap the link below to continue.', status: 'ACTIVE' },
    { name: 'Comment → Ads Details', keyword: 'DETAILS', reply: 'Hey {{first_name}} 👋 Thanks for your interest. Here are the details from the ad.', status: 'ACTIVE' },
    { name: 'FAQ Assistant', keyword: 'INFO', reply: 'Thanks for reaching out. Tell us what information you need.', status: 'PAUSED' }
  ];
  for (const item of autoSeed) {
    db.data.automations.push({
      id: nanoid(), workspaceId, name: item.name, status: item.status,
      triggerType: 'INSTAGRAM_COMMENT', triggerScope: 'ALL', instagramAccountId: '', keyword: item.keyword,
      matchType: 'CONTAINS', mediaId: '', publicReply: 'Sent you a DM! 🚀', privateReply: item.reply,
      runs: 0,
      leads: 0,
      createdAt: now, updatedAt: now,
      nodes: [
        { id: 'trigger-1', position: { x: 80, y: 100 }, data: { label: `⚡ Instagram Comment\nKeyword: ${item.keyword}` } },
        { id: 'message-1', position: { x: 390, y: 100 }, data: { label: '💬 Private DM\nSend requested details' } }
      ],
      edges: [{ id: 'e1', source: 'trigger-1', target: 'message-1' }]
    });
  }

  db.data.activity.unshift(
    { id: nanoid(), workspaceId, isDemo: true, type: 'COMMENT', text: 'New Instagram comment received', at: now },
    { id: nanoid(), workspaceId, isDemo: true, type: 'AUTOMATION', text: 'Comment → Product Price triggered', at: now },
    { id: nanoid(), workspaceId, isDemo: true, type: 'LEAD', text: 'New lead created from Instagram', at: now }
  );
  await db.write();
  console.log('Created PingCheck demo workspace, secure demo login and sample data.');
} else {
  if (!demo.passwordHash && demo.password) {
    demo.passwordHash = hashPassword(demo.password);
    delete demo.password;
    await db.write();
  }
  console.log('PingCheck local data already exists. Demo account is ready.');
}

await closeDb();

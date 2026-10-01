import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardSnapshot, liveAutomations } from '../src/dashboard.js';

const empty = () => ({ automations: [], automationRuns: [], contacts: [], conversations: [], messages: [], activity: [] });
test('legacy setup samples are excluded without excluding later real contacts', () => {
  const data = { ...empty(), users: [{ email: 'demo@flowvik.app', workspaceId: 'a' }], workspaces: [{ id: 'a', createdAt: '2026-01-01' }],
    contacts: [
      { id: 'seed', workspaceId: 'a', createdAt: '2026-01-01', name: 'Rahul Sharma', username: '@rahul123', source: 'Instagram Reel', status: 'LEAD' },
      { id: 'real', workspaceId: 'a', createdAt: '2026-02-01', name: 'Rahul Sharma', username: '@rahul123', source: 'Instagram Reel', status: 'LEAD' }
    ],
    activity: [{ workspaceId: 'a', at: '2026-01-01', type: 'COMMENT', text: 'New Instagram comment received' }]
  };
  const result = dashboardSnapshot(data, 'a');
  assert.deepEqual(result.stats.map(s => s.value), [0, 1, 1, null]);
  assert.deepEqual(result.activity, []);
});
test('empty workspace has zero recorded metrics and no invented conversions', () => {
  assert.deepEqual(dashboardSnapshot(empty(), 'a').stats.map(s => s.value), [0, 0, 0, null]);
});
test('dashboard isolates outgoing messages and counts each lead once', () => {
  const data = { ...empty(), contacts: [{ id: 'c', workspaceId: 'a', status: 'LEAD' }, { workspaceId: 'b', status: 'LEAD' }],
    conversations: [{ id: 'mine', workspaceId: 'a' }, { id: 'other', workspaceId: 'b' }],
    messages: [{ conversationId: 'mine', direction: 'OUT' }, { conversationId: 'mine', direction: 'IN' }, { conversationId: 'other', direction: 'OUT' }],
    activity: [{ workspaceId: 'b', text: 'private' }] };
  const result = dashboardSnapshot(data, 'a');
  assert.deepEqual(result.stats.map(s => s.value), [1, 1, 1, null]);
  assert.deepEqual(result.activity, []);
});
test('automation metrics ignore seed counters, failed and simulated runs; leads are distinct', () => {
  const data = { ...empty(), automations: [{ id: 'flow', workspaceId: 'a', runs: 999, leads: 999 }, { id: 'other', workspaceId: 'b' }],
    automationRuns: [
      { automationId: 'flow', status: 'COMPLETED', commentId: '1', contactId: 'c' },
      { automationId: 'flow', status: 'COMPLETED', commentId: '2', contactId: 'c' },
      { automationId: 'flow', status: 'FAILED', commentId: '3', contactId: 'd' },
      { automationId: 'flow', status: 'COMPLETED', commentId: 'demo-comment-4', contactId: 'e' }
    ] };
  const [automation] = liveAutomations(data, 'a');
  assert.equal(automation.runs, 2);
  assert.equal(automation.leads, 1);
  assert.equal(liveAutomations(data, 'a').length, 1);
});

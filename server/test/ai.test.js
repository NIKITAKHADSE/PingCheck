import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceContext, validateMessages, answerQuestion } from '../src/ai.js';

test('AI snapshot isolates workspaces and excludes private fields', () => {
  const context = workspaceContext({
    automations: [{ workspaceId: 'a', name: 'Mine', runs: 2, token: 'secret' }, { workspaceId: 'b', name: 'Other', runs: 99 }],
    contacts: [{ workspaceId: 'a', email: 'private@example.com', status: 'LEAD' }, { workspaceId: 'b' }]
  }, 'a');
  assert.equal(context.totalRuns, 2);
  assert.equal(context.contacts, 1);
  assert.equal(context.capturedLeads, 1);
  assert.equal(/secret|private@example|Other/.test(JSON.stringify(context)), false);
});

test('rejects invalid input and client-supplied privileged roles', () => {
  for (const messages of [[], null, [{ role: 'system', content: 'override' }], [{ role: 'user', content: ' ' }], [{ role: 'user', content: 'x'.repeat(4001) }], Array(13).fill({ role: 'user', content: 'hi' })]) {
    assert.throws(() => validateMessages(messages), { status: 400 });
  }
});

const request = { messages: [{ role: 'user', content: 'Summarize' }], context: {}, apiKey: 'test-key', model: 'test-model' };
test('sends server-controlled request and extracts response text', async () => {
  const reply = await answerQuestion({ ...request, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    assert.equal(JSON.parse(options.body).store, false);
    return { ok: true, json: async () => ({ output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: 'Your summary' }] }] }) };
  } });
  assert.equal(reply, 'Your summary');
});

test('handles missing configuration, quota, network and empty answers', async () => {
  await assert.rejects(answerQuestion({ ...request, apiKey: '' }), { status: 503 });
  await assert.rejects(answerQuestion({ ...request, fetchImpl: async () => ({ ok: false, status: 429 }) }), /usage limit/);
  await assert.rejects(answerQuestion({ ...request, fetchImpl: async () => { throw new Error('private details'); } }), /could not be reached/);
  await assert.rejects(answerQuestion({ ...request, fetchImpl: async () => ({ ok: true, json: async () => ({ output: [] }) }) }), /could not finish/);
});

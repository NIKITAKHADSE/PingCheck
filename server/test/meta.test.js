import assert from 'node:assert/strict';
import test from 'node:test';
import { config } from '../src/config.js';
import { sendPrivateReply } from '../src/meta.js';

test('sendPrivateReply targets the connected Instagram account', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ recipient_id: 'commenter-1', message_id: 'message-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  await sendPrivateReply('access-token', 'ig-user-123', 'comment-456', 'Details: https://example.com/product');

  assert.equal(request.url, `https://graph.instagram.com/${config.meta.version}/ig-user-123/messages`);
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer access-token');
  assert.deepEqual(JSON.parse(request.options.body), {
    recipient: { comment_id: 'comment-456' },
    message: { text: 'Details: https://example.com/product' }
  });
});

test('sendPrivateReply rejects missing account and comment IDs before calling Meta', async () => {
  await assert.rejects(
    () => sendPrivateReply('access-token', '', 'comment-456', 'Details'),
    /Instagram account ID is required/
  );
  await assert.rejects(
    () => sendPrivateReply('access-token', 'ig-user-123', '', 'Details'),
    /Instagram comment ID is required/
  );
});

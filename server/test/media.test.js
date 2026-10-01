import test from 'node:test';
import assert from 'node:assert/strict';
import { listMedia } from '../src/meta.js';
test('media pagination forwards cursors and never exposes the upstream token URL', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async url => {
    assert.equal(new URL(url).searchParams.get('after'), 'page-2');
    return new Response(JSON.stringify({ data: [{ id: 'post-26' }], paging: { next: 'https://graph.instagram.com/media?access_token=secret', cursors: { after: 'page-3' } } }));
  };
  assert.deepEqual(await listMedia('secret', 25, 'page-2'), { media: [{ id: 'post-26' }], nextCursor: 'page-3' });
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [], paging: { cursors: { after: 'last' } } }));
  assert.deepEqual(await listMedia('secret'), { media: [], nextCursor: '' });
});

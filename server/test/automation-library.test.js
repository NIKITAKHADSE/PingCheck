import test from 'node:test';
import assert from 'node:assert/strict';
import { organizeAutomation } from '../src/automation-library.js';
import { matchesAutomation } from '../src/automation.js';

test('trash stops comment matching and restoring does not resume sending', () => {
  const item = { status: 'ACTIVE', triggerType: 'INSTAGRAM_COMMENT', keyword: 'PRICE' };
  assert.equal(matchesAutomation(item, 'PRICE'), true);
  organizeAutomation(item, { action: 'trash' }, []);
  assert.equal(item.status, 'PAUSED');
  assert.ok(item.trashedAt);
  assert.equal(matchesAutomation({ ...item, status: 'ACTIVE' }, 'PRICE'), false);
  organizeAutomation(item, { action: 'restore' }, []);
  assert.equal(item.trashedAt, undefined);
  assert.equal(item.status, 'PAUSED');
  assert.equal(matchesAutomation(item, 'PRICE'), false);
});

test('moving allows only folders belonging to the workspace or no folder', () => {
  const item = { status: 'ACTIVE', folderId: '' };
  const folders = [{ id: 'own-folder', name: 'Products' }];
  assert.throws(() => organizeAutomation(item, { action: 'move', folderId: 'another-workspace-folder' }, folders), /Folder not found/);
  assert.equal(item.folderId, '');
  organizeAutomation(item, { action: 'move', folderId: 'own-folder' }, folders);
  assert.equal(item.folderId, 'own-folder');
  assert.equal(item.status, 'ACTIVE');
  organizeAutomation(item, { action: 'move', folderId: '' }, folders);
  assert.equal(item.folderId, '');
  assert.throws(() => organizeAutomation(item, { action: 'move' }, folders), /Folder not found/);
  assert.throws(() => organizeAutomation(item, { action: 'unknown' }, folders), /Unknown/);
});

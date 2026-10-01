export function organizeAutomation(item, body, folders) {
  if (body.action === 'trash') {
    item.trashedAt = new Date().toISOString();
    item.status = 'PAUSED';
  } else if (body.action === 'restore') {
    delete item.trashedAt;
    item.status = 'PAUSED';
  } else if (body.action === 'move') {
    if (body.folderId !== '' && !folders.some(f => f.id === body.folderId)) {
      throw new Error('Folder not found.');
    }
    item.folderId = body.folderId;
  } else {
    throw new Error('Unknown library action.');
  }
  item.updatedAt = new Date().toISOString();
}

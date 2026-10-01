// Serialize complete read/modify/write operations, including ordinary reads.
export function createDbAccess(db, defaults) {
  let pending = Promise.resolve();
  function enqueue(operation) {
    const result = pending.then(operation);
    pending = result.catch(() => {});
    return result;
  }
  async function load() {
    await db.read();
    for (const [key, value] of Object.entries(defaults)) {
      if (!Array.isArray(db.data[key])) db.data[key] = structuredClone(value);
    }
  }
  return {
    readDb: () => enqueue(async () => { await load(); return structuredClone(db.data); }),
    mutate: mutator => enqueue(async () => {
      await load();
      const result = await mutator(db.data);
      await db.write();
      return structuredClone(result);
    })
  };
}

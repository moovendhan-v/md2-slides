/**
 * One-time moves of persisted data from the product's former name
 * ("slidewise-*") to "md2slides-*". Safe to call repeatedly; storage errors
 * (private mode, blocked site data) are ignored.
 */
export function migrateLocalStorageKey(from: string, to: string, store: Pick<Storage, "getItem" | "setItem" | "removeItem"> | undefined = globalThis.localStorage) {
  try {
    if (!store) return;
    const old = store.getItem(from);
    if (old == null) return;
    if (store.getItem(to) == null) store.setItem(to, old);
    store.removeItem(from);
  } catch {
    // Storage unavailable: nothing to migrate.
  }
}

/** Read a value under `key`, falling back to (and moving) the legacy key. */
export async function migrateAsync<T>(key: string, legacy: string, io: { get: (k: string) => Promise<T | undefined>; set: (k: string, v: T) => Promise<void>; del: (k: string) => Promise<void> }): Promise<T | undefined> {
  const current = await io.get(key);
  if (current !== undefined) return current;
  const old = await io.get(legacy);
  if (old === undefined) return undefined;
  await io.set(key, old);
  await io.del(legacy);
  return old;
}

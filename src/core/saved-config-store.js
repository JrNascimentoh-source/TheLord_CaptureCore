const STORAGE_KEY = "thelord_capturecore_saved_configs_v1";

function readAll() {
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function writeAll(items) { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(items)); }

export class SavedConfigStore {
  list() { return readAll().sort((a,b) => b.savedAt.localeCompare(a.savedAt)); }
  has(config) {
    return this.list().some(item =>
      item.platformId === config.platformId &&
      item.gameId === config.gameId &&
      item.screenName === config.screenName &&
      item.sourceUrl === config.sourceUrl
    );
  }
  save({platformId,gameId,screenName,sourceUrl}) {
    const normalized = {platformId,gameId,screenName:screenName.trim(),sourceUrl:sourceUrl.trim()};
    const existing = this.list().find(item =>
      item.platformId === normalized.platformId &&
      item.gameId === normalized.gameId &&
      item.screenName === normalized.screenName &&
      item.sourceUrl === normalized.sourceUrl
    );
    if (existing) return existing;
    const item = {id:globalThis.crypto?.randomUUID?.() ?? ("saved-" + Date.now() + "-" + Math.random().toString(16).slice(2)),...normalized,savedAt:new Date().toISOString()};
    const all = readAll(); all.push(item); writeAll(all); return item;
  }
  remove(id) {
    const all = readAll(), next = all.filter(item => item.id !== id);
    writeAll(next); return next.length !== all.length;
  }
}

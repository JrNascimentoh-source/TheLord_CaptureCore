import {isValidPair} from "./platform-registry.js";
const STORAGE_KEY = "thelord_capturecore_instances_v1";
const ALLOWED_STATES = new Set(["offline", "connecting", "online", "error"]);
function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? ("capture-" + Date.now() + "-" + Math.random().toString(16).slice(2));
}
function readAll() {
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const supported = parsed.filter(item => isValidPair(item?.platformId, item?.gameId));
    if (supported.length !== parsed.length) { try { writeAll(supported); } catch {} }
    return supported;
  } catch { return []; }
}
function writeAll(items) { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(items)); }
export class InstanceStore {
  list() { return readAll().sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }
  create({platformId,gameId,screenName,sourceUrl}) {
    if (!isValidPair(platformId,gameId)) throw new Error("Combinação de plataforma e jogo não suportada.");
    const item = {id:makeId(),platformId,gameId,screenName:screenName.trim(),sourceUrl:sourceUrl.trim(),status:"offline",lastSeenAt:null,lastValue:null,roundCount:0,createdAt:new Date().toISOString()};
    const all = readAll(); all.push(item); writeAll(all); return item;
  }
  updateStatus(id,status,lastSeenAt=null) {
    if (!ALLOWED_STATES.has(status)) throw new Error("Estado de instância inválido.");
    const all=readAll(), index=all.findIndex(item=>item.id===id);
    if(index<0)return null;
    all[index]={...all[index],status,lastSeenAt:lastSeenAt??all[index].lastSeenAt}; writeAll(all); return all[index];
  }
  recordRound(id,{value,detectedAt,game}) {
    const numeric=Number(value);
    if(!Number.isFinite(numeric)||numeric<1||numeric>=1000000)return null;
    const all=readAll(), index=all.findIndex(item=>item.id===id);
    if(index<0)return null;
    all[index]={...all[index],status:"online",lastSeenAt:detectedAt||new Date().toISOString(),lastValue:numeric,roundCount:(all[index].roundCount||0)+1,lastGame:game||all[index].gameId};
    writeAll(all); return all[index];
  }
  remove(id) { const all=readAll(), next=all.filter(item=>item.id!==id); writeAll(next); return next.length!==all.length; }
}
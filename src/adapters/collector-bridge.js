const EVENT_NAME = "thelord:capturecore:collector";
export const COLLECTOR_MESSAGE_TYPE = "THELORD_CAPTURECORE_EVENT";
const ALLOWED_KINDS = new Set(["heartbeat", "round"]);
export class CollectorBridge extends EventTarget {
  constructor({freshnessMs=120000}={}) {
    super(); this.freshnessMs=freshnessMs; this.windows=new Map(); this.handleMessage=this.handleMessage.bind(this);
  }
  connect() { window.addEventListener("message",this.handleMessage); }
  disconnect() { window.removeEventListener("message",this.handleMessage); this.windows.clear(); }
  register(instanceId, popupWindow) {
    if (!instanceId || !popupWindow) throw new Error("Instância ou janela inválida.");
    this.windows.set(instanceId,popupWindow);
  }
  unregister(instanceId) { this.windows.delete(instanceId); }
  handleMessage(event) {
    const payload=event.data;
    if (!payload || payload.type!==COLLECTOR_MESSAGE_TYPE || payload.version!==1) return;
    if (typeof payload.instanceId!=="string" || !payload.instanceId || !ALLOWED_KINDS.has(payload.kind)) return;
    const expectedWindow=this.windows.get(payload.instanceId);
    if (!expectedWindow || event.source!==expectedWindow) return;
    this.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:{
      instanceId:payload.instanceId,kind:payload.kind,receivedAt:new Date().toISOString(),data:payload.data??null
    }}));
  }
  onCollectorEvent(callback) {
    const listener=event=>callback(event.detail);
    this.addEventListener(EVENT_NAME,listener);
    return ()=>this.removeEventListener(EVENT_NAME,listener);
  }
  isFresh(lastSeenAt) {
    if(!lastSeenAt)return false;
    const age=Date.now()-new Date(lastSeenAt).getTime();
    return Number.isFinite(age)&&age>=0&&age<=this.freshnessMs;
  }
}
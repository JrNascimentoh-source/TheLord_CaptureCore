const EVENT_NAME = "thelord:capturecore:collector";
export const COLLECTOR_MESSAGE_TYPE = "THELORD_CAPTURECORE_EVENT";
export class CollectorBridge extends EventTarget {
  constructor({freshnessMs=120000}={}) { super(); this.freshnessMs=freshnessMs; this.handleMessage=this.handleMessage.bind(this); }
  connect() { window.addEventListener("message",this.handleMessage); }
  disconnect() { window.removeEventListener("message",this.handleMessage); }
  handleMessage(event) {
    const p=event.data;
    if(!p||p.type!==COLLECTOR_MESSAGE_TYPE||p.version!==1||event.source!==window)return;
    if(typeof p.instanceId!=="string"||!p.instanceId)return;
    this.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:{instanceId:p.instanceId,kind:p.kind,receivedAt:new Date().toISOString(),data:p.data??null}}));
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
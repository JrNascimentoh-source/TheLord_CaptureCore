const EVENT_NAME = "thelord:capturecore:collector";
export const COLLECTOR_MESSAGE_TYPE = "THELORD_CAPTURECORE_EVENT";
const ALLOWED_KINDS = new Set(["heartbeat", "round"]);
export class CollectorBridge {
 constructor({freshnessMs=120000}={}){this.freshnessMs=freshnessMs;this.frames=new Map();this.handleMessage=this.handleMessage.bind(this);this.target=new EventTarget();}
 connect(){window.addEventListener("message",this.handleMessage);}
 disconnect(){window.removeEventListener("message",this.handleMessage);this.frames.clear();}
 register(instanceId,frameWindow,expectedOrigin){if(!instanceId||!frameWindow||!expectedOrigin)throw new Error("Instância, tela ou origem inválida.");this.frames.set(instanceId,{source:frameWindow,origin:expectedOrigin});}
 unregister(instanceId){this.frames.delete(instanceId);}
 handleMessage(event){
  const payload=event.data;if(!payload||payload.type!==COLLECTOR_MESSAGE_TYPE||payload.version!==1)return;
  if(typeof payload.instanceId!=="string"||!payload.instanceId||!ALLOWED_KINDS.has(payload.kind))return;
  const expected=this.frames.get(payload.instanceId);if(!expected||event.source!==expected.source||event.origin!==expected.origin)return;
  this.target.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:{instanceId:payload.instanceId,kind:payload.kind,receivedAt:new Date().toISOString(),data:payload.data??null}}));
 }
 onCollectorEvent(callback){const listener=event=>callback(event.detail);this.target.addEventListener(EVENT_NAME,listener);return()=>this.target.removeEventListener(EVENT_NAME,listener);}
 isFresh(lastSeenAt){if(!lastSeenAt)return false;const age=Date.now()-new Date(lastSeenAt).getTime();return Number.isFinite(age)&&age>=0&&age<=this.freshnessMs;}
}
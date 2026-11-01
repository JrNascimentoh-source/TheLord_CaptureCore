import {InstanceStore} from "./core/instance-store.js";
import {GAMES,PLATFORMS,isValidPair} from "./core/platform-registry.js";
import {CollectorBridge} from "./adapters/collector-bridge.js";
const store=new InstanceStore(), bridge=new CollectorBridge(), $=s=>document.querySelector(s), activity=[];
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function time(v){return v?new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"medium"}).format(new Date(v)):"Nenhum sinal recebido";}
function log(message){activity.unshift({message,time:new Date()});activity.splice(8);renderActivity();}
function renderActivity(){
 const el=$("#activity-list");
 el.innerHTML=activity.length?activity.map(a=>'<div class="activity-row"><span>'+esc(a.message)+'</span><span>'+time(a.time)+'</span></div>').join(""):'<p class="activity-empty">Nenhuma atividade registrada.</p>';
}
function render(){
 const items=store.list(),online=items.filter(i=>i.status==="online").length,games=new Set(items.map(i=>i.gameId)).size;
 $("#metric-total").textContent=items.length;$("#metric-online").textContent=online;$("#metric-offline").textContent=items.length-online;$("#metric-games").textContent=games;
 $("#instance-count").textContent=items.length+" INSTÂNCIAS";$("#engine-status").textContent="Bridge aguardando coletor";
 $("#instance-list").innerHTML=items.length?items.map(i=>{
  const p=PLATFORMS[i.platformId],g=GAMES[i.gameId],status=i.status==="online"?"online":"offline";
  let hostname="Origem inválida";try{hostname=new URL(i.sourceUrl).hostname;}catch{}
  return '<article class="instance-card"><div class="instance-top"><div class="instance-title"><span class="platform-mark">'+esc(p.shortLabel)+'</span><div><h3>'+esc(p.label)+' — '+esc(g.label)+'</h3><p>'+esc(i.screenName)+'</p></div></div><span class="status-pill '+status+'"><i class="status-dot '+status+'"></i>'+(status==="online"?"ONLINE":"OFFLINE")+'</span></div><div class="instance-meta"><div><span class="meta-label">ÚLTIMO SINAL</span><span class="meta-value">'+time(i.lastSeenAt)+'</span></div><div><span class="meta-label">IDENTIFICADOR</span><span class="meta-value">'+esc(i.id.slice(0,13))+'…</span></div><div><span class="meta-label">ORIGEM</span><span class="meta-value">'+esc(hostname)+'</span></div><div><span class="meta-label">COLETOR</span><span class="meta-value">Universal Collector · aguardando vínculo</span></div></div><div class="instance-actions"><button class="text-button danger" data-remove="'+esc(i.id)+'">Remover instância</button></div></article>';
 }).join(""):'<div class="empty-state"><span class="empty-icon">▣</span><b>Nenhuma instância cadastrada</b><p>Adicione a primeira tela para iniciar a configuração do CaptureCore.</p><button class="button secondary" id="empty-add-inline">＋ Adicionar tela</button></div>';
 $("#empty-add-inline")?.addEventListener("click",openModal);
}
function openModal(){$("#form-error").textContent="";updateGameOptions();$("#instance-modal").showModal();}
function closeModal(){$("#instance-modal").close();}
function updateGameOptions(){
 const platformId=$("#platform").value,allowed=PLATFORMS[platformId].games,select=$("#game"),previous=select.value;
 select.innerHTML=allowed.map(id=>'<option value="'+id+'">'+GAMES[id].label+(id==="aviator2"?" (BetDoPovo)":id==="aviator"&&platformId==="7a7"?"":"")+'</option>').join("");
 if(allowed.includes(previous))select.value=previous;
}
function createInstance(event){
 event.preventDefault();
 const platformId=$("#platform").value,gameId=$("#game").value,screenName=$("#screen-name").value.trim(),sourceUrl=$("#source-url").value.trim();
 if(!isValidPair(platformId,gameId)){ $("#form-error").textContent="A combinação de plataforma e jogo não é válida.";return; }
 try{
  const url=new URL(sourceUrl);if(!["http:","https:"].includes(url.protocol))throw Error("URL inválida");
  store.create({platformId,gameId,screenName,sourceUrl});
  log("Instância criada: "+screenName+" · "+PLATFORMS[platformId].label+" / "+GAMES[gameId].label);
  $("#instance-form").reset();$("#platform").value="7a7";updateGameOptions();closeModal();render();
 }catch{$("#form-error").textContent="Informe uma URL válida (http ou https).";}
}
function onCollectorEvent(detail){
 const instance=store.list().find(i=>i.id===detail.instanceId);if(!instance)return;
 store.updateStatus(instance.id,"online",detail.receivedAt);
 if(detail.kind==="heartbeat")log("Sinal recebido: "+instance.screenName);
 render();
}
$("#add-instance").addEventListener("click",openModal);$("#empty-add").addEventListener("click",openModal);
$("#close-modal").addEventListener("click",closeModal);$("#cancel-modal").addEventListener("click",closeModal);
$("#instance-form").addEventListener("submit",createInstance);$("#platform").addEventListener("change",updateGameOptions);
$("#instance-list").addEventListener("click",event=>{
 const button=event.target.closest("[data-remove]");if(!button)return;
 const item=store.list().find(i=>i.id===button.dataset.remove);
 if(!item||!confirm('Remover a instância "'+item.screenName+'" deste navegador?'))return;
 store.remove(item.id);log("Instância removida: "+item.screenName);render();
});
bridge.connect();bridge.onCollectorEvent(onCollectorEvent);render();
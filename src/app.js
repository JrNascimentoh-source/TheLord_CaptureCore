import {InstanceStore} from "./core/instance-store.js";
import {GAMES,PLATFORMS,isValidPair} from "./core/platform-registry.js";
import {CollectorBridge} from "./adapters/collector-bridge.js";
const store=new InstanceStore(), bridge=new CollectorBridge(), popupWindows=new Map(), $=s=>document.querySelector(s), activity=[];
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
 $("#instance-count").textContent=items.length+" INSTÂNCIAS";$("#engine-status").textContent=online+" coletor(es) com sinal";
 $("#instance-list").innerHTML=items.length?items.map(i=>{
  const p=PLATFORMS[i.platformId],g=GAMES[i.gameId],status=i.status==="online"?"online":"offline";
  let hostname="Origem inválida";try{hostname=new URL(i.sourceUrl).hostname;}catch{}
  const lastValue=Number.isFinite(i.lastValue)?i.lastValue.toFixed(2)+"x":"Aguardando primeira rodada";
  return '<article class="instance-card"><div class="instance-top"><div class="instance-title"><span class="platform-mark">'+esc(p.shortLabel)+'</span><div><h3>'+esc(p.label)+' — '+esc(g.label)+'</h3><p>'+esc(i.screenName)+'</p></div></div><span class="status-pill '+status+'"><i class="status-dot '+status+'"></i>'+(status==="online"?"ONLINE":"OFFLINE")+'</span></div><div class="instance-meta"><div><span class="meta-label">ÚLTIMO SINAL</span><span class="meta-value">'+time(i.lastSeenAt)+'</span></div><div><span class="meta-label">ÚLTIMA VELA</span><span class="meta-value">'+lastValue+'</span></div><div><span class="meta-label">ORIGEM</span><span class="meta-value">'+esc(hostname)+'</span></div><div><span class="meta-label">VELAS CAPTURADAS</span><span class="meta-value">'+(i.roundCount||0)+'</span></div></div><div class="instance-actions"><button class="text-button" data-open="'+esc(i.id)+'">Abrir jogo e coletar ↗</button><button class="text-button danger" data-remove="'+esc(i.id)+'">Remover</button></div></article>';
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
  store.create({platformId,gameId,screenName,sourceUrl:url.href});
  log("Instância criada: "+screenName+" · "+PLATFORMS[platformId].label+" / "+GAMES[gameId].label);
  $("#instance-form").reset();$("#platform").value="7a7";updateGameOptions();closeModal();render();
 }catch{$("#form-error").textContent="Informe uma URL válida (http ou https).";}
}
function openInstance(id){
 const item=store.list().find(entry=>entry.id===id);if(!item)return;
 try{
  const url=new URL(item.sourceUrl);
  url.searchParams.set("_capturecore_instance",item.id);
  url.searchParams.set("_capturecore_origin",location.origin);
  const popup=window.open(url.href,"_blank");
  if(!popup){log("O navegador bloqueou a janela de "+item.screenName+"; permita pop-ups para este painel.");return;}
  popupWindows.set(item.id,popup);bridge.register(item.id,popup);
  store.updateStatus(item.id,"connecting");
  log("Jogo aberto para coleta: "+item.screenName);render();
 }catch{log("Não foi possível abrir a URL da instância "+item.screenName);}
}
function onCollectorEvent(detail){
 const instance=store.list().find(i=>i.id===detail.instanceId);if(!instance)return;
 if(detail.kind==="heartbeat"){
  store.updateStatus(instance.id,"online",detail.receivedAt);
 }else if(detail.kind==="round"){
  const value=Number(detail.data?.value);
  if(!Number.isFinite(value)||value<1||value>=1000000)return;
  store.recordRound(instance.id,{value,detectedAt:detail.data?.detectedAt||detail.receivedAt,game:detail.data?.game});
  log("Vela capturada: "+value.toFixed(2)+"x · "+instance.screenName);
 }
 render();
}
$("#add-instance").addEventListener("click",openModal);$("#empty-add").addEventListener("click",openModal);
$("#close-modal").addEventListener("click",closeModal);$("#cancel-modal").addEventListener("click",closeModal);
$("#instance-form").addEventListener("submit",createInstance);$("#platform").addEventListener("change",updateGameOptions);
$("#instance-list").addEventListener("click",event=>{
 const openButton=event.target.closest("[data-open]");
 if(openButton){openInstance(openButton.dataset.open);return;}
 const button=event.target.closest("[data-remove]");if(!button)return;
 const item=store.list().find(i=>i.id===button.dataset.remove);
 if(!item||!confirm('Remover a instância "'+item.screenName+'" deste navegador?'))return;
 const popup=popupWindows.get(item.id);try{popup?.close();}catch{}
 popupWindows.delete(item.id);bridge.unregister(item.id);store.remove(item.id);log("Instância removida: "+item.screenName);render();
});
bridge.connect();bridge.onCollectorEvent(onCollectorEvent);render();
setInterval(()=>{let changed=false;for(const item of store.list()){if(item.status==="online"&&!bridge.isFresh(item.lastSeenAt)){store.updateStatus(item.id,"offline",item.lastSeenAt);changed=true;}}if(changed)render();},15000);

import {InstanceStore} from "./core/instance-store.js";
import {SavedConfigStore} from "./core/saved-config-store.js";
import {GAMES,PLATFORMS,isValidPair} from "./core/platform-registry.js";
import {CollectorBridge} from "./adapters/collector-bridge.js";
const store=new InstanceStore(), savedStore=new SavedConfigStore(), bridge=new CollectorBridge(), screenFrames=new Map(), $=s=>document.querySelector(s), activity=[];
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
  return '<article class="instance-card"><div class="instance-top"><div class="instance-title"><span class="platform-mark">'+esc(p.shortLabel)+'</span><div><h3>'+esc(p.label)+' — '+esc(g.label)+'</h3><p>'+esc(i.screenName)+'</p></div></div><span class="status-pill '+status+'"><i class="status-dot '+status+'"></i>'+(status==="online"?"ONLINE":"OFFLINE")+'</span></div><div class="instance-meta"><div><span class="meta-label">ÚLTIMO SINAL</span><span class="meta-value">'+time(i.lastSeenAt)+'</span></div><div><span class="meta-label">ÚLTIMA VELA</span><span class="meta-value">'+lastValue+'</span></div><div><span class="meta-label">ORIGEM</span><span class="meta-value">'+esc(hostname)+'</span></div><div><span class="meta-label">VELAS CAPTURADAS</span><span class="meta-value">'+(i.roundCount||0)+'</span></div></div><div class="instance-actions"><button class="text-button" data-open="'+esc(i.id)+'">Abrir jogo e coletar ↗</button><button class="text-button save-config" data-save="'+esc(i.id)+'" '+(savedStore.has(i)?'disabled':'')+' >'+(savedStore.has(i)?'✓ Salva':'☆ Salvar configuração')+'</button><button class="text-button danger" data-remove="'+esc(i.id)+'">Remover</button></div></article>';
 }).join(""):'<div class="empty-state"><span class="empty-icon">▣</span><b>Nenhuma instância cadastrada</b><p>Adicione a primeira tela para iniciar a configuração do CaptureCore.</p><button class="button secondary" id="empty-add-inline">＋ Adicionar tela</button></div>';
 $("#empty-add-inline")?.addEventListener("click",openModal);
 renderSavedConfigs();
}
function renderSavedConfigs(){
 const items=savedStore.list();
 $("#saved-count").textContent=items.length+" SALVAS";
 $("#saved-list").innerHTML=items.length?items.map(item=>{
  const p=PLATFORMS[item.platformId],g=GAMES[item.gameId];
  let hostname="Origem inválida";try{hostname=new URL(item.sourceUrl).hostname;}catch{}
  return '<article class="saved-card"><div class="saved-card-main"><span class="saved-mark">★</span><div><h3>'+esc(item.screenName)+'</h3><p>'+esc(p?.label||item.platformId)+' · '+esc(g?.label||item.gameId)+'</p><small>'+esc(hostname)+'</small></div></div><div class="saved-actions"><button class="text-button" data-start-saved="'+esc(item.id)+'">Iniciar tela ↗</button><button class="text-button danger" data-delete-saved="'+esc(item.id)+'" aria-label="Excluir configuração salva">Excluir</button></div></article>';
 }).join(""):'<div class="saved-empty">Nenhuma configuração salva ainda. Use “Salvar configuração” em uma tela cadastrada.</div>';
}
function saveInstanceConfig(id){
 const item=store.list().find(entry=>entry.id===id);if(!item)return;
 const saved=savedStore.save(item);
 log("Configuração salva: "+saved.screenName);render();
}
function startSavedConfig(id){
 const config=savedStore.list().find(item=>item.id===id);if(!config)return;
 let instance=store.list().find(item=>item.platformId===config.platformId&&item.gameId===config.gameId&&item.screenName===config.screenName&&item.sourceUrl===config.sourceUrl);
 if(!instance)instance=store.create(config);
 const existing=screenFrames.get(instance.id);
 if(existing?.isConnected){existing.closest(".game-screen")?.scrollIntoView({behavior:"smooth",block:"start"});log("Tela já está aberta no painel: "+instance.screenName);return;}
 log("Configuração reutilizada: "+instance.screenName);render();openInstance(instance.id);
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
 window.captureCoreShowSection?.('game-screens');
 const item=store.list().find(entry=>entry.id===id);if(!item)return;
 const existing=screenFrames.get(item.id);if(existing?.isConnected){existing.closest(".game-screen")?.scrollIntoView({behavior:"smooth",block:"start"});return;}
 try{
  const url=new URL(item.sourceUrl);url.searchParams.set("_capturecore_instance",item.id);url.searchParams.set("_capturecore_origin",location.origin);
  const panel=document.createElement("article");panel.className="game-screen";panel.dataset.screenId=item.id;
  const heading=document.createElement("div");heading.className="game-screen-heading";
  const title=document.createElement("div");title.innerHTML='<strong></strong><small>Carregando jogo e aguardando o coletor…</small>';title.querySelector("strong").textContent=item.screenName;
  const actions=document.createElement("div");actions.className="game-screen-actions";
  const reload=document.createElement("button");reload.type="button";reload.className="text-button";reload.textContent="Recarregar";
  const close=document.createElement("button");close.type="button";close.className="text-button danger";close.textContent="Fechar tela";
  const frame=document.createElement("iframe");frame.className="game-screen-frame";frame.title="Jogo: "+item.screenName;frame.src=url.href;frame.referrerPolicy="strict-origin-when-cross-origin";frame.allow="fullscreen; autoplay; clipboard-read; clipboard-write";
  reload.addEventListener("click",()=>{store.updateStatus(item.id,"connecting");title.querySelector("small").textContent="Recarregando…";frame.src=url.href;});
  close.addEventListener("click",()=>closeScreen(item.id));frame.addEventListener("load",()=>{title.querySelector("small").textContent="Documento carregado; aguardando sinal do coletor…";});
  actions.append(reload,close);heading.append(title,actions);panel.append(heading,frame);$("#screen-grid .saved-empty")?.remove();$("#screen-grid").prepend(panel);screenFrames.set(item.id,frame);
  bridge.register(item.id,frame.contentWindow,url.origin);store.updateStatus(item.id,"connecting");$("#screen-count").textContent=screenFrames.size+" TELAS";
  panel.scrollIntoView({behavior:"smooth",block:"start"});log("Jogo incorporado ao painel: "+item.screenName);render();
 }catch{log("Não foi possível incorporar a URL da instância "+item.screenName);}
}
function closeScreen(id){
 const frame=screenFrames.get(id);bridge.unregister(id);screenFrames.delete(id);frame?.closest(".game-screen")?.remove();
 const item=store.list().find(entry=>entry.id===id);if(item)store.updateStatus(id,"offline");$("#screen-count").textContent=screenFrames.size+" TELAS";
 if(!screenFrames.size)$("#screen-grid").innerHTML='<div class="saved-empty">Nenhuma tela aberta. Use “Abrir jogo e coletar” em uma instância.</div>';
 render();log("Tela fechada no painel"+(item?": "+item.screenName:"."));
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
$("#saved-list").addEventListener("click",event=>{
 const start=event.target.closest("[data-start-saved]");if(start){startSavedConfig(start.dataset.startSaved);return;}
 const remove=event.target.closest("[data-delete-saved]");if(remove&&confirm("Excluir esta configuração salva?")){savedStore.remove(remove.dataset.deleteSaved);log("Configuração salva excluída.");render();}
});
$("#instance-list").addEventListener("click",event=>{
 const saveButton=event.target.closest("[data-save]");if(saveButton){saveInstanceConfig(saveButton.dataset.save);return;}
 const openButton=event.target.closest("[data-open]");
 if(openButton){openInstance(openButton.dataset.open);return;}
 const button=event.target.closest("[data-remove]");if(!button)return;
 const item=store.list().find(i=>i.id===button.dataset.remove);
 if(!item||!confirm('Remover a instância "'+item.screenName+'" deste navegador?'))return;
 closeScreen(item.id);store.remove(item.id);log("Instância removida: "+item.screenName);render();
});
bridge.connect();bridge.onCollectorEvent(onCollectorEvent);bridge.onDiagnostic(detail=>{
 const messages={origin:"Sinal do coletor rejeitado: domínio de origem diferente do cadastrado ("+detail.receivedOrigin+"; esperado "+detail.expectedOrigin+").",window:"Sinal recebido de uma janela diferente da tela registrada.",instance:"Sinal recebido com identificador de instância não registrado.",payload:"Sinal do coletor recebido com formato inválido."};
 log(messages[detail.reason]||"Falha na validação do sinal do coletor.");
});render();renderSavedConfigs();
setInterval(()=>{let changed=false;for(const item of store.list()){if(item.status==="online"&&!bridge.isFresh(item.lastSeenAt)){store.updateStatus(item.id,"offline",item.lastSeenAt);changed=true;}}if(changed)render();},15000);

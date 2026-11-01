(function(){
 var toggle=document.getElementById('sidebarToggle'),KEY='thelord-capturecore-sidebar-collapsed',collapsed=false;
 try{collapsed=localStorage.getItem(KEY)==='1'}catch(_){}
 function applySidebar(){
  document.body.classList.toggle('sidebar-collapsed',collapsed);
  if(!toggle)return;
  var label=collapsed?'Expandir barra de navegação':'Recolher barra de navegação';
  toggle.textContent=collapsed?'›':'‹';toggle.setAttribute('aria-expanded',String(!collapsed));toggle.setAttribute('aria-label',label);toggle.title=label;
 }
 if(toggle)toggle.addEventListener('click',function(){collapsed=!collapsed;applySidebar();try{localStorage.setItem(KEY,collapsed?'1':'0')}catch(_){}});
 applySidebar();
 var links=[].slice.call(document.querySelectorAll('.bottom .nav'));
 var sections=[].slice.call(document.querySelectorAll('main > section.card'));
 function showSection(id,updateHash){
  if(!sections.some(function(section){return section.id===id}))id='dashboard';
  sections.forEach(function(section){section.hidden=section.id!==id;});
  links.forEach(function(link){var active=link.getAttribute('href')==='#'+id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  if(updateHash&&location.hash!=='#'+id)history.replaceState(null,'','#'+id);
 }
 window.captureCoreShowSection=function(id){showSection(id,true);};
 links.forEach(function(link){link.addEventListener('click',function(event){event.preventDefault();showSection(link.getAttribute('href').slice(1),true);});});
 showSection('dashboard',false);
})();
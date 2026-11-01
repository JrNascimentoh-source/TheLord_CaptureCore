(function(){
 var toggle=document.getElementById('sidebarToggle'),KEY='thelord-capturecore-sidebar-collapsed',collapsed=false;
 try{collapsed=localStorage.getItem(KEY)==='1'}catch(_){}
 function apply(){
  document.body.classList.toggle('sidebar-collapsed',collapsed);
  if(!toggle)return;
  var label=collapsed?'Expandir barra de navegação':'Recolher barra de navegação';
  toggle.textContent=collapsed?'›':'‹';toggle.setAttribute('aria-expanded',String(!collapsed));toggle.setAttribute('aria-label',label);toggle.title=label;
 }
 if(toggle)toggle.addEventListener('click',function(){collapsed=!collapsed;apply();try{localStorage.setItem(KEY,collapsed?'1':'0')}catch(_){}});
 apply();
 var links=[].slice.call(document.querySelectorAll('.bottom .nav'));
 function setActive(id){links.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+id)})}
 links.forEach(function(a){a.addEventListener('click',function(){setActive(a.getAttribute('href').slice(1))})});
 if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(list){list.forEach(function(e){if(e.isIntersecting)setActive(e.target.id)})},{rootMargin:'-35% 0px -55% 0px'});
  ['dashboard','instances','saved-configs','activity'].forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el)});
 }
})();
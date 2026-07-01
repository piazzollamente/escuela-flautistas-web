(function(){
  const path=window.location.pathname.endsWith('/')?window.location.pathname:window.location.pathname+'/';
  const isEs=path==='/embocadura-organizada/';
  const isPt=path==='/pt/embocadura-organizada/';
  if(!isEs&&!isPt)return;
  function init(){
    const nav=document.querySelector('.nav-links');
    if(!nav||document.getElementById('edfLanguageSwitch'))return;
    const el=document.createElement('span');
    el.id='edfLanguageSwitch';
    el.setAttribute('aria-label',isPt?'Selecionar idioma':'Seleccionar idioma');
    el.innerHTML=isPt?'<a href="/embocadura-organizada/" title="Español">🇪🇸 <span>ES</span></a><a class="active" href="/pt/embocadura-organizada/" title="Português">🇧🇷 <span>PT</span></a>':'<a class="active" href="/embocadura-organizada/" title="Español">🇪🇸 <span>ES</span></a><a href="/pt/embocadura-organizada/" title="Português">🇧🇷 <span>PT</span></a>';
    nav.insertBefore(el,nav.firstChild);
    const style=document.createElement('style');
    style.textContent='#edfLanguageSwitch{display:inline-flex!important;gap:8px;align-items:center;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.86);border:1px solid rgba(174,230,223,.72);font-weight:900;white-space:nowrap}#edfLanguageSwitch a{display:inline-flex!important;align-items:center!important;gap:3px!important;text-decoration:none!important;color:#6f6666!important;opacity:.72!important}#edfLanguageSwitch a.active{color:#c42030!important;opacity:1!important}@media(max-width:900px){.nav-links #edfLanguageSwitch{display:inline-flex!important}.nav-links>a:not(.btn){display:none!important}#edfLanguageSwitch span{font-size:.72rem!important}}';
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
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
    el.innerHTML=isPt?'<a href="/embocadura-organizada/">🇪🇸 ES</a><a class="active" href="/pt/embocadura-organizada/">🇧🇷 PT</a>':'<a class="active" href="/embocadura-organizada/">🇪🇸 ES</a><a href="/pt/embocadura-organizada/">🇧🇷 PT</a>';
    nav.insertBefore(el,nav.firstChild);
    const style=document.createElement('style');
    style.textContent='#edfLanguageSwitch{display:inline-flex;gap:8px;align-items:center;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.78);border:1px solid rgba(174,230,223,.72);font-weight:900;white-space:nowrap}#edfLanguageSwitch a{text-decoration:none;color:#6f6666;opacity:.72}#edfLanguageSwitch a.active{color:#c42030;opacity:1}@media(max-width:900px){.nav-links #edfLanguageSwitch{display:inline-flex!important}.nav-links>a:not(.btn){display:none!important}}';
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
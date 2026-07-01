(function(){
  const path=window.location.pathname.endsWith('/')?window.location.pathname:window.location.pathname+'/';
  if(path!=='/embocadura-organizada/'&&path!=='/pt/embocadura-organizada/')return;
  function init(){
    document.querySelectorAll('#edfLanguageSwitch').forEach(function(el){el.remove()});
    var style=document.createElement('style');
    style.textContent='.language-switch,.lang-switch{display:inline-flex!important;gap:8px!important;align-items:center!important;padding:7px 10px!important;border-radius:999px!important;background:rgba(255,255,255,.86)!important;border:1px solid rgba(174,230,223,.72)!important;font-size:.72rem!important;font-weight:900!important;letter-spacing:.08em!important;white-space:nowrap!important}.language-switch a,.lang-switch a{display:inline-flex!important;align-items:center!important;gap:3px!important;text-decoration:none!important;color:#6f6666!important;opacity:.72!important}.language-switch a.active,.lang-switch a.active{color:#c42030!important;opacity:1!important}@media(max-width:900px){.nav-links .language-switch,.nav-links .lang-switch{display:inline-flex!important}.nav-links>a:not(.btn){display:none!important}}';
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
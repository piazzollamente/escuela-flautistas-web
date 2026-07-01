(function(){
  const path=window.location.pathname.endsWith('/')?window.location.pathname:window.location.pathname+'/';
  const isPt=path==='/pt/embocadura-organizada/';
  if(!isPt)return;
  function run(){
    const band=[...document.querySelectorAll('body>div,.marquee-band')].find(el=>(el.textContent||'').includes('EMBOCADURA')&&(el.textContent||'').includes('21 DIAS'));
    if(!band)return;
    band.className='marquee-band';
    band.removeAttribute('style');
    band.innerHTML='<div class="marquee-track"><div class="marquee-group"><span>EMBOCADURA</span><span>·</span><span>SOM</span><span>·</span><span>RESPIRAÇÃO</span><span>·</span><span>CORPO</span><span>·</span><span>ESTABILIDADE</span><span>·</span><span>21 DIAS</span><span>·</span></div><div class="marquee-group" aria-hidden="true"><span>EMBOCADURA</span><span>·</span><span>SOM</span><span>·</span><span>RESPIRAÇÃO</span><span>·</span><span>CORPO</span><span>·</span><span>ESTABILIDADE</span><span>·</span><span>21 DIAS</span><span>·</span></div></div>';
    if(!document.getElementById('edfForceMarqueeCss')){
      const style=document.createElement('style');style.id='edfForceMarqueeCss';
      style.textContent='.marquee-band{overflow:hidden!important;border-block:1px solid rgba(57,50,50,.09)!important;background:linear-gradient(90deg,var(--paper),rgba(174,230,223,.28),var(--paper))!important;color:var(--ink)!important;padding:0!important;text-align:left!important}.marquee-track{display:flex!important;width:max-content!important;animation:edfMarquee 28s linear infinite!important;will-change:transform!important}.marquee-group{display:flex!important;align-items:center!important;gap:18px!important;padding:13px 18px!important;white-space:nowrap!important;font-size:.78rem!important;letter-spacing:.24em!important;text-transform:uppercase!important;font-weight:950!important}.marquee-group span:nth-child(4n+1){color:var(--red)!important}.marquee-group span:nth-child(4n+2){color:var(--ink)!important}.marquee-group span:nth-child(4n+3){color:#497d75!important}.marquee-group span:nth-child(4n+4){color:var(--soft)!important}@keyframes edfMarquee{to{transform:translateX(-50%)}}';
      document.head.appendChild(style);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  window.addEventListener('load',run);
  setTimeout(run,500);
})();
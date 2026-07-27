(function(){
  const pathname=window.location.pathname.endsWith('/')?window.location.pathname:window.location.pathname+'/';
  const isEs=pathname==='/embocadura-organizada/';
  const isPt=pathname==='/pt/embocadura-organizada/';
  const isMasterclass=pathname==='/masterclass/';
  if(!isEs&&!isPt&&!isMasterclass)return;

  function pricePatch(){
    document.querySelectorAll('.price-big').forEach(el=>{if(el.textContent.includes('USD $29'))el.textContent='USD $39'});
    document.querySelectorAll('.savings').forEach(el=>{if(el.textContent.includes('289'))el.textContent=isPt?'Você economiza USD $279':'Ahorras USD $279'});
    document.querySelectorAll('.mobile-cta-copy span,.hero-actions a,.price-card strong').forEach(el=>{el.textContent=el.textContent.replace('USD $29','USD $39')});
    const support=document.querySelector(isPt?'#preco .receipt-support':'#precio .receipt-support');
    if(support){support.textContent=isPt?'Esta é a primeira edição de Embocadura Organizada. Você ainda pode acessar o programa completo por uma fração do seu valor real enquanto a primeira geração de participantes do desafio continua aberta.':'Esta es la primera edición de Embocadura Organizada. Aún puedes acceder al programa completo por una fracción de su valor real mientras sigue abierta la primera generación de participantes del desafío.'}
  }

  function languageSwitch(){
    if(!isEs&&!isPt)return;
    const nav=document.querySelector('.nav-links');
    if(!nav||nav.querySelector('.language-switch'))return;
    const box=document.createElement('span');
    box.className='language-switch';
    box.setAttribute('aria-label',isPt?'Selecionar idioma':'Seleccionar idioma');
    box.innerHTML='<a class="'+(isEs?'active':'')+'" href="/embocadura-organizada/">🇪🇸 <span>ES</span></a><a class="'+(isPt?'active':'')+'" href="/pt/embocadura-organizada/">🇧🇷 <span>PT</span></a>';
    nav.prepend(box);
  }

  function marqueePt(){
    if(!isPt)return;
    const band=[...document.querySelectorAll('.marquee-band,body>div')].find(el=>el.textContent.includes('EMBOCADURA')&&el.textContent.includes('21 DIAS'));
    if(!band)return;
    band.className='marquee-band';band.removeAttribute('style');
    const group='<div class="marquee-group"><span>EMBOCADURA</span><span>·</span><span>SOM</span><span>·</span><span>RESPIRAÇÃO</span><span>·</span><span>CORPO</span><span>·</span><span>ESTABILIDADE</span><span>·</span><span>21 DIAS</span><span>·</span></div>';
    band.innerHTML='<div class="marquee-track">'+group+group+'</div>';
  }

  function injectCss(){
    if(!isEs&&!isPt||document.getElementById('edfDynamicCss'))return;
    const style=document.createElement('style');
    style.id='edfDynamicCss';
    style.textContent=`
      .language-switch{display:inline-flex!important;align-items:center;gap:9px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.86);border:1px solid rgba(174,230,223,.72);font-size:.72rem;font-weight:900;letter-spacing:.08em;white-space:nowrap}.language-switch a{display:inline-flex!important;gap:3px;align-items:center;color:var(--soft);opacity:.72}.language-switch a.active{color:var(--red);opacity:1}
      @media(max-width:900px){.nav-links>a:not(.btn):not(.language-switch a){display:none!important}}
    `;
    document.head.appendChild(style);
  }
  function init(){pricePatch();languageSwitch();marqueePt();injectCss()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);setTimeout(init,500);
})();

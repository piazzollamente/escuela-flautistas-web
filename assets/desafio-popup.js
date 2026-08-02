(function(){
  const pathname=window.location.pathname.endsWith('/')?window.location.pathname:window.location.pathname+'/';
  const isHome=pathname==='/';
  const isEs=pathname==='/embocadura-organizada/';
  const isPt=pathname==='/pt/embocadura-organizada/';
  const isMasterclass=pathname==='/masterclass/';
  const isMentorias=pathname==='/mentorias.html/';
  const isBrandPage=isHome||isEs||isPt||isMasterclass||isMentorias;
  if(!isBrandPage)return;

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

  function brandLogo(){
    const brand=isMentorias?document.querySelector('.logo'):document.querySelector('.brand,.logo');
    if(!brand||brand.querySelector('.edf-brand-logo'))return;

    const contextNode=brand.querySelector(':scope > span');
    const context=contextNode?contextNode.textContent.trim():'';
    const isLink=brand.tagName.toLowerCase()==='a';

    brand.classList.add('edf-brand-home');
    brand.setAttribute('aria-label',context?'Escuela de Flautistas · '+context:'Escuela de Flautistas');
    if(isLink&&!brand.getAttribute('href'))brand.setAttribute('href','/');
    brand.innerHTML='<span class="edf-brand-logo"><img src="/assets/logo%202%20de%20agosto.png" alt="" width="600" height="240"></span>'+(context?'<span class="edf-brand-context">'+context+'</span>':'');
  }

  function injectCss(){
    if(document.getElementById('edfDynamicCss'))return;
    const style=document.createElement('style');
    style.id='edfDynamicCss';
    style.textContent=`
      .edf-brand-home{display:inline-flex!important;align-items:center!important;gap:9px!important;width:auto!important;max-width:min(100%,260px)!important;color:inherit!important;text-decoration:none!important;line-height:1!important;letter-spacing:0!important;text-transform:none!important}
      .edf-brand-logo{display:grid;place-items:center;flex:0 0 auto;width:clamp(118px,13vw,158px);height:42px;padding:7px 12px;border-radius:13px;background:#111;box-shadow:0 10px 24px rgba(17,17,17,.18),inset 0 1px 0 rgba(255,255,255,.11);overflow:hidden}
      .edf-brand-logo img{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;object-fit:contain!important;object-position:center!important;filter:none!important}
      .edf-brand-context{display:block;color:var(--red,#E31C23)!important;font-family:'Montserrat',system-ui,sans-serif!important;font-size:.56rem!important;font-weight:900!important;line-height:1.18!important;letter-spacing:.11em!important;text-transform:uppercase!important;white-space:normal!important}
      .language-switch{display:inline-flex!important;align-items:center;gap:9px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.86);border:1px solid rgba(174,230,223,.72);font-size:.72rem;font-weight:900;letter-spacing:.08em;white-space:nowrap}.language-switch a{display:inline-flex!important;gap:3px;align-items:center;color:var(--soft);opacity:.72}.language-switch a.active{color:var(--red);opacity:1}
      @media(max-width:900px){.nav-links>a:not(.btn):not(.language-switch a){display:none!important}}
      @media(max-width:620px){.edf-brand-home{gap:6px!important;max-width:220px!important}.edf-brand-logo{width:118px;height:36px;padding:6px 10px;border-radius:11px}.edf-brand-context{max-width:86px;font-size:.48rem!important;letter-spacing:.08em!important}}
    `;
    document.head.appendChild(style);
  }

  function init(){
    injectCss();
    brandLogo();
    pricePatch();
    languageSwitch();
    marqueePt();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);
  setTimeout(init,500);
})();

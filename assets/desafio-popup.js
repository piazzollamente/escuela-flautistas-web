(function(){
  const path=window.location.pathname.endsWith('/')?window.location.pathname:window.location.pathname+'/';
  const isEs=path==='/embocadura-organizada/';
  const isPt=path==='/pt/embocadura-organizada/';
  const isMasterclass=path==='/masterclass/';
  if(!isEs&&!isPt&&!isMasterclass)return;

  const PRICE='USD $39';
  const SAVING_ES='Ahorras USD $279';
  const SAVING_PT='Você economiza USD $279';

  function flag(type){
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 36 36');
    svg.setAttribute('class','flag-icon');
    svg.setAttribute('aria-hidden','true');
    function add(name,attrs){
      const node=document.createElementNS(ns,name);
      Object.keys(attrs).forEach(key=>node.setAttribute(key,attrs[key]));
      svg.appendChild(node);
    }
    if(type==='es'){
      add('circle',{cx:'18',cy:'18',r:'18',fill:'#c42030'});
      add('rect',{x:'0',y:'12',width:'36',height:'12',fill:'#f4c430'});
    }else{
      add('circle',{cx:'18',cy:'18',r:'18',fill:'#229e45'});
      add('circle',{cx:'18',cy:'18',r:'10',fill:'#f9d616'});
      add('circle',{cx:'18',cy:'18',r:'5',fill:'#2b4ea2'});
    }
    return svg;
  }

  function buildLink(href,label,type,active){
    const a=document.createElement('a');
    a.href=href;
    if(active)a.className='active';
    a.appendChild(flag(type));
    const span=document.createElement('span');
    span.textContent=label;
    a.appendChild(span);
    return a;
  }

  function languageSwitch(){
    if(!isEs&&!isPt)return;
    const nav=document.querySelector('.nav-links');
    if(!nav)return;
    document.querySelectorAll('#edfLanguageSwitch').forEach(el=>el.remove());
    const switches=[...document.querySelectorAll('.language-switch,.lang-switch')];
    switches.forEach((el,index)=>{if(index>0)el.remove()});
    let box=document.querySelector('.language-switch,.lang-switch');
    if(!box){
      box=document.createElement('span');
      nav.insertBefore(box,nav.firstChild);
    }
    box.className='language-switch';
    box.innerHTML='';
    box.setAttribute('aria-label',isPt?'Selecionar idioma':'Seleccionar idioma');
    box.appendChild(buildLink('/embocadura-organizada/','ES','es',isEs));
    box.appendChild(buildLink('/pt/embocadura-organizada/','PT','br',isPt));
  }

  function marqueePt(){
    if(!isPt)return;
    const band=[...document.querySelectorAll('body>div,.marquee-band')].find(el=>(el.textContent||'').includes('EMBOCADURA')&&(el.textContent||'').includes('21 DIAS'));
    if(!band)return;
    band.className='marquee-band';
    band.removeAttribute('style');
    band.innerHTML='<div class="marquee-track"><div class="marquee-group"><span>EMBOCADURA</span><span>·</span><span>SOM</span><span>·</span><span>RESPIRAÇÃO</span><span>·</span><span>CORPO</span><span>·</span><span>ESTABILIDADE</span><span>·</span><span>21 DIAS</span><span>·</span></div><div class="marquee-group" aria-hidden="true"><span>EMBOCADURA</span><span>·</span><span>SOM</span><span>·</span><span>RESPIRAÇÃO</span><span>·</span><span>CORPO</span><span>·</span><span>ESTABILIDADE</span><span>·</span><span>21 DIAS</span><span>·</span></div></div>';
  }

  function pricePatch(){
    document.querySelectorAll('.price-big').forEach(el=>{
      if((el.textContent||'').includes('USD $29'))el.textContent=PRICE;
    });
    document.querySelectorAll('.savings').forEach(el=>{
      if((el.textContent||'').includes('289'))el.textContent=isPt?SAVING_PT:SAVING_ES;
    });
    document.querySelectorAll('.mobile-cta-copy span').forEach(el=>{
      el.textContent=(el.textContent||'').replace('USD $29',PRICE);
    });
    document.querySelectorAll('.hero-actions a,.price-card strong').forEach(el=>{
      el.textContent=(el.textContent||'').replace('USD $29',PRICE);
    });
    document.querySelectorAll('.price-card small').forEach(el=>{
      if((el.textContent||'').trim()==='Acceso promocional')el.textContent='Acceso de lanzamiento';
    });
    if(isEs){
      const support=document.querySelector('#precio .receipt-support');
      if(support){
        support.textContent='Esta es la primera edición de Embocadura Organizada. Aún puedes acceder al programa completo por una fracción de su valor real mientras sigue abierta la primera generación de participantes del desafío.';
      }
    }
    if(isPt){
      const support=document.querySelector('#preco .receipt-support');
      if(support){
        support.textContent='Esta é a primeira edição de Embocadura Organizada. Você ainda pode acessar o programa completo por uma fração do seu valor real enquanto a primeira geração de participantes do desafio continua aberta.';
      }
    }
  }

  function css(){
    if(!isEs&&!isPt)return;
    if(document.getElementById('edfLangAndMarqueeCss'))return;
    const style=document.createElement('style');
    style.id='edfLangAndMarqueeCss';
    style.textContent='.language-switch{display:inline-flex!important;gap:10px!important;align-items:center!important;padding:7px 11px!important;border-radius:999px!important;background:rgba(255,255,255,.86)!important;border:1px solid rgba(174,230,223,.72)!important;font-size:.72rem!important;font-weight:900!important;letter-spacing:.08em!important;white-space:nowrap!important}.language-switch a{display:inline-flex!important;align-items:center!important;gap:5px!important;text-decoration:none!important;color:#6f6666!important;opacity:.72!important}.language-switch a.active{color:#c42030!important;opacity:1!important}.flag-icon{width:16px!important;height:16px!important;display:inline-block!important;border-radius:50%!important;box-shadow:none!important;flex:0 0 16px!important}.marquee-band{overflow:hidden!important;border-block:1px solid rgba(57,50,50,.09)!important;background:linear-gradient(90deg,var(--paper),rgba(174,230,223,.28),var(--paper))!important;color:var(--ink)!important;padding:0!important;text-align:left!important}.marquee-track{display:flex!important;width:max-content!important;animation:edfMarquee 28s linear infinite!important;will-change:transform!important}.marquee-group{display:flex!important;align-items:center!important;gap:18px!important;padding:13px 18px!important;white-space:nowrap!important;font-size:.78rem!important;letter-spacing:.24em!important;text-transform:uppercase!important;font-weight:950!important}.marquee-group span:nth-child(4n+1){color:var(--red)!important}.marquee-group span:nth-child(4n+2){color:var(--ink)!important}.marquee-group span:nth-child(4n+3){color:#497d75!important}.marquee-group span:nth-child(4n+4){color:var(--soft)!important}@keyframes edfMarquee{to{transform:translateX(-50%)}}@media(max-width:900px){.nav-links .language-switch{display:inline-flex!important}.nav-links>a:not(.btn){display:none!important}}';
    document.head.appendChild(style);
  }

  function init(){pricePatch();languageSwitch();marqueePt();css()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);
  setTimeout(init,500);
})();
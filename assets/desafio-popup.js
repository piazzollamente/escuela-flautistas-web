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

  function testimonials(){
    if(!isEs)return;
    const problemSection=document.getElementById('problema');
    if(!problemSection||!problemSection.parentNode)return;

    let section=document.getElementById('testimonios');
    if(!section){
      section=document.createElement('section');
      section.className='section testimonials-section';
      section.id='testimonios';
      section.setAttribute('aria-labelledby','testimonios-title');
      section.innerHTML='<div class="container"><div class="testimonials-heading"><div><div class="eyebrow">Testimonios reales</div><h2 id="testimonios-title">Lo que ya están descubriendo las alumnas</h2><p class="section-lead">Desde los primeros días, el desafío empieza a cambiar la manera de observar la embocadura, comprender las dificultades y organizar el estudio.</p></div><span class="testimonials-badge">Mensajes recibidos por WhatsApp</span></div><div class="testimonials-grid"><figure class="testimonial-card testimonial-card-featured"><div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%202.jpeg" alt="Testimonio de Leticia, alumna de Embocadura Organizada, sobre el workbook y el acompañamiento del desafío" loading="lazy" decoding="async"></div><figcaption><strong>Una ruta que da tranquilidad</strong><span>“El workbook me encanta… las dificultades se van poniendo en su sitio.”</span></figcaption></figure><figure class="testimonial-card"><div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%201.jpeg" alt="Testimonio de una alumna de Embocadura Organizada que agradece el material y cuenta sus descubrimientos" loading="lazy" decoding="async"></div><figcaption><strong>Descubrimientos desde el comienzo</strong><span>“Gracias por este tesoro de material.”</span></figcaption></figure></div><p class="testimonials-note">Capturas reales compartidas por participantes de la primera edición.</p></div>';
    }
    problemSection.parentNode.insertBefore(section,problemSection);
  }

  function css(){
    if(!isEs&&!isPt)return;
    if(document.getElementById('edfLangAndMarqueeCss'))return;
    const style=document.createElement('style');
    style.id='edfLangAndMarqueeCss';
    style.textContent='.language-switch{display:inline-flex!important;gap:10px!important;align-items:center!important;padding:7px 11px!important;border-radius:999px!important;background:rgba(255,255,255,.86)!important;border:1px solid rgba(174,230,223,.72)!important;font-size:.72rem!important;font-weight:900!important;letter-spacing:.08em!important;white-space:nowrap!important}.language-switch a{display:inline-flex!important;align-items:center!important;gap:5px!important;text-decoration:none!important;color:#6f6666!important;opacity:.72!important}.language-switch a.active{color:#c42030!important;opacity:1!important}.flag-icon{width:16px!important;height:16px!important;display:inline-block!important;border-radius:50%!important;box-shadow:none!important;flex:0 0 16px!important}.marquee-band{overflow:hidden!important;border-block:1px solid rgba(57,50,50,.09)!important;background:linear-gradient(90deg,var(--paper),rgba(174,230,223,.28),var(--paper))!important;color:var(--ink)!important;padding:0!important;text-align:left!important}.marquee-track{display:flex!important;width:max-content!important;animation:edfMarquee 28s linear infinite!important;will-change:transform!important}.marquee-group{display:flex!important;align-items:center!important;gap:18px!important;padding:13px 18px!important;white-space:nowrap!important;font-size:.78rem!important;letter-spacing:.24em!important;text-transform:uppercase!important;font-weight:950!important}.marquee-group span:nth-child(4n+1){color:var(--red)!important}.marquee-group span:nth-child(4n+2){color:var(--ink)!important}.marquee-group span:nth-child(4n+3){color:#497d75!important}.marquee-group span:nth-child(4n+4){color:var(--soft)!important}@keyframes edfMarquee{to{transform:translateX(-50%)}}.testimonials-section{overflow:hidden;background:radial-gradient(circle at 8% 20%,rgba(174,230,223,.25),transparent 24rem),linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,250,243,.78))}.testimonials-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:28px}.testimonials-heading h2{margin-top:0}.testimonials-badge{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:rgba(174,230,223,.30);border:1px solid rgba(174,230,223,.72);color:var(--dark);font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.testimonials-badge:before{content:"✓";display:grid;place-items:center;width:21px;height:21px;border-radius:50%;background:var(--mint);color:var(--ink);font-size:.72rem}.testimonials-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;margin-top:38px}.testimonial-card{position:relative;margin:0;padding:13px;border-radius:30px;background:rgba(255,255,255,.90);border:1px solid rgba(174,230,223,.52);box-shadow:0 20px 58px rgba(33,29,29,.09);transition:transform .22s ease,box-shadow .22s ease}.testimonial-card:hover{transform:translateY(-4px);box-shadow:0 28px 70px rgba(33,29,29,.13)}.testimonial-card-featured{margin-top:0}.testimonial-image-wrap{overflow:hidden;border-radius:21px;background:#151515}.testimonial-image-wrap img{width:100%;height:auto;aspect-ratio:auto;object-fit:contain}.testimonial-card figcaption{display:grid;gap:7px;padding:20px 14px 12px}.testimonial-card figcaption strong{font-family:var(--serif);font-size:clamp(1.45rem,2.2vw,2rem);line-height:1;color:var(--dark)}.testimonial-card figcaption span{color:rgba(111,102,102,.88);font-size:.92rem;font-weight:700;line-height:1.55}.testimonials-note{margin:22px 0 0;text-align:center;color:rgba(111,102,102,.68);font-size:.78rem;font-weight:750}@media(max-width:900px){.nav-links .language-switch{display:inline-flex!important}.nav-links>a:not(.btn){display:none!important}.testimonials-heading{display:grid;align-items:start}.testimonials-badge{width:max-content;max-width:100%}.testimonials-grid{grid-template-columns:1fr;gap:18px}.testimonial-card{padding:10px;border-radius:24px}.testimonial-image-wrap{border-radius:17px}}';
    document.head.appendChild(style);
  }

  function init(){pricePatch();languageSwitch();marqueePt();css();testimonials()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);
  setTimeout(init,500);
})();

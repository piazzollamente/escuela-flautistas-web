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

  function testimonials(){
    if(!isEs)return;
    const problem=document.getElementById('problema');
    if(!problem||!problem.parentNode)return;
    let section=document.getElementById('testimonios');
    if(section&&section.dataset.testimonialsHydrated==='true'){setupTestimonialsCarousel(section);return}
    if(!section){
      section=document.createElement('section');
      section.id='testimonios';
      section.className='section testimonials-section';
      section.setAttribute('aria-labelledby','testimonios-title');
    }
    section.dataset.testimonialsHydrated='true';
    section.innerHTML=`
      <div class="container">
        <div class="testimonials-heading">
          <div>
            <div class="eyebrow">Prueba social real</div>
            <h2 id="testimonios-title">Lo que empieza a pasar cuando la embocadura se ordena.</h2>
            <p class="section-lead">Mensajes reales de la primera generación. La idea no es mostrar capturas enormes: es que en pocos segundos se entienda qué resultado están percibiendo los alumnos.</p>
          </div>
          <span class="testimonials-badge">Primera generación en curso</span>
        </div>
        <div class="proof-layout">
          <article class="proof-feature">
            <span class="proof-kicker">Testimonio destacado · Día 8</span>
            <h3>“Ya me está sonando la flauta como nunca.”</h3>
            <p>Un alumno todavía no termina el desafío y ya percibe un sonido más lleno, enfocado y estable en todos los registros.</p>
            <div class="proof-tags"><span>Sonido lleno</span><span>Más foco</span><span>Todos los registros</span></div>
          </article>
          <div class="proof-metrics" aria-label="Resultados observados en testimonios">
            <div><strong>Día 8</strong><span>cambios audibles</span></div>
            <div><strong>21 días</strong><span>ruta guiada</span></div>
            <div><strong>4</strong><span>testimonios reales</span></div>
          </div>
        </div>
        <div class="testimonials-carousel" data-testimonials-carousel aria-label="Carrusel de testimonios del desafío">
          <button class="testimonial-arrow testimonial-prev" type="button" aria-label="Ver testimonio anterior">‹</button>
          <div class="testimonials-viewport">
            <div class="testimonials-track" data-testimonials-track>
              <figure class="testimonial-card testimonial-slide"><div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%204.jpeg" alt="Testimonio de alumno en el día 8: la flauta le suena llena y enfocada en todos los registros" loading="lazy" decoding="async"></div><figcaption><small>Día 8</small><strong>Sonido lleno y enfocado</strong><span>“Ya me está sonando la flauta como nunca en todos los registros.”</span></figcaption></figure>
              <figure class="testimonial-card testimonial-slide"><div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%203.jpeg" alt="Testimonio de una alumna que observa avances en su sonido antes de llegar a la mitad del curso" loading="lazy" decoding="async"></div><figcaption><small>Antes de la mitad</small><strong>Más conciencia del sonido</strong><span>“Cada video me hace darme cuenta de esos pequeños detalles.”</span></figcaption></figure>
              <figure class="testimonial-card testimonial-slide"><div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%202.jpeg" alt="Testimonio de Leticia sobre el workbook y el acompañamiento del desafío" loading="lazy" decoding="async"></div><figcaption><small>Workbook + ruta</small><strong>Las dificultades se ordenan</strong><span>“Las dificultades se van poniendo en su sitio.”</span></figcaption></figure>
              <figure class="testimonial-card testimonial-slide"><div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%201.jpeg" alt="Testimonio de una alumna que agradece el material y cuenta sus descubrimientos" loading="lazy" decoding="async"></div><figcaption><small>Material de estudio</small><strong>Descubrimientos desde el comienzo</strong><span>“Gracias por este tesoro de material.”</span></figcaption></figure>
            </div>
          </div>
          <button class="testimonial-arrow testimonial-next" type="button" aria-label="Ver siguiente testimonio">›</button>
        </div>
        <p class="testimonials-note">Capturas reales compartidas por participantes de la primera edición.</p>
      </div>`;
    problem.parentNode.insertBefore(section,problem);
    setupTestimonialsCarousel(section);
  }

  function setupTestimonialsCarousel(section){
    if(!section)return;
    const track=section.querySelector('[data-testimonials-track]');
    const slides=Array.from(section.querySelectorAll('.testimonial-slide'));
    if(!track||slides.length<2)return;
    if(track.dataset.carouselReady==='true')return;
    track.dataset.carouselReady='true';
    const prev=section.querySelector('.testimonial-prev');
    const next=section.querySelector('.testimonial-next');
    let index=0,timer=null;
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function visibleCount(){return window.innerWidth>=1040?2:window.innerWidth>=760?2:1}
    function maxIndex(){return Math.max(0,slides.length-visibleCount())}
    function render(){const gap=parseFloat(getComputedStyle(track).gap)||18;const width=slides[0].getBoundingClientRect().width;if(!width)return;index=Math.max(0,Math.min(index,maxIndex()));track.style.transform='translate3d('+(-(width+gap)*index)+'px,0,0)'}
    function go(step){index+=step;if(index>maxIndex())index=0;if(index<0)index=maxIndex();render()}
    function start(){if(reduced||timer||maxIndex()===0)return;timer=window.setInterval(()=>go(1),2500)}
    function stop(){if(timer){window.clearInterval(timer);timer=null}}
    prev&&prev.addEventListener('click',()=>{stop();go(-1);start()});
    next&&next.addEventListener('click',()=>{stop();go(1);start()});
    section.addEventListener('mouseenter',stop);section.addEventListener('mouseleave',start);section.addEventListener('focusin',stop);section.addEventListener('focusout',start);
    window.addEventListener('resize',()=>{render();stop();start()},{passive:true});
    if('IntersectionObserver'in window){new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){section.classList.add('is-carousel-active');start()}else stop()})},{threshold:.15}).observe(section)}else{section.classList.add('is-carousel-active');start()}
    requestAnimationFrame(()=>{render();setTimeout(render,450);setTimeout(()=>go(1),900)});
  }

  function injectCss(){
    if(!isEs&&!isPt||document.getElementById('edfDynamicCss'))return;
    const style=document.createElement('style');
    style.id='edfDynamicCss';
    style.textContent=`
      .language-switch{display:inline-flex!important;align-items:center;gap:9px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.86);border:1px solid rgba(174,230,223,.72);font-size:.72rem;font-weight:900;letter-spacing:.08em;white-space:nowrap}.language-switch a{display:inline-flex!important;gap:3px;align-items:center;color:var(--soft);opacity:.72}.language-switch a.active{color:var(--red);opacity:1}
      .testimonials-section{overflow:hidden;background:radial-gradient(circle at 8% 20%,rgba(174,230,223,.24),transparent 23rem),radial-gradient(circle at 92% 12%,rgba(196,32,48,.08),transparent 21rem),linear-gradient(180deg,rgba(255,255,255,.45),rgba(255,250,243,.86))}.testimonials-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:28px}.testimonials-heading h2{margin-top:0;max-width:880px}.testimonials-badge{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:rgba(174,230,223,.30);border:1px solid rgba(174,230,223,.72);font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.testimonials-badge:before{content:'✓';display:grid;place-items:center;width:21px;height:21px;border-radius:50%;background:var(--mint);color:var(--ink)}
      .proof-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:18px;margin:34px 0 26px}.proof-feature{position:relative;overflow:hidden;padding:32px;border-radius:30px;background:linear-gradient(135deg,#211d1d,#393232);box-shadow:0 24px 70px rgba(33,29,29,.16);color:#fff}.proof-feature:after{content:'';position:absolute;right:-70px;top:-90px;width:220px;height:220px;border-radius:50%;background:rgba(174,230,223,.18);filter:blur(8px)}.proof-kicker{display:inline-flex;margin-bottom:14px;color:var(--mint);font-size:.72rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.proof-feature h3{position:relative;z-index:1;color:#fff;font-family:var(--serif);font-size:clamp(2rem,4vw,4rem);line-height:.96;letter-spacing:-.05em;margin:0 0 14px}.proof-feature p{position:relative;z-index:1;max-width:680px;color:rgba(255,255,255,.78);font-weight:600}.proof-tags{position:relative;z-index:1;display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.proof-tags span{padding:8px 11px;border-radius:999px;background:rgba(174,230,223,.12);border:1px solid rgba(174,230,223,.28);color:rgba(255,255,255,.88);font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.proof-metrics{display:grid;gap:12px}.proof-metrics div{padding:22px;border-radius:24px;background:rgba(255,255,255,.86);border:1px solid rgba(174,230,223,.52);box-shadow:0 16px 42px rgba(33,29,29,.06)}.proof-metrics strong{display:block;color:var(--red);font-family:var(--serif);font-size:clamp(2rem,3vw,3rem);line-height:1}.proof-metrics span{display:block;color:var(--soft);font-size:.78rem;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
      .testimonials-carousel{position:relative;margin-top:18px;opacity:.78;transform:translateY(16px);transition:opacity .55s ease,transform .55s ease}.testimonials-section.is-carousel-active .testimonials-carousel{opacity:1;transform:translateY(0)}.testimonials-viewport{overflow:hidden;padding:8px 4px 10px}.testimonials-carousel:before,.testimonials-carousel:after{content:'';position:absolute;top:0;bottom:0;width:70px;z-index:2;pointer-events:none}.testimonials-carousel:before{left:0;background:linear-gradient(90deg,rgba(255,250,243,.92),transparent)}.testimonials-carousel:after{right:0;background:linear-gradient(270deg,rgba(255,250,243,.92),transparent)}.testimonials-track{display:flex;gap:18px;will-change:transform;transition:transform .58s cubic-bezier(.2,.82,.2,1)}
      .testimonial-card{flex:0 0 calc((100% - 18px)/2);margin:0;padding:12px;border-radius:26px;background:rgba(255,255,255,.94);border:1px solid rgba(174,230,223,.52);box-shadow:0 18px 46px rgba(33,29,29,.075);transition:.22s ease;display:grid;grid-template-columns:minmax(190px,.72fr) 1fr;gap:14px;align-items:center}.testimonial-card:hover{transform:translateY(-4px);box-shadow:0 24px 58px rgba(33,29,29,.12)}.testimonial-highlight{border-color:rgba(196,32,48,.30);box-shadow:0 18px 50px rgba(196,32,48,.10)}.testimonial-image-wrap{overflow:hidden;border-radius:18px;background:#151515;aspect-ratio:4/5;display:flex;align-items:center;justify-content:center}.testimonial-image-wrap img{width:100%;height:100%;object-fit:contain}.testimonial-card figcaption{display:grid;gap:7px;padding:8px 10px 8px 0}.testimonial-card figcaption small{color:var(--red);font-size:.68rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.testimonial-card figcaption strong{font-family:var(--serif);font-size:clamp(1.35rem,2.2vw,2rem);line-height:1}.testimonial-card figcaption span{color:rgba(111,102,102,.88);font-size:.9rem;font-weight:750;line-height:1.45}.testimonial-arrow{position:absolute;top:46%;z-index:3;width:42px;height:42px;border:1px solid rgba(174,230,223,.76);border-radius:50%;background:rgba(255,255,255,.94);box-shadow:0 12px 28px rgba(33,29,29,.10);color:var(--dark);font-size:2rem;line-height:1;display:grid;place-items:center;cursor:pointer}.testimonial-prev{left:8px}.testimonial-next{right:8px}.testimonial-arrow:hover{background:var(--mint-soft)}.testimonials-note{margin:20px 0 0;text-align:center;color:rgba(111,102,102,.68);font-size:.78rem;font-weight:750}
      @media(max-width:1039px){.proof-layout{grid-template-columns:1fr}.proof-metrics{grid-template-columns:repeat(3,1fr)}.testimonial-card{grid-template-columns:1fr;flex-basis:calc((100% - 18px)/2)}.testimonial-card figcaption{padding:8px 6px 6px}}
      @media(max-width:900px){.nav-links>a:not(.btn):not(.language-switch a){display:none!important}.testimonials-heading{display:grid}.testimonials-badge{width:max-content;max-width:100%}.testimonials-carousel:before,.testimonials-carousel:after{width:34px}}
      @media(max-width:759px){.proof-feature{padding:26px 22px}.proof-metrics{grid-template-columns:1fr}.testimonial-card{flex-basis:100%;border-radius:22px}.testimonial-image-wrap{border-radius:15px}.testimonial-arrow{width:38px;height:38px;font-size:1.8rem}.testimonial-card figcaption span{font-size:.84rem}}
      @media(prefers-reduced-motion:reduce){.testimonials-track,.testimonials-carousel{transition:none!important}}
    `;
    document.head.appendChild(style);
  }
  function init(){pricePatch();languageSwitch();marqueePt();injectCss();testimonials()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);setTimeout(init,500);
})();
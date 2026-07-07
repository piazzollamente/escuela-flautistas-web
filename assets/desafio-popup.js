(function(){
  const pathname=window.location.pathname.endsWith('/')?window.location.pathname:window.location.pathname+'/';
  const isEs=pathname==='/embocadura-organizada/';
  const isPt=pathname==='/pt/embocadura-organizada/';
  const isMasterclass=pathname==='/masterclass/';
  if(!isEs&&!isPt&&!isMasterclass)return;

  function pricePatch(){
    document.querySelectorAll('.price-big').forEach(el=>{
      if(el.textContent.includes('USD $29'))el.textContent='USD $39';
    });
    document.querySelectorAll('.savings').forEach(el=>{
      if(el.textContent.includes('289'))el.textContent=isPt?'Você economiza USD $279':'Ahorras USD $279';
    });
    document.querySelectorAll('.mobile-cta-copy span,.hero-actions a,.price-card strong').forEach(el=>{
      el.textContent=el.textContent.replace('USD $29','USD $39');
    });
    const support=document.querySelector(isPt?'#preco .receipt-support':'#precio .receipt-support');
    if(support){
      support.textContent=isPt
        ?'Esta é a primeira edição de Embocadura Organizada. Você ainda pode acessar o programa completo por uma fração do seu valor real enquanto a primeira geração de participantes do desafio continua aberta.'
        :'Esta es la primera edición de Embocadura Organizada. Aún puedes acceder al programa completo por una fracción de su valor real mientras sigue abierta la primera generación de participantes del desafío.';
    }
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
    band.className='marquee-band';
    band.removeAttribute('style');
    const group='<div class="marquee-group"><span>EMBOCADURA</span><span>·</span><span>SOM</span><span>·</span><span>RESPIRAÇÃO</span><span>·</span><span>CORPO</span><span>·</span><span>ESTABILIDADE</span><span>·</span><span>21 DIAS</span><span>·</span></div>';
    band.innerHTML='<div class="marquee-track">'+group+group+'</div>';
  }

  function testimonials(){
    if(!isEs)return;
    const problem=document.getElementById('problema');
    if(!problem||!problem.parentNode)return;
    let section=document.getElementById('testimonios');
    if(!section){
      section=document.createElement('section');
      section.id='testimonios';
      section.className='section testimonials-section';
      section.setAttribute('aria-labelledby','testimonios-title');
    }
    section.innerHTML=`
      <div class="container">
        <div class="testimonials-heading">
          <div>
            <div class="eyebrow">Testimonios reales</div>
            <h2 id="testimonios-title">Resultados que ya están apareciendo dentro del desafío</h2>
            <p class="section-lead">Una previsualización rápida de lo que ocurre cuando la embocadura se organiza: más claridad, más foco y un sonido que empieza a responder antes de terminar los 21 días.</p>
          </div>
          <span class="testimonials-badge">Primera generación en curso</span>
        </div>
        <div class="testimonials-carousel" data-testimonials-carousel aria-label="Carrusel de testimonios del desafío">
          <button class="testimonial-arrow testimonial-prev" type="button" aria-label="Ver testimonio anterior">‹</button>
          <div class="testimonials-track" data-testimonials-track>
            <figure class="testimonial-card testimonial-slide">
              <div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%203.jpeg" alt="Testimonio de una alumna que observa avances en su sonido antes de llegar a la mitad del curso" loading="lazy" decoding="async"></div>
              <figcaption><strong>Avances antes de llegar a la mitad</strong><span>“Cada video me hace darme cuenta de esos pequeños detalles que afectaban mi sonido.”</span></figcaption>
            </figure>
            <figure class="testimonial-card testimonial-slide">
              <div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%202.jpeg" alt="Testimonio de Leticia sobre el workbook y el acompañamiento del desafío" loading="lazy" decoding="async"></div>
              <figcaption><strong>Una ruta que da tranquilidad</strong><span>“El workbook me encanta… las dificultades se van poniendo en su sitio.”</span></figcaption>
            </figure>
            <figure class="testimonial-card testimonial-slide">
              <div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%201.jpeg" alt="Testimonio de una alumna que agradece el material y cuenta sus descubrimientos" loading="lazy" decoding="async"></div>
              <figcaption><strong>Descubrimientos desde el comienzo</strong><span>“Gracias por este tesoro de material.”</span></figcaption>
            </figure>
            <figure class="testimonial-card testimonial-slide testimonial-highlight">
              <div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%204.jpeg" alt="Testimonio de alumno en el día 8: la flauta le suena llena y enfocada en todos los registros" loading="lazy" decoding="async"></div>
              <figcaption><strong>Día 8: sonido lleno y enfocado</strong><span>“Ya me está sonando la flauta como nunca en todos los registros.”</span></figcaption>
            </figure>
          </div>
          <button class="testimonial-arrow testimonial-next" type="button" aria-label="Ver siguiente testimonio">›</button>
        </div>
        <p class="testimonials-note">Capturas reales compartidas por participantes de la primera edición.</p>
      </div>`;
    problem.parentNode.insertBefore(section,problem);
    setupTestimonialsCarousel(section);
  }

  function setupTestimonialsCarousel(section){
    if(!section||section.dataset.carouselReady==='true')return;
    const track=section.querySelector('[data-testimonials-track]');
    const slides=Array.from(section.querySelectorAll('.testimonial-slide'));
    const prev=section.querySelector('.testimonial-prev');
    const next=section.querySelector('.testimonial-next');
    if(!track||slides.length<2)return;
    section.dataset.carouselReady='true';
    let index=0;
    let timer=null;
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function visibleCount(){return window.innerWidth>=1040?3:window.innerWidth>=720?2:1}
    function maxIndex(){return Math.max(0,slides.length-visibleCount())}
    function render(){
      index=Math.max(0,Math.min(index,maxIndex()));
      const gap=parseFloat(getComputedStyle(track).gap)||18;
      const width=slides[0].getBoundingClientRect().width;
      track.style.transform='translate3d('+(-(width+gap)*index)+'px,0,0)';
    }
    function go(step){index=index+step;if(index>maxIndex())index=0;if(index<0)index=maxIndex();render()}
    function start(){if(reduced||timer)return;timer=window.setInterval(()=>go(1),3600)}
    function stop(){if(timer){window.clearInterval(timer);timer=null}}
    if(prev)prev.addEventListener('click',()=>{stop();go(-1);start()});
    if(next)next.addEventListener('click',()=>{stop();go(1);start()});
    section.addEventListener('mouseenter',stop);
    section.addEventListener('mouseleave',start);
    section.addEventListener('focusin',stop);
    section.addEventListener('focusout',start);
    window.addEventListener('resize',render,{passive:true});
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){section.classList.add('is-carousel-active');start()}else stop()});
    },{threshold:.34});
    observer.observe(section);
    render();
  }

  function injectCss(){
    if(!isEs&&!isPt||document.getElementById('edfDynamicCss'))return;
    const style=document.createElement('style');
    style.id='edfDynamicCss';
    style.textContent=`
      .language-switch{display:inline-flex!important;align-items:center;gap:9px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.86);border:1px solid rgba(174,230,223,.72);font-size:.72rem;font-weight:900;letter-spacing:.08em;white-space:nowrap}
      .language-switch a{display:inline-flex!important;gap:3px;align-items:center;color:var(--soft);opacity:.72}.language-switch a.active{color:var(--red);opacity:1}
      .testimonials-section{overflow:hidden;background:radial-gradient(circle at 8% 20%,rgba(174,230,223,.25),transparent 24rem),linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,250,243,.78))}
      .testimonials-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:28px}.testimonials-heading h2{margin-top:0}
      .testimonials-badge{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:rgba(174,230,223,.30);border:1px solid rgba(174,230,223,.72);font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .testimonials-badge:before{content:'✓';display:grid;place-items:center;width:21px;height:21px;border-radius:50%;background:var(--mint);color:var(--ink)}
      .testimonials-carousel{position:relative;margin-top:38px;opacity:.78;transform:translateY(16px);transition:opacity .55s ease,transform .55s ease}.testimonials-section.is-carousel-active .testimonials-carousel{opacity:1;transform:translateY(0)}
      .testimonials-carousel:before,.testimonials-carousel:after{content:'';position:absolute;top:0;bottom:0;width:76px;z-index:2;pointer-events:none}.testimonials-carousel:before{left:0;background:linear-gradient(90deg,rgba(255,250,243,.92),transparent)}.testimonials-carousel:after{right:0;background:linear-gradient(270deg,rgba(255,250,243,.92),transparent)}
      .testimonials-track{display:flex;gap:18px;will-change:transform;transition:transform .58s cubic-bezier(.2,.82,.2,1)}
      .testimonial-card{flex:0 0 calc((100% - 36px)/3);margin:0;padding:10px;border-radius:24px;background:rgba(255,255,255,.92);border:1px solid rgba(174,230,223,.52);box-shadow:0 18px 46px rgba(33,29,29,.075);transition:.22s ease}
      .testimonial-card:hover{transform:translateY(-4px);box-shadow:0 24px 58px rgba(33,29,29,.12)}.testimonial-highlight{border-color:rgba(196,32,48,.28);box-shadow:0 18px 50px rgba(196,32,48,.10)}
      .testimonial-image-wrap{overflow:hidden;border-radius:17px;background:#151515;aspect-ratio:4/5;display:flex;align-items:center;justify-content:center}.testimonial-image-wrap img{width:100%;height:100%;object-fit:contain}
      .testimonial-card figcaption{display:grid;gap:6px;padding:14px 8px 8px}.testimonial-card figcaption strong{font-family:var(--serif);font-size:clamp(1.16rem,1.65vw,1.55rem);line-height:1}.testimonial-card figcaption span{color:rgba(111,102,102,.88);font-size:.82rem;font-weight:750;line-height:1.45}
      .testimonial-arrow{position:absolute;top:42%;z-index:3;width:42px;height:42px;border:1px solid rgba(174,230,223,.76);border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 12px 28px rgba(33,29,29,.10);color:var(--dark);font-size:2rem;line-height:1;display:grid;place-items:center;cursor:pointer}.testimonial-prev{left:8px}.testimonial-next{right:8px}.testimonial-arrow:hover{background:var(--mint-soft)}
      .testimonials-note{margin:22px 0 0;text-align:center;color:rgba(111,102,102,.68);font-size:.78rem;font-weight:750}
      @media(max-width:1039px){.testimonial-card{flex-basis:calc((100% - 18px)/2)}}
      @media(max-width:900px){.nav-links>a:not(.btn):not(.language-switch a){display:none!important}.testimonials-heading{display:grid}.testimonials-badge{width:max-content;max-width:100%}.testimonials-carousel{margin-top:28px}.testimonials-carousel:before,.testimonials-carousel:after{width:34px}}
      @media(max-width:719px){.testimonial-card{flex-basis:100%;border-radius:22px}.testimonial-image-wrap{border-radius:15px}.testimonial-arrow{width:38px;height:38px;font-size:1.8rem}.testimonial-card figcaption{padding:13px 6px 7px}.testimonial-card figcaption span{font-size:.8rem}}
      @media(prefers-reduced-motion:reduce){.testimonials-track,.testimonials-carousel{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function init(){pricePatch();languageSwitch();marqueePt();injectCss();testimonials()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);
  setTimeout(init,500);
})();
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
            <h2 id="testimonios-title">Lo que ya están descubriendo las alumnas</h2>
            <p class="section-lead">Desde los primeros días, el desafío empieza a cambiar la manera de observar la embocadura, comprender las dificultades y organizar el estudio.</p>
          </div>
          <span class="testimonials-badge">Mensajes recibidos por WhatsApp</span>
        </div>
        <div class="testimonials-grid">
          <figure class="testimonial-card testimonial-card-wide">
            <div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%203.jpeg" alt="Testimonio de una alumna que observa avances en su sonido antes de llegar a la mitad del curso" loading="lazy" decoding="async"></div>
            <figcaption><strong>Avances antes de llegar a la mitad</strong><span>“Cada video me hace darme cuenta de esos pequeños detalles que afectaban mi sonido.”</span></figcaption>
          </figure>
          <figure class="testimonial-card">
            <div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%202.jpeg" alt="Testimonio de Leticia sobre el workbook y el acompañamiento del desafío" loading="lazy" decoding="async"></div>
            <figcaption><strong>Una ruta que da tranquilidad</strong><span>“El workbook me encanta… las dificultades se van poniendo en su sitio.”</span></figcaption>
          </figure>
          <figure class="testimonial-card">
            <div class="testimonial-image-wrap"><img src="/embocadura-organizada/Testimonio%201.jpeg" alt="Testimonio de una alumna que agradece el material y cuenta sus descubrimientos" loading="lazy" decoding="async"></div>
            <figcaption><strong>Descubrimientos desde el comienzo</strong><span>“Gracias por este tesoro de material.”</span></figcaption>
          </figure>
        </div>
        <p class="testimonials-note">Capturas reales compartidas por participantes de la primera edición.</p>
      </div>`;
    problem.parentNode.insertBefore(section,problem);
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
      .testimonials-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;margin-top:38px}
      .testimonial-card{margin:0;padding:13px;border-radius:30px;background:rgba(255,255,255,.90);border:1px solid rgba(174,230,223,.52);box-shadow:0 20px 58px rgba(33,29,29,.09);transition:.22s ease}
      .testimonial-card:hover{transform:translateY(-4px);box-shadow:0 28px 70px rgba(33,29,29,.13)}
      .testimonial-card-wide{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1.45fr) minmax(250px,.55fr);align-items:center}
      .testimonial-image-wrap{overflow:hidden;border-radius:21px;background:#151515}.testimonial-image-wrap img{width:100%;height:auto;object-fit:contain}
      .testimonial-card figcaption{display:grid;gap:7px;padding:20px 14px 12px}.testimonial-card-wide figcaption{padding:34px 30px}
      .testimonial-card figcaption strong{font-family:var(--serif);font-size:clamp(1.45rem,2.2vw,2rem);line-height:1}.testimonial-card-wide figcaption strong{font-size:clamp(1.8rem,3vw,2.7rem)}
      .testimonial-card figcaption span{color:rgba(111,102,102,.88);font-size:.92rem;font-weight:700;line-height:1.55}.testimonial-card-wide figcaption span{font-size:1rem}
      .testimonials-note{margin:22px 0 0;text-align:center;color:rgba(111,102,102,.68);font-size:.78rem;font-weight:750}
      @media(max-width:900px){.nav-links>a:not(.btn):not(.language-switch a){display:none!important}.testimonials-heading{display:grid}.testimonials-badge{width:max-content;max-width:100%}.testimonials-grid{grid-template-columns:1fr;gap:18px}.testimonial-card,.testimonial-card-wide{grid-column:auto;display:block;padding:10px;border-radius:24px}.testimonial-card-wide figcaption{padding:20px 14px 12px}.testimonial-image-wrap{border-radius:17px}}
    `;
    document.head.appendChild(style);
  }

  function init(){pricePatch();languageSwitch();marqueePt();injectCss();testimonials()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('load',init);
  setTimeout(init,500);
})();

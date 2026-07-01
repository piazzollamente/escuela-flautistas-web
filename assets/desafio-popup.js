(function(){
  const path=window.location.pathname.endsWith('/')?window.location.pathname:window.location.pathname+'/';
  const isEs=path==='/embocadura-organizada/';
  const isPt=path==='/pt/embocadura-organizada/';
  if(!isEs&&!isPt)return;
  function icon(kind){
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 36 36');
    svg.setAttribute('class','flag-icon');
    svg.setAttribute('aria-hidden','true');
    function node(name,attrs){const n=document.createElementNS(ns,name);Object.keys(attrs).forEach(k=>n.setAttribute(k,attrs[k]));svg.appendChild(n)}
    if(kind==='es'){
      node('circle',{cx:'18',cy:'18',r:'18',fill:'#c42030'});
      node('rect',{x:'0',y:'12',width:'36',height:'12',fill:'#f4c430'});
    }else{
      node('circle',{cx:'18',cy:'18',r:'18',fill:'#229e45'});
      node('circle',{cx:'18',cy:'18',r:'10',fill:'#f9d616'});
      node('circle',{cx:'18',cy:'18',r:'5',fill:'#2b4ea2'});
    }
    return svg;
  }
  function makeLink(href,title,code,kind,active){
    const a=document.createElement('a');
    a.href=href;a.title=title;if(active)a.className='active';
    a.appendChild(icon(kind));
    const s=document.createElement('span');s.textContent=code;a.appendChild(s);
    return a;
  }
  function addPtAnimations(){
    if(!isPt)return;
    const hero=document.querySelector('.hero');
    if(hero){
      hero.querySelector('h1')?.classList.add('hero-title');
      hero.querySelectorAll('.hero-copy p,.eyebrow').forEach(el=>el.classList.add('hero-subtitle'));
      hero.querySelector('.hero-actions')?.classList.add('hero-cta');
      hero.querySelectorAll('.trust-line').forEach(el=>el.classList.add('hero-trust'));
      hero.querySelector('.hero-proof')?.classList.add('hero-proof-anim');
      hero.querySelector('.image-card')?.classList.add('hero-visual');
    }
    const firstBand=[...document.querySelectorAll('body>div,main>div,section')].find(el=>/EMBOCADURA.*SOM.*RESPIRAÇÃO/i.test(el.textContent||''));
    if(firstBand&&!firstBand.classList.contains('marquee-band')){
      firstBand.className='marquee-band';
      firstBand.removeAttribute('style');
      firstBand.innerHTML='<div class="marquee-track"><div class="marquee-group"><span>EMBOCADURA</span><span>·</span><span>SOM</span><span>·</span><span>RESPIRAÇÃO</span><span>·</span><span>CORPO</span><span>·</span><span>ESTABILIDADE</span><span>·</span><span>21 DIAS</span><span>·</span></div><div class="marquee-group" aria-hidden="true"><span>EMBOCADURA</span><span>·</span><span>SOM</span><span>·</span><span>RESPIRAÇÃO</span><span>·</span><span>CORPO</span><span>·</span><span>ESTABILIDADE</span><span>·</span><span>21 DIAS</span><span>·</span></div></div>';
    }
    const progress=[...document.querySelectorAll('section')].find(el=>/Dias 1.*7|Dias 8.*14|Dias 15.*21/i.test(el.textContent||''));
    if(progress){
      progress.classList.add('progress-timeline','reveal-on-scroll');
      const cards=progress.querySelectorAll('.card');
      if(cards.length===3){
        const grid=progress.querySelector('.grid');
        if(grid){
          grid.className='timeline';
          if(!grid.querySelector('.timeline-line')){
            const line=document.createElement('div');line.className='timeline-line';line.setAttribute('aria-hidden','true');grid.prepend(line);
          }
        }
        cards.forEach(card=>{
          card.classList.remove('card');
          card.classList.add('timeline-step','reveal-on-scroll');
          const title=card.querySelector('h3');
          if(title&&!card.querySelector('.timeline-dot')){
            const m=title.textContent.match(/(\d+)[^\d]+(\d+)/);
            const dot=document.createElement('span');dot.className='timeline-dot';dot.textContent=m?m[1]+'–'+m[2]:'21';
            card.prepend(dot);
          }
        });
      }
    }
    if(!document.getElementById('edfPtAnimationsCss')){
      const style=document.createElement('style');
      style.id='edfPtAnimationsCss';
      style.textContent='.hero-title,.hero-subtitle,.hero-cta,.hero-trust,.hero-proof-anim,.hero-visual{opacity:0;transform:translateY(22px);animation:edfHeroIn .82s cubic-bezier(.2,.72,.18,1) forwards}.hero-title{animation-delay:.08s}.hero-subtitle{animation-delay:.24s}.hero-cta{animation-delay:.38s}.hero-trust{animation-delay:.5s}.hero-proof-anim{animation-delay:.58s}.hero-visual{animation-delay:.32s}.marquee-band{overflow:hidden;border-block:1px solid rgba(57,50,50,.09);background:linear-gradient(90deg,var(--paper),rgba(174,230,223,.28),var(--paper));color:var(--ink)}.marquee-track{display:flex;width:max-content;animation:edfMarquee 28s linear infinite;will-change:transform}.marquee-group{display:flex;align-items:center;gap:18px;padding:13px 18px;white-space:nowrap;font-size:.78rem;letter-spacing:.24em;text-transform:uppercase;font-weight:950}.marquee-group span:nth-child(4n+1){color:var(--red)}.marquee-group span:nth-child(4n+2){color:var(--ink)}.marquee-group span:nth-child(4n+3){color:#497d75}.marquee-group span:nth-child(4n+4){color:var(--soft)}.progress-timeline{background:linear-gradient(180deg,#fff,var(--off))}.timeline{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:36px}.timeline-line{position:absolute;left:calc(16.666% + 18px);right:calc(16.666% + 18px);top:38px;height:2px;background:rgba(57,50,50,.12);overflow:hidden}.timeline-line:after{content:"";display:block;width:100%;height:100%;background:linear-gradient(90deg,var(--red),var(--mint),var(--red-deep));transform:scaleX(0);transform-origin:left;transition:transform 1.15s cubic-bezier(.2,.72,.18,1)}.progress-timeline.is-visible .timeline-line:after{transform:scaleX(1)}.timeline-step{position:relative;padding:30px 24px 26px;border-radius:26px;background:rgba(255,255,255,.84);border:1px solid rgba(174,230,223,.48);box-shadow:0 18px 48px rgba(33,29,29,.06)}.timeline-dot{display:grid;place-items:center;width:58px;height:58px;margin-bottom:20px;border-radius:50%;background:var(--paper);border:1px solid rgba(196,32,48,.22);color:var(--red);font-family:var(--serif);font-size:1.28rem;font-weight:700;box-shadow:0 14px 30px rgba(196,32,48,.08)}.timeline-step h3{font-family:var(--sans);font-size:1rem;letter-spacing:0;font-weight:900;margin-bottom:10px}@keyframes edfHeroIn{to{opacity:1;transform:translateY(0)}}@keyframes edfMarquee{to{transform:translateX(-50%)}}@media(max-width:900px){.timeline{grid-template-columns:1fr}.timeline-line{left:29px;right:auto;top:72px;bottom:30px;width:2px;height:auto}.timeline-line:after{transform:scaleY(0);transform-origin:top}.progress-timeline.is-visible .timeline-line:after{transform:scaleY(1)}.timeline-step{padding-left:86px}.timeline-dot{position:absolute;left:24px;top:26px;width:42px;height:42px;font-size:1rem}}@media(prefers-reduced-motion:reduce){.hero-title,.hero-subtitle,.hero-cta,.hero-trust,.hero-proof-anim,.hero-visual{opacity:1;transform:none;animation:none}.marquee-track{animation:none}.timeline-line:after{transform:none}}';
      document.head.appendChild(style);
    }
  }
  function init(){
    document.querySelectorAll('#edfLanguageSwitch').forEach(el=>el.remove());
    const nav=document.querySelector('.nav-links');
    if(nav){
      let switches=document.querySelectorAll('.language-switch,.lang-switch');
      switches.forEach((el,i)=>{if(i>0)el.remove()});
      let sw=document.querySelector('.language-switch,.lang-switch');
      if(!sw){sw=document.createElement('span');sw.className='language-switch';nav.insertBefore(sw,nav.firstChild)}
      sw.className='language-switch';
      sw.setAttribute('aria-label',isPt?'Selecionar idioma':'Seleccionar idioma');
      sw.innerHTML='';
      sw.appendChild(makeLink('/embocadura-organizada/','Español','ES','es',isEs));
      sw.appendChild(makeLink('/pt/embocadura-organizada/','Português','PT','br',isPt));
    }
    if(!document.getElementById('edfLanguageSwitchCss')){
      const style=document.createElement('style');
      style.id='edfLanguageSwitchCss';
      style.textContent='.language-switch{display:inline-flex!important;gap:8px!important;align-items:center!important;padding:7px 10px!important;border-radius:999px!important;background:rgba(255,255,255,.86)!important;border:1px solid rgba(174,230,223,.72)!important;font-size:.72rem!important;font-weight:900!important;letter-spacing:.08em!important;white-space:nowrap!important}.language-switch a{display:inline-flex!important;align-items:center!important;gap:5px!important;text-decoration:none!important;color:#6f6666!important;opacity:.72!important}.language-switch a.active{color:#c42030!important;opacity:1!important}.flag-icon{width:16px!important;height:16px!important;display:inline-block!important;border-radius:50%!important;box-shadow:none!important;flex:0 0 16px!important}@media(max-width:900px){.nav-links .language-switch{display:inline-flex!important}.nav-links>a:not(.btn){display:none!important}}';
      document.head.appendChild(style);
    }
    addPtAnimations();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
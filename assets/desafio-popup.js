(function(){
  const rawPath=window.location.pathname;
  const path=rawPath.endsWith('/')?rawPath:rawPath+'/';
  if(path==='/embocadura-organizada/'||path==='/cuenta-regresiva/') return;

  const destination='https://escueladeflautistas.cl/embocadura-organizada/?utm_source=web&utm_medium=popup&utm_campaign=desafio_21_dias&utm_content=desafio_abierto_global';
  const image='/assets/embocadura-organizada/portada.png';
  const nudgeKey='edfChallengeNudgeClosedV1';
  const isHome=path==='/'||path==='/index.html/';
  const isMasterclass=path==='/masterclass/';
  const isOldPage=['/embocadura/','/sonido/','/workbook/','/instructivo/'].includes(path);

  if(document.getElementById('edfChallengePopup')) return;

  function addCss(){
    if(document.getElementById('edfChallengePopupCss')) return;
    const link=document.createElement('link');
    link.id='edfChallengePopupCss';
    link.rel='stylesheet';
    link.href='/assets/desafio-popup-card.css';
    document.head.appendChild(link);
  }

  function canShow(key){try{return !(window.localStorage&&localStorage.getItem(key)==='1')}catch(error){return true}}
  function markClosed(key){try{if(window.localStorage)localStorage.setItem(key,'1')}catch(error){}}

  function findWorkSection(){
    const sections=[...document.querySelectorAll('section,[id],main>div')];
    return sections.find(el=>/c[oó]mo trabajamos/i.test(el.textContent||''));
  }

  function init(){
    addCss();

    const backdrop=document.createElement('div');
    backdrop.className='edf-popup-backdrop';
    backdrop.id='edfChallengePopupBackdrop';

    const popup=document.createElement('aside');
    popup.className='edf-popup';
    popup.id='edfChallengePopup';
    popup.setAttribute('aria-label','Desafío 21 días');
    popup.innerHTML=`
      <button class="edf-popup__close" type="button" aria-label="Cerrar aviso" id="edfChallengePopupClose">×</button>
      <div class="edf-popup__media">
        <img class="edf-popup__image" src="${image}" alt="Portada del Desafío 21 días: Embocadura Organizada" loading="lazy">
      </div>
      <div class="edf-popup__body">
        <span class="edf-popup__badge">Acceso promocional</span>
        <h3>¡Desafío 21 días abierto!</h3>
        <p>¡Ordena tu embocadura con clases de 3 a 7 min!</p>
        <div class="edf-popup__meta"><span>21<small>días</small></span><span>3-7<small>min</small></span><span>29<small>USD</small></span></div>
        <a class="edf-popup__button" href="${destination}">Entrar al desafío →</a>
      </div>`;

    const float=document.createElement('button');
    float.className='edf-float';
    float.type='button';
    float.setAttribute('aria-label','Entrar al Desafío 21 días');
    float.innerHTML='<span class="edf-float__dot"></span><span>Desafío 21 días</span>';

    const nudge=document.createElement('div');
    nudge.className='edf-nudge';
    nudge.id='edfChallengeNudge';
    nudge.innerHTML='<button type="button" aria-label="Cerrar recordatorio" id="edfChallengeNudgeClose">×</button><strong>¿Lo quieres llevar a la práctica?</strong><p>El Desafío 21 días sigue abierto. Puedes entrar cuando quieras desde este botón.</p>';

    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
    document.body.appendChild(float);
    document.body.appendChild(nudge);

    function showFloat(){float.classList.add('is-visible')}
    function hideFloat(){float.classList.remove('is-visible')}
    function showPopup(){hideFloat();nudge.classList.remove('is-visible');popup.classList.add('is-visible');backdrop.classList.add('is-visible')}
    function hidePopup(){popup.classList.remove('is-visible');backdrop.classList.remove('is-visible');showFloat()}
    function showNudge(){if(!popup.classList.contains('is-visible')&&canShow(nudgeKey))nudge.classList.add('is-visible')}
    function hideNudge(save){nudge.classList.remove('is-visible');if(save)markClosed(nudgeKey)}

    document.getElementById('edfChallengePopupClose').addEventListener('click',hidePopup);
    backdrop.addEventListener('click',hidePopup);
    document.getElementById('edfChallengeNudgeClose').addEventListener('click',()=>hideNudge(true));
    float.addEventListener('click',()=>{hideNudge(false);showPopup()});

    if(isHome){
      showFloat();
      const target=findWorkSection();
      if(target&&'IntersectionObserver'in window){
        let shown=false;
        const observer=new IntersectionObserver(entries=>{
          if(shown)return;
          entries.forEach(entry=>{if(entry.isIntersecting){shown=true;showPopup();observer.disconnect()}})
        },{threshold:.18,rootMargin:'0px 0px -18% 0px'});
        observer.observe(target);
      }else{
        window.addEventListener('scroll',function onScroll(){if(window.scrollY>window.innerHeight*.45){window.removeEventListener('scroll',onScroll);showPopup()}},{passive:true});
      }
      window.setTimeout(showNudge,120000);
      return;
    }

    if(isMasterclass){
      window.setTimeout(showPopup,8000);
      window.setTimeout(showNudge,120000);
      return;
    }

    if(isOldPage){
      showFloat();
      window.setTimeout(showPopup,25000);
      return;
    }

    showFloat();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

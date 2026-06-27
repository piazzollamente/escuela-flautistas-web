(function(){
  const destination='https://escueladeflautistas.cl/embocadura-organizada/?utm_source=web&utm_medium=popup&utm_campaign=desafio_21_dias&utm_content=desafio_abierto_global';
  const image='/assets/embocadura-organizada/portada.png';
  const storageKey='edfChallengePopupClosedV2';

  if(document.getElementById('edfChallengePopup')) return;
  try{ if(window.localStorage && localStorage.getItem(storageKey)==='1') return; }catch(error){}

  function addCss(){
    if(document.getElementById('edfChallengePopupCss')) return;
    const link=document.createElement('link');
    link.id='edfChallengePopupCss';
    link.rel='stylesheet';
    link.href='/assets/desafio-popup-card.css';
    document.head.appendChild(link);
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

    document.body.appendChild(backdrop);
    document.body.appendChild(popup);

    function show(){ popup.classList.add('is-visible'); backdrop.classList.add('is-visible'); }
    function hide(){
      popup.classList.remove('is-visible');
      backdrop.classList.remove('is-visible');
      try{ if(window.localStorage) localStorage.setItem(storageKey,'1'); }catch(error){}
    }

    const timer=window.setTimeout(show,5000);
    const close=document.getElementById('edfChallengePopupClose');
    if(close) close.addEventListener('click',function(){ window.clearTimeout(timer); hide(); });
    backdrop.addEventListener('click',function(){ window.clearTimeout(timer); hide(); });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

(function () {
  const destination = 'https://escueladeflautistas.cl/embocadura-organizada/?utm_source=web&utm_medium=popup&utm_campaign=desafio_21_dias&utm_content=desafio_abierto_global';
  const image = '/assets/embocadura-organizada/portada.png';
  const storageKey = 'edfChallengePopupClosed';

  if (document.getElementById('edfChallengePopup')) return;

  try {
    if (window.localStorage && localStorage.getItem(storageKey) === '1') return;
  } catch (error) {}

  const css = `
    .edf-popup-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9997;
      background:
        radial-gradient(circle at 50% 44%, rgba(196, 32, 48, .24), transparent 25rem),
        rgba(33, 29, 29, .72);
      backdrop-filter: blur(8px);
      opacity: 0;
      pointer-events: none;
      transition: opacity .32s ease;
    }

    .edf-popup-backdrop.is-visible {
      opacity: 1;
      pointer-events: auto;
    }

    .edf-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      z-index: 9998;
      width: min(760px, calc(100vw - 30px));
      border-radius: 34px;
      background:
        linear-gradient(145deg, rgba(255, 255, 255, .96), rgba(255, 250, 243, .99)),
        #fffaf3;
      border: 1px solid rgba(174, 230, 223, .72);
      box-shadow: 0 34px 110px rgba(0, 0, 0, .46);
      overflow: hidden;
      transform: translate(-50%, -46%) scale(.94);
      opacity: 0;
      pointer-events: none;
      transition: opacity .32s ease, transform .32s cubic-bezier(.2, .82, .2, 1);
      font-family: 'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #393232;
    }

    .edf-popup.is-visible {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    .edf-popup__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 15px 20px;
      background: linear-gradient(135deg, #393232, #211d1d);
      color: #AEE6DF;
      font-size: .72rem;
      font-weight: 900;
      letter-spacing: .14em;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(174, 230, 223, .20);
    }

    .edf-popup__close {
      width: 38px;
      height: 38px;
      border: 1px solid rgba(255, 255, 255, .14);
      border-radius: 999px;
      background: rgba(255, 255, 255, .10);
      color: #fff;
      cursor: pointer;
      font-size: 1.28rem;
      line-height: 1;
    }

    .edf-popup__grid {
      display: grid;
      grid-template-columns: .88fr 1.12fr;
      gap: 0;
      align-items: stretch;
    }

    .edf-popup__image-wrap {
      position: relative;
      min-height: 360px;
      background:
        radial-gradient(circle at 50% 40%, rgba(174, 230, 223, .24), transparent 16rem),
        linear-gradient(145deg, #211d1d, #393232);
      padding: 24px;
      display: grid;
      place-items: center;
      overflow: hidden;
    }

    .edf-popup__image-wrap::after {
      content: '';
      position: absolute;
      inset: auto -20% -28% -20%;
      height: 58%;
      background: radial-gradient(ellipse at center, rgba(196, 32, 48, .32), transparent 62%);
    }

    .edf-popup__image {
      position: relative;
      z-index: 1;
      width: min(260px, 76%);
      max-height: 320px;
      object-fit: contain;
      border-radius: 22px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, .36);
      transform: rotate(-2deg);
    }

    .edf-popup__body {
      position: relative;
      display: grid;
      align-content: center;
      gap: 16px;
      padding: 34px;
      background:
        radial-gradient(circle at 100% 0%, rgba(174, 230, 223, .36), transparent 13rem),
        radial-gradient(circle at 0% 100%, rgba(196, 32, 48, .08), transparent 13rem);
    }

    .edf-popup__badge {
      width: fit-content;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(196, 32, 48, .10);
      color: #C42030;
      font-size: .72rem;
      font-weight: 900;
      letter-spacing: .1em;
      text-transform: uppercase;
      border: 1px solid rgba(196, 32, 48, .18);
    }

    .edf-popup h3 {
      margin: 0;
      color: #393232;
      font-size: clamp(2.05rem, 4vw, 3.05rem);
      line-height: .96;
      letter-spacing: -.055em;
      font-weight: 900;
    }

    .edf-popup p {
      margin: 0;
      color: rgba(57, 50, 50, .80);
      font-size: 1.04rem;
      line-height: 1.55;
      font-weight: 650;
      max-width: 34ch;
    }

    .edf-popup__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 2px;
    }

    .edf-popup__meta span {
      display: inline-flex;
      align-items: center;
      min-height: 31px;
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(174, 230, 223, .30);
      color: #393232;
      font-size: .78rem;
      font-weight: 850;
      border: 1px solid rgba(57, 50, 50, .08);
    }

    .edf-popup__button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 56px;
      margin-top: 6px;
      padding: 15px 22px;
      border-radius: 999px;
      background: #C42030;
      color: #fff;
      font-size: .92rem;
      font-weight: 900;
      letter-spacing: .07em;
      line-height: 1.15;
      text-align: center;
      text-decoration: none;
      text-transform: uppercase;
      box-shadow: 0 18px 38px rgba(196, 32, 48, .30);
      transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
    }

    .edf-popup__button:hover {
      transform: translateY(-2px);
      background: #8f1721;
      box-shadow: 0 22px 44px rgba(196, 32, 48, .34);
    }

    @media (max-width: 760px) {
      .edf-popup {
        width: calc(100vw - 28px);
        border-radius: 26px;
      }

      .edf-popup__grid {
        grid-template-columns: 1fr;
      }

      .edf-popup__image-wrap {
        min-height: 210px;
        padding: 18px;
      }

      .edf-popup__image {
        width: min(170px, 54%);
        max-height: 185px;
      }

      .edf-popup__body {
        padding: 24px;
      }
    }
  `;

  const style = document.createElement('style');
  style.id = 'edfChallengePopupStyles';
  style.textContent = css;
  document.head.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.className = 'edf-popup-backdrop';
  backdrop.id = 'edfChallengePopupBackdrop';

  const popup = document.createElement('aside');
  popup.className = 'edf-popup';
  popup.id = 'edfChallengePopup';
  popup.setAttribute('aria-label', 'Desafío 21 días');
  popup.innerHTML = `
    <div class="edf-popup__top">
      <span>Escuela de Flautistas</span>
      <button class="edf-popup__close" type="button" aria-label="Cerrar aviso" id="edfChallengePopupClose">×</button>
    </div>
    <div class="edf-popup__grid">
      <div class="edf-popup__image-wrap">
        <img class="edf-popup__image" src="${image}" alt="Portada del Desafío 21 días: Embocadura Organizada" loading="lazy">
      </div>
      <div class="edf-popup__body">
        <span class="edf-popup__badge">Acceso promocional</span>
        <h3>¡Desafío 21 días abierto!</h3>
        <p>¡Ordena tu embocadura con clases de 3 a 7 min!</p>
        <div class="edf-popup__meta"><span>21 días</span><span>3 a 7 min</span><span>29 USD</span></div>
        <a class="edf-popup__button" href="${destination}">Entrar al desafío</a>
      </div>
    </div>
  `;

  function mountPopup() {
    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
  }

  function showPopup() {
    popup.classList.add('is-visible');
    backdrop.classList.add('is-visible');
  }

  function hidePopup() {
    popup.classList.remove('is-visible');
    backdrop.classList.remove('is-visible');
    try {
      if (window.localStorage) localStorage.setItem(storageKey, '1');
    } catch (error) {}
  }

  function init() {
    mountPopup();

    const showTimer = window.setTimeout(showPopup, 5000);
    const close = document.getElementById('edfChallengePopupClose');

    if (close) {
      close.addEventListener('click', function () {
        window.clearTimeout(showTimer);
        hidePopup();
      });
    }

    backdrop.addEventListener('click', function () {
      window.clearTimeout(showTimer);
      hidePopup();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

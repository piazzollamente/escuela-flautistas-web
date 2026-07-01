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
  function init(){
    document.querySelectorAll('#edfLanguageSwitch').forEach(el=>el.remove());
    const nav=document.querySelector('.nav-links');
    if(!nav)return;
    let switches=document.querySelectorAll('.language-switch,.lang-switch');
    switches.forEach((el,i)=>{if(i>0)el.remove()});
    let sw=document.querySelector('.language-switch,.lang-switch');
    if(!sw){sw=document.createElement('span');sw.className='language-switch';nav.insertBefore(sw,nav.firstChild)}
    sw.className='language-switch';
    sw.setAttribute('aria-label',isPt?'Selecionar idioma':'Seleccionar idioma');
    sw.innerHTML='';
    sw.appendChild(makeLink('/embocadura-organizada/','Español','ES','es',isEs));
    sw.appendChild(makeLink('/pt/embocadura-organizada/','Português','PT','br',isPt));
    if(!document.getElementById('edfLanguageSwitchCss')){
      const style=document.createElement('style');
      style.id='edfLanguageSwitchCss';
      style.textContent='.language-switch{display:inline-flex!important;gap:8px!important;align-items:center!important;padding:7px 10px!important;border-radius:999px!important;background:rgba(255,255,255,.86)!important;border:1px solid rgba(174,230,223,.72)!important;font-size:.72rem!important;font-weight:900!important;letter-spacing:.08em!important;white-space:nowrap!important}.language-switch a{display:inline-flex!important;align-items:center!important;gap:5px!important;text-decoration:none!important;color:#6f6666!important;opacity:.72!important}.language-switch a.active{color:#c42030!important;opacity:1!important}.flag-icon{width:16px!important;height:16px!important;display:inline-block!important;border-radius:50%!important;box-shadow:none!important;flex:0 0 16px!important}@media(max-width:900px){.nav-links .language-switch{display:inline-flex!important}.nav-links>a:not(.btn){display:none!important}}';
      document.head.appendChild(style);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
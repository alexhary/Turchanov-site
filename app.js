
/* ===================== i18n ===================== */
const I18N = {
  en: {
    title: "Aleksey Turchanov",
    subtitle: "Spatial Design • Digital Production • Art-driven Installations",
    body: `Designing forms where art meets architecture.

A multidisciplinary designer working across ephemeral architecture, installations, interior objects and digital visual production.
Developing concepts that unite form, light and material, transforming them into sculptural spaces for brands, exhibitions and cultural projects.

Based in Barcelona, I create spatial and digital experiences — from concept and design to fabrication-ready solutions and visual presentation.`
  },

  es: {
    title: "Aleksey Turchanov",
    subtitle: "Diseño Espacial • Producción Digital • Instalaciones Artísticas",
    body: `Diseñador multidisciplinar que trabaja en arquitectura efímera, instalaciones, objetos interiores y producción visual digital.
Desarrolla conceptos que unen forma, luz y materia, transformándolos en espacios escultóricos para marcas, exposiciones y proyectos culturales.

Con base en Barcelona, crea experiencias espaciales y digitales — desde el concepto y el diseño hasta soluciones listas para fabricación y presentación visual.`
  },

  ru: {
    title: "Алексей Турчанов",
    subtitle: "Дизайн пространств • Цифровая продукция • Художественные инсталляции",
    body: `Междисциплинарный дизайнер, работающий в области архитектуры эфемера, инсталляций, интерьерных объектов и цифрового визуального дизайна.
Создаёт концепции, объединяющие форму, свет и материю, превращая их в скульптурные пространства для брендов, выставок и культурных проектов.

Базируется в Барселоне. Создаёт пространственные и цифровые опыты — от идеи и дизайна до решений, готовых к производству и презентации.`
  }
};

/* ===================== Аккордеон ===================== */
const acc       = document.getElementById('acc');
const pLang     = document.getElementById('panel-lang');
const pContact  = document.getElementById('panel-contact');
let openPane    = null;

function setAccordionHeight(open){
  if(open){
    acc.style.maxHeight = '0px';
    requestAnimationFrame(()=> acc.style.maxHeight = acc.scrollHeight + 'px');
  }else{
    acc.style.maxHeight = acc.scrollHeight + 'px';
    requestAnimationFrame(()=> acc.style.maxHeight = '0px');
  }
}

function showLang(lang){
  document.getElementById('lang-title').textContent = I18N[lang].title;
  document.getElementById('lang-body').textContent  = I18N[lang].body;
  pContact.setAttribute('aria-hidden','true');
  pLang.setAttribute('aria-hidden','false');
}

function openLang(lang){
  const willClose = (openPane === 'lang' && acc.style.maxHeight !== '0px');
  if(willClose){
    openPane = null; setAccordionHeight(false);
    setTimeout(()=> pLang.setAttribute('aria-hidden','true'), 350);
    return;
  }
  showLang(lang);
  setAccordionHeight(true);
  openPane = 'lang';
}

function openContact(){
  const willClose = (openPane === 'contact' && acc.style.maxHeight !== '0px');
  if(willClose){
    openPane = null; setAccordionHeight(false);
    setTimeout(()=> pContact.setAttribute('aria-hidden','true'), 350);
    return;
  }
  pLang.setAttribute('aria-hidden','true');
  pContact.setAttribute('aria-hidden','false');
  setAccordionHeight(true);
  openPane = 'contact';
}

document.querySelectorAll('.flag').forEach(f => f.addEventListener('click', () => openLang(f.dataset.lang)));
document.querySelectorAll('[data-contact]').forEach(btn => btn.addEventListener('click', openContact));

/* ===================== Parallax ===================== */
(function(){
  const MAX_TILT = 25;     // насколько сильно наклоняем
  const LERP_ROT = 0.12;   // сглаживание поворота
  const LERP_SCL = 0.08;   // сглаживание масштаба (чем меньше, тем плавней)
  const PAR      = 0.35;   // разлёт слоёв
  const SCALE_IN = 0.9;   // целевой scale при наведении/движении
  const SCALE_OUT= 1.00;   // целевой scale при выходе

  document.querySelectorAll('.tilt').forEach(root=>{
    const st = { rx:0, ry:0, tRx:0, tRy:0, s:SCALE_OUT, tS:SCALE_OUT };
    const layers = [...root.querySelectorAll('.layer')];

    const onMove = e =>{
      const r = root.getBoundingClientRect();
      const p = ('touches' in e) ? e.touches[0] : e;
      const nx = (p.clientX - (r.left + r.width/2)) / (r.width/2);
      const ny = (p.clientY - (r.top  + r.height/2)) / (r.height/2);
      st.tRy =  MAX_TILT * nx;
      st.tRx = -MAX_TILT * ny;
      st.tS  = SCALE_IN;            // <-- вместо мгновенного scale ставим целевой
    };

    const onLeave = ()=>{
      st.tRx = st.tRy = 0;
      st.tS  = SCALE_OUT;           // <-- целевой scale при выходе
    };

    root.addEventListener('mousemove', onMove, {passive:true});
    root.addEventListener('touchmove', onMove, {passive:true});
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('touchend', onLeave);
    root.addEventListener('touchcancel', onLeave);

    (function tick(){
      // Плавно тянем текущие значения к целевым
      st.rx += (st.tRx - st.rx) * LERP_ROT;
      st.ry += (st.tRy - st.ry) * LERP_ROT;
      st.s  += (st.tS  - st.s ) * LERP_SCL;

      root.style.transform =
        `rotateX(${st.rx.toFixed(2)}deg) rotateY(${st.ry.toFixed(2)}deg) scale(${st.s.toFixed(3)})`;

      const dx = -st.ry * PAR, dy = st.rx * PAR;
      for(const layer of layers){
        const d = parseFloat(layer.dataset.depth || 0);
        layer.style.transform = `translate3d(${(dx*d).toFixed(2)}px, ${(dy*d).toFixed(2)}px, 0)`;
      }
      requestAnimationFrame(tick);
    })();
  });
})();


/* ===================== Lightbox ===================== */
(function(){
  const ARROW_SRC = 'images/arrow-L.svg';
  function build(node){
    // New: explicit file list via data-files="a.jpg | b.webp | c.png"
    const rawFiles = (node.getAttribute('data-files') || '').trim();
    let items = [];
    if (rawFiles) {
      items = rawFiles.split('|').map(s => s.trim()).filter(Boolean);
    } else {
      // Fallback: old scheme data-album + data-count (+ base/ext)
      const n = node.getAttribute('data-album');
      const k = +node.getAttribute('data-count') || 0;
      const base = node.getAttribute('data-base') || 'images';
      const ext  = node.getAttribute('data-ext')  || 'jpg';
      for (let i = 1; i <= k; i++) items.push(`${base}/${n}_${i}.${ext}`);
    }
    const captions = (node.getAttribute('data-captions')||'')
      .split('|').map(s=>s.trim()).filter(Boolean);
    return {items, captions};
  }
  function open(items, captions=[], start=0){
    let idx = start;
    const overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.innerHTML = `
      <button class="lb-close" aria-label="Close">✕</button>
      <div class="lb-dialog">
        <button class="lb-btn lb-prev" aria-label="Prev"><img src="${ARROW_SRC}" alt=""></button>
        <button class="lb-btn lb-next" aria-label="Next"><img src="${ARROW_SRC}" alt=""></button>
        <img class="lb-img" alt="">
        <div class="lb-count"></div>
        <div class="lb-desc"></div>
      </div>`;
    const img=overlay.querySelector('.lb-img');
    const count=overlay.querySelector('.lb-count');
    const desc=overlay.querySelector('.lb-desc');
    const load=i=>{ idx=(i+items.length)%items.length; img.src=items[idx]; count.textContent=`${idx+1} / ${items.length}`; desc.textContent=captions[idx]||''; };
    const cleanup=()=>{ document.body.style.overflow=''; overlay.remove(); document.removeEventListener('keydown',onKey); };
    const onKey=e=>{ if(e.key==='Escape')cleanup(); if(e.key==='ArrowLeft')load(idx-1); if(e.key==='ArrowRight')load(idx+1); };
    overlay.addEventListener('click',e=>{ if(e.target===overlay) cleanup(); });
    overlay.querySelector('.lb-close').onclick=cleanup;
    overlay.querySelector('.lb-prev').onclick =()=>load(idx-1);
    overlay.querySelector('.lb-next').onclick =()=>load(idx+1);
    document.body.appendChild(overlay); document.addEventListener('keydown',onKey);
    document.body.style.overflow='hidden'; load(idx);
  }
  document.querySelectorAll('.lb').forEach(node=>{
    node.addEventListener('click',e=>{ if((e.target.closest('.caption'))) return; const {items,captions}=build(node); open(items,captions,0); });
  });
})();

/* ===================== Slider ===================== */
(function(){
  const root=document.querySelector('.slider'); if(!root) return;
  const delay=+(root.getAttribute('data-delay')||3000);
  const track=root.querySelector('.slides');
  const slides=[...root.querySelectorAll('.slide')];
  let index=0,timer=null,animating=false;
  function go(i){
    if(animating) return;
    index=(i+slides.length)%slides.length; animating=true;
    track.style.transition='transform 450ms ease';
    track.style.transform=`translateX(${-index*100}%)`;
    setTimeout(()=>{ animating=false; },460);
  }
  function next(){ go(index+1) } function prev(){ go(index-1) }
  function start(){ stop(); timer=setInterval(next,delay) }
  function stop(){ if(timer){ clearInterval(timer); timer=null } }
  root.querySelector('.s-next').addEventListener('click',()=>{ next(); start(); });
  root.querySelector('.s-prev').addEventListener('click',()=>{ prev(); start(); });
  root.addEventListener('mouseenter',stop); root.addEventListener('mouseleave',start);
  go(0); start();
})();

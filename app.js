/* ===================== Accordion + language (HTML-based, toggle, smooth close) ===================== */
const acc       = document.getElementById('acc');
const pContact  = document.getElementById('panel-contact');
let openPane    = null;   // 'lang:en' | 'lang:es' | 'lang:ru' | 'contact' | null

function hideAllPanels(){
  document.querySelectorAll('.lang-block').forEach(b => b.setAttribute('aria-hidden','true'));
  if (pContact) pContact.setAttribute('aria-hidden','true');
}

function openPanel(panel){
  if(!panel || !acc) return;
  panel.setAttribute('aria-hidden','false');
  acc.style.maxHeight = '0px';
  requestAnimationFrame(()=>{
    acc.style.maxHeight = panel.scrollHeight + 'px';
  });
}

function closeAccordion(){
  if(!acc) return;
  const current = acc.scrollHeight;
  acc.style.maxHeight = current + 'px'; // start from current height
  void acc.offsetHeight;                // force reflow
  requestAnimationFrame(()=>{
    acc.style.maxHeight = '0px';
  });
}

function openLang(lang){
  const key = `lang:${lang}`;
  if (openPane === key){
    hideAllPanels();
    closeAccordion();
    openPane = null;
    return;
  }
  hideAllPanels();
  const panel = document.getElementById(`panel-${lang}`);
  if(panel){
    openPane = key;
    openPanel(panel);
  }
}

function toggleContact(){
  if (openPane === 'contact'){
    hideAllPanels();
    closeAccordion();
    openPane = null;
    return;
  }
  hideAllPanels();
  if (pContact){
    openPane = 'contact';
    openPanel(pContact);
  }
}

// Bind flags & contact
document.querySelectorAll('.flag').forEach(f => f.addEventListener('click', () => openLang(f.dataset.lang)));
document.querySelectorAll('[data-contact]').forEach(btn => btn.addEventListener('click', toggleContact));

// Keep accordion closed on load
document.addEventListener('DOMContentLoaded', () => {
  hideAllPanels();
  if (acc) acc.style.maxHeight = '0px';
  openPane = null;
});

/* ===================== Parallax ===================== */
(function(){
  const MAX_TILT = 25;
  const LERP_ROT = 0.12;
  const LERP_SCL = 0.08;
  const PAR      = 0.35;
  const SCALE_IN = 0.9;
  const SCALE_OUT= 1.00;

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
      st.tS  = SCALE_IN;
    };

    const onLeave = ()=>{ st.tRx = st.tRy = 0; st.tS  = SCALE_OUT; };

    root.addEventListener('mousemove', onMove, {passive:true});
    root.addEventListener('touchmove', onMove, {passive:true});
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('touchend', onLeave);
    root.addEventListener('touchcancel', onLeave);

    (function tick(){
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
    const rawFiles = (node.getAttribute('data-files') || '').trim();
    let items = [];
    if (rawFiles) {
      items = rawFiles.split('|').map(s => s.trim()).filter(Boolean);
    } else {
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
    const load=i=>{ idx=(i+items.length)%items.length; img.src=items[idx]; count.textContent=''; desc.textContent=captions[idx]||''; };
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
    node.addEventListener('click',e=>{
      if((e.target.closest('.caption'))) return;
      const {items,captions}=build(node); open(items,captions,0);
    });
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


/* === AJAX submit for Web3Forms === */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('rq-form');
  if (!form) return;
  const statusEl = document.getElementById('rq-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.website && form.website.value.trim()) return; // honeypot
    if (statusEl) statusEl.textContent = 'Sending…';
    if (submitBtn) submitBtn.disabled = true;
    try {
      const fd = new FormData(form);
      const resp = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
      const data = await resp.json().catch(()=>({}));
      if (!resp.ok || data.success === false) throw new Error(data.message || 'Request failed');
      if (statusEl) statusEl.textContent = 'Thanks! Your message was sent.';
      form.reset();
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = 'Error sending. Please try again.';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});

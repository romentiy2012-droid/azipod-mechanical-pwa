
const TOTAL=121;
const doc=document.getElementById('document');
const q=document.getElementById('q');
const count=document.getElementById('count');
const prev=document.getElementById('prev');
const next=document.getElementById('next');
const offlineBtn=document.getElementById('offline');
const installBtn=document.getElementById('install');
const toast=document.getElementById('toast');
let indexData=null, hits=[], hitPos=-1, deferredPrompt=null;

function say(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),2500)}
function buildPages(){
  const f=document.createDocumentFragment();
  for(let i=1;i<=TOTAL;i++){
    const s=document.createElement('section');s.className='page';s.id=`page-${i}`;s.dataset.page=i;
    const im=document.createElement('img');
    im.src=`pages/page-${String(i).padStart(3,'0')}.webp`; im.alt=`Страница ${i} из ${TOTAL}`; im.loading=i<=3?'eager':'lazy'; im.decoding='async'; im.draggable=false;
    s.appendChild(im);f.appendChild(s);
  }
  doc.appendChild(f);
}
async function loadIndex(){try{indexData=await fetch('search-index.json').then(r=>r.json())}catch(e){console.warn(e)}}
function normalize(s){return (s||'').toLocaleLowerCase('ru-RU').replace(/\s+/g,' ').trim()}
function doSearch(){
  const term=normalize(q.value); document.querySelectorAll('.page.match').forEach(x=>x.classList.remove('match'));
  if(!term||!indexData){hits=[];hitPos=-1;count.textContent='0/0';return}
  hits=indexData.pages.filter(p=>normalize(p.text).includes(term)).map(p=>p.page); hitPos=hits.length?0:-1; showHit();
}
function showHit(){
  document.querySelectorAll('.page.match').forEach(x=>x.classList.remove('match'));
  if(!hits.length){count.textContent='0/0';return}
  const n=hits[hitPos], el=document.getElementById(`page-${n}`); el.classList.add('match'); el.scrollIntoView({behavior:'smooth',block:'start'}); count.textContent=`${hitPos+1}/${hits.length}`;
}
q.addEventListener('search',doSearch); q.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()});
prev.addEventListener('click',()=>{if(hits.length){hitPos=(hitPos-1+hits.length)%hits.length;showHit()}});
next.addEventListener('click',()=>{if(hits.length){hitPos=(hitPos+1)%hits.length;showHit()}});

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.hidden=false});
installBtn.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.hidden=true});

async function ensureSW(){if(!('serviceWorker' in navigator))return null;return navigator.serviceWorker.ready}
offlineBtn.addEventListener('click',async()=>{
  if(!('caches' in window)){say('Офлайн-кэш не поддерживается этим браузером');return}
  offlineBtn.disabled=true;
  try{
    const cache=await caches.open('azipod-pages-v1');
    for(let i=1;i<=TOTAL;i++){
      const url=`pages/page-${String(i).padStart(3,'0')}.webp`;
      const r=await cache.match(url);
      if(!r){const resp=await fetch(url); if(resp.ok) await cache.put(url,resp.clone())}
      offlineBtn.textContent=`Офлайн ${i}/${TOTAL}`;
    }
    say('Все 121 страниц сохранены для офлайн-работы');offlineBtn.textContent='Офлайн готов';
  }catch(e){console.error(e);say('Не удалось полностью загрузить офлайн-копию');offlineBtn.textContent='Скачать офлайн'}
  finally{offlineBtn.disabled=false}
});

buildPages(); loadIndex();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(console.warn))}

import { REGIONS } from '../data/catalog.js';

export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
export const easeIO = t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
export const cellOf = (x,y)=>[Math.round((x-760)/12), Math.round((400-y)/12)];
export const shortName = ru => ru.replace(/^(Гробница|Яичная шахта|Шахта|Форт|Замок|Плантация|Деревня|Лагерь)\s/,'');

export const LS_KEY = 'vv-atlas-v1';
export function loadSaved(){ try{ return JSON.parse(localStorage.getItem(LS_KEY))||{}; }catch{ return {}; } }

export const DEF_PREFS = {
  theme:'ash', labels:true, regions:true, grid:false, glow:true, ash:45, mscale:1, sound:true,
  catsOff:[], region:'all', source:'all', sort:'name', favOnly:false, hideVisited:false,
};
export const REDUCED = typeof window!=='undefined' && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function guessRegion(x,y){
  if (x<320 && y<280) return 'SOL';
  if (x>950 && y<270) return 'TV';
  if (x<340 && y>480) return 'MM';
  if (y>860) return 'MM';
  let best='AL', bd=Infinity;
  for (const k of ['RM','AL','WG','BC','AI','MA','AC','GL','SH']){
    const [px,py]=REGIONS[k].pt, d=(px-x)**2+(py-y)**2;
    if (d<bd){ bd=d; best=k; }
  }
  return best;
}

/* Зерно текстуры — генерируется один раз при загрузке модуля */
function makeGrain(){
  const c=document.createElement('canvas'); c.width=c.height=120;
  const x=c.getContext('2d'), im=x.createImageData(120,120);
  for(let i=0;i<im.data.length;i+=4){ const v=Math.random()*255|0; im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255; }
  x.putImageData(im,0,0);
  return c.toDataURL();
}
export const GRAIN_URL = makeGrain();
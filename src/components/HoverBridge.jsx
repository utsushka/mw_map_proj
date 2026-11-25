import { useEffect, useRef } from 'react';

/* Делегированный hover по меткам — нативно, без ре-рендеров карты. */
export default function HoverBridge({svgRef,onHover,showTip,hideTip,locations}){
  const locRef=useRef(locations); locRef.current=locations;
  const cbRef=useRef({onHover,showTip,hideTip}); cbRef.current={onHover,showTip,hideTip};
  useEffect(()=>{
    const svg=svgRef.current; if(!svg)return;
    let cur=null;
    const over=(e)=>{
      const g=e.target.closest&&e.target.closest('[data-loc]');
      const id=g?g.getAttribute('data-loc'):null;
      if(id!==cur){
        cur=id; cbRef.current.onHover(id);
        if(id){ const loc=locRef.current.find(l=>l.id===id); if(loc)cbRef.current.showTip(loc); }
        else cbRef.current.hideTip();
      }
    };
    const out=(e)=>{ if(!svg.contains(e.relatedTarget)){ cur=null; cbRef.current.onHover(null); cbRef.current.hideTip(); } };
    svg.addEventListener('pointerover',over);
    svg.addEventListener('pointerout',out);
    return ()=>{ svg.removeEventListener('pointerover',over); svg.removeEventListener('pointerout',out); };
  },[]);
  return null;
}
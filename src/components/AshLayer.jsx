import { useEffect, useRef } from 'react';
import { REDUCED } from '../lib/utils.js';

export default function AshLayer({density, theme}){
  const cvRef = useRef(null);
  useEffect(()=>{
    const cv = cvRef.current; if(!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio||1, 2);
    let W=0,H=0, raf=0, parts=[], running=true;
    const resize=()=>{ const r=cv.parentElement.getBoundingClientRect();
      W=r.width;H=r.height; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cv.parentElement);
    const N = REDUCED?0:Math.round(density*1.4);
    const spawn=(any)=>{ const ember=Math.random()<.16;
      return { x:any?Math.random()*W:W+10+Math.random()*40, y:Math.random()*H,
        vx:-(.25+Math.random()*.65)*(ember?.6:1), vy:.08+Math.random()*.3,
        r:ember?.8+Math.random()*1.4:.5+Math.random()*1.6, a:.08+Math.random()*(ember?.4:.3),
        ph:Math.random()*6.28, ember }; };
    for(let i=0;i<N;i++)parts.push(spawn(true));
    const light = theme==='parchment';
    let prev=performance.now();
    const tick=(now)=>{
      if(!running) return;
      const dt=Math.min((now-prev)/16.7,3); prev=now;
      ctx.clearRect(0,0,W,H);
      for(const p of parts){
        p.ph+=.015*dt; p.x+=(p.vx+Math.sin(p.ph)*.18)*dt; p.y+=p.vy*dt;
        if(p.x<-12||p.y>H+12){ Object.assign(p,spawn(false)); p.y=Math.random()*H*.9; }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283);
        ctx.fillStyle = p.ember?`rgba(255,${140+Math.sin(p.ph*2)*40|0},60,${p.a})`
          : light?`rgba(90,70,40,${p.a*.8})`:`rgba(214,196,166,${p.a})`;
        ctx.fill();
      }
      raf=requestAnimationFrame(tick);
    };
    if(N>0) raf=requestAnimationFrame(tick);
    const vis=()=>{ if(document.hidden){running=false;cancelAnimationFrame(raf);} else if(N>0&&!running){running=true;prev=performance.now();raf=requestAnimationFrame(tick);} };
    document.addEventListener('visibilitychange',vis);
    return ()=>{ running=false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange',vis); };
  },[density,theme]);
  return <canvas ref={cvRef} className="ash-cv" aria-hidden="true"/>;
}
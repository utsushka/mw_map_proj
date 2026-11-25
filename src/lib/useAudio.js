import { useRef, useEffect, useCallback } from 'react';

/* Весь звук синтезируется Web Audio API: ветер, гул Красной Горы, отклики UI. */
export function useAudio(soundOn, ash){
  const ref = useRef({ctx:null, master:null, wind:null});
  const onRef = useRef(soundOn); onRef.current = soundOn;

  const init = useCallback(()=>{
    const a = ref.current;
    if (a.ctx || !onRef.current) return;
    try{
      const Ctx = window.AudioContext||window.webkitAudioContext; if(!Ctx) return;
      const ctx = new Ctx();
      const master = ctx.createGain(); master.gain.value=.9; master.connect(ctx.destination);
      const len = ctx.sampleRate*2, buf = ctx.createBuffer(1,len,ctx.sampleRate), d = buf.getChannelData(0);
      let last=0; for(let i=0;i<len;i++){ const w=Math.random()*2-1; last=(last+.02*w)/1.02; d[i]=last*3.5; }
      const noise=ctx.createBufferSource(); noise.buffer=buf; noise.loop=true;
      const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=320; lp.Q.value=.7;
      const wind=ctx.createGain(); wind.gain.value=.05;
      noise.connect(lp); lp.connect(wind); wind.connect(master); noise.start();
      const lfo=ctx.createOscillator(); lfo.frequency.value=.07;
      const lfoG=ctx.createGain(); lfoG.gain.value=130; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      const droneG=ctx.createGain(); droneG.gain.value=.014; droneG.connect(master);
      [55,82.41].forEach((f,i)=>{ const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
        const g=ctx.createGain(); g.gain.value=i?0.55:1; o.connect(g); g.connect(droneG); o.start(); });
      const trem=ctx.createOscillator(); trem.frequency.value=.05; const tg=ctx.createGain(); tg.gain.value=.006;
      trem.connect(tg); tg.connect(droneG.gain); trem.start();
      ref.current={ctx,master,wind};
    }catch{/* звук не критичен */}
  },[]);

  useEffect(()=>{
    const h=()=>{ init(); window.removeEventListener('pointerdown',h); };
    window.addEventListener('pointerdown',h);
    return ()=>window.removeEventListener('pointerdown',h);
  },[init]);

  useEffect(()=>{
    const a=ref.current;
    if(!a.ctx){ if(soundOn) init(); return; }
    if(soundOn){ a.ctx.resume(); a.master.gain.setTargetAtTime(.9,a.ctx.currentTime,.08); }
    else a.master.gain.setTargetAtTime(0,a.ctx.currentTime,.05);
  },[soundOn,init]);

  useEffect(()=>{
    const a=ref.current;
    if(a.wind&&a.ctx) a.wind.gain.setTargetAtTime(.028+ash/100*.05,a.ctx.currentTime,.4);
  },[ash]);

  const play = useCallback((name)=>{
    const a=ref.current; if(!a.ctx||!onRef.current) return;
    const ctx=a.ctx, t=ctx.currentTime;
    const note=(f,start,dur,type='triangle',vol=.07)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type=type;o.frequency.value=f;o.connect(g);g.connect(a.master);
      g.gain.setValueAtTime(vol,t+start);g.gain.exponentialRampToValueAtTime(.0001,t+start+dur);
      o.start(t+start);o.stop(t+start+dur+.02);
    };
    if(name==='select'){note(523,0,.28);note(784,.03,.22,'sine',.04);}
    else if(name==='toggle')note(220,0,.07,'square',.03);
    else if(name==='add'){note(392,0,.14);note(523,.1,.2);}
    else if(name==='remove'){note(330,0,.16);note(175,.1,.28);}
    else if(name==='dice'){note(440,0,.08);note(554,.07,.08);note(659,.14,.14);}
    else if(name==='open')note(262,0,.14,'sine',.05);
  },[]);

  return {play, init};
}
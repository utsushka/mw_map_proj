import { useState, useEffect, useLayoutEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { THEMES, REGIONS } from '../data/catalog.js';
import { WORLD, ISLAND_D, MAIN_W_D, MAIN_S_D, MAIN_NE_D, SOL_D, ISLETS, REG_ELLIPSES, REG_LABELS, SEA_LABELS, FOYADAS, RIVER_D, ROADS } from '../data/geography.js';
import { clamp, easeIO, cellOf, REDUCED, GRAIN_URL } from '../lib/utils.js';
import { I } from '../lib/icons.jsx';
import Marker from './Marker.jsx';
import AshLayer from './AshLayer.jsx';
import HoverBridge from './HoverBridge.jsx';

const MapView = forwardRef(function MapView(props, ref){
  const { locations, matched, q, selectedId, hoverId, meta, prefs, addMode, draft, theme,
          onSelect, onHover, onAddPoint, onRandom, onResetFilters, onCancelAdd, hintSeen, onHintSeen } = props;
  const wrapRef=useRef(null), svgRef=useRef(null), miniVpRef=useRef(null), tipRef=useRef(null);
  const zoomElRef=useRef(null), cellElRef=useRef(null), scaleElRef=useRef(null);
  const pxRef=useRef({w:800,h:600}), vbRef=useRef({x:-20,y:60,w:1240,h:880}), fitWRef=useRef(1240);
  const unitRef=useRef(1.5), pointersRef=useRef(new Map()), dragRef=useRef(null), pinchRef=useRef(null);
  const animRef=useRef(0), commitTRef=useRef(0);
  const prefsRef=useRef(prefs); prefsRef.current=prefs;
  const cbRef=useRef({}); cbRef.current={onSelect,onAddPoint,addMode,onHintSeen};
  const [, setTick] = useState(0);
  const T = THEMES[theme];

  const clampVb = (vb)=>{
    vb.w = clamp(vb.w, 110, 2600);
    vb.h = vb.w * pxRef.current.h / Math.max(pxRef.current.w,1);
    const cx = clamp(vb.x+vb.w/2, -60, 1260), cy = clamp(vb.y+vb.h/2, -40, 1040);
    vb.x = cx-vb.w/2; vb.y = cy-vb.h/2;
  };
  /* Панорама/зум — через атрибуты, без ре-рендеров React */
  const applyView = useCallback(()=>{
    const svg=svgRef.current; if(!svg||!pxRef.current.w) return;
    const vb=vbRef.current; clampVb(vb);
    svg.setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    const s = (vb.w/pxRef.current.w) * prefsRef.current.mscale;
    unitRef.current = s;
    const str=`scale(${s})`;
    svg.querySelectorAll('.mk-s,.mk-t').forEach(n=>n.setAttribute('transform',str));
    const r=miniVpRef.current;
    if(r){ r.setAttribute('x',vb.x); r.setAttribute('y',vb.y); r.setAttribute('width',vb.w); r.setAttribute('height',vb.h); }
    if(zoomElRef.current) zoomElRef.current.textContent = Math.round(fitWRef.current/vb.w*100)+'%';
    if(scaleElRef.current) scaleElRef.current.textContent = (88*(vb.w/pxRef.current.w)/12).toFixed(1)+' кл.';
  },[]);
  const commit = useCallback(()=>{ setTick(t=>t+1); },[]);
  const scheduleCommit = useCallback(()=>{ clearTimeout(commitTRef.current); commitTRef.current=setTimeout(commit,170); },[commit]);
  const worldOf = useCallback((cx,cy)=>{
    const r=svgRef.current.getBoundingClientRect(), vb=vbRef.current, k=vb.w/r.width;
    return { x:vb.x+(cx-r.left)*k, y:vb.y+(cy-r.top)*k };
  },[]);
  const animateTo = useCallback((target,ms=520)=>{
    cancelAnimationFrame(animRef.current);
    if(REDUCED||ms<=0){ Object.assign(vbRef.current,target); applyView(); commit(); return; }
    const from={...vbRef.current}, t0=performance.now();
    const step=(now)=>{
      const t=clamp((now-t0)/ms,0,1), e=easeIO(t), vb=vbRef.current;
      vb.x=from.x+(target.x-from.x)*e; vb.y=from.y+(target.y-from.y)*e; vb.w=from.w+(target.w-from.w)*e;
      applyView();
      if(t<1) animRef.current=requestAnimationFrame(step); else commit();
    };
    animRef.current=requestAnimationFrame(step);
  },[applyView,commit]);
  const fitAll = useCallback((anim)=>{
    const px=pxRef.current, w=Math.max(1240, 1060*px.w/Math.max(px.h,1));
    fitWRef.current=w;
    const h=w*px.h/px.w, target={x:600-w/2, y:500-h/2, w};
    if(anim) animateTo(target,600); else { Object.assign(vbRef.current,target); applyView(); }
  },[animateTo,applyView]);
  const zoomBy = useCallback((f)=>{
    const vb=vbRef.current, cx=vb.x+vb.w/2, cy=vb.y+vb.h/2, w=clamp(vb.w/f,110,2600);
    const h=w*pxRef.current.h/pxRef.current.w; animateTo({x:cx-w/2,y:cy-h/2,w},260);
  },[animateTo]);

  useLayoutEffect(()=>{
    const el=wrapRef.current;
    const measure=()=>{ const r=el.getBoundingClientRect(); pxRef.current={w:r.width,h:r.height}; };
    measure(); fitAll(false); commit();
    const ro=new ResizeObserver(()=>{ measure(); applyView(); scheduleCommit(); });
    ro.observe(el);
    return ()=>{ ro.disconnect(); cancelAnimationFrame(animRef.current); clearTimeout(commitTRef.current); };
  },[]);
  useEffect(()=>{ applyView(); },[prefs.mscale,prefs.labels,locations,applyView]);
  useEffect(()=>{
    const el=svgRef.current;
    const onWheel=(e)=>{
      e.preventDefault();
      const f=Math.pow(1.0016,-e.deltaY), p=worldOf(e.clientX,e.clientY), vb=vbRef.current;
      const nw=clamp(vb.w/f,110,2600), real=vb.w/nw;
      vb.x=p.x-(p.x-vb.x)/real; vb.y=p.y-(p.y-vb.y)/real; vb.w=nw;
      applyView(); scheduleCommit();
    };
    el.addEventListener('wheel',onWheel,{passive:false});
    return ()=>el.removeEventListener('wheel',onWheel);
  },[applyView,scheduleCommit,worldOf]);

  useImperativeHandle(ref,()=>({
    zoomTo(loc){ const px=pxRef.current, w=230; animateTo({x:loc.x-w/2, y:loc.y-(w*px.h/px.w)/2, w},560); },
    reset(){ fitAll(true); },
    zoomBy,
    nudge(dx,dy){ const vb=vbRef.current; vb.x+=dx*vb.w*.08; vb.y+=dy*vb.w*.08; applyView(); scheduleCommit(); },
    getView(){ return {...vbRef.current}; },
    setView(v){ animateTo({x:v.x,y:v.y,w:v.w},560); },
  }),[animateTo,fitAll,zoomBy,applyView,scheduleCommit]);

  const onPointerDown=(e)=>{
    if(e.pointerType==='mouse'&&e.button!==0) return;
    const svg=svgRef.current;
    svg.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    hideTip();
    if(pointersRef.current.size===1){
      const hitEl = e.target.closest && e.target.closest('[data-loc]');
      dragRef.current={moved:0, hit:hitEl?hitEl.getAttribute('data-loc'):null};
      svg.classList.add('dragging');
      if(cbRef.current.onHintSeen) cbRef.current.onHintSeen();
    } else if(pointersRef.current.size===2){
      const pts=[...pointersRef.current.values()];
      const mid={x:(pts[0].x+pts[1].x)/2, y:(pts[0].y+pts[1].y)/2};
      pinchRef.current={ d0:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)||1, w0:vbRef.current.w, midW:worldOf(mid.x,mid.y) };
      if(dragRef.current) dragRef.current.hit=null;
    }
  };
  const onPointerMove=(e)=>{
    const rect=svgRef.current.getBoundingClientRect();
    if(tipRef.current&&tipRef.current.classList.contains('show')){
      tipRef.current.style.transform=`translate(${e.clientX-rect.left+14}px,${e.clientY-rect.top-30}px)`;
    }
    const w=worldOf(e.clientX,e.clientY);
    if(cellElRef.current){ const [cx,cy]=cellOf(w.x,w.y); cellElRef.current.textContent=`${cx}, ${cy}`; }
    const pts=pointersRef.current;
    if(!pts.has(e.pointerId)) return;
    const prev=pts.get(e.pointerId);
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const vb=vbRef.current;
    if(pts.size===1&&dragRef.current){
      const k=vb.w/rect.width, dx=e.clientX-prev.x, dy=e.clientY-prev.y;
      vb.x-=dx*k; vb.y-=dy*k;
      dragRef.current.moved+=Math.abs(dx)+Math.abs(dy);
      applyView();
    } else if(pts.size===2&&pinchRef.current){
      const arr=[...pts.values()], p=pinchRef.current;
      const d=Math.hypot(arr[0].x-arr[1].x,arr[0].y-arr[1].y)||1;
      const mid={x:(arr[0].x+arr[1].x)/2,y:(arr[0].y+arr[1].y)/2};
      vb.w=clamp(p.w0*p.d0/d,110,2600);
      const k=vb.w/rect.width;
      vb.x=p.midW.x-(mid.x-rect.left)*k; vb.y=p.midW.y-(mid.y-rect.top)*k;
      if(dragRef.current)dragRef.current.moved=99;
      applyView();
    }
  };
  const endPointer=(e)=>{
    const pts=pointersRef.current;
    pts.delete(e.pointerId);
    try{ svgRef.current.releasePointerCapture(e.pointerId); }catch{/* noop */}
    if(pts.size<2) pinchRef.current=null;
    if(pts.size===0){
      svgRef.current.classList.remove('dragging');
      const d=dragRef.current; dragRef.current=null;
      if(d&&d.moved<6){
        if(d.hit) cbRef.current.onSelect(d.hit);
        else if(cbRef.current.addMode){ const w=worldOf(e.clientX,e.clientY); cbRef.current.onAddPoint({x:Math.round(w.x),y:Math.round(w.y)}); }
      }
      commit();
    }
  };
  const onDoubleClick=(e)=>{
    const p=worldOf(e.clientX,e.clientY), vb=vbRef.current, w=clamp(vb.w/1.9,110,2600);
    const h=w*pxRef.current.h/pxRef.current.w;
    animateTo({x:p.x-w/2,y:p.y-h/2,w},380);
  };
  const showTip=(loc)=>{ const t=tipRef.current; if(!t)return;
    t.textContent=loc.ru; t.style.borderColor=CATS_COLOR(loc); t.classList.add('show'); };
  const hideTip=()=>{ if(tipRef.current)tipRef.current.classList.remove('show'); };
  const miniJump=(e)=>{
    const r=e.currentTarget.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width*WORLD.w, y=(e.clientY-r.top)/r.height*WORLD.h;
    const vb=vbRef.current; vb.x=x-vb.w/2; vb.y=y-vb.h/2; applyView(); scheduleCommit();
  };
  const s=unitRef.current, vb=vbRef.current;
  const gridLines=[];
  if(prefs.grid){
    for(let x=0;x<=1200;x+=60)gridLines.push(<line key={'gx'+x} x1={x} y1={-80} x2={x} y2={1080} vectorEffect="non-scaling-stroke"/>);
    for(let y=0;y<=1000;y+=60)gridLines.push(<line key={'gy'+y} x1={-100} y1={y} x2={1300} y2={y} vectorEffect="non-scaling-stroke"/>);
  }

  return (
    <div ref={wrapRef} className="mapwrap">
      <svg ref={svgRef} className={'mapsvg'+(addMode?' adding':'')+(prefs.glow?'':' no-glow')}
           viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet"
           role="application" aria-label="Карта Вварденфелла"
           onPointerDown={onPointerDown} onPointerMove={onPointerMove}
           onPointerUp={endPointer} onPointerCancel={endPointer}
           onPointerLeave={()=>{ if(cellElRef.current)cellElRef.current.textContent='—'; hideTip(); }}
           onDoubleClick={onDoubleClick}>
        <defs>
          <radialGradient id="seaG" cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor={T.sea1}/><stop offset="100%" stopColor={T.sea0}/>
          </radialGradient>
          <radialGradient id="emberG"><stop offset="0%" stopColor="#ffd27a" stopOpacity=".95"/>
            <stop offset="35%" stopColor="#ff5a2a" stopOpacity=".55"/><stop offset="100%" stopColor="#ff5a2a" stopOpacity="0"/></radialGradient>
          <radialGradient id="craterG"><stop offset="0%" stopColor="#3a1408"/><stop offset="70%" stopColor={T.crater}/><stop offset="100%" stopColor={T.crater} stopOpacity=".2"/></radialGradient>
          {REG_ELLIPSES.map(([k])=>(
            <radialGradient key={k} id={'reg-'+k}>
              <stop offset="0%" stopColor={REGIONS[k].tint} stopOpacity={T.tintOp}/>
              <stop offset="70%" stopColor={REGIONS[k].tint} stopOpacity={T.tintOp*.45}/>
              <stop offset="100%" stopColor={REGIONS[k].tint} stopOpacity="0"/>
            </radialGradient>))}
          <radialGradient id="shimG"><stop offset="0%" stopColor={T.shim}/><stop offset="100%" stopColor={T.shim} stopOpacity="0"/></radialGradient>
        </defs>
        <rect x="-1400" y="-1200" width="4000" height="3400" fill="url(#seaG)"/>
        <ellipse className="fx fx-shim" cx="420" cy="760" rx="300" ry="150" fill="url(#shimG)"/>
        <ellipse className="fx fx-shim2" cx="1050" cy="180" rx="260" ry="130" fill="url(#shimG)"/>
        <g strokeLinejoin="round">
          {[MAIN_W_D,MAIN_S_D,MAIN_NE_D].map((d,i)=>(
            <g key={i}>
              <path d={d} fill="none" stroke={T.coastGlow} strokeWidth="14"/>
              <path d={d} fill={T.mainland} stroke={T.coast} strokeWidth="2.2"/>
              <path d={d} fill="none" stroke={T.tr} strokeWidth="1.4" strokeDasharray="7 6"/>
            </g>))}
          <path d={SOL_D} fill="none" stroke={T.coastGlow} strokeWidth="14"/>
          <path d={SOL_D} fill={T.sol} stroke={T.coast} strokeWidth="2.2"/>
          <path d={ISLAND_D} fill="none" stroke={T.coastGlow} strokeWidth="16"/>
          <path d={ISLAND_D} fill={T.land} stroke={T.coast} strokeWidth="2.6"/>
          {ISLETS.map(([cx,cy,r],i)=>(
            <g key={i}>
              <circle cx={cx} cy={cy} r={r+5} fill="none" stroke={T.coastGlow} strokeWidth="6"/>
              <circle cx={cx} cy={cy} r={r} fill={T.land} stroke={T.coast} strokeWidth="1.6"/>
            </g>))}
        </g>
        {prefs.regions && (
          <g>
            {REG_ELLIPSES.map(([k, cx, cy, rx, ry]) => (
              <ellipse key={k} cx={cx} cy={cy} rx={rx} ry={ry} fill={'url(#reg-' + k + ')'}/>
            ))}
          </g>
        )}
        <g fill="none" strokeLinecap="round">
          {FOYADAS.map((d,i)=><path key={i} d={d} stroke={T.foyada} strokeWidth="7"/>)}
          {FOYADAS.map((d,i)=><path key={'t'+i} d={d} stroke={T.foyada} strokeWidth="2" opacity=".8"/>)}
          <path d={RIVER_D} stroke={T.river} strokeWidth="4.5" opacity=".75"/>
          <ellipse cx="795" cy="625" rx="27" ry="15" fill={T.river} opacity=".55"/>
          <ellipse cx="185" cy="127" rx="15" ry="10" fill={T.river} opacity=".55"/>
          {ROADS.map((d,i)=><path key={i} d={d} stroke={T.road} strokeWidth="1.6" strokeDasharray="2.5 6"/>)}
        </g>
        <g>
          <circle cx="760" cy="400" r="96" fill="url(#craterG)"/>
          <circle cx="760" cy="400" r="62" fill="none" stroke={T.foyada} strokeWidth="2.5"/>
          <circle cx="760" cy="400" r="30" fill={T.crater}/>
          <circle className="fx fx-ember" cx="760" cy="400" r="58" fill="url(#emberG)"/>
          <circle className="fx fx-ember" cx="760" cy="400" r="9" fill="#ffd27a" opacity=".9"/>
          <g className="fx fx-smoke" style={{filter:'blur(7px)'}} opacity=".5">
            <path d="M756 392 C740 360 726 340 700 318 C724 330 738 326 748 342 C744 320 752 306 742 284 C762 306 760 330 764 352 C772 338 786 334 792 316 C794 344 780 366 768 390 Z" fill={theme==='ash'?'#8a7a68':'#6b5a44'}/>
          </g>
          <circle cx="760" cy="400" r="140" fill="none" stroke={T.coast} strokeWidth="1.8" strokeDasharray="3 9" opacity=".4"/>
        </g>
        {prefs.grid && <g stroke={T.grid} strokeWidth="1">{gridLines}</g>}
        {prefs.regions && <g>
          {REG_LABELS.map(([k,txt,x,y])=><text key={k} className="reg-label" x={x} y={y} fill={T.regLabel}>{txt}</text>)}
          {SEA_LABELS.map(([txt,x,y],i)=><text key={i} className="sea-label" x={x} y={y} fill={T.seaLabel}>{txt}</text>)}
          <text className="src-label" x={150} y={585} fill={T.srcLabel}>TAMRIEL REBUILT</text>
          <text className="src-label" x={1092} y={52} fill={T.srcLabel}>TAMRIEL REBUILT</text>
          <text className="src-label" x={185} y={244} fill={T.srcLabel}>BLOODMOON</text>
        </g>}
        <g transform="translate(1108 795)" opacity=".8">
          <circle r="26" fill="none" stroke={T.coast} strokeWidth="1.4"/>
          <path d="M0-22 L5 0 0 22 -5 0 Z M-22 0 L0 5 22 0 0 -5 Z" fill={T.coast} opacity=".7"/>
          <path d="M0-22 L5 0 0 6 -5 0 Z" fill={theme==='ash'?'#ff5a2a':'#a04020'}/>
          <text y="-32" textAnchor="middle" fill={T.regLabel} style={{font:'600 13px Cormorant,serif',letterSpacing:'.2em'}}>С</text>
        </g>
        {draft && <g transform={`translate(${draft.x} ${draft.y})`}>
          <circle className="draft-ring" r="20" fill="none" stroke="#2fd0c2" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
          <g transform={`scale(${s})`}>
            <circle r="13" fill="rgba(12,9,6,.74)" stroke="#2fd0c2" strokeWidth="1.6" vectorEffect="non-scaling-stroke"/>
            <path d="M-6 0H6M0 -6V6" stroke="#2fd0c2" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
          </g>
        </g>}
        <g>
          {locations.map(loc=>{
            const m=meta[loc.id]||{};
            return <Marker key={loc.id} loc={loc} s={s} theme={theme}
              selected={loc.id===selectedId} hovered={loc.id===hoverId}
              dimmed={!!q && !matched.has(loc.id)}
              visited={!!m.visited} fav={!!m.fav} isCustom={loc.src==='MY'} labels={prefs.labels}/>;
          })}
        </g>
      </svg>
      <div ref={tipRef} className="mtip"/>
      <AshLayer density={prefs.ash} theme={theme}/>
      <div className="grain" style={{backgroundImage:`url(${GRAIN_URL})`}}/>
      <div className="vig"/>
      <HoverBridge svgRef={svgRef} onHover={onHover} showTip={showTip} hideTip={hideTip} locations={locations}/>
      <div className="mo zoomer">
        <button className="ibtn" title="Приблизить (+)" aria-label="Приблизить" onClick={()=>zoomBy(1.6)}>{I.plus}</button>
        <button className="ibtn" title="Отдалить (−)" aria-label="Отдалить" onClick={()=>zoomBy(1/1.6)}>{I.minus}</button>
        <button className="ibtn" title="Весь атлас (0)" aria-label="Весь атлас" onClick={()=>fitAll(true)}>{I.home}</button>
        <button className="ibtn" title="Случайная локация (R)" aria-label="Случайная локация" onClick={onRandom}>{I.dice}</button>
      </div>
      {addMode && <div className="mo add-banner">{I.target}<span>Кликните по карте, чтобы поставить метку</span>
        <button className="mini-btn" onClick={onCancelAdd}>Esc · отмена</button></div>}
      <div className="mo readout">
        <div className="ro-chip">Клетка <b ref={cellElRef}>—</b></div>
        <div className="ro-chip">Масштаб <b ref={zoomElRef}>100%</b></div>
        <div className="ro-chip ro-scale"><div className="scalebar"/><b ref={scaleElRef}>—</b></div>
      </div>
      <div className="mo mini" aria-label="Миникарта">
        <svg viewBox="0 0 1200 1000" onPointerDown={(e)=>{e.currentTarget.setPointerCapture(e.pointerId);miniJump(e);}}
             onPointerMove={(e)=>{ if(e.buttons)miniJump(e); }}>
          <rect x="-200" y="-200" width="1600" height="1400" fill={T.sea0}/>
          <path d={MAIN_W_D} fill={T.mainland}/><path d={MAIN_S_D} fill={T.mainland}/><path d={MAIN_NE_D} fill={T.mainland}/>
          <path d={SOL_D} fill={T.sol}/><path d={ISLAND_D} fill={T.land} stroke={T.coast} strokeWidth="4"/>
          {ISLETS.map(([cx,cy,r],i)=><circle key={i} cx={cx} cy={cy} r={r} fill={T.land}/>)}
          <circle cx="760" cy="400" r="34" fill="#ff5a2a" opacity=".55"/>
          <rect ref={miniVpRef} className="mini-vp" x={vb.x} y={vb.y} width={vb.w} height={vb.h}/>
        </svg>
      </div>
      {!hintSeen && locations.length>0 && <div className="mo hint">
        <span>Тяните карту · колесо — масштаб · клик по метке — детали</span>
        <button onClick={onHintSeen} aria-label="Скрыть подсказку">✕</button></div>}
      {locations.length===0 && <div className="mo empty"><div className="empty-card">
        <h3>Пепел скрыл всё</h3><p>Под текущие фильтры не попала ни одна локация.</p>
        <button className="btn btn-gold" onClick={onResetFilters}>Сбросить фильтры</button>
      </div></div>}
    </div>
  );
});

/* цвет категории для тултипа */
import { CATS } from '../data/catalog.js';
function CATS_COLOR(loc){ return CATS[loc.type].color; }

export default MapView;
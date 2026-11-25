import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CATS, CAT_KEYS, REGIONS, REG_KEYS, SOURCES } from './data/catalog.js';
import { LOCATIONS } from './data/locations.js';
import { clamp, loadSaved, LS_KEY, DEF_PREFS } from './lib/utils.js';
import { I, CatIcon } from './lib/icons.jsx';
import { useAudio } from './lib/useAudio.js';
import MapView from './components/MapView.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import LocationForm from './components/LocationForm.jsx';
import AboutModal from './components/AboutModal.jsx';

const SAVED = loadSaved();

export default function App(){
  const [prefs,setPrefs]=useState(()=>({...DEF_PREFS,...(SAVED.prefs||{})}));
  const [meta,setMeta]=useState(()=>SAVED.meta||{});
  const [custom,setCustom]=useState(()=>Array.isArray(SAVED.custom)?SAVED.custom:[]);
  const [views,setViews]=useState(()=>Array.isArray(SAVED.views)?SAVED.views:[]);
  const [q,setQ]=useState('');
  const [selectedId,setSelectedId]=useState(null);
  const [hoverId,setHoverId]=useState(null);
  const [addMode,setAddMode]=useState(false);
  const [draft,setDraft]=useState(null);
  const [about,setAbout]=useState(false);
  const [sbOpen,setSbOpen]=useState(false);
  const [hintSeen,setHintSeen]=useState(!!SAVED.hintSeen);
  const [toasts,setToasts]=useState([]);
  const mapRef=useRef(null);
  const searchRef=useRef(null);
  const fileRef=useRef(null);
  const toastTimers=useRef(new Map());
  const undoRef=useRef(null);
  const audio=useAudio(prefs.sound,prefs.ash);
  const setPref=(k,v)=>setPrefs(o=>({...o,[k]:v}));

  useEffect(()=>{
    const t=setTimeout(()=>{ try{ localStorage.setItem(LS_KEY,JSON.stringify({prefs,meta,custom,views,hintSeen})); }catch{/* noop */} },250);
    return ()=>clearTimeout(t);
  },[prefs,meta,custom,views,hintSeen]);
  useEffect(()=>()=>{ toastTimers.current.forEach(clearTimeout); },[]);

  const toast=useCallback((msg,kind='ok',action)=>{
    const id=Date.now()+Math.random();
    setToasts(ts=>[...ts.slice(-2),{id,msg,kind,action}]);
    const tm=setTimeout(()=>setToasts(ts=>ts.filter(t=>t.id!==id)),action?6500:3800);
    toastTimers.current.set(id,tm);
  },[]);
  const dismissToast=(id)=>{ clearTimeout(toastTimers.current.get(id)); toastTimers.current.delete(id);
    setToasts(ts=>ts.filter(t=>t.id!==id)); };

  const all=useMemo(()=>[...LOCATIONS,...custom],[custom]);
  const byId=useMemo(()=>{ const m=new Map(); all.forEach(l=>m.set(l.id,l)); return m; },[all]);
  const baseFilter=useCallback((l,skip)=>{
    if(skip!=='cat'&&prefs.catsOff.includes(l.type))return false;
    if(skip!=='reg'&&prefs.region!=='all'&&l.region!==prefs.region)return false;
    if(prefs.source!=='all'&&l.src!==prefs.source)return false;
    const m=meta[l.id]||{};
    if(prefs.favOnly&&!m.fav)return false;
    if(prefs.hideVisited&&m.visited)return false;
    return true;
  },[prefs,meta]);
  const ql=q.trim().toLowerCase();
  const matches=useCallback(l=>!ql||l.ru.toLowerCase().includes(ql)||l.en.toLowerCase().includes(ql),[ql]);
  const visible=useMemo(()=>all.filter(l=>baseFilter(l)),[all,baseFilter]);
  const searched=useMemo(()=>visible.filter(matches),[visible,matches]);
  const matchedSet=useMemo(()=>new Set(searched.map(l=>l.id)),[searched]);
  const catCounts=useMemo(()=>{ const c={}; CAT_KEYS.forEach(k=>c[k]=0);
    all.forEach(l=>{ if(baseFilter(l,'cat')&&matches(l))c[l.type]++; }); return c; },[all,baseFilter,matches]);
  const selected=selectedId?byId.get(selectedId):null;

  const selectLoc=useCallback((id)=>{ setSelectedId(id); setDraft(null); setAddMode(false); audio.play('select'); },[audio]);
  const zoomTo=useCallback((loc)=>{ mapRef.current?.zoomTo(loc); },[]);
  const toggleMeta=(id,k)=>setMeta(m=>({...m,[id]:{...(m[id]||{}),[k]:!(m[id]||{})[k]}}));
  const setNote=(id,v)=>setMeta(m=>({...m,[id]:{...(m[id]||{}),note:v}}));
  const resetFilters=()=>{ setPrefs(o=>({...o,catsOff:[],region:'all',source:'all',favOnly:false,hideVisited:false})); setQ('');
    toast('Фильтры сброшены','info'); };
  const randomLoc=()=>{
    if(!searched.length){ toast('Нет видимых локаций для выбора','warn'); return; }
    const l=searched[Math.floor(Math.random()*searched.length)];
    audio.play('dice'); pickAndZoom(l.id);
    toast('Судьба указывает на: '+l.ru,'info');
  };
  const startAdd=()=>{ setAddMode(a=>!a); setDraft(null); setSelectedId(null); audio.play('open'); };
  const addPoint=(pt)=>{ setAddMode(false); setDraft(pt); setSelectedId(null); audio.play('open'); };
  const saveLoc=(loc)=>{
    setCustom(cs=>{ const i=cs.findIndex(c=>c.id===loc.id);
      if(i>=0){ const n=[...cs]; n[i]=loc; return n; } return [...cs,loc]; });
    setDraft(null); setSelectedId(loc.id); audio.play('add');
    toast(draft?.id?'Метка обновлена':'Локация добавлена на атлас','ok');
  };
  const deleteLoc=(loc)=>{
    if(undoRef.current){ clearTimeout(undoRef.current.timer); undoRef.current=null; }
    setCustom(cs=>cs.filter(c=>c.id!==loc.id));
    setSelectedId(null); audio.play('remove');
    const entry={loc,timer:setTimeout(()=>{undoRef.current=null;},6400)};
    undoRef.current=entry;
    toast(`«${loc.ru}» удалена`,'bad',{label:'Отменить',fn:()=>{
      clearTimeout(entry.timer); undoRef.current=null;
      setCustom(cs=>[...cs,loc]); setSelectedId(loc.id); audio.play('add'); toast('Метка возвращена','ok');
    }});
  };
  const editLoc=(loc)=>{ setSelectedId(null); setDraft({...loc}); audio.play('open'); };
  const exportJSON=()=>{
    const data={app:'vvardenfell-atlas',version:1,exported:new Date().toISOString(),custom,meta,views};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download='vvardenfell-atlas-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast(`Экспортировано: ${custom.length} своих меток, ${Object.keys(meta).length} отметок`,'ok'); audio.play('toggle');
  };
  const importJSON=(file)=>{
    file.text().then(txt=>{
      const j=JSON.parse(txt);
      if(!j||j.app!=='vvardenfell-atlas'||!Array.isArray(j.custom))throw new Error('bad');
      const clean=j.custom.filter(c=>c&&typeof c.id==='string'&&CATS[c.type]&&REGIONS[c.region]
        &&isFinite(c.x)&&isFinite(c.y)&&typeof c.ru==='string')
        .map(c=>({...c,x:clamp(+c.x,-200,1400),y:clamp(+c.y,-200,1200),src:'MY',ru:String(c.ru).slice(0,80)}));
      setCustom(cs=>{ const m=new Map(cs.map(c=>[c.id,c])); clean.forEach(c=>m.set(c.id,c)); return [...m.values()]; });
      if(j.meta&&typeof j.meta==='object')setMeta(m=>({...j.meta,...m}));
      if(Array.isArray(j.views))setViews(v=>[...j.views.slice(0,8),...v].slice(0,10));
      toast(`Импортировано: ${clean.length} локаций`,'ok'); audio.play('add');
    }).catch(()=>toast('Файл не похож на экспорт атласа','bad'));
  };
  const saveView=()=>{
    const vb=mapRef.current?.getView(); if(!vb)return;
    const name=(prefs.region!=='all'?REGIONS[prefs.region].name:'Весь атлас')+' · '+(1240/vb.w).toFixed(1)+'×';
    const v={id:'vw-'+Date.now().toString(36),name,vb:{x:vb.x,y:vb.y,w:vb.w},
      f:{catsOff:prefs.catsOff,region:prefs.region,source:prefs.source,favOnly:prefs.favOnly,hideVisited:prefs.hideVisited},q};
    setViews(vs=>[...vs,v].slice(-10)); audio.play('toggle'); toast('Вид сохранён: '+name,'info');
  };
  const applyViewChip=(v)=>{ setPrefs(o=>({...o,...v.f})); setQ(v.q||''); mapRef.current?.setView(v.vb); audio.play('open'); };

  useEffect(()=>{
    const h=(e)=>{
      const tag=(e.target.tagName||'').toLowerCase();
      const typing=tag==='input'||tag==='textarea'||tag==='select';
      if(e.key==='Escape'){
        if(about)setAbout(false);
        else if(draft)setDraft(null);
        else if(addMode)setAddMode(false);
        else if(selectedId)setSelectedId(null);
        else if(sbOpen)setSbOpen(false);
        return;
      }
      if(typing)return;
      if(e.key==='/'){ e.preventDefault(); setSbOpen(true); searchRef.current?.focus(); }
      else if(e.key==='+'||e.key==='=')mapRef.current?.zoomBy(1.5);
      else if(e.key==='-')mapRef.current?.zoomBy(1/1.5);
      else if(e.key==='0')mapRef.current?.reset();
      else if(e.key==='r'||e.key==='R'||e.key==='к'||e.key==='К')randomLoc();
      else if(e.key==='ArrowLeft')mapRef.current?.nudge(-1,0);
      else if(e.key==='ArrowRight')mapRef.current?.nudge(1,0);
      else if(e.key==='ArrowUp')mapRef.current?.nudge(0,-1);
      else if(e.key==='ArrowDown')mapRef.current?.nudge(0,1);
    };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[about,draft,addMode,selectedId,sbOpen,searched]);

  return (
    <div className="app">
      <header className="hdr">
        <button className="ibtn hdr-panel" title="Панель управления" aria-label="Панель управления" onClick={()=>setSbOpen(o=>!o)}>{I.list}</button>
        <div className="brand">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 3 29 27H3Z" fill="none" stroke="#d8b36a" strokeWidth="2"/>
            <circle cx="16" cy="19" r="3.4" fill="#ff5a2a"/>
            <circle cx="16" cy="10" r="1.6" fill="#d8b36a"/><circle cx="9.5" cy="22" r="1.6" fill="#d8b36a"/><circle cx="22.5" cy="22" r="1.6" fill="#d8b36a"/>
          </svg>
          <div><h1>АТЛАС ВВАРДЕНФЕЛЛА</h1><small>Morrowind · Bloodmoon · Tamriel Rebuilt · {all.length} локаций</small></div>
        </div>
        <div className="hdr-sp"/>
        <div className="hdr-actions">
          <button className={'ibtn'+(prefs.sound?' on':'')} title={prefs.sound?'Выключить звук':'Включить звук'}
                  aria-label="Звук" onClick={()=>{ setPref('sound',!prefs.sound); audio.init(); }}>
            {prefs.sound?<span className="eq"><i/><i/><i/></span>:I.soundOff}
          </button>
          <button className="ibtn" title="Тема карты: пепел / пергамент" aria-label="Тема карты"
                  onClick={()=>{ setPref('theme',prefs.theme==='ash'?'parchment':'ash'); audio.play('toggle'); }}>
            {prefs.theme==='ash'?I.scroll:I.moon}
          </button>
          <button className={'btn btn-gold'+(addMode?' toggled-gold':'')} onClick={startAdd} title="Добавить локацию кликом по карте">
            {I.plus}<span>{addMode?'Отменить постановку':'Локация'}</span>
          </button>
          <button className="ibtn" title="Экспорт JSON" aria-label="Экспорт" onClick={exportJSON}>{I.dl}</button>
          <button className="ibtn" title="Импорт JSON" aria-label="Импорт" onClick={()=>fileRef.current?.click()}>{I.ul}</button>
          <button className="ibtn" title="О проекте (паспорт задания)" aria-label="О проекте" onClick={()=>{setAbout(true);audio.play('open');}}>{I.info}</button>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{display:'none'}}
                 onChange={(e)=>{ const f=e.target.files?.[0]; if(f)importJSON(f); e.target.value=''; }}/>
        </div>
      </header>

      <div className="main">
        {sbOpen && <div className="sb-backdrop" onClick={()=>setSbOpen(false)}/>}
        <aside className={'sb'+(sbOpen?' open':'')}>
          <div className="sb-sec" style={{position:'sticky',top:0,zIndex:2,background:'linear-gradient(180deg,#1c1712,#1c1712f2)',backdropFilter:'blur(4px)'}}>
            <div className="search">
              {I.search}
              <input ref={searchRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск: Балмора, Arkngthand…  ( / )" aria-label="Поиск локаций"/>
              {q&&<button className="clr" onClick={()=>setQ('')} aria-label="Очистить">✕</button>}
            </div>
            <div className="frow three">
              <label className="fld"><span>Регион</span>
                <select value={prefs.region} onChange={e=>setPref('region',e.target.value)}>
                  <option value="all">Все</option>{REG_KEYS.map(k=><option key={k} value={k}>{REGIONS[k].name}</option>)}</select></label>
              <label className="fld"><span>Источник</span>
                <select value={prefs.source} onChange={e=>setPref('source',e.target.value)}>
                  <option value="all">Все</option>{Object.keys(SOURCES).map(k=><option key={k} value={k}>{SOURCES[k]}</option>)}</select></label>
            </div>
            <div className="chips">
              <button className={'chip-t'+(prefs.favOnly?' on':'')} onClick={()=>{setPref('favOnly',!prefs.favOnly);audio.play('toggle');}}>★ Избранное</button>
              <button className={'chip-t'+(prefs.hideVisited?' on':'')} onClick={()=>{setPref('hideVisited',!prefs.hideVisited);audio.play('toggle');}}>✓ Скрыть посещённые</button>
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-h">Легенда
              <span className="mini">
                <button className="mini-btn" onClick={()=>setPref('catsOff',[])}>все</button>
                <button className="mini-btn" onClick={()=>setPref('catsOff',[...CAT_KEYS])}>ни одной</button>
              </span>
            </div>
            {CAT_KEYS.map(k=>{
              const off=prefs.catsOff.includes(k);
              return <label key={k} className={'lg-row'+(off?' off':'')}>
                <input type="checkbox" checked={!off} style={{accentColor:CATS[k].color}}
                  onChange={()=>{ setPref('catsOff',off?prefs.catsOff.filter(c=>c!==k):[...prefs.catsOff,k]); audio.play('toggle'); }}/>
                <span className="lg-ic" style={{background:CATS[k].color+'1c',border:`1px solid ${CATS[k].color}44`}}><CatIcon type={k}/></span>
                <span className="lg-name">{CATS[k].label}</span>
                <span className="lg-n">{catCounts[k]}</span>
              </label>;
            })}
          </div>

          <div className="sb-sec">
            <div className="sb-h">Отображение</div>
            <div className="seg" role="group" aria-label="Тема карты">
              <button className={prefs.theme==='ash'?'on':''} onClick={()=>{setPref('theme','ash');audio.play('toggle');}}>{I.moon} Пепел</button>
              <button className={prefs.theme==='parchment'?'on':''} onClick={()=>{setPref('theme','parchment');audio.play('toggle');}}>{I.scroll} Пергамент</button>
            </div>
            {[['labels','Подписи меток'],['regions','Названия регионов'],['grid','Сетка клеток'],['glow','Свечение и дым']].map(([k,txt])=>(
              <div className="sw-row" key={k}><span>{txt}</span>
                <button className="sw" role="switch" aria-checked={prefs[k]} aria-label={txt}
                  onClick={()=>{setPref(k,!prefs[k]);audio.play('toggle');}}/></div>))}
            <div className="sl-row"><label>Размер меток <b>{Math.round(prefs.mscale*100)}%</b></label>
              <input type="range" min="0.6" max="1.8" step="0.05" value={prefs.mscale} onChange={e=>setPref('mscale',+e.target.value)} aria-label="Размер меток"/></div>
            <div className="sl-row"><label>Плотность пепла <b>{prefs.ash}</b></label>
              <input type="range" min="0" max="100" step="1" value={prefs.ash} onChange={e=>setPref('ash',+e.target.value)} aria-label="Плотность пепла"/></div>
          </div>

          <div className="sb-sec">
            <div className="sb-h">Виды карты
              <span className="mini"><button className="mini-btn" onClick={saveView}>＋ сохранить вид</button></span></div>
            {views.length===0
              ? <p style={{fontSize:11.5,color:'var(--tx3)'}}>Сохраняйте ракурс и фильтры — например «Вивек, только гробницы».</p>
              : <div className="views">{views.map(v=>(
                  <span key={v.id} className="view-chip"><b onClick={()=>applyViewChip(v)}>{v.name}</b>
                    <button className="vx" aria-label="Удалить вид" onClick={()=>setViews(vs=>vs.filter(x=>x.id!==v.id))}>✕</button></span>))}</div>}
          </div>

          <div className="sb-foot">
            <button className="btn" onClick={exportJSON}>{I.dl} Экспорт</button>
            <button className="btn" onClick={()=>fileRef.current?.click()}>{I.ul} Импорт</button>
            <small>Отметки, заметки и свои метки хранятся в localStorage этого браузера.</small>
          </div>
        </aside>

        <MapView ref={mapRef}
          locations={visible} matched={matchedSet} q={ql}
          selectedId={selectedId} hoverId={hoverId} meta={meta} prefs={prefs} theme={prefs.theme}
          addMode={addMode} draft={draft}
          onSelect={selectLoc} onHover={setHoverId} onAddPoint={addPoint}
          onRandom={randomLoc} onResetFilters={resetFilters} onCancelAdd={()=>setAddMode(false)}
          hintSeen={hintSeen} onHintSeen={()=>setHintSeen(true)}/>
        {draft
          ? <LocationForm key={draft.id||'new'} draft={draft} onSave={saveLoc} onCancel={()=>setDraft(null)}/>
          : selected
            ? <DetailPanel key={selected.id} loc={selected} meta={meta} audio={audio}
                onClose={()=>setSelectedId(null)}
                onToggleVisited={(id)=>toggleMeta(id,'visited')} onToggleFav={(id)=>toggleMeta(id,'fav')}
                onNote={setNote} onZoom={zoomTo} onEdit={editLoc} onDelete={deleteLoc}/>
            : null}
      </div>

      <div className="toasts" aria-live="polite">
        {toasts.map(t=>(
          <div key={t.id} className={'toast '+t.kind}>
            <span className="dot"/><span>{t.msg}</span>
            {t.action&&<button onClick={()=>{t.action.fn();dismissToast(t.id);}}>{t.action.label}</button>}
          </div>))}
      </div>
      {about&&<AboutModal onClose={()=>setAbout(false)}/>}
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { CATS, REGIONS } from '../data/catalog.js';
import { cellOf } from '../lib/utils.js';
import { CatIcon, I } from '../lib/icons.jsx';

const uespCache = new Map();

export default function DetailPanel({loc, meta, onClose, onToggleVisited, onToggleFav, onNote, onZoom, onEdit, onDelete, audio}){
  const [uesp,setUesp]=useState({status:'idle'});
  const [nonce,setNonce]=useState(0);
  const [savedFlash,setSavedFlash]=useState(false);
  const m = meta[loc.id]||{};
  const c = CATS[loc.type];
  const uespPage = loc.src==='MW' ? 'Morrowind:'+loc.en : loc.src==='BM' ? 'Bloodmoon:'+loc.en : null;

  useEffect(()=>{
    if(!uespPage){ setUesp({status:'mod'}); return; }
    const cached=uespCache.get(uespPage);
    if(cached){ setUesp(cached); return; }
    const ctrl=new AbortController();
    const timer=setTimeout(()=>{ setUesp({status:'error'}); ctrl.abort(); },9000);
    setUesp({status:'loading'});
    const url='https://en.uesp.net/w/api.php?action=parse&format=json&origin=*&redirects=1&disableeditsection=1&prop=text&page='+encodeURIComponent(uespPage);
    fetch(url,{signal:ctrl.signal})
      .then(r=>{ if(!r.ok)throw new Error('HTTP '+r.status); return r.json(); })
      .then(j=>{
        if(ctrl.signal.aborted) return;
        if(j.error||!j.parse||!j.parse.text)throw new Error(j.error?j.error.code:'пустой ответ');
        const html=j.parse.text['*']||'';
        const doc=new DOMParser().parseFromString(html,'text/html');
        doc.querySelectorAll('sup, .mw-editsection, style, script, table').forEach(n=>n.remove());
        let text='';
        for(const p of doc.querySelectorAll('p')){
          const t=p.textContent.replace(/\s+/g,' ').trim();
          if(t.length>60){ text=t; break; }
        }
        if(!text)throw new Error('нет вводного абзаца');
        if(text.length>460)text=text.slice(0,460).replace(/\s\S*$/,'')+'…';
        let img=null;
        const im=doc.querySelector('.thumbimage, .image img, img');
        if(im){ let src=im.getAttribute('src')||''; if(src.startsWith('/images/'))src='https://en.uesp.net'+src;
          if(/^https:\/\/(en\.uesp\.net|images\.uesp\.net)\//.test(src))img=src; }
        const res={status:'ok',text,img};
        uespCache.set(uespPage,res); setUesp(res);
      })
      .catch((err)=>{ if(err&&err.name==='AbortError')return; setUesp({status:'error'}); })
      .finally(()=>clearTimeout(timer));
    return ()=>{ ctrl.abort(); clearTimeout(timer); };
  },[loc.id,nonce]);

  const [cx,cy]=cellOf(loc.x,loc.y);
  const noteTimer=useRef(0);
  const handleNote=(v)=>{ onNote(loc.id,v); setSavedFlash(true);
    clearTimeout(noteTimer.current); noteTimer.current=setTimeout(()=>setSavedFlash(false),1200); };
  useEffect(()=>()=>clearTimeout(noteTimer.current),[]);

  return (
    <aside className="panel" role="dialog" aria-label={'Локация: '+loc.ru}>
      <div className="p-head">
        <div className="p-ic" style={{background:`linear-gradient(135deg,${c.color}26,${c.color}0d)`,border:`1px solid ${c.color}66`,color:c.color}}>
          <CatIcon type={loc.type} size={26}/>
        </div>
        <div className="p-tt">
          <h2>{loc.ru}</h2>
          <div className="en">{loc.en}</div>
          <div className="p-meta">
            <span className="tag" style={{background:c.color+'22',color:c.color,border:`1px solid ${c.color}55`}}>{c.label}</span>
            <span className="tag" style={{background:REGIONS[loc.region].color+'1e',color:REGIONS[loc.region].color,border:`1px solid ${REGIONS[loc.region].color}44`}}>{REGIONS[loc.region].name}</span>
            {loc.src==='TR'&&<span className="badge b-tr">Tamriel Rebuilt</span>}
            {loc.src==='BM'&&<span className="badge b-bm">Bloodmoon</span>}
            {loc.src==='MY'&&<span className="badge b-my">{loc.mod||'Моя локация'}</span>}
          </div>
        </div>
        <button className="p-x" onClick={onClose} aria-label="Закрыть">✕</button>
      </div>
      <div className="p-body">
        <p className="p-desc">{loc.desc||'Описание пока не добавлено — допишите его в заметках ниже.'}</p>
        <div className="coord-line"><span>Клетка: <b>{cx}, {cy}</b></span><span>XY: <b>{loc.x}, {loc.y}</b></span></div>
        <div className="p-acts">
          <button className={'btn'+(m.visited?' toggled-ok':'')} onClick={()=>{onToggleVisited(loc.id);audio.play('toggle');}}>
            {m.visited?'✓ Посещено':'Отметить посещённой'}</button>
          <button className={'btn'+(m.fav?' toggled-gold':'')} onClick={()=>{onToggleFav(loc.id);audio.play('toggle');}}>
            {m.fav?'★ В избранном':'☆ В избранное'}</button>
          <button className="btn" onClick={()=>onZoom(loc)}>{I.target} К метке</button>
          {uespPage
            ? <a className="btn" href={'https://en.uesp.net/wiki/'+encodeURIComponent(uespPage)} target="_blank" rel="noopener noreferrer">UESP ↗</a>
            : <button className="btn" onClick={()=>onZoom(loc)}>{I.scroll} Обзор</button>}
        </div>
        {loc.src==='MY' && <div className="p-acts">
          <button className="btn" onClick={()=>onEdit(loc)}>✎ Редактировать</button>
          <button className="btn btn-danger" onClick={()=>onDelete(loc)}>Удалить</button>
        </div>}
        <div className="p-sec">
          <h4>UESP Wiki · живые данные (EN)</h4>
          <div className="uesp">
            {uesp.status==='loading' && <div aria-label="Загрузка"><div className="shim" style={{width:'92%'}}/><div className="shim" style={{width:'100%'}}/><div className="shim" style={{width:'64%'}}/></div>}
            {uesp.status==='ok' && <div>
              {uesp.img && <img src={uesp.img} alt="" loading="lazy" onError={(e)=>{e.target.style.display='none';}}/>}
              <p>{uesp.text}</p>
              <div className="u-foot"><span>Источник: en.uesp.net · CC BY-SA</span>
                <a href={'https://en.uesp.net/wiki/'+encodeURIComponent(uespPage)} target="_blank" rel="noopener noreferrer">Читать статью ↗</a></div>
            </div>}
            {uesp.status==='error' && <div>
              <p className="u-err">UESP сейчас недоступен — показана офлайн-справка выше.</p>
              <div className="u-foot"><button className="mini-btn" onClick={()=>setNonce(n=>n+1)}>Повторить запрос</button>
                <a href={'https://en.uesp.net/wiki/'+encodeURIComponent(uespPage)} target="_blank" rel="noopener noreferrer">Открыть вручную ↗</a></div>
            </div>}
            {uesp.status==='mod' && <p style={{color:'var(--tx3)'}}>Для модовых локаций ({loc.src==='TR'?'Tamriel Rebuilt':(loc.mod||'свои моды')}) статей на UESP нет — используйте заметки ниже.</p>}
          </div>
        </div>
        <div className="p-sec">
          <h4>Личная заметка</h4>
          <textarea className="note-ta" value={m.note||''} placeholder="Что взять, кого убить, где вход, какой ключ нужен…"
            onChange={(e)=>handleNote(e.target.value)}/>
          <div className="note-cap"><span>Хранится в вашем браузере</span><span className={'saved'+(savedFlash?' show':'')}>Сохранено ✓</span></div>
        </div>
      </div>
    </aside>
  );
}
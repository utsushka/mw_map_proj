import { useState } from 'react';
import { CATS, CAT_KEYS, REGIONS, REG_KEYS } from '../data/catalog.js';
import { guessRegion, cellOf } from '../lib/utils.js';
import { I } from '../lib/icons.jsx';

export default function LocationForm({draft, onSave, onCancel}){
  const editing = !!draft.id;
  const [f,setF]=useState(()=>({ ru:draft.ru||'', en:draft.en||'', type:draft.type||'home',
    region:draft.region||guessRegion(draft.x,draft.y), src:draft.src==='TR'?'TR':'MY',
    mod:draft.mod||'Tamriel Rebuilt', desc:draft.desc||'' }));
  const [err,setErr]=useState('');
  const set=(k,v)=>setF(o=>({...o,[k]:v}));
  const submit=()=>{
    if(!f.ru.trim()){ setErr('Введите название локации.'); return; }
    onSave({ ...draft, id:draft.id||('my-'+Date.now().toString(36)),
      ru:f.ru.trim(), en:f.en.trim()||f.ru.trim(), type:f.type, region:f.region,
      src:f.src, mod:f.src==='MY'?(f.mod.trim()||'Свой мод'):'Tamriel Rebuilt', desc:f.desc.trim() });
  };
  return (
    <aside className="panel" role="dialog" aria-label={editing?'Редактирование локации':'Новая локация'}>
      <div className="p-head">
        <div className="p-ic" style={{background:'rgba(47,208,194,.12)',border:'1px solid rgba(47,208,194,.5)',color:'#2fd0c2'}}>{I.target}</div>
        <div className="p-tt"><h2>{editing?'Правка метки':'Новая метка'}</h2>
          <div className="en">Клетка {cellOf(draft.x,draft.y).join(', ')} · XY {draft.x}, {draft.y}</div></div>
        <button className="p-x" onClick={onCancel} aria-label="Закрыть">✕</button>
      </div>
      <div className="p-body">
        <div className="f-grid">
          <label className="fld"><span>Название (RU) *</span>
            <input value={f.ru} autoFocus onChange={e=>set('ru',e.target.value)} placeholder="Например: Тель Арун-Мал"/></label>
          <label className="fld"><span>Название (EN)</span>
            <input value={f.en} onChange={e=>set('en',e.target.value)} placeholder="Tel Aruhn-Mal"/></label>
          <div className="f-2">
            <label className="fld"><span>Тип</span>
              <select value={f.type} onChange={e=>set('type',e.target.value)}>
                {CAT_KEYS.map(k=><option key={k} value={k}>{CATS[k].label}</option>)}</select></label>
            <label className="fld"><span>Регион</span>
              <select value={f.region} onChange={e=>set('region',e.target.value)}>
                {REG_KEYS.map(k=><option key={k} value={k}>{REGIONS[k].name}</option>)}</select></label>
          </div>
          <div className="f-2">
            <label className="fld"><span>Источник</span>
              <select value={f.src} onChange={e=>set('src',e.target.value)}>
                <option value="MY">Свой мод</option><option value="TR">Tamriel Rebuilt</option></select></label>
            {f.src==='MY' && <label className="fld"><span>Название мода</span>
              <input value={f.mod} onChange={e=>set('mod',e.target.value)} placeholder="Project Tamriel…"/></label>}
          </div>
          <label className="fld"><span>Описание</span>
            <textarea rows="3" value={f.desc} onChange={e=>set('desc',e.target.value)} placeholder="Что это за место и зачем туда идти…"/></label>
          {err && <div className="f-err">{err}</div>}
          <div className="f-btns">
            <button className="btn btn-gold" onClick={submit}>{editing?'Сохранить правки':'Поставить метку'}</button>
            <button className="btn" onClick={onCancel}>Отмена</button>
          </div>
          <p style={{fontSize:11,color:'var(--tx3)'}}>Метка сохранится в localStorage. Перенести на другой компьютер — «Экспорт JSON» внизу панели.</p>
        </div>
      </div>
    </aside>
  );
}
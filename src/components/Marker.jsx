import { memo } from 'react';
import { CATS, THEMES } from '../data/catalog.js';
import { shortName } from '../lib/utils.js';

const Marker = memo(function Marker({loc, s, selected, hovered, dimmed, visited, fav, isCustom, labels, theme}){
  const c = CATS[loc.type], T = THEMES[theme];
  return (
    <g transform={`translate(${loc.x} ${loc.y})`} data-loc={loc.id}
       className={'mk'+(dimmed?' dimmed':'')+(visited&&!selected?' visited-m':'')}>
      <g className="mk-s" transform={`scale(${s})`}>
        {selected && <circle className="sel-ring" r="19" fill="none" stroke={c.color} strokeWidth="2" vectorEffect="non-scaling-stroke"/>}
        {isCustom && <circle r="16.5" fill="none" stroke={c.color} strokeWidth="1.2" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity=".85"/>}
        <circle className="halo" r="13" fill="rgba(12,9,6,.74)" stroke={c.color}
                strokeWidth={hovered||selected?2.4:1.5} vectorEffect="non-scaling-stroke"
                style={hovered||selected?{filter:`drop-shadow(0 0 6px ${c.color})`}:null}/>
        <g transform="translate(-10.8 -10.8) scale(.9)">
          {c.icon.map((p,i)=><path key={i} d={p.d} fill={p.fill||c.color} fillRule={p.even?'evenodd':'nonzero'}/>)}
        </g>
        {visited && <g transform="translate(9.5 -9.5)"><circle r="5" fill="#23c56d" stroke="#0c0a06" strokeWidth="1"/><path d="M-2.2 0l1.6 1.9 3-3.6" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></g>}
        {fav && <g transform="translate(-9.5 -9.5) scale(.62)"><path d="M0-6l1.8 3.7 4 .6-2.9 2.9.7 4L0 3.2l-3.6 2 .7-4-2.9-2.9 4-.6Z" fill="#f0cf8a" stroke="#0c0a06" strokeWidth="1.2"/></g>}
        <circle r="17" fill="transparent"/>
      </g>
      {labels && <g className="mk-t" transform={`scale(${s})`}>
        <text className="mk-label" y="27" fill={T.label} stroke={T.labelHalo} strokeWidth="3.5"
              vectorEffect="non-scaling-stroke" style={{paintOrder:'stroke'}}>{shortName(loc.ru)}</text>
      </g>}
    </g>
  );
});
export default Marker;
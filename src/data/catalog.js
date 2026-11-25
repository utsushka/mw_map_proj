/* Категории — ровно легенда задания, в заданном порядке.
   icon: пути в поле 24×24; fill/even — детали иконки. */
export const CATS = {
  daedric: { label:'Даэдрические руины', color:'#ff4257',
    icon:[{d:'M12 2l3 6h-2l2.5 6-2.5-1v8h-2v-8l-2.5 1L11 8H9Z'},{d:'M6 21h12v2H6Z'}] },
  dwemer: { label:'Двемерские руины', color:'#f2a93b',
    icon:[{d:'M11 2h2l.5 2.2 2 .8 2-1.2 1.4 1.4-1.2 2 .8 2 2.2 .5v2l-2.2 .5-.8 2 1.2 2-1.4 1.4-2-1.2-2 .8L13 22h-2l-.5-2.2-2-.8-2 1.2-1.4-1.4 1.2-2-.8-2L3.3 13v-2l2.2-.5 .8-2-1.2-2 1.4-1.4 2 1.2 2-.8Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',even:true}] },
  stronghold: { label:'Данмерские крепости', color:'#8f7bff',
    icon:[{d:'M4 21V9l2-1V4h2v2h2V4h4v2h2V4h2v4l2 1v12h-7v-5h-2v5Z'}] },
  grotto: { label:'Гроты', color:'#2fd0c9',
    icon:[{d:'M4 15a8 8 0 0 1 16 0h-4.5a3.5 3.5 0 0 0-7 0Z'},{d:'M2 18.5c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0V22H2Z'}] },
  cave: { label:'Пещеры', color:'#97a3b4',
    icon:[{d:'M2 20L9 5l4.2 8L16 9l6 11Z M10 20a2.6 3.2 0 0 1 5.2 0Z',even:true}] },
  tomb: { label:'Родовые гробницы', color:'#4fe08a',
    icon:[{d:'M6 21V10a6 6 0 0 1 12 0v11h-3.2V10.5a2.8 2.8 0 0 0-5.6 0V21Z'},{d:'M4 21h16v2H4Z'}] },
  egg: { label:'Яичные шахты', color:'#ffd94d',
    icon:[{d:'M12 3c2.3 0 4.1 3.5 4.1 6.7a4.1 4.1 0 0 1-8.2 0C7.9 6.5 9.7 3 12 3Z M6.3 12.2c1.7 0 3 2.5 3 4.7a3 3 0 0 1-6 0c0-2.2 1.3-4.7 3-4.7Z M17.7 12.2c1.7 0 3 2.5 3 4.7a3 3 0 0 1-6 0c0-2.2 1.3-4.7 3-4.7Z'}] },
  mine: { label:'Шахты', color:'#a9e34b',
    icon:[{d:'M4 7C8 3.5 15 3 20.5 6l-1 2.2C15 5.8 9.3 6.2 5.4 9Z'},{d:'M11.2 6.6l2.4 1.2L7 21.5l-2.8-1.3Z'},{d:'M18 14l2.5 2.5-2.5 2.5-2.5-2.5Z'}] },
  camp: { label:'Лагеря Эшлендеров', color:'#e0764a',
    icon:[{d:'M12 4l8 16H4Z M12 11l3.4 9H8.6Z',even:true},{d:'M9.5 1.5L12 4l2.5-2.5 1 1L12 6 8.5 2.5Z'}] },
  velothi: { label:'Велотийские башни', color:'#ff5ecb',
    icon:[{d:'M12 2a4.2 4.2 0 0 1 4.2 4.2c0 1.6-.9 2.9-2.2 3.6L14.6 20H9.4L10 9.8A4.2 4.2 0 0 1 7.8 6.2 4.2 4.2 0 0 1 12 2Z M12 12a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z',even:true},{d:'M7 20h10v2H7Z'}] },
  home: { label:'Поместья, хижины, дома, лачуги, плантации, фермы', color:'#4fa8ff',
    icon:[{d:'M12 3l9 8.5h-2.5V21h-4.5v-6h-4v6H5.5v-9.5H3Z'}] },
  fort: { label:'Имперские форты', color:'#f0e9dc',
    icon:[{d:'M4 21V7h2.5V4h3v3h5V4h3v3H20v14h-6v-4.5a2 2 0 0 0-4 0V21Z'},{d:'M12 9.5l2.3 2.8-2.3 2.8-2.3-2.8Z',fill:'#e0483f'}] },
};
export const CAT_KEYS = Object.keys(CATS);

export const REGIONS = {
  RM:{name:'Красная Гора', color:'#ff6a3d', tint:'#5a2a18', pt:[760,400]},
  AL:{name:'Пепельные земли', color:'#c9a06a', tint:'#4a3d2c', pt:[700,250]},
  WG:{name:'Вест Гэш', color:'#a8b06a', tint:'#3c3d2c', pt:[575,370]},
  BC:{name:'Горький Берег', color:'#5fae7f', tint:'#28402e', pt:[560,620]},
  AI:{name:'Аскадийские острова', color:'#7fd06a', tint:'#2f4a2c', pt:[750,630]},
  MA:{name:'Молаг Амур', color:'#d07a5f', tint:'#4a2e24', pt:[915,520]},
  AC:{name:'Берег Азуры', color:'#8f7bff', tint:'#37304e', pt:[1005,430]},
  GL:{name:'Пастбища', color:'#b6c94a', tint:'#42482a', pt:[900,270]},
  SH:{name:'Шеогорад', color:'#5fb6d0', tint:'#2a3c4e', pt:[790,100]},
  SOL:{name:'Солстейм', color:'#9fc6e0', tint:'#3c4a58', pt:[185,120]},
  MM:{name:'Материк · Аантирин', color:'#4fd0c2', tint:'#26403a', pt:[180,760]},
  TV:{name:'Материк · Тельваннис', color:'#35b09a', tint:'#2a3c32', pt:[1100,130]},
};
export const REG_KEYS = Object.keys(REGIONS);
export const SOURCES = { MW:'Ванилла', BM:'Bloodmoon', TR:'Tamriel Rebuilt', MY:'Мои локации' };

export const THEMES = {
  ash: { name:'Пепел', sea0:'#0b141c', sea1:'#12242e', land:'#262620', mainland:'#211e18', sol:'#2e3a44',
    coast:'#c9a86a', coastGlow:'rgba(201,168,106,.16)', grid:'rgba(220,200,160,.10)',
    regLabel:'rgba(205,187,150,.5)', seaLabel:'rgba(95,125,140,.55)', srcLabel:'rgba(47,208,194,.65)',
    label:'#efe6d0', labelHalo:'rgba(10,8,6,.85)', river:'#4fa8d8', road:'rgba(216,179,106,.38)',
    foyada:'rgba(150,120,90,.32)', tr:'rgba(47,208,194,.5)', tintOp:.6, shim:'rgba(140,190,210,.05)', crater:'#160b06' },
  parchment: { name:'Пергамент', sea0:'#d3c8a4', sea1:'#c3b58c', land:'#e8dcb6', mainland:'#ddd0a6', sol:'#e6e2d2',
    coast:'#6b5233', coastGlow:'rgba(107,82,51,.22)', grid:'rgba(90,70,40,.15)',
    regLabel:'rgba(110,88,56,.62)', seaLabel:'rgba(125,108,72,.6)', srcLabel:'rgba(16,110,100,.75)',
    label:'#38291a', labelHalo:'rgba(238,228,196,.9)', river:'#4a7fa0', road:'rgba(107,82,51,.5)',
    foyada:'rgba(120,90,60,.35)', tr:'rgba(16,110,100,.55)', tintOp:.34, shim:'rgba(120,100,60,.07)', crater:'#4a2412' },
};
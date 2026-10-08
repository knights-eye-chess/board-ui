import { createBoardAppearance, PIECE_CODES, DEFAULT_QUALITY_DEFINITIONS } from '@knights-eye-chess/board-ui/appearance';

/** Build-time host extensions, registered once. Runtime controls only select names. */
export function chevronArrow(g) {
  const {from:f,to:t,unit:u}=g, n={x:-u.y,y:u.x};
  const p=(x,y)=>`${x} ${y}`, point=(along,across)=>p(t.x-u.x*along+n.x*across,t.y-u.y*along+n.y*across);
  const w=1.4*g.weight, h=4*g.weight;
  return {layers:[
    {d:`M ${p(f.x+n.x*w,f.y+n.y*w)} L ${point(5,w)} L ${point(5,-w)} L ${p(f.x-n.x*w,f.y-n.y*w)} Z`,fill:g.color,fillOpacity:.55*g.opacity},
    {d:`M ${point(6,h)} L ${point(0,0)} L ${point(6,-h)} L ${point(8,-h+1)} L ${point(3,0)} L ${point(8,h-1)} Z`,fill:g.color,fillOpacity:g.opacity},
  ]};
}
export const customPieces = Object.fromEntries(PIECE_CODES.map(code => [code,{asset:`custom/pieces/${code === code.toUpperCase() ? 'w' : 'b'}${code.toLowerCase()}.svg`,scale:.84}]));
export const customIcons = Object.fromEntries(DEFAULT_QUALITY_DEFINITIONS.map(q => [q.name,{asset:`custom/icons/${q.name}.svg`,color:q.color,label:q.label,group:q.group}]));
customIcons.bookmark={asset:'custom/icons/bookmark.svg',color:'#8b5cf6',label:'Saved idea',group:'host-defined'};
export const themes = {
  midnight: {light:'#cdd6e5',dark:'#425a78',focus:'#ab78ff',dialog:'#fff',dialogText:'#18253a',lastMove:'#eecb55',selected:'#e6b853',target:'#14223b88',coordinateLight:'#405979',coordinateDark:'#e5eaf2'},
  mint: {light:'#e6f4e9',dark:'#78a596',focus:'#6c42ce',dialog:'#fff',dialogText:'#173d30',lastMove:'#eecb55',selected:'#edc36b',target:'#18544288',coordinateLight:'#426f62',coordinateDark:'#eaf7ed'},
  'warm-sand': {light:'#f1e4d1',dark:'#b88763',focus:'#8e57cb',dialog:'#fff9ef',dialogText:'#452d20',lastMove:'#b29aea',selected:'#f0c76b',target:'#5d352b88',coordinateLight:'#946d4f',coordinateDark:'#fff5e8'},
};
export function demoAppearance() {
  const assets = Object.fromEntries(PIECE_CODES.map(code=>{const file=`${code === code.toUpperCase() ? 'w' : 'b'}${code.toLowerCase()}.png`;return [`pieces/${file}`,`./assets/pieces/${file}`]}));
  for(const q of DEFAULT_QUALITY_DEFINITIONS) assets[`icons/${q.file}`]=`./assets/icons/${q.file}`;
  for(const definition of Object.values(customPieces)) assets[definition.asset]=`./assets/${definition.asset}`;
  for(const definition of Object.values(customIcons)) assets[definition.asset]=`./assets/${definition.asset}`;
  return createBoardAppearance({assetUrls:assets,pieceSets:{'outlined-silhouette':{pieces:customPieces}},iconSets:{'diamond-marks':{icons:customIcons}},squareThemes:themes,arrowStyles:{'arrow-chevron-head':chevronArrow}});
}

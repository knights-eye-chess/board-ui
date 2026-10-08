import {mountBoardViewer} from '@knights-eye-chess/board-ui/viewer';
import {DEFAULT_QUALITY_DEFINITIONS} from '@knights-eye-chess/board-ui/appearance';
import {demoAppearance} from './appearance.mjs';
const catalogue=demoAppearance(), host=document.querySelector('#gallery-viewer'), controls=document.querySelector('#appearance-controls');
const position={};for(let i=0;i<8;i++){const file='abcdefgh'[i];position[file+'1']='RNBQKBNR'[i];position[file+'2']='P';position[file+'7']='p';position[file+'8']='rnbqkbnr'[i]}
delete position.e2;position.e4='P';delete position.e7;position.e5='p';delete position.g1;position.f3='N';
let preview=0,lastMove=['g1','f3'];
let selectedSquare=null,current={kind:'main',ply:0};
const qualities=DEFAULT_QUALITY_DEFINITIONS.map(q=>({cursor:{kind:'main',ply:DEFAULT_QUALITY_DEFINITIONS.indexOf(q)+1},label:q.label,classification:q.name,iconId:q.name,iconLabel:q.label}));
const strip=()=>({main:[{cursor:{kind:'main',ply:0},label:'Icon samples'},...qualities],current,selectedLine:[{kind:'main',ply:0},...qualities.map(q=>q.cursor)],label:'Classification icon artwork samples'});
const state=()=>({position,positionKey:`gallery-${preview}`,orientation:controls.elements.orientation.value,selectedSquare,permissions:{select:true,move:false,draggable:false},legalMoves:[],lastMove});
const viewer=mountBoardViewer(host,{board:{appearance:catalogue,state:state(),onSelect(square){selectedSquare=square;viewer.updateBoard(state())},onMove(){}},moveStrip:{view:strip(),figurines:false,onNavigate(cursor){current=cursor;viewer.updateStrip(strip())}},slots:{board:host.querySelector('[data-board]'),moveStrip:host.querySelector('[data-strip]')}});
function update(){
  const f=controls.elements,appearance={pieceSet:f.pieces.value,iconSet:f.icons.value,squareTheme:f.theme.value,coordinates:{visible:f.coordinates.checked,size:Number(f.size.value)},animation:{durationMs:Number(f.animation.value)}};
  viewer.updateAppearance(appearance);viewer.updateBoard(state());
  viewer.updateBoardOverlays('gallery',{arrows:f.arrows.checked?[{from:'g1',to:'f3',label:'Arrow geometry sample',style:f.arrow.value,color:f.color.value,opacity:.85},{from:'d2',to:'d4',label:'Vertical arrow sample',style:f.arrow.value,color:f.color.value,opacity:.65}]:[],badges:[{square:'f3',icon:'best',label:'Best icon sample'},{square:'e4',icon:f.icons.value==='diamond-marks'?'bookmark':'book',label:f.icons.value==='diamond-marks'?'Host-defined saved idea':'Book icon sample'}]});
  document.querySelector('#coordinate-size').textContent=`${f.size.value}px`;document.querySelector('#animation-duration').textContent=`${f.animation.value}ms`;
  document.querySelector('#runtime-code').textContent=`viewer.updateAppearance(${JSON.stringify(appearance,null,2)});\n\nviewer.updateBoardOverlays('gallery', {\n  arrows: [{ from: 'g1', to: 'f3',\n    style: '${f.arrow.value}', color: '${f.color.value}' }]\n});`;
}
document.querySelector('#replay').addEventListener('click',()=>{
  const from=position.f3?'f3':'g1',to=from==='f3'?'g1':'f3';
  delete position[from];position[to]='N';lastMove=[from,to];preview++;viewer.updateBoard(state());
});
controls.addEventListener('submit',event=>event.preventDefault());
controls.addEventListener('input',update);controls.addEventListener('change',update);update();
window.addEventListener('pagehide',event=>{if(!event.persisted)viewer.dispose()});

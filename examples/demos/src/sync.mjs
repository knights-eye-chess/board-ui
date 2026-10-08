import {mountBoardViewer} from '@knights-eye-chess/board-ui/viewer';
import {mountMoveStrip} from '@knights-eye-chess/board-ui/move-strip';
import {DemoGame,SCENARIOS} from './model.mjs';
import {demoAppearance} from './appearance.mjs';

let game=new DemoGame(), events=[], sharedStrip;
const catalogue=demoAppearance(), viewers=[], dragging=new Set();
const configs=[
  {id:'white',name:'White view',orientation:'white',theme:'classic'},
  {id:'black',name:'Black view',orientation:'black',theme:'midnight'},
  {id:'mini',name:'Miniature',orientation:'white',theme:'mint',pieces:'outlined-silhouette'},
];
const status=document.querySelector('#status'), inspector=document.querySelector('#events'), snapshot=document.querySelector('#snapshot');
function record(source,event,details) {
  events.unshift({source,event,...details});events=events.slice(0,12);
  inspector.textContent=events.map(e=>JSON.stringify(e)).join('\n');
}
function render(source=-1,intentId) {
  viewers.forEach((view,i)=>view.updateBoard(game.board(configs[i].orientation,i===source?intentId:undefined)));
  sharedStrip.update(game.strip());
  viewers[0].updateNavigationControls({previousDisabled:game.current===game.root,nextDisabled:!game.current.children.length});
  const data=game.summary();status.textContent=data.status;
  document.querySelector('#position-count').textContent=`${data.positions} positions · ${data.branches} variations`;
  document.querySelector('#current-move').textContent=data.move;snapshot.textContent=JSON.stringify(data,null,2);
}
function command(source,command) {
  if(game.command(command)){record(source,'command',{command});render()}
}
function dragState(i,active) {
  if(active)dragging.add(i);else dragging.delete(i);
  sharedStrip.setGestureBlocked(dragging.size>0);
}
configs.forEach((config,i)=>{
  const host=document.querySelector(`#${config.id}-viewer`);
  viewers.push(mountBoardViewer(host,{
    board:{
      appearance:catalogue,
      appearanceSelection:{squareTheme:config.theme,pieceSet:config.pieces||'glossy',coordinates:{visible:true,size:i===2?9:12},animation:{durationMs:200}},
      state:game.board(config.orientation),
      onSelect(square){game.select(square);record(config.name,'onSelect',{square});render()},
      onMove(intent){const accepted=game.play(intent.uci);record(config.name,'onMove',{uci:intent.uci,accepted});if(accepted)render(i,intent.intentId)},
      onDragStart(){dragState(i,true)},
      onDragCommit(){dragState(i,false)},
      onDragCancel(){dragState(i,false)},
    },
    moveStrip:false,
    slots:{board:host.querySelector('[data-board]'),...(i===0?{previous:document.querySelector('#shared-prev'),next:document.querySelector('#shared-next')}:{})},
    keymap:{ArrowLeft:'previous',ArrowRight:'next',Home:'start',End:'end'},
    onNavigationCommand(id){command(config.name,id)},
  }));
});
sharedStrip=mountMoveStrip(document.querySelector('#shared-strip'),{
  view:game.strip(),figurines:false,
  onNavigate(cursor,details){if(game.navigate(cursor)){record('Shared strip','onNavigate',{cursor,source:details.source});render()}},
  onCommand(id){command('Shared strip',id)},keymap:{Home:'start',End:'end'},
  onGestureStart(){viewers.forEach(view=>view.cancelBoardGesture())},
});
document.querySelector('#scenario').addEventListener('change',event=>{
  game=new DemoGame(SCENARIOS[event.target.value]);record('Host','reset',{scenario:event.target.value});render();sharedStrip.center();
});
document.querySelector('#reset').addEventListener('click',()=>{
  game=new DemoGame(SCENARIOS[document.querySelector('#scenario').value]);record('Host','reset',{});render();
});
document.querySelector('#start').addEventListener('click',()=>command('Host','start'));
document.querySelector('#end').addEventListener('click',()=>command('Host','end'));
render();
window.addEventListener('pagehide',event=>{if(!event.persisted){viewers.forEach(view=>view.dispose());sharedStrip.dispose()}});

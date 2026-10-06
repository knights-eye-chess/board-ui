import { boardSquares, boardSquareCenter, isBoardSquare, renderBoardSquares, type BoardOrientation, type Square } from './controlled-board-renderer.js';
export type { BoardOrientation, Square } from './controlled-board-renderer.js';
export type BoardPiece = 'P'|'R'|'N'|'B'|'Q'|'K'|'p'|'r'|'n'|'b'|'q'|'k';
export type PromotionPiece = 'q'|'r'|'b'|'n';
export interface BoardMoveIntent { from: Square; to: Square; promotion?: PromotionPiece; uci: string; source: 'click'|'drag'|'keyboard'; }
export interface BoardBadge { square: Square; label: string; text?: string; color?: string; background?: string; }
export interface BoardArrow { from: Square; to: Square; label: string; color?: string; opacity?: number; width?: number; }
export interface ControlledBoardState {
  position: Readonly<Partial<Record<Square, BoardPiece>>>;
  orientation: BoardOrientation;
  selectedSquare: Square | null;
  /** Opaque occurrence token: changing it cancels transient gestures even for identical placements. */
  positionKey?: string;
  permissions: { select: boolean; move: boolean; draggable?: boolean };
  /** Exact allowed UCI moves. Hosts generate and validate legality; this UI does not. */
  legalMoves: readonly string[];
  lastMove?: readonly Square[];
  badges?: readonly BoardBadge[];
  arrows?: readonly BoardArrow[];
  label?: string;
}
export interface ControlledBoardOptions {
  state: ControlledBoardState;
  /** Piece artwork is provided by the caller and rendered square with object-fit:contain. */
  pieceUrl(piece: BoardPiece): string;
  onSelect(square: Square | null): void;
  onMove(intent: BoardMoveIntent): void;
}
export interface ControlledBoard { update(state: ControlledBoardState): void; dispose(): void; }
const names: Record<string,string> = { p:'pawn', r:'rook', n:'knight', b:'bishop', q:'queen', k:'king' };
const css = `:host{display:block;width:100%;min-width:0}*{box-sizing:border-box}.board{position:relative;display:grid;grid-template-columns:repeat(8,1fr);width:100%;aspect-ratio:1;isolation:isolate;touch-action:none;user-select:none;overflow:hidden}.sq{position:relative;aspect-ratio:1;outline:0}.light{background:var(--board-light,#e9edcc)}.dark{background:var(--board-dark,#779556)}.sq.last{box-shadow:inset 0 0 0 100px #eacb4266}.sq.selected{box-shadow:inset 0 0 0 100px #ead34088}.sq:focus-visible{outline:3px solid var(--board-focus,#5634ad);outline-offset:-3px;z-index:2}.piece{position:absolute;inset:0;display:block;pointer-events:none}.piece img{width:100%;height:100%;object-fit:contain}.rank,.file{position:absolute;font:600 clamp(8px,2vw,12px) sans-serif;pointer-events:none;z-index:1}.rank{left:3px;top:2px}.file{right:3px;bottom:2px}.dark small{color:var(--board-light,#e9edcc)}.light small{color:var(--board-dark,#779556)}.target:after{content:'';position:absolute;inset:38%;border-radius:50%;background:#25341d55;pointer-events:none}.badge{position:absolute;right:0;top:0;max-width:100%;padding:2px 4px;border-radius:50%;font:700 12px sans-serif;z-index:5;pointer-events:none}.arrows{position:absolute;inset:0;width:100%;height:100%;z-index:4;pointer-events:none}.drag-ghost{position:absolute;width:12.5%;height:12.5%;z-index:8;pointer-events:none;opacity:.85}.promotion{position:absolute;inset:0;z-index:10;background:#0008;display:flex;align-items:center;justify-content:center}.promotion-panel{max-width:96%;background:var(--board-dialog,#fff);color:var(--board-dialog-text,#17221b);border-radius:8px;padding:8px;box-shadow:0 3px 15px #0005;font:14px sans-serif}.promotion-options{display:flex}.promotion button{font:inherit;cursor:pointer}.promotion-choice{width:min(17vw,64px);padding:3px;background:transparent;border:1px solid #77866f}.promotion-choice img{width:100%;aspect-ratio:1;object-fit:contain}.promotion-cancel{display:block;margin:6px auto 0}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(prefers-reduced-motion:reduce){*{animation:none;transition:none}}`;
function snapshot(value: ControlledBoardState): ControlledBoardState {
  if (!value || !['white','black'].includes(value.orientation) || !value.permissions || typeof value.permissions.select !== 'boolean' || typeof value.permissions.move !== 'boolean') throw new TypeError('Invalid controlled board state.');
  if (value.selectedSquare !== null && !isBoardSquare(value.selectedSquare)) throw new TypeError('Invalid selected square.');
  if (!value.position || Object.entries(value.position).some(([square,piece]) => !isBoardSquare(square) || !/^[prnbqkPRNBQK]$/.test(String(piece)))) throw new TypeError('Invalid board position.');
  if (!Array.isArray(value.legalMoves) || value.legalMoves.some(move => !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move) || move.slice(0,2) === move.slice(2,4))) throw new TypeError('Invalid allowed UCI move.');
  if (value.lastMove?.some(square => !isBoardSquare(square)) || value.badges?.some(badge => !isBoardSquare(badge.square) || typeof badge.label !== 'string') || value.arrows?.some(arrow => !isBoardSquare(arrow.from) || !isBoardSquare(arrow.to) || arrow.from === arrow.to || typeof arrow.label !== 'string')) throw new TypeError('Invalid board overlay.');
  return { ...value, position:{...value.position}, permissions:{...value.permissions}, legalMoves:[...value.legalMoves], lastMove:value.lastMove?.slice(), badges:value.badges?.map(badge=>({...badge})), arrows:value.arrows?.map(arrow=>({...arrow})) };
}
/** Mount an engine-free controlled board. Update is a complete detached state replacement. */
export function mountControlledBoard(host: HTMLElement, options: ControlledBoardOptions): ControlledBoard {
  let state = snapshot(options.state), disposed = false;
  if (typeof options.pieceUrl !== 'function' || typeof options.onSelect !== 'function' || typeof options.onMove !== 'function') throw new TypeError('Controlled board callbacks are required.');
  const document = host.ownerDocument, window = document.defaultView!;
  const owned = document.createElement('div'), shadow = owned.attachShadow({mode:'open'});
  const style = document.createElement('style'); style.textContent=css;
  const board = document.createElement('div'); board.className='board'; board.setAttribute('role','grid'); board.setAttribute('aria-rowcount','8'); board.setAttribute('aria-colcount','8');
  shadow.appendChild(style); shadow.appendChild(board); host.appendChild(owned);
  let focusSquare: Square = state.selectedSquare || 'a1';
  let promotion: { from: Square; to: Square; source: BoardMoveIntent['source']; choices: PromotionPiece[] } | null = null;
  let drag: { from: Square; pointer: number; x: number; y: number; active: boolean; ghost: HTMLElement | null } | null = null;
  let suppressClick = false;
  const listeners: Array<()=>void> = [];
  function listen(target: EventTarget, event: string, handler: EventListener) { target.addEventListener(event,handler); listeners.push(()=>target.removeEventListener(event,handler)); }
  function image(piece: BoardPiece) { const img = document.createElement('img'); img.src=options.pieceUrl(piece); img.alt=''; img.draggable=false; return img; }
  function cell(square: Square) { return board.querySelector<HTMLElement>(`.sq[data-square="${square}"]`); }
  function cancelDrag() { drag?.ghost?.remove(); drag=null; }
  function dismissPromotion(restore = true) { promotion=null; board.querySelector('.promotion')?.remove(); if (restore) cell(focusSquare)?.focus(); }
  function emit(from: Square, to: Square, source: BoardMoveIntent['source'], promotionPiece?: PromotionPiece) {
    const uci = from+to+(promotionPiece||'');
    if (!state.permissions.move || !state.legalMoves.includes(uci)) return;
    options.onMove({from,to,uci,source,...(promotionPiece?{promotion:promotionPiece}:{})});
  }
  function attempt(from: Square, to: Square, source: BoardMoveIntent['source']): boolean {
    const moves = state.legalMoves.filter(move=>move.slice(0,4)===from+to);
    if (!state.permissions.move || !moves.length) return false;
    const choices = (['q','r','b','n'] as const).filter(piece=>moves.includes(from+to+piece));
    if (choices.length) { promotion={from,to,source,choices}; showPromotion(); } else emit(from,to,source);
    return true;
  }
  function activate(square: Square, source: 'click'|'keyboard') {
    if (promotion) return;
    if (state.selectedSquare && attempt(state.selectedSquare,square,source)) return;
    if (state.permissions.select) options.onSelect(square===state.selectedSquare?null:square);
  }
  function showPromotion() {
    if (!promotion) return;
    const pending=promotion, veil=document.createElement('div'); veil.className='promotion';
    veil.setAttribute('role','dialog'); veil.setAttribute('aria-modal','true'); veil.setAttribute('aria-label','Choose promotion piece');
    const panel=document.createElement('div'); panel.className='promotion-panel';
    const label=document.createElement('div'); label.textContent='Choose promotion piece'; panel.appendChild(label);
    const choices=document.createElement('div'); choices.className='promotion-options';
    const mover=state.position[pending.from], white=mover===mover?.toUpperCase();
    pending.choices.forEach(piece=>{ const button=document.createElement('button'); button.type='button'; button.className='promotion-choice'; button.setAttribute('aria-label',`Promote to ${names[piece]}`); button.appendChild(image((white?piece.toUpperCase():piece) as BoardPiece)); button.onclick=()=>{dismissPromotion();emit(pending.from,pending.to,pending.source,piece);}; choices.appendChild(button); });
    const cancel=document.createElement('button'); cancel.type='button'; cancel.className='promotion-cancel'; cancel.textContent='Cancel'; cancel.onclick=()=>dismissPromotion();
    panel.appendChild(choices); panel.appendChild(cancel); veil.appendChild(panel); board.appendChild(veil);
    choices.querySelector('button')?.focus();
  }
  function render() {
    const focused = shadow.activeElement?.closest<HTMLElement>('[data-square]')?.dataset.square;
    board.setAttribute('aria-label',state.label||'Chess board'); board.setAttribute('aria-readonly',String(!state.permissions.move));
    renderBoardSquares(board,{orientation:state.orientation,decorate(square,name){
      const piece=state.position[name];
      if (state.lastMove?.includes(name)) square.classList.add('last');
      if (state.selectedSquare===name) square.classList.add('selected');
      if (state.permissions.move && state.selectedSquare && state.legalMoves.some(move=>move.slice(0,4)===state.selectedSquare!+name)) square.classList.add('target');
      square.setAttribute('role','gridcell'); square.setAttribute('aria-rowindex',String(Math.floor(boardSquares(state.orientation).indexOf(name)/8)+1)); square.setAttribute('aria-colindex',String(boardSquares(state.orientation).indexOf(name)%8+1)); square.tabIndex=name===focusSquare?0:-1;
      square.setAttribute('aria-selected',String(state.selectedSquare===name));
      square.setAttribute('aria-label',`${name}${piece?', '+(piece===piece.toUpperCase()?'White ':'Black ')+names[piece.toLowerCase()]:', empty'}`);
      if (piece) { const wrapper=document.createElement('span'); wrapper.className='piece'; wrapper.appendChild(image(piece)); square.appendChild(wrapper); }
      state.badges?.filter(badge=>badge.square===name).forEach(badge=>{ const node=document.createElement('span');node.className='badge';node.textContent=badge.text||'•';node.title=badge.label;node.setAttribute('role','img');node.setAttribute('aria-label',badge.label);if(badge.color)node.style.color=badge.color;if(badge.background)node.style.backgroundColor=badge.background;square.appendChild(node); });
    }});
    const squares=Array.from(board.children);
    for(let row=0;row<8;row++){const node=document.createElement('div');node.setAttribute('role','row');node.style.display='contents';squares.slice(row*8,row*8+8).forEach(square=>node.appendChild(square));board.appendChild(node);}
    if(drag?.ghost)board.appendChild(drag.ghost);
    if (state.arrows?.length) {
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.classList.add('arrows'); svg.setAttribute('viewBox','0 0 100 100'); svg.setAttribute('role','img'); svg.setAttribute('aria-label',state.arrows.map(arrow=>arrow.label).join('; '));
      state.arrows.forEach(arrow=>{ const from=boardSquareCenter(arrow.from,state.orientation),to=boardSquareCenter(arrow.to,state.orientation),angle=Math.atan2(to.y-from.y,to.x-from.x),head=4,width=Math.max(.2,Math.min(4,arrow.width||1.5));const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d',`M ${from.x} ${from.y} L ${to.x} ${to.y} M ${to.x-head*Math.cos(angle-.6)} ${to.y-head*Math.sin(angle-.6)} L ${to.x} ${to.y} L ${to.x-head*Math.cos(angle+.6)} ${to.y-head*Math.sin(angle+.6)}`);line.setAttribute('fill','none');line.setAttribute('stroke',arrow.color||'#7252a0');line.setAttribute('stroke-width',String(width));line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');line.setAttribute('opacity',String(Math.max(0,Math.min(1,arrow.opacity??.7))));const title=document.createElementNS(svg.namespaceURI,'title');title.textContent=arrow.label;line.appendChild(title);svg.appendChild(line); }); board.appendChild(svg);
    }
    if (promotion) showPromotion(); else if (focused && isBoardSquare(focused)) cell(focused)?.focus();
  }
  function eventSquare(event: Event): Square | null { const target=(event.target as Element).closest?.('[data-square]') as HTMLElement|null; return target && isBoardSquare(target.dataset.square) ? target.dataset.square : null; }
  listen(board,'click',event=>{if(suppressClick){suppressClick=false;return;}const square=eventSquare(event);if(square){focusSquare=square;activate(square,'click');}});
  listen(board,'focusin',event=>{const square=eventSquare(event);if(square){focusSquare=square;board.querySelectorAll<HTMLElement>('.sq').forEach(node=>node.tabIndex=node.dataset.square===square?0:-1);}});
  listen(board,'keydown',event=>{
    const key=event as KeyboardEvent;
    if (promotion) {
      if (key.key==='Escape') { key.preventDefault();dismissPromotion(); }
      if (key.key==='Tab') { const buttons=Array.from(board.querySelectorAll<HTMLButtonElement>('.promotion button'));const at=buttons.indexOf(shadow.activeElement as HTMLButtonElement);key.preventDefault();buttons[(at+(key.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus(); }
      return;
    }
    if(key.key==='Escape'){cancelDrag();if(state.permissions.select)options.onSelect(null);return;}
    const square=eventSquare(event);if(!square)return;
    if(key.key==='Enter'||key.key===' '){key.preventDefault();activate(square,'keyboard');return;}
    const sequence=boardSquares(state.orientation),at=sequence.indexOf(square),delta: Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};
    let next=at;
    if(key.key in delta) { next=Math.max(0,Math.min(63,at+delta[key.key])); if((key.key==='ArrowLeft'||key.key==='ArrowRight')&&Math.floor(next/8)!==Math.floor(at/8))next=at; }else if(key.key==='Home')next=Math.floor(at/8)*8;else if(key.key==='End')next=Math.floor(at/8)*8+7;else return;
    key.preventDefault();cell(sequence[next])?.focus();
  });
  listen(board,'pointerdown',event=>{
    const pointer=event as PointerEvent,square=eventSquare(event);
    suppressClick=false;
    if(promotion||drag||pointer.button!==0||!square||!state.position[square]||!state.permissions.move||state.permissions.draggable===false||!state.legalMoves.some(move=>move.slice(0,2)===square))return;
    suppressClick=false;drag={from:square,pointer:pointer.pointerId,x:pointer.clientX,y:pointer.clientY,active:false,ghost:null};
  });
  listen(window,'pointermove',event=>{
    const pointer=event as PointerEvent;if(!drag||pointer.pointerId!==drag.pointer)return;
    if(!drag.active&&Math.hypot(pointer.clientX-drag.x,pointer.clientY-drag.y)<6)return;
    pointer.preventDefault();drag.active=true;
    if(!drag.ghost){drag.ghost=document.createElement('span');drag.ghost.className='drag-ghost';drag.ghost.appendChild(image(state.position[drag.from]!));board.appendChild(drag.ghost);}
    const rect=board.getBoundingClientRect();drag.ghost.style.left=`${pointer.clientX-rect.left-rect.width/16}px`;drag.ghost.style.top=`${pointer.clientY-rect.top-rect.height/16}px`;
  });
  listen(window,'pointerup',event=>{
    const pointer=event as PointerEvent;if(!drag||pointer.pointerId!==drag.pointer)return;
    const pending=drag,rect=board.getBoundingClientRect();cancelDrag();if(!pending.active)return;
    suppressClick=true;
    const column=Math.floor((pointer.clientX-rect.left)/rect.width*8),row=Math.floor((pointer.clientY-rect.top)/rect.height*8);
    if(column>=0&&column<8&&row>=0&&row<8)attempt(pending.from,boardSquares(state.orientation)[row*8+column],'drag');
  });
  listen(window,'pointercancel',event=>{if(drag?.pointer===(event as PointerEvent).pointerId)cancelDrag();});
  listen(window,'blur',()=>cancelDrag());
  try { render(); } catch(error) { listeners.forEach(remove=>remove());owned.remove();throw error; }
  return {
    update(next) {
      if(disposed)throw new Error('Controlled board is disposed.');
      const replacement=snapshot(next);
      const contextChanged=JSON.stringify([state.position,state.positionKey,state.orientation,state.permissions,state.legalMoves,state.selectedSquare])!==JSON.stringify([replacement.position,replacement.positionKey,replacement.orientation,replacement.permissions,replacement.legalMoves,replacement.selectedSquare]);
      state=replacement;if(contextChanged){cancelDrag();dismissPromotion(false);suppressClick=false;}render();
    },
    dispose(){if(disposed)return;disposed=true;cancelDrag();promotion=null;listeners.forEach(remove=>remove());owned.remove();},
  };
}

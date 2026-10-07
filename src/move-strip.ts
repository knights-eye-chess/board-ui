/** A request identity supplied by the host. The strip never interprets a game tree. */
export type MoveStripCursor = { kind: 'main'; ply: number } | { kind: 'branch'; branchId: string; index: number };
export interface MoveStripItem {
  cursor: MoveStripCursor;
  label: string;
  number?: string;
  /** Prefix used when copying a move, even when `number` is hidden. */
  copyPrefix?: string;
  classification?: string;
  comment?: string;
  annotation?: string;
  /** Optional host color for the move text. */
  color?: string;
  /** Optional image for the starting-position item. */
  startIconUrl?: string;
  /** Presentation identifier resolved by the host's appearance catalogue. */
  iconId?: string;
  iconLabel?: string;
}
export interface MoveStripBranch {
  id: string;
  parentId?: string;
  /** Cursor whose horizontal center anchors this branch's first move. */
  anchor: MoveStripCursor;
  moves: readonly MoveStripItem[];
}
export interface MoveStripView {
  main: readonly MoveStripItem[];
  branches?: readonly MoveStripBranch[];
  /** The ordered canonical path through main prefix, ancestors and active branch. */
  selectedLine: readonly MoveStripCursor[];
  current: MoveStripCursor;
  label?: string;
}
export interface MoveStripAppearance {
  resolveIcon?: (id: string) => { src: string; width?: number; height?: number } | null;
}
export interface MoveStripOptions {
  view: MoveStripView;
  onNavigate(cursor: MoveStripCursor, details: {source: 'click'|'scroll'|'keyboard'}): void;
  appearance?: MoveStripAppearance;
  /** Optional app commands; only invoked by focused strip keyboard input. */
  onCommand?: (command: 'a'|'b'|'l') => void;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
  onUserScroll?: () => void;
  onSettled?: () => void;
}
export interface MoveStrip {
  update(view: MoveStripView): void;
  /** Patch late presentation data without replacing buttons or changing scroll position. */
  updateMove(cursor: MoveStripCursor, patch: Partial<Pick<MoveStripItem,'classification'|'iconId'|'iconLabel'|'comment'|'color'>>): void;
  updateAppearance(appearance: MoveStripAppearance): void;
  setGestureBlocked(blocked: boolean): void;
  center(): void;
  getInteractionState(): {pointerActive:boolean;userGesture:boolean;userPositioned:boolean};
  getBranchRows(): Record<string,number>;
  getCurrentBounds(): {key:string;rect:DOMRect} | null;
  subscribe(listener:()=>void): ()=>void;
  relayout(): void;
  dispose(): void;
}

const css = `:host{display:block;min-width:0;width:100%;--strip-surface:#f4f0e6}*{box-sizing:border-box}.shell{position:relative}.viewport{position:relative;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;background:var(--move-strip-surface,var(--card,var(--strip-surface)));border:var(--move-strip-border,1px solid var(--line,#d7d3c9));border-radius:8px;padding:1px 4px;scrollbar-width:none;touch-action:pan-x;min-height:38px}.viewport::-webkit-scrollbar{display:none}.content{position:relative;min-height:36px;overflow:hidden}.overlay{position:absolute;inset:0;overflow:hidden;pointer-events:none}.row{display:flex;align-items:center;gap:3px;position:absolute;left:0;top:0;min-height:36px;white-space:nowrap}.row.main{width:100%;overflow:hidden}.row.branch{width:max-content;border:1px solid var(--line,#d7d3c9);border-radius:7px;background:color-mix(in srgb,var(--secondary,#e6eee8),transparent 18%);pointer-events:auto;touch-action:none}button{display:inline-flex;align-items:center;justify-content:center;gap:4px;flex:none;min-height:28px;border:0;border-radius:5px;padding:5px 7px;background:transparent;color:var(--move-quality-text,var(--move-quality,var(--muted,#68746e)));font:800 13px/1 var(--font-ui,Arial,sans-serif);cursor:pointer;white-space:nowrap;touch-action:pan-x;-webkit-user-select:text;user-select:text}.branch button{touch-action:none;font-size:12px;padding:4px 6px}button:hover{background:var(--move-strip-hover,var(--secondary,#e6eee8))}button.current{background:var(--played,#dce9df)}button:focus-visible{outline:2px solid var(--move-strip-focus,#2c165b);outline-offset:2px}.number{opacity:.72;font-weight:500;margin-right:3px}.number,.san{font-family:var(--move-font,var(--font-ui,Arial,sans-serif));font-feature-settings:"ss01" 0}.icon-slot{display:inline-flex;flex:0 0 14px;width:14px;height:15px;align-items:center;justify-content:center}.icon{display:block;width:100%;height:100%;object-fit:contain}.annotation{color:var(--green,#1f6044);font-size:.8em;margin-left:2px}.start-icon{width:20px;height:20px;object-fit:contain}.branch:has(button.current){border-color:var(--green,#1f6044);box-shadow:inset 3px 0 0 var(--green,#1f6044)}@media(min-width:741px){button,.branch button{font-size:15px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}`;

function key(cursor: MoveStripCursor): string {
  return cursor.kind === 'main' ? `m:${cursor.ply}` : `b:${cursor.branchId}:${cursor.index}`;
}
function copyCursor(cursor: MoveStripCursor): MoveStripCursor { return {...cursor}; }
function validCursor(cursor: MoveStripCursor): boolean {
  return !!cursor && (cursor.kind === 'main' && Number.isSafeInteger(cursor.ply) && cursor.ply >= 0 || cursor.kind === 'branch' && typeof cursor.branchId === 'string' && !!cursor.branchId && Number.isSafeInteger(cursor.index) && cursor.index >= 0);
}
function snapshot(view: MoveStripView): MoveStripView {
  if (!view || !Array.isArray(view.main) || !Array.isArray(view.selectedLine) || !validCursor(view.current) || view.branches && !Array.isArray(view.branches)) throw new TypeError('Invalid move strip view.');
  const seen = new Set<string>();
  function item(value: MoveStripItem): MoveStripItem {
    if (!value || !validCursor(value.cursor) || typeof value.label !== 'string') throw new TypeError('Invalid move strip item.');
    const identity=key(value.cursor); if(seen.has(identity))throw new TypeError(`Duplicate move strip cursor: ${identity}`);seen.add(identity);
    return {...value,cursor:copyCursor(value.cursor)};
  }
  const branchIds=new Set<string>();
  const main=view.main.map(item),branches=(view.branches||[]).map(branch=>{
    if(!branch || typeof branch.id!=='string' || !branch.id || !validCursor(branch.anchor) || !Array.isArray(branch.moves))throw new TypeError('Invalid move strip branch.');
    if(branchIds.has(branch.id))throw new TypeError(`Duplicate move strip branch: ${branch.id}`);branchIds.add(branch.id);
    return {...branch,anchor:copyCursor(branch.anchor),moves:branch.moves.map(item)};
  });
  if(!seen.has(key(view.current)) || view.selectedLine.some(cursor=>!validCursor(cursor)||!seen.has(key(cursor))))throw new TypeError('Move strip selection must refer to displayed moves.');
  if(new Set(view.selectedLine.map(key)).size!==view.selectedLine.length)throw new TypeError('Duplicate selected-line cursor.');
  if(branches.some(branch=>!seen.has(key(branch.anchor))))throw new TypeError('Move strip branch anchor is missing.');
  return {main,branches,selectedLine:view.selectedLine.map(copyCursor),current:copyCursor(view.current),label:view.label};
}

/** Mount a controlled view of move labels. Navigation remains authoritative in the host. */
export function mountMoveStrip(host: HTMLElement, options: MoveStripOptions): MoveStrip {
  if(!host || typeof options?.onNavigate!=='function')throw new TypeError('Move strip host and onNavigate are required.');
  let view=snapshot(options.view),appearance=options.appearance||{},disposed=false,blocked=false,pending=false;
  const doc=host.ownerDocument, win=doc.defaultView!;
  const originalHostStyle=host.getAttribute('style');host.style.display='block';host.style.padding='0';host.style.border='0';host.style.overflow='visible';
  const restoreHost=()=>{if(originalHostStyle===null)host.removeAttribute('style');else host.setAttribute('style',originalHostStyle);};
  const owned=doc.createElement('div'),shadow=owned.attachShadow({mode:'open'}),style=doc.createElement('style');style.textContent=css;
  const shell=doc.createElement('div'),viewport=doc.createElement('div'),content=doc.createElement('div'),overlay=doc.createElement('div');shell.className='shell';viewport.className='viewport';content.className='content';overlay.className='overlay';viewport.setAttribute('role','region');viewport.setAttribute('aria-label',view.label||'Moves');viewport.append(content);shell.append(viewport,overlay);shadow.append(style,shell);host.append(owned);
  const buttons=new Map<string,HTMLButtonElement>();
  const listeners:Array<()=>void>=[];
  const subscribers=new Set<()=>void>();
  function notifyLayout(){for(const listener of subscribers)listener();}
  function listen(target:EventTarget,name:string,handler:EventListener,opts?:AddEventListenerOptions){target.addEventListener(name,handler,opts);listeners.push(()=>target.removeEventListener(name,handler,opts));}
  let pointerId:number|null=null,pointerStart=0,pointerMoved=false,overlayDragX:number|null=null,suppressClick=false,userGesture=false,userPositioned=false,scrollFrame=0,settleTimer=0,programmaticUntil=0,scrollCallback=false,lastRequested='',renderPending=false;
  const branchRows:Record<string,number>={},branchLanes:HTMLElement[]=[];
  function positionBranches(){for(const lane of branchLanes)lane.style.transform=`translateX(${-viewport.scrollLeft}px)`;}
  function clearTimer(){win.clearTimeout(settleTimer);settleTimer=0;}
  function centerOf(button:HTMLElement){const r=button.getBoundingClientRect();return r.left+r.width/2;}
  function selectedButtons(){return view.selectedLine.map(cursor=>buttons.get(key(cursor))).filter((button):button is HTMLButtonElement=>!!button);}
  function viewportWidth(){return viewport.clientWidth;}
  function nativeEnd(){const line=selectedButtons(),last=line[line.length-1];if(!last)return viewportWidth();const outer=viewport.getBoundingClientRect(),end=last.getBoundingClientRect(),style=win.getComputedStyle(viewport),extra=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+viewport.offsetWidth-viewport.clientWidth;return Math.max(viewportWidth(),Math.ceil(end.left+end.width/2-outer.left+viewport.scrollLeft+viewportWidth()/2-extra));}
  /** Clamp against the existing range before shrinking it, avoiding a late rewind. */
  function lockRange(){const width=nativeEnd(),max=Math.max(0,width-viewportWidth());if(viewport.scrollLeft>max)viewport.scrollLeft=max;content.style.width=`${width}px`;}
  function showCurrent(){for(const [identity,button] of buttons){const current=identity===key(view.current);button.classList.toggle('current',current);if(current)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');}}
  function centerCurrent(){const button=buttons.get(key(view.current));if(!button)return;lockRange();const outer=viewport.getBoundingClientRect();programmaticUntil=Date.now()+240;viewport.scrollLeft=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,viewport.scrollLeft+centerOf(button)-(outer.left+outer.width/2)));positionBranches();}
  function request(cursor:MoveStripCursor,source:'click'|'scroll'|'keyboard'){
    const identity=key(cursor);if(source==='scroll'&&(identity===key(view.current)||identity===lastRequested))return;
    lastRequested=identity;scrollCallback=source==='scroll';try{options.onNavigate(copyCursor(cursor),{source});}finally{scrollCallback=false;}
  }
  function resolveCenter(){const line=selectedButtons();if(!line.length)return;const outer=viewport.getBoundingClientRect(),middle=outer.left+outer.width/2,first=centerOf(line[0]);if(middle<first-1){if(viewport.scrollLeft>0)viewport.scrollLeft=Math.max(0,viewport.scrollLeft-(first-middle));return;}let best=line[0],distance=Infinity;for(const button of line){const next=Math.abs(centerOf(button)-middle);if(next<distance){best=button;distance=next;}}const cursor=view.selectedLine[line.indexOf(best)];if(cursor)request(cursor,'scroll');}
  function beginGesture(){lockRange();if(!userGesture){pointerStart=viewport.scrollLeft;pointerMoved=false;options.onGestureStart?.();}userGesture=true;programmaticUntil=0;clearTimer();}
  function settle(){clearTimer();settleTimer=win.setTimeout(()=>{settleTimer=0;if(pointerId!==null){settle();return;}if(userGesture)resolveCenter();userGesture=false;lastRequested='';if(renderPending&&!blocked){renderPending=false;render(false);}options.onSettled?.();},180);}
  function fillButton(button:HTMLButtonElement,item:MoveStripItem){const wasCurrent=button.classList.contains('current');button.replaceChildren();button.className=wasCurrent?'current':'';button.removeAttribute('style');button.dataset.cursor=key(item.cursor);button.dataset.copySan=`${(item.copyPrefix||item.number||'').replace(/…/g,'...')}${item.label}`.trim();button.setAttribute('aria-label',`${item.number?item.number+' ':''}${item.label}${item.annotation?', '+item.annotation:''}${item.iconLabel?', '+item.iconLabel:''}`);if(item.comment)button.title=item.comment;else button.removeAttribute('title');
    if(item.startIconUrl){const start=doc.createElement('img');start.className='start-icon';start.src=item.startIconUrl;start.alt='';start.setAttribute('aria-hidden','true');button.append(start);}else{
      if(item.number){const number=doc.createElement('span');number.className='number';number.textContent=item.number;button.append(number);}
      const label=doc.createElement('span');label.className='san';label.setAttribute('aria-hidden','true');label.textContent=item.label.replace(/[KQRBNP]/g,letter=>({K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'} as Record<string,string>)[letter]);button.append(label);
      if(item.annotation){const note=doc.createElement('small');note.className='annotation';note.textContent=item.annotation;button.append(note);}
    }
    const slot=doc.createElement('span');slot.className='icon-slot';slot.setAttribute('aria-hidden','true');button.append(slot);setPresentation(button,item);
  }
  function setPresentation(button:HTMLButtonElement,item:MoveStripItem){const old=button.dataset.classification;if(old)button.classList.remove(old);button.style.removeProperty('--move-quality');button.style.removeProperty('color');
    if(item.classification&&/^[a-z][a-z0-9-]*$/.test(item.classification)){button.classList.add(item.classification);button.dataset.classification=item.classification;button.style.setProperty('--move-quality',`var(--quality-${item.classification})`);}else delete button.dataset.classification;
    if(item.color)button.style.color=item.color;
    button.setAttribute('aria-label',`${item.number?item.number+' ':''}${item.label}${item.annotation?', '+item.annotation:''}${item.iconLabel?', '+item.iconLabel:''}`);if(item.comment)button.title=item.comment;else button.removeAttribute('title');
    const slot=button.querySelector<HTMLElement>('.icon-slot');if(slot){slot.replaceChildren();if(item.iconId){const icon=appearance.resolveIcon?.(item.iconId);if(icon){const image=doc.createElement('img');image.className='icon';image.src=icon.src;image.alt='';if(icon.width)image.width=icon.width;if(icon.height)image.height=icon.height;slot.append(image);}}}
  }
  function makeButton(item:MoveStripItem){const button=doc.createElement('button');button.type='button';fillButton(button,item);
    button.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}userGesture=false;clearTimer();request(item.cursor,'click');});buttons.set(key(item.cursor),button);return button;}
  function render(preserveScroll:boolean){if(disposed)return;if(blocked||userGesture||pointerId!==null){renderPending=true;return;}const oldScroll=viewport.scrollLeft,focused=(shadow.activeElement as HTMLElement|null)?.dataset.cursor;buttons.clear();content.replaceChildren();viewport.setAttribute('aria-label',view.label||'Moves');
    const main=doc.createElement('div');main.className='row main';content.append(main);overlay.replaceChildren();branchLanes.length=0;for(const item of view.main)main.append(makeButton(item));
    const first=main.querySelector('button'),last=main.querySelector('button:last-child');const half=viewportWidth()/2,viewportStyle=win.getComputedStyle(viewport),leftInset=parseFloat(viewportStyle.paddingLeft)||0,rightInset=parseFloat(viewportStyle.paddingRight)||0;if(first)main.style.paddingLeft=`${Math.max(0,half-first.getBoundingClientRect().width/2-leftInset)}px`;if(last)main.style.paddingRight=`${Math.max(0,half-last.getBoundingClientRect().width/2-rightInset)}px`;
    const branches=view.branches||[],ordered:MoveStripBranch[]=[],visited=new Set<string>();let row=1;for(const id of Object.keys(branchRows))delete branchRows[id];
    function appendBranch(branch:MoveStripBranch){if(visited.has(branch.id))return;visited.add(branch.id);ordered.push(branch);for(const child of branches)if(child.parentId===branch.id)appendBranch(child);}
    for(const branch of branches)if(!branch.parentId||!branches.some(candidate=>candidate.id===branch.parentId))appendBranch(branch);for(const branch of branches)appendBranch(branch);
    const rows=new Map<string,number>();for(const branch of ordered){const lane=doc.createElement('div');lane.className='row branch';lane.dataset.branchId=branch.id;const parentRow=branch.parentId?rows.get(branch.parentId)||0:0;row=Math.max(row,parentRow+1);rows.set(branch.id,row);lane.style.top=`${row*42}px`;lane.style.transform=`translateX(${-viewport.scrollLeft}px)`;for(const item of branch.moves)lane.append(makeButton(item));overlay.append(lane);const anchor=buttons.get(key(branch.anchor)),firstBranch=lane.querySelector('button');if(anchor&&firstBranch){const origin=viewport.getBoundingClientRect().left;lane.style.left=`${Math.max(0,centerOf(anchor)-origin+viewport.scrollLeft-firstBranch.getBoundingClientRect().width/2)}px`;}branchRows[branch.id]=lane.getBoundingClientRect().top;branchLanes.push(lane);row++;}
    content.style.height=`${Math.max(36,row===1?36:row*42)}px`;showCurrent();lockRange();if(preserveScroll)viewport.scrollLeft=Math.min(oldScroll,Math.max(0,viewport.scrollWidth-viewport.clientWidth));else centerCurrent();positionBranches();if(focused)buttons.get(focused)?.focus({preventScroll:true});notifyLayout();}
  function items(value:MoveStripView){return [...value.main,...(value.branches||[]).flatMap(branch=>branch.moves)];}
  function sameStructure(a:MoveStripView,b:MoveStripView){return a.main.map(item=>key(item.cursor)).join('|')===b.main.map(item=>key(item.cursor)).join('|')&&JSON.stringify(a.branches?.map(branch=>[branch.id,branch.parentId,key(branch.anchor),branch.moves.map(item=>key(item.cursor))]))===JSON.stringify(b.branches?.map(branch=>[branch.id,branch.parentId,key(branch.anchor),branch.moves.map(item=>key(item.cursor))]));}
  function sameText(a:MoveStripItem,b:MoveStripItem){return a.label===b.label&&a.number===b.number&&a.copyPrefix===b.copyPrefix&&a.annotation===b.annotation&&a.startIconUrl===b.startIconUrl;}
  listen(shell,'pointerdown',(event)=>{const pointer=event as PointerEvent;if(pointer.button!==0)return;suppressClick=false;pointerId=pointer.pointerId;pointerStart=viewport.scrollLeft;pointerMoved=false;overlayDragX=overlay.contains(event.target as Node)?pointer.clientX:null;beginGesture();},{passive:true});
  listen(win,'pointermove',(event)=>{const pointer=event as PointerEvent;if(pointerId!==pointer.pointerId||overlayDragX===null)return;const delta=pointer.clientX-overlayDragX;overlayDragX=pointer.clientX;if(delta){pointer.preventDefault();viewport.scrollLeft-=delta;pointerMoved=true;}},{passive:false});
  listen(win,'pointerup',(event)=>{if(pointerId!==(event as PointerEvent).pointerId)return;pointerMoved ||= Math.abs(viewport.scrollLeft-pointerStart)>.5;suppressClick=pointerMoved;if(suppressClick)win.setTimeout(()=>{suppressClick=false;},0);pointerId=null;overlayDragX=null;options.onGestureEnd?.();settle();},{passive:true});
  listen(win,'pointercancel',(event)=>{if(pointerId!==(event as PointerEvent).pointerId)return;pointerId=null;overlayDragX=null;options.onGestureEnd?.();settle();},{passive:true});
  listen(viewport,'wheel',()=>{beginGesture();settle();},{passive:true});
  listen(viewport,'scroll',()=>{positionBranches();if(Date.now()<programmaticUntil&&!userGesture)return;if(!userGesture||Math.abs(viewport.scrollLeft-pointerStart)<=.5&&!pointerMoved)return;pointerMoved=true;userPositioned=true;options.onUserScroll?.();if(scrollFrame)return;scrollFrame=win.requestAnimationFrame(()=>{scrollFrame=0;if(userGesture)resolveCenter();});settle();},{passive:true});
  listen(shell,'keydown',(event)=>{const keyboard=event as KeyboardEvent,target=event.target as HTMLElement;if(!target.closest('button'))return;if(keyboard.altKey||keyboard.ctrlKey||keyboard.metaKey)return;
    if(options.onCommand&&['a','b','l'].includes(keyboard.key.toLowerCase())){keyboard.preventDefault();options.onCommand(keyboard.key.toLowerCase() as 'a'|'b'|'l');return;}
    const line=selectedButtons(),at=line.indexOf(target as HTMLButtonElement);if(at<0)return;let next=at;if(keyboard.key==='ArrowLeft')next=Math.max(0,at-1);else if(keyboard.key==='ArrowRight')next=Math.min(line.length-1,at+1);else if(keyboard.key==='Home')next=0;else if(keyboard.key==='End')next=line.length-1;else if(keyboard.key==='Enter'||keyboard.key===' '){keyboard.preventDefault();request(view.selectedLine[at],'keyboard');return;}else return;keyboard.preventDefault();line[next]?.focus();},{passive:false});
  listen(shadow,'copy',(event)=>{const copy=event as ClipboardEvent,selection=win.getSelection();if(!copy.clipboardData||!selection||selection.isCollapsed||!selection.rangeCount)return;const range=selection.getRangeAt(0),buttonFor=(node:Node)=>((node.nodeType===1?node:node.parentElement) as Element|null)?.closest?.('button[data-copy-san]'),start=buttonFor(range.startContainer),end=buttonFor(range.endContainer);if(start&&start===end&&shadow.contains(start)){copy.clipboardData.setData('text/plain',(start as HTMLElement).dataset.copySan||'');copy.preventDefault();}},{passive:false});
  try{render(false);}catch(error){listeners.forEach(remove=>remove());owned.remove();restoreHost();throw error;}
  let observedWidth=viewport.clientWidth;const resizeObserver=typeof win.ResizeObserver==='function'?new win.ResizeObserver(()=>{const width=viewport.clientWidth;if(width===observedWidth)return;observedWidth=width;render(true);}):null;resizeObserver?.observe(viewport);
  return {
    update(next){if(disposed)throw new Error('Move strip is disposed.');const replacement=snapshot(next),changed=key(replacement.current)!==key(view.current),reuse=sameStructure(view,replacement),oldItems=new Map(items(view).map(item=>[key(item.cursor),item]));view=replacement;viewport.setAttribute('aria-label',view.label||'Moves');
      if(reuse){for(const item of items(view)){const button=buttons.get(key(item.cursor)),old=oldItems.get(key(item.cursor));if(button&&old&&JSON.stringify(old)!==JSON.stringify(item)){if(sameText(old,item))setPresentation(button,item);else fillButton(button,item);}}showCurrent();lockRange();if(!scrollCallback&&!blocked&&!userGesture&&pointerId===null&&changed){lastRequested='';centerCurrent();}if(changed)notifyLayout();return;}
      showCurrent();if(scrollCallback){lockRange();renderPending=true;return;}if(blocked||userGesture||pointerId!==null){renderPending=true;return;}if(changed)lastRequested='';render(!changed);
    },
    updateMove(cursor,patch){if(disposed)throw new Error('Move strip is disposed.');if(!validCursor(cursor)||!patch||typeof patch!=='object')throw new TypeError('Invalid move strip patch.');const target=items(view).find(item=>key(item.cursor)===key(cursor));if(!target)throw new RangeError('Move strip cursor is not displayed.');for(const field of ['classification','iconId','iconLabel','comment','color'] as const)if(Object.hasOwn(patch,field))Object.assign(target,{[field]:patch[field]});const button=buttons.get(key(cursor));if(button)setPresentation(button,target);},
    updateAppearance(next){if(disposed)throw new Error('Move strip is disposed.');appearance=next||{};for(const item of items(view)){const button=buttons.get(key(item.cursor));if(button)setPresentation(button,item);}},
    setGestureBlocked(next){if(disposed)throw new Error('Move strip is disposed.');blocked=!!next;if(!blocked&&renderPending&&pointerId===null&&!userGesture){renderPending=false;render(false);}},
    center(){if(disposed)throw new Error('Move strip is disposed.');if(blocked){renderPending=true;return;}userGesture=false;userPositioned=false;clearTimer();centerCurrent();},
    getInteractionState(){return {pointerActive:pointerId!==null,userGesture,userPositioned};},getBranchRows(){return Object.fromEntries(branchLanes.map(lane=>[lane.dataset.branchId!,lane.getBoundingClientRect().top]));},
    getCurrentBounds(){const identity=key(view.current),button=buttons.get(identity);return button?{key:identity,rect:button.getBoundingClientRect()}:null;},
    subscribe(listener){if(disposed)throw new Error('Move strip is disposed.');subscribers.add(listener);return ()=>subscribers.delete(listener);},
    relayout(){if(disposed)throw new Error('Move strip is disposed.');render(true);},
    dispose(){if(disposed)return;disposed=true;resizeObserver?.disconnect();clearTimer();if(scrollFrame)win.cancelAnimationFrame(scrollFrame);listeners.forEach(remove=>remove());owned.remove();buttons.clear();subscribers.clear();restoreHost();}
  };
}

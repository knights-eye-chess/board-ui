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
  /** Host command IDs are emitted only while a move button owns keyboard focus. */
  onCommand?: (command: string) => void;
  /** Keyboard key to host command ID. Defaults to a/b/l; `{}` disables commands. */
  keymap?: Readonly<Record<string,string>>;
  /** SAN piece-letter display. Defaults to chess figurines; `false` keeps labels literal. A map replaces only its listed letters. Copy and accessible text always use the original label. */
  figurines?: boolean | Readonly<Record<string,string>>;
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

// Presentation extracted from the preserved widget; all branches share native scrolling.
const css = `:host{display:block;min-width:0;width:100%;--strip-surface:#f4f0e6}*{box-sizing:border-box}.shell{position:relative}.viewport{position:relative;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;background:var(--move-strip-surface,var(--card,var(--strip-surface)));border:var(--move-strip-border,1px solid var(--line,#d7d3c9));border-radius:var(--move-strip-radius,8px);padding:1px 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;white-space:normal}.viewport::-webkit-scrollbar{display:none}.content{position:relative;min-width:100%;overflow:hidden}.row{position:relative;display:flex;align-items:center;gap:3px;overflow:visible;white-space:nowrap;width:max-content;min-width:100%;min-height:36px}.main-row,.branch-area{overflow:hidden}.branch-area{position:relative;min-width:100%;height:0}.branch-tree{position:absolute;width:max-content}.branch-segment{position:relative;display:block;width:max-content;min-height:31px;padding:1px 5px 1px 3px;border:1px solid var(--line,#d7d3c9);background:color-mix(in srgb,var(--secondary,#e6eee8),transparent 18%);border-radius:7px;white-space:nowrap}.branch-line{position:relative;z-index:2;display:flex;align-items:center;gap:3px;min-height:25px}.branch-children{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-width:100%;padding:3px 0 1px}.branch-children>.branch-segment{position:relative;flex:0 0 auto;background:color-mix(in srgb,var(--secondary,#e6eee8),transparent 26%)}button{display:inline-flex;align-items:center;justify-content:center;gap:4px;flex:0 0 auto;border:0;border-radius:5px;padding:5px 7px;background:none;color:var(--move-quality-text,var(--muted,#68746e));font:800 14px/1 var(--font-ui,Arial,sans-serif);cursor:pointer;white-space:nowrap;-webkit-user-select:text;user-select:text}button[data-classification]{--move-quality-text:color-mix(in srgb,var(--move-quality) 85%,var(--ink,#14231d))}.branch-segment button{position:relative;z-index:3;font-size:13px;padding:4px 6px;pointer-events:auto}button.current{background:var(--played,#dce9df)}button:focus-visible{outline:2px solid var(--move-strip-focus,#2c165b);outline-offset:2px}.number{font-weight:400}.number,.san{font-family:var(--move-font,var(--font-ui,Arial,sans-serif));font-feature-settings:"ss01" 0;font-synthesis:none}.icon-slot{display:flex;flex:0 0 14px;width:14px;height:15px;align-items:center;justify-content:center}.icon{display:block;width:100%;height:100%;object-fit:contain}.annotation{color:var(--green,#1f6044);font-size:.8em;margin-left:2px}.start-icon{display:block;width:20px;height:20px;object-fit:contain}.branch-segment.active{border-color:var(--green,#1f6044);box-shadow:inset 3px 0 0 var(--green,#1f6044)} .branch-segment{border:0!important;box-shadow:none!important;background:transparent!important;padding:0!important;min-height:0}.branch-line{height:auto;padding:1px 10px!important;border-radius:9px;background:color-mix(in srgb,var(--secondary,#e6eee8),transparent 24%)}.branch-line:before,.branch-line:after{content:"";position:absolute;top:1px;bottom:1px;width:8px;pointer-events:none}.branch-line:before{left:1px;border-left:2px solid var(--green,#1f6044);border-radius:50% 0 0 50%}.branch-line:after{right:1px;border-right:2px solid var(--green,#1f6044);border-radius:0 50% 50% 0}.branch-segment:has(>.branch-children){position:relative!important;padding:2px 8px!important;border-radius:14px;background:color-mix(in srgb,var(--secondary,#e6eee8),transparent 60%)!important}.branch-segment:has(>.branch-children):before,.branch-segment:has(>.branch-children):after{content:"";position:absolute;z-index:5;top:2px;bottom:2px;width:8px;pointer-events:none}.branch-segment:has(>.branch-children):before{left:1px;border-left:2px solid var(--green,#1f6044);border-radius:50% 0 0 50%}.branch-segment:has(>.branch-children):after{right:1px;border-right:2px solid var(--green,#1f6044);border-radius:0 50% 50% 0}.branch-segment:has(>.branch-children)>.branch-line{padding-left:0!important;padding-right:0!important;background:transparent!important}.branch-segment:has(>.branch-children)>.branch-line:before,.branch-segment:has(>.branch-children)>.branch-line:after{display:none}.branch-segment:has(>.branch-children)>.branch-children{gap:4px;padding:4px 0 0}button{touch-action:manipulation}button:has(.start-icon){display:inline-flex;width:30px;padding:2px 4px;transform:translateY(-1px)}.start-icon{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#b38361;overflow:hidden}.start-icon img{position:relative;top:-1.1px;left:.3px;display:block;width:140%;height:140%;object-fit:contain;transform:translateY(-1px);justify-self:center;max-width:none}.move-selection{display:inline-flex;align-items:baseline;gap:4px}.number{opacity:.72;font-weight:500}@media(min-width:741px){button,.branch-segment button{font-size:15px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}`;


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
  const keymap=options.keymap??{a:'a',b:'b',l:'l'};
  const figurines=options.figurines===false?null:options.figurines&&typeof options.figurines==='object'?options.figurines:{K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'};
  function displayLabel(label:string){return figurines?label.replace(/[KQRBNP]/g,letter=>figurines[letter]??letter):label;}
  const doc=host.ownerDocument, win=doc.defaultView!;
  const originalHostStyle=host.getAttribute('style');host.style.display='block';host.style.padding='0';host.style.border='0';host.style.overflow='visible';
  const restoreHost=()=>{if(originalHostStyle===null)host.removeAttribute('style');else host.setAttribute('style',originalHostStyle);};
  const owned=doc.createElement('div'),shadow=owned.attachShadow({mode:'open'}),style=doc.createElement('style');style.textContent=css;
  const shell=doc.createElement('div'),viewport=doc.createElement('div'),content=doc.createElement('div');shell.className='shell';viewport.className='viewport';content.className='content';viewport.setAttribute('role','region');viewport.setAttribute('aria-label',view.label||'Moves');viewport.append(content);shell.append(viewport);shadow.append(style,shell);host.append(owned);
  const buttons=new Map<string,HTMLButtonElement>();
  const listeners:Array<()=>void>=[];
  const subscribers=new Set<()=>void>();
  function notifyLayout(){for(const listener of subscribers)listener();}
  function listen(target:EventTarget,name:string,handler:EventListener,opts?:AddEventListenerOptions){target.addEventListener(name,handler,opts);listeners.push(()=>target.removeEventListener(name,handler,opts));}
  let pointerId:number|null=null,pointerStart=0,pointerMoved=false,suppressClick=false,userGesture=false,userPositioned=false,scrollFrame=0,settleTimer=0,programmaticUntil=0,scrollCallback=false,lastRequested='',renderPending=false;
  const branchLanes:HTMLElement[]=[];let treeExtent=0;
  const metricWidths=new WeakMap<Element,number>();
  const metricObserver=typeof win.ResizeObserver==='function'?new win.ResizeObserver(entries=>{let changed=false;for(const entry of entries){const width=entry.target.getBoundingClientRect().width,previous=metricWidths.get(entry.target);metricWidths.set(entry.target,width);if(previous!==undefined&&Math.abs(width-previous)>.25)changed=true;}if(changed)render(userPositioned);}):null;
  function observeMetrics(){metricObserver?.disconnect();for(const button of buttons.values()){metricWidths.set(button,button.getBoundingClientRect().width);metricObserver?.observe(button);}}
  function clearTimer(){win.clearTimeout(settleTimer);settleTimer=0;}
  function centerOf(button:HTMLElement){const r=button.getBoundingClientRect();return r.left+r.width/2;}
  function selectedButtons(){return view.selectedLine.map(cursor=>buttons.get(key(cursor))).filter((button):button is HTMLButtonElement=>!!button);}
  function viewportWidth(){return viewport.clientWidth;}
  function nativeEnd(){const line=selectedButtons(),last=line[line.length-1];if(!last)return viewportWidth();const outer=viewport.getBoundingClientRect(),end=last.getBoundingClientRect(),style=win.getComputedStyle(viewport),extra=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+(viewport.offsetWidth-viewport.clientWidth)/2;return Math.max(viewportWidth(),Math.ceil(end.left+end.width/2-outer.left+viewport.scrollLeft+viewportWidth()/2-extra));}
  /** Clamp against the existing range before shrinking it, avoiding a late rewind. */
  function setClip(width:number){content.style.width=`${width}px`;for(const child of Array.from(content.children)) (child as HTMLElement).style.width=`${width}px`;}
  function lockRange(){if(userGesture||pointerId!==null){setClip(treeExtent);return;}const width=nativeEnd(),padding=win.getComputedStyle(viewport),horizontalPadding=(parseFloat(padding.paddingLeft)||0)+(parseFloat(padding.paddingRight)||0),max=Math.max(0,width+horizontalPadding-viewportWidth());if(viewport.scrollLeft>max){viewport.scrollLeft=max;}setClip(width);}
  function showCurrent(){for(const [identity,button] of buttons){const current=identity===key(view.current);button.classList.toggle('current',current);if(current)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');}for(const lane of branchLanes)lane.classList.toggle('active',view.current.kind==='branch'&&view.current.branchId===lane.dataset.branchId);}
  function centerCurrent(){const button=buttons.get(key(view.current));if(!button)return;userPositioned=false;lockRange();const outer=viewport.getBoundingClientRect();programmaticUntil=Date.now()+240;viewport.scrollLeft=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,viewport.scrollLeft+centerOf(button)-(outer.left+outer.width/2)));}
  function request(cursor:MoveStripCursor,source:'click'|'scroll'|'keyboard'){
    const identity=key(cursor);if(source==='scroll'&&(identity===key(view.current)||identity===lastRequested))return;
    lastRequested=identity;scrollCallback=source==='scroll';try{options.onNavigate(copyCursor(cursor),{source});}finally{scrollCallback=false;}
  }
  function resolveCenter(){const line=selectedButtons();if(!line.length)return;const outer=viewport.getBoundingClientRect(),middle=outer.left+outer.width/2,first=centerOf(line[0]);if(middle<first-1){if(viewport.scrollLeft>0)viewport.scrollLeft=Math.max(0,viewport.scrollLeft-(first-middle));return;}let best=line[0],distance=Infinity;for(const button of line){const next=Math.abs(centerOf(button)-middle);if(next<distance){best=button;distance=next;}}const cursor=view.selectedLine[line.indexOf(best)];if(cursor)request(cursor,'scroll');}
  function beginGesture(){if(!userGesture){pointerStart=viewport.scrollLeft;pointerMoved=false;options.onGestureStart?.();}userGesture=true;lockRange();programmaticUntil=0;clearTimer();}
  function settle(){clearTimer();settleTimer=win.setTimeout(()=>{settleTimer=0;if(pointerId!==null){settle();return;}if(userGesture)resolveCenter();userGesture=false;lockRange();lastRequested='';if(renderPending&&!blocked){renderPending=false;render(userPositioned);}options.onSettled?.();},180);}
  function fillButton(button:HTMLButtonElement,item:MoveStripItem){const wasCurrent=button.classList.contains('current');button.replaceChildren();button.className=wasCurrent?'current':'';button.removeAttribute('style');button.dataset.cursor=key(item.cursor);button.dataset.copySan=`${(item.copyPrefix||item.number||'').replace(/…/g,'...')}${item.label}`.trim();button.setAttribute('aria-label',`${item.number?item.number+' ':''}${item.label}${item.annotation?', '+item.annotation:''}${item.iconLabel?', '+item.iconLabel:''}`);if(item.comment)button.title=item.comment;else button.removeAttribute('title');
    if(item.startIconUrl){const start=doc.createElement('span'),image=doc.createElement('img');start.className='start-icon';image.src=item.startIconUrl;image.alt='';start.setAttribute('aria-hidden','true');start.append(image);button.append(start);}else{
      const selection=doc.createElement('span');selection.className='move-selection';button.append(selection);if(item.number){const number=doc.createElement('span');number.className='number';number.textContent=item.number;selection.append(number);}
      const label=doc.createElement('span');label.className='san';label.setAttribute('aria-hidden','true');label.textContent=displayLabel(item.label);selection.append(label);
      if(item.annotation){const note=doc.createElement('small');note.className='annotation';note.textContent=item.annotation;button.append(note);}
    }
    if(item.startIconUrl)return;const slot=doc.createElement('span');slot.className='icon-slot';slot.setAttribute('aria-hidden','true');button.append(slot);setPresentation(button,item);
  }
  function setPresentation(button:HTMLButtonElement,item:MoveStripItem){const old=button.dataset.classification;if(old)button.classList.remove(old);button.style.removeProperty('--move-quality');button.style.removeProperty('color');
    if(item.classification&&/^[a-z][a-z0-9-]*$/.test(item.classification)){button.classList.add(item.classification);button.dataset.classification=item.classification;button.style.setProperty('--move-quality',`var(--quality-${item.classification})`);}else delete button.dataset.classification;
    if(item.color)button.style.color=item.color;
    button.setAttribute('aria-label',`${item.number?item.number+' ':''}${item.label}${item.annotation?', '+item.annotation:''}${item.iconLabel?', '+item.iconLabel:''}`);if(item.comment)button.title=item.comment;else button.removeAttribute('title');
    const slot=button.querySelector<HTMLElement>('.icon-slot');if(slot){slot.replaceChildren();if(item.iconId){const icon=appearance.resolveIcon?.(item.iconId);if(icon){const image=doc.createElement('img');image.className='icon';image.src=icon.src;image.alt='';if(icon.width)image.width=icon.width;if(icon.height)image.height=icon.height;slot.append(image);}}}
  }
  function makeButton(item:MoveStripItem){const button=doc.createElement('button');button.type='button';fillButton(button,item);
    button.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}userGesture=false;clearTimer();request(item.cursor,'click');settle();});buttons.set(key(item.cursor),button);return button;}
  /** Original nested segment layout, using host cursors instead of game-tree state. */
  function render(preserveScroll:boolean){
    if(disposed)return;if(blocked||userGesture||pointerId!==null){renderPending=true;return;}
    const oldScroll=viewport.scrollLeft,focused=(shadow.activeElement as HTMLElement|null)?.dataset.cursor;
    buttons.clear();content.replaceChildren();branchLanes.length=0;viewport.setAttribute('aria-label',view.label||'Moves');
    const main=doc.createElement('div');main.className='row main main-row';content.append(main);
    for(const item of view.main)main.append(makeButton(item));
    const first=main.querySelector('button'),last=main.querySelector('button:last-child'),half=viewportWidth()/2,viewportStyle=win.getComputedStyle(viewport),leftInset=parseFloat(viewportStyle.paddingLeft)||0,rightInset=parseFloat(viewportStyle.paddingRight)||0;
    if(first)main.style.paddingLeft=`${Math.max(0,half-first.getBoundingClientRect().width/2-leftInset)}px`;
    if(last)main.style.paddingRight=`${Math.max(0,half-last.getBoundingClientRect().width/2-rightInset)}px`;
    const branches=view.branches||[],area=doc.createElement('div');area.className='branch-area';content.append(area);
    function textLeft(button:HTMLElement){return button.getBoundingClientRect().left+(parseFloat(win.getComputedStyle(button).paddingLeft)||0);}
    type Entry={element:HTMLElement;left:number;width:number;height:number};
    type Occupied={left:number;right:number;top:number;bottom:number};
    function packedTop(entry:Entry,occupied:Occupied[],initial:number){let top=initial,collision:Occupied|undefined;do{collision=undefined;for(const placed of occupied){if(entry.left+entry.width+7>placed.left&&entry.left<placed.right+7&&top+entry.height+4>placed.top&&top<placed.bottom+4&&(!collision||placed.bottom>collision.bottom))collision=placed;}if(collision)top=collision.bottom+4;}while(collision);return top;}
    function segment(branch:MoveStripBranch,depth:number):HTMLElement{
      const element=doc.createElement('div'),row=doc.createElement('div');element.className='branch-segment'+(depth>1?' nested':'');element.dataset.branchId=branch.id;row.className='branch-line branch';element.append(row);branchLanes.push(element);
      for(const item of branch.moves)row.append(makeButton(item));
      const children=branches.filter(child=>child.parentId===branch.id);
      if(children.length){const box=doc.createElement('div');box.className='branch-children';for(const child of children)box.append(segment(child,depth+1));element.append(box);}
      return element;
    }
    function layoutSegment(element:HTMLElement){
      const box=element.querySelector<HTMLElement>(':scope > .branch-children');if(!box)return;
      const row=element.querySelector<HTMLElement>(':scope > .branch-line')!,entries:Entry[]=[],occupied:Occupied[]=[];
      for(const child of Array.from(box.querySelectorAll<HTMLElement>(':scope > .branch-segment'))){
        layoutSegment(child);const branch=branches.find(item=>item.id===child.dataset.branchId)!,anchor=buttons.get(key(branch.anchor)),first=child.querySelector<HTMLElement>(':scope > .branch-line > button');
        child.style.left='auto';child.style.top='auto';child.style.marginLeft='0px';
        entries.push({element:child,left:anchor&&first?Math.round(textLeft(anchor)-textLeft(first)):20,width:child.offsetWidth,height:child.offsetHeight});
      }
      entries.sort((a,b)=>a.left-b.left||b.width-a.width);box.style.display='block';let maxRight=0,maxBottom=0;
      for(const entry of entries){const top=packedTop(entry,occupied,4),right=entry.left+entry.width,bottom=top+entry.height;entry.element.style.position='absolute';entry.element.style.left=`${entry.left}px`;entry.element.style.top=`${top}px`;occupied.push({left:entry.left,right,top,bottom});maxRight=Math.max(maxRight,right);maxBottom=Math.max(maxBottom,bottom);}
      const width=Math.max(row.scrollWidth,maxRight);box.style.height=`${maxBottom+1}px`;box.style.width=`${width}px`;element.style.width=`${width+16}px`;
    }
    const entries:Entry[]=[],occupied:Occupied[]=[];
    for(const branch of branches.filter(branch=>!branch.parentId||!branches.some(parent=>parent.id===branch.parentId))){
      const tree=doc.createElement('div'),element=segment(branch,1);tree.className='branch-tree';tree.style.left='0px';tree.style.top='0px';tree.append(element);area.append(tree);layoutSegment(element);
      const anchor=buttons.get(key(branch.anchor)),first=element.querySelector<HTMLElement>(':scope > .branch-line > button');
      entries.push({element:tree,left:anchor&&first?Math.round(textLeft(anchor)-textLeft(first)):Math.max(0,main.scrollWidth-60),width:tree.offsetWidth,height:tree.offsetHeight});
    }
    entries.sort((a,b)=>a.left-b.left||b.width-a.width);
    const gapButton=main.querySelector<HTMLElement>('button.current')||main.querySelector<HTMLElement>('button:not(:has(.start-icon))')||main.querySelector<HTMLElement>('button'),rootTop=gapButton?gapButton.getBoundingClientRect().bottom-area.getBoundingClientRect().top+4:0;
    let maxBottom=0,maxRight=main.scrollWidth;
    for(const entry of entries){const top=packedTop(entry,occupied,rootTop),right=entry.left+entry.width,bottom=top+entry.height;entry.element.style.left=`${entry.left}px`;entry.element.style.top=`${top}px`;occupied.push({left:entry.left,right,top,bottom});maxBottom=Math.max(maxBottom,bottom);maxRight=Math.max(maxRight,right+half);}
    area.style.height=entries.length?`${Math.ceil(maxBottom)+3}px`:'0px';treeExtent=Math.ceil(maxRight);showCurrent();lockRange();
    if(preserveScroll)viewport.scrollLeft=Math.min(oldScroll,Math.max(0,viewport.scrollWidth-viewport.clientWidth));else centerCurrent();
    if(focused)buttons.get(focused)?.focus({preventScroll:true});observeMetrics();notifyLayout();
  }
  function items(value:MoveStripView){return [...value.main,...(value.branches||[]).flatMap(branch=>branch.moves)];}
  function sameStructure(a:MoveStripView,b:MoveStripView){return a.main.map(item=>key(item.cursor)).join('|')===b.main.map(item=>key(item.cursor)).join('|')&&JSON.stringify(a.branches?.map(branch=>[branch.id,branch.parentId,key(branch.anchor),branch.moves.map(item=>key(item.cursor))]))===JSON.stringify(b.branches?.map(branch=>[branch.id,branch.parentId,key(branch.anchor),branch.moves.map(item=>key(item.cursor))]));}
  function sameText(a:MoveStripItem,b:MoveStripItem){return a.label===b.label&&a.number===b.number&&a.copyPrefix===b.copyPrefix&&a.annotation===b.annotation&&a.startIconUrl===b.startIconUrl;}
  function endPointer(event:Event){const pointer=event as PointerEvent;if(pointerId===null||pointer.pointerId!=null&&pointerId>=0&&pointerId!==pointer.pointerId)return;pointerMoved ||= Math.abs(viewport.scrollLeft-pointerStart)>.5;userPositioned=pointerMoved;suppressClick=pointerMoved;if(suppressClick)win.setTimeout(()=>{suppressClick=false;},0);pointerId=null;options.onGestureEnd?.();settle();}
  listen(viewport,'pointerdown',(event)=>{const pointer=event as PointerEvent;if(pointer.button!==0)return;suppressClick=false;pointerId=pointer.pointerId;pointerStart=viewport.scrollLeft;pointerMoved=false;beginGesture();},{passive:true});
  // Native scrolling cancels PointerEvents on touch. TouchEvents retain gesture ownership
  // until the finger lifts, including platforms without PointerEvent delivery.
  listen(viewport,'touchstart',()=>{if(pointerId!==null)return;pointerId=-1;pointerStart=viewport.scrollLeft;pointerMoved=false;beginGesture();},{passive:true});
  listen(win,'pointerup',endPointer,{passive:true});
  listen(win,'pointercancel',(event)=>{if((event as PointerEvent).pointerType==='touch')return;endPointer(event);},{passive:true});
  listen(win,'touchend',endPointer,{passive:true});listen(win,'touchcancel',endPointer,{passive:true});
  listen(viewport,'wheel',()=>{beginGesture();settle();},{passive:true});
  listen(viewport,'scroll',()=>{if(Date.now()<programmaticUntil&&!userGesture)return;if(!userGesture)beginGesture();else if(Math.abs(viewport.scrollLeft-pointerStart)<=.5&&!pointerMoved)return;
    lockRange();pointerMoved=true;userPositioned=true;options.onUserScroll?.();if(scrollFrame)return;
    scrollFrame=win.requestAnimationFrame(()=>{scrollFrame=0;if(userGesture)resolveCenter();});settle();},{passive:true});
  listen(shell,'keydown',(event)=>{const keyboard=event as KeyboardEvent,target=event.target as HTMLElement;if(!target.closest('button'))return;if(keyboard.altKey||keyboard.ctrlKey||keyboard.metaKey)return;
    const command=Object.hasOwn(keymap,keyboard.key)?keymap[keyboard.key]:keymap[keyboard.key.toLowerCase()];if(options.onCommand&&command){keyboard.preventDefault();options.onCommand(command);return;}
    const line=selectedButtons(),at=line.indexOf(target as HTMLButtonElement);if(at<0)return;let next=at;if(keyboard.key==='ArrowLeft')next=Math.max(0,at-1);else if(keyboard.key==='ArrowRight')next=Math.min(line.length-1,at+1);else if(keyboard.key==='Home')next=0;else if(keyboard.key==='End')next=line.length-1;else if(keyboard.key==='Enter'||keyboard.key===' '){keyboard.preventDefault();request(view.selectedLine[at],'keyboard');return;}else return;keyboard.preventDefault();line[next]?.focus();},{passive:false});
  listen(shadow,'copy',(event)=>{const copy=event as ClipboardEvent,selection=win.getSelection();if(!copy.clipboardData||!selection||selection.isCollapsed||!selection.rangeCount)return;const range=selection.getRangeAt(0),buttonFor=(node:Node)=>((node.nodeType===1?node:node.parentElement) as Element|null)?.closest?.('button[data-copy-san]'),start=buttonFor(range.startContainer),end=buttonFor(range.endContainer);if(start&&start===end&&shadow.contains(start)){copy.clipboardData.setData('text/plain',(start as HTMLElement).dataset.copySan||'');copy.preventDefault();}},{passive:false});
  try{render(false);}catch(error){listeners.forEach(remove=>remove());owned.remove();restoreHost();throw error;}
  let observedWidth=viewport.clientWidth;const resizeObserver=typeof win.ResizeObserver==='function'?new win.ResizeObserver(()=>{const width=viewport.clientWidth;if(width===observedWidth)return;observedWidth=width;render(userPositioned);}):null;resizeObserver?.observe(viewport);
  if(doc.fonts){listen(doc.fonts,'loadingdone',()=>render(userPositioned));void doc.fonts.ready.then(()=>{if(!disposed)render(userPositioned);});}
  return {
    update(next){if(disposed)throw new Error('Move strip is disposed.');const replacement=snapshot(next),changed=key(replacement.current)!==key(view.current),reuse=sameStructure(view,replacement),oldItems=new Map(items(view).map(item=>[key(item.cursor),item]));view=replacement;viewport.setAttribute('aria-label',view.label||'Moves');
      if(reuse){for(const item of items(view)){const button=buttons.get(key(item.cursor)),old=oldItems.get(key(item.cursor));if(button&&old&&JSON.stringify(old)!==JSON.stringify(item)){if(sameText(old,item))setPresentation(button,item);else fillButton(button,item);}}showCurrent();lockRange();if(!scrollCallback&&!blocked&&!userGesture&&pointerId===null&&changed){lastRequested='';centerCurrent();}if(changed)notifyLayout();return;}
      showCurrent();if(scrollCallback){lockRange();renderPending=true;return;}if(blocked||userGesture||pointerId!==null){renderPending=true;return;}if(changed)lastRequested='';render(!changed);
    },
    updateMove(cursor,patch){if(disposed)throw new Error('Move strip is disposed.');if(!validCursor(cursor)||!patch||typeof patch!=='object')throw new TypeError('Invalid move strip patch.');const target=items(view).find(item=>key(item.cursor)===key(cursor));if(!target)throw new RangeError('Move strip cursor is not displayed.');for(const field of ['classification','iconId','iconLabel','comment','color'] as const)if(Object.hasOwn(patch,field))Object.assign(target,{[field]:patch[field]});const button=buttons.get(key(cursor));if(button)setPresentation(button,target);},
    updateAppearance(next){if(disposed)throw new Error('Move strip is disposed.');appearance=next||{};for(const item of items(view)){const button=buttons.get(key(item.cursor));if(button)setPresentation(button,item);}},
    setGestureBlocked(next){if(disposed)throw new Error('Move strip is disposed.');blocked=!!next;if(!blocked&&renderPending&&pointerId===null&&!userGesture){renderPending=false;render(false);}},
    center(){if(disposed)throw new Error('Move strip is disposed.');if(blocked){renderPending=true;return;}userGesture=false;userPositioned=false;clearTimer();centerCurrent();},
    getInteractionState(){return {pointerActive:pointerId!==null,userGesture,userPositioned};},getBranchRows(){return Object.fromEntries(branchLanes.map(lane=>[lane.dataset.branchId!,lane.querySelector('.branch-line')!.getBoundingClientRect().top]));},
    getCurrentBounds(){const identity=key(view.current),button=buttons.get(identity);return button?{key:identity,rect:button.getBoundingClientRect()}:null;},
    subscribe(listener){if(disposed)throw new Error('Move strip is disposed.');subscribers.add(listener);return ()=>subscribers.delete(listener);},
    relayout(){if(disposed)throw new Error('Move strip is disposed.');render(userPositioned);},
    dispose(){if(disposed)return;disposed=true;resizeObserver?.disconnect();metricObserver?.disconnect();clearTimer();if(scrollFrame)win.cancelAnimationFrame(scrollFrame);listeners.forEach(remove=>remove());owned.remove();buttons.clear();subscribers.clear();restoreHost();}
  };
}

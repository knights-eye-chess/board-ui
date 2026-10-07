import type { MoveStrip } from './move-strip.js';
export interface MoveStripPanelOptions { appHost:HTMLElement; stripHost:HTMLElement; controlsHost:HTMLElement; strip:MoveStrip;
  classNames?: { column?:string; panel?:string; viewport?:string; expand?:string; dialog?:string };
  labels?: { panel?:string; viewport?:string; expand?:string; dialog?:string };
}
/** Package-owned vertical discovery; layout slots are supplied by the host. */
export function mountMoveStripPanel(options: MoveStripPanelOptions) {
  const {appHost:app,stripHost:moves,controlsHost:controls,strip}=options;
  const classes={column:'board-ui-column',panel:'board-ui-move-panel',viewport:'board-ui-move-viewport',expand:'board-ui-move-expand',dialog:'board-ui-move-dialog',...options.classNames};
  const labels={panel:'Move tree',viewport:'Move tree rows',expand:'Expand move tree',dialog:'Expanded move tree',...options.labels};
  const document=app.ownerDocument,window=document.defaultView!;
  const requestAnimationFrame=window.requestAnimationFrame.bind(window),cancelAnimationFrame=window.cancelAnimationFrame.bind(window),matchMedia=window.matchMedia.bind(window),ResizeObserver=window.ResizeObserver;
  const style=document.createElement('style'); style.textContent='[data-board-strip-panel]{min-width:0;min-height:0;margin-top:8px;display:flex;flex-direction:column}[data-board-strip-controls]{position:relative;margin-top:0!important;min-height:0}[data-board-strip-viewport]{position:relative;min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior-y:contain;scrollbar-width:thin;border:1px solid var(--board-strip-line,var(--line,#d7d3c9));border-radius:9px;background:var(--board-strip-surface,var(--secondary,#e6eee8))}[data-board-strip-viewport]>[data-board-strip-host]{border:0;border-radius:0;--move-strip-border:0}[data-board-strip-expand]{position:absolute;z-index:3;bottom:5px;right:56px;width:31.5px;height:31.5px;min-height:0;padding:5px;display:grid;place-items:center;border:1px solid var(--board-strip-line,var(--line,#d7d3c9));border-radius:6px;background:var(--dialog-action-surface,#f4f0e6);color:var(--board-strip-accent,var(--green,#1f6044));opacity:.72;cursor:pointer}[data-board-strip-expand][hidden]{display:none}[data-board-strip-expand]:hover{opacity:1}[data-board-strip-expand] svg{display:block;width:100%;height:100%}dialog[data-board-strip-dialog]{position:fixed;inset:auto 0 max(16px,env(safe-area-inset-bottom));margin:0 auto;width:calc(100vw - 16px);height:fit-content;max-height:calc(100dvh - 32px);padding:0;color:var(--board-strip-text,var(--ink,#17241d));background:var(--board-strip-dialog,var(--dialog-surface,var(--paper,#fff)));border:1px solid var(--board-strip-line,var(--line,#d7d3c9));border-radius:16px;outline:none;box-shadow:0 2px 12px #00000018}dialog[data-board-strip-dialog][open]{display:flex;flex-direction:column}dialog[data-board-strip-dialog]::backdrop{background:transparent;backdrop-filter:brightness(.8) contrast(.9)}[data-board-strip-dialog]>[data-board-strip-controls]{flex:0 1 auto;margin:12px!important;overflow:hidden;grid-template-rows:minmax(0,1fr)}@media(max-width:740px){[data-board-strip-panel]{margin-top:var(--section-gap,9px)}[data-board-strip-panel] [data-board-strip-viewport]{overflow:visible;border:0;background:transparent}[data-board-strip-panel] [data-board-strip-host]{border:0;border-radius:9px;--move-strip-border:1px solid var(--board-strip-line,var(--line,#d7d3c9));--move-strip-radius:9px}}'; app.appendChild(style);
  controls.dataset.boardStripControls=''; moves.dataset.boardStripHost='';
  const column = controls.parentElement!;
  const addedClasses=classes.column.split(/\s+/).filter(name=>name&&!column.classList.contains(name));column.classList.add(...addedClasses);
  const panel = document.createElement('section');
  panel.className = classes.panel; panel.dataset.boardStripPanel='';
  panel.setAttribute('aria-label', labels.panel);
  const expand = document.createElement('button');
  expand.dataset.boardStripExpand=''; expand.type = 'button'; expand.className = classes.expand; expand.hidden = true;
  expand.setAttribute('aria-label', labels.expand); expand.title = labels.expand;
  expand.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 3H3v5m0-5 7 7m6-7h5v5m0-5-7 7M3 16v5h5m-5 0 7-7m6 7h5v-5m0 5-7-7"/></svg>';
  const viewport = document.createElement('div'); viewport.className = classes.viewport; viewport.dataset.boardStripViewport='';
  viewport.setAttribute('aria-label', labels.viewport);
  controls.parentNode!.insertBefore(panel, controls); panel.appendChild(controls); controls.appendChild(expand); moves.parentNode!.insertBefore(viewport, moves); viewport.appendChild(moves);
  const dialog = document.createElement('dialog'); dialog.className = classes.dialog; dialog.dataset.boardStripDialog='';
  dialog.setAttribute('aria-label', labels.dialog);
  dialog.tabIndex = -1; dialog.setAttribute('autofocus', ''); app.appendChild(dialog);
  let frame = 0, disposed = false, selectedKey = '';
  const desktop = matchMedia('(min-width:741px)');
  function refresh(reveal = false) {
    if (disposed) return;
    const current = strip.getCurrentBounds();
    const key = current?.key || '';
    if ((reveal || key !== selectedKey) && current && (desktop.matches || dialog.open)) {
      const rect = current.rect, box = viewport.getBoundingClientRect();
      if (rect.top < box.top) viewport.scrollTop += rect.top - box.top - 4;
      else if (rect.bottom > box.bottom) viewport.scrollTop += rect.bottom - box.bottom + 4;
    }
    selectedKey = key;
    expand.hidden = dialog.open || !desktop.matches || viewport.scrollHeight <= viewport.clientHeight + 2;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; refresh(); }); }
  expand.onclick = () => {
    dialog.appendChild(controls); dialog.showModal(); dialog.focus({ preventScroll: true });
    strip.relayout();
    refresh(true);
  };
  function restore() { panel.appendChild(controls!); strip.relayout(); selectedKey = ""; refresh(true); expand.focus({ preventScroll: true }); }
  dialog.addEventListener('close', restore);
  dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); });
  viewport.addEventListener('scroll', schedule, { passive: true });
  const unsubscribe = strip.subscribe(schedule);
  const onResize = () => { selectedKey = ''; schedule(); };
  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize); resize?.observe(viewport); resize?.observe(moves);
  window.addEventListener('resize', onResize);
  desktop.addEventListener('change', schedule); schedule();
  return () => { disposed=true; cancelAnimationFrame(frame); unsubscribe(); resize?.disconnect(); window.removeEventListener('resize', onResize); desktop.removeEventListener('change',schedule); dialog.removeEventListener('close',restore); if(dialog.open)dialog.close(); panel.parentNode!.insertBefore(controls,panel); viewport.parentNode!.insertBefore(moves,viewport); expand.remove(); viewport.remove(); panel.remove(); dialog.remove(); column.classList.remove(...addedClasses); style.remove(); delete controls.dataset.boardStripControls; delete moves.dataset.boardStripHost; };
}

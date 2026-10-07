import { mountControlledBoard, type ControlledBoard, type ControlledBoardOptions, type ControlledBoardState, type BoardAppearanceUpdate, type BoardOverlayUpdate } from './controlled-board.js';
import { mountMoveStrip, type MoveStrip, type MoveStripOptions, type MoveStripView, type MoveStripCursor, type MoveStripItem } from './move-strip.js';
import { resolveIconPresentation, resolveAppearanceSelection, validateAppearanceSelection, defaultBoardAppearance } from './appearance.js';
import { mountMoveStripPanel, type MoveStripPanelOptions } from './move-strip-panel.js';

/** Optional composite: the chess position/tree remain controlled by the host. */
export interface BoardViewerOptions {
  board: ControlledBoardOptions;
  moveStrip?: false | MoveStripOptions;
  /** Existing layout slots can be supplied without access to component internals. */
  slots?: { board: HTMLElement; moveStrip?: HTMLElement; previous?: HTMLButtonElement; next?: HTMLButtonElement };
  moveStripPanel?: Omit<MoveStripPanelOptions,'stripHost'|'strip'>;
  /** Host-configurable keyboard commands; {} disables viewer navigation shortcuts. */
  keymap?: Readonly<Record<string,string>>;
  /** Only these command IDs may repeat; defaults to the transport commands. */
  repeatableCommands?: readonly string[];
  /** Explicit denial takes precedence over repeatableCommands. */
  nonRepeatingCommands?: readonly string[];
  onNavigationCommand?(command: string): void;
}
export interface BoardViewer {
  updateBoard(state: ControlledBoardState): void;
  updateStrip(view: MoveStripView): void;
  updateBoardOverlays(group: string, overlay: BoardOverlayUpdate | null): void;
  updateStripMove(cursor: MoveStripCursor, patch: Partial<Omit<MoveStripItem, 'cursor'>>): void;
  updateAppearance(appearance: BoardAppearanceUpdate): void;
  setGestureBlocked(blocked: boolean): void;
  cancelBoardGesture(): void;
  centerStrip(): void;
  getBranchRows(): Record<string, number>;
  getInteractionState(): { pointerActive: boolean; userGesture: boolean; userPositioned: boolean };
  updateNavigationControls(state: { previousDisabled:boolean; nextDisabled:boolean }): void;
  dispose(): void;
}
export function mountBoardViewer(host: HTMLElement, options: BoardViewerOptions): BoardViewer {
  validateAppearanceSelection(options.board.appearance ?? defaultBoardAppearance,options.board.appearanceSelection);
  const document = host.ownerDocument;
  const owned: HTMLElement[] = [];
  const boardHost = options.slots?.board ?? document.createElement('div');
  if (!options.slots?.board) { host.appendChild(boardHost); owned.push(boardHost); }
  const stripOptions = options.moveStrip || undefined;
  const stripHost = stripOptions ? options.slots?.moveStrip ?? document.createElement('div') : undefined;
  if (stripHost && !options.slots?.moveStrip) { host.appendChild(stripHost); owned.push(stripHost); }
  let strip: MoveStrip | undefined, board: ControlledBoard | undefined, disposed = false;
  const cleanups: Array<()=>void> = [];
  const originalTabIndex=boardHost.getAttribute('tabindex');cleanups.push(()=>{if(originalTabIndex===null)boardHost.removeAttribute('tabindex');else boardHost.setAttribute('tabindex',originalTabIndex);});
  const catalogue = options.board.appearance ?? defaultBoardAppearance;
  let presentation: BoardAppearanceUpdate = { ...options.board.appearanceSelection };
  const sharedIcons = () => {
    const icons = resolveAppearanceSelection(catalogue, presentation).iconSet.icons;
    return { resolveIcon: (id: string) => icons[id] ? { src: resolveIconPresentation(catalogue, id, { iconSet:presentation.iconSet, color:presentation.qualityColors?.[id] }).src } : null };
  };
  try {
    if (stripOptions && stripHost) strip = mountMoveStrip(stripHost, { ...stripOptions, appearance: stripOptions.appearance ?? sharedIcons() });
    board = mountControlledBoard(boardHost, {
      ...options.board,
      onDragStart(from) { strip?.setGestureBlocked(true); options.board.onDragStart?.(from); },
      onDragCommit(event) { strip?.setGestureBlocked(false); options.board.onDragCommit?.(event); },
      onDragCancel(from) { strip?.setGestureBlocked(false); options.board.onDragCancel?.(from); },
    });
    if (strip && stripHost && options.moveStripPanel) cleanups.push(mountMoveStripPanel({ ...options.moveStripPanel, stripHost, strip }));
  } catch (error) { board?.dispose(); strip?.dispose(); owned.forEach(node => node.remove()); throw error; }
  const window = document.defaultView!;
  function listen(target: EventTarget, name:string, handler:EventListener, capture=false) { target.addEventListener(name,handler,capture); cleanups.push(()=>target.removeEventListener(name,handler,capture)); }
  function bindTransport(button:HTMLButtonElement|undefined, command:'previous'|'next') {
    if (!button || !options.onNavigationCommand) return;
    let delay=0,repeat=0,repeated=false;
    const clear = () => { window.clearTimeout(delay); window.clearInterval(repeat); delay=repeat=0; };
    const action = () => { if (!button.disabled) options.onNavigationCommand!(command); };
    listen(button,'click',event=>{if(repeated&&(event as MouseEvent).detail!==0){event.preventDefault();repeated=false;return;}action();});
    listen(button,'pointerdown',event=>{const pointer=event as PointerEvent;if(button.disabled||pointer.button!==0)return;clear();repeated=false;delay=window.setTimeout(()=>{repeated=true;action();repeat=window.setInterval(()=>{if(button.disabled)clear();else action();},55);},340);});
    for(const name of ['pointerup','pointercancel','pointerleave','lostpointercapture'])listen(button,name,clear);
    listen(window,'pointerup',clear);listen(window,'pointercancel',clear);listen(button,'contextmenu',event=>{if(repeated)event.preventDefault();});cleanups.push(clear);
  }
  bindTransport(options.slots?.previous,'previous');bindTransport(options.slots?.next,'next');
  if(options.onNavigationCommand) listen(host,'keydown',event=>{
    const key=event as KeyboardEvent;
    if(key.ctrlKey||key.metaKey||key.altKey)return;
    const path=key.composedPath().filter(node=>node instanceof window.Element) as Element[];
    if(path.some(node=>node.matches('input,textarea,select,[contenteditable="true"],.promotion,[role="dialog"]')))return;
    const names: Readonly<Record<string,string>>=options.keymap??{ArrowLeft:'previous',ArrowRight:'next',ArrowUp:'branchUp',ArrowDown:'branchDown',Home:'start',End:'end',PageUp:'resumeMain',f:'flip',Backspace:'delete',Delete:'delete'};
    if(!(key.key in names))return;
    key.preventDefault();key.stopPropagation();if(key.repeat&&((options.nonRepeatingCommands??[]).includes(names[key.key])||!(options.repeatableCommands??['previous','next','branchUp','branchDown','start','end']).includes(names[key.key])))return;options.onNavigationCommand!(names[key.key]);
  }, true);
  const alive = () => { if (disposed) throw new Error('Board viewer is disposed.'); };
  return {
    updateBoard(state) { alive(); board!.update(state); },
    updateStrip(view) { alive(); strip?.update(view); },
    updateBoardOverlays(group, overlay) { alive(); board!.updateOverlays(group, overlay); },
    updateStripMove(cursor, patch) { alive(); strip?.updateMove(cursor, patch); },
    updateAppearance(appearance) { alive(); validateAppearanceSelection(catalogue,{...presentation,...appearance,qualityColors:{...presentation.qualityColors,...appearance.qualityColors}});board!.updateAppearance(appearance); presentation = { ...presentation, ...appearance, qualityColors:{...presentation.qualityColors,...appearance.qualityColors} }; strip?.updateAppearance(sharedIcons()); },
    setGestureBlocked(blocked) { alive(); strip?.setGestureBlocked(blocked); },
    cancelBoardGesture() { alive(); board!.cancelGesture(); },
    centerStrip() { alive(); strip?.center(); },
    getBranchRows() { alive(); return strip?.getBranchRows() ?? {}; },
    getInteractionState() { alive(); return strip?.getInteractionState() ?? { pointerActive:false, userGesture:false, userPositioned:false }; },
    updateNavigationControls(state) { alive(); const focused=document.activeElement;const losingFocus=(focused===options.slots?.previous&&state.previousDisabled)||(focused===options.slots?.next&&state.nextDisabled); if(losingFocus){boardHost.tabIndex=-1;boardHost.focus({preventScroll:true});} if(options.slots?.previous)options.slots.previous.disabled=state.previousDisabled; if(options.slots?.next)options.slots.next.disabled=state.nextDisabled; },
    dispose() { if (disposed) return; disposed = true; cleanups.forEach(cleanup=>cleanup()); board!.dispose(); strip?.dispose(); owned.forEach(node => node.remove()); },
  };
}

import { isBoardSquare, type Square } from './controlled-board-renderer.js';

export type PieceCode = 'P'|'R'|'N'|'B'|'Q'|'K'|'p'|'r'|'n'|'b'|'q'|'k';
export type PiecePlacement = Readonly<Partial<Record<Square, PieceCode>>>;
/** Host move facts for ambiguous matches; these do not imply board-side legality. */
export interface PieceTransitionHint {
  from?: Square;
  to?: Square;
  captureSquare?: Square;
  rookFrom?: Square;
  rookTo?: Square;
  /** Used for a promoted piece returning as a pawn during reverse navigation. */
  reversePromotion?: boolean;
  /** Cross-line jumps fade pieces without a matching source. */
  fadeUnmatched?: boolean;
  animate?: boolean;
}
export interface PieceTravel { from: Square; to: Square; piece: PieceCode; changedIdentity: boolean; }
export interface PieceExit { square: Square; piece: PieceCode; kind: 'capture'|'fade'; }
export interface PieceEntrance { square: Square; piece: PieceCode; kind: 'fade'; }
export interface PieceTransitionPlan { travels: PieceTravel[]; exits: PieceExit[]; entrances: PieceEntrance[]; }

/** Match changed squares in the same order as the production board's piece sync. */
export function planPieceTransitions(before: PiecePlacement, after: PiecePlacement, hint?: PieceTransitionHint, lastMove?: readonly Square[]): PieceTransitionPlan {
  const removed: { square: Square; piece: PieceCode; used: boolean }[]=[];
  const added: { square: Square; piece: PieceCode }[]=[];
  for (const [square, piece] of Object.entries(before) as [Square, PieceCode][]) {
    if (piece && after[square] !== piece) removed.push({square,piece,used:false});
  }
  for (const [square, piece] of Object.entries(after) as [Square, PieceCode][]) {
    if (piece && before[square] !== piece) added.push({square,piece});
  }
  const travels: PieceTravel[]=[], entrances: PieceEntrance[]=[];
  const take=(square: Square | undefined) => square && removed.find(item=>!item.used&&item.square===square);
  for (const item of added) {
    let source: (typeof removed)[number] | undefined;
    if (hint && item.square===hint.to) source=take(hint.from);
    if (!source && hint?.rookTo===item.square) source=take(hint.rookFrom);
    if (!source) source=removed.find(candidate=>!candidate.used&&candidate.piece===item.piece);
    if (!source && lastMove?.length===2) {
      if (item.square===lastMove[1]) source=take(lastMove[0]);
      else if (item.square===lastMove[0]) source=take(lastMove[1]);
    }
    if (source) { source.used=true; travels.push({from:source.square,to:item.square,piece:item.piece,changedIdentity:source.piece!==item.piece}); }
    else if (hint?.fadeUnmatched) entrances.push({square:item.square,piece:item.piece,kind:'fade'});
  }
  return {travels,entrances,exits:removed.filter(item=>!item.used).map(item=>({square:item.square,piece:item.piece,kind:hint?.fadeUnmatched?'fade':'capture'}))};
}
export function validatePieceTransitionHint(hint: PieceTransitionHint | undefined): void {
  if (!hint) return;
  if ((hint.from===undefined)!==(hint.to===undefined)||
      (hint.from!==undefined&&(!isBoardSquare(hint.from)||!isBoardSquare(hint.to)||hint.from===hint.to))||
      (hint.captureSquare!==undefined&&!isBoardSquare(hint.captureSquare))||
      ((hint.rookFrom===undefined)!==(hint.rookTo===undefined))||
      (hint.rookFrom!==undefined&&(!isBoardSquare(hint.rookFrom)||!isBoardSquare(hint.rookTo)))) {
    throw new TypeError('Invalid piece transition hint.');
  }
}

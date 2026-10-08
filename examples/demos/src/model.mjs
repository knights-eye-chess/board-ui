import { ChildNode, parsePgn, startingPosition } from 'chessops/pgn';
import { normalizeMove, castlingSide } from 'chessops/chess';
import { makeSan, parseSan } from 'chessops/san';
import { makeFen } from 'chessops/fen';
import { makeSquare, makeUci, parseUci, roleToChar, kingCastlesTo } from 'chessops/util';

export const SCENARIOS = {
  opening: '1. e4 e5 2. Nf3 Nc6 (2... Nf6 3. Nxe5 d6 4. Nf3 Nxe4) 3. Bb5 a6 (3... Nf6 4. O-O (4. d3 Bc5) Be7) 4. Ba4 Nf6 5. O-O Be7 *',
  promotion: '[SetUp "1"]\n[FEN "7k/P7/8/8/8/8/8/7K w - - 0 1"]\n\n*',
  castling: '[SetUp "1"]\n[FEN "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"]\n\n*',
};
const cursorKey = c => c.kind === 'main' ? `m:${c.ply}` : `b:${c.branchId}:${c.index}`;
let generation = 0;
function uiMove(pos, move) {
  const side = castlingSide(pos, move);
  return side ? { ...move, to: kingCastlesTo(pos.turn, side) } : move;
}

/** The tree is chessops Node/ChildNode. Maps index those nodes; they do not own a second tree. */
export class DemoGame {
  constructor(pgn = SCENARIOS.opening) {
    this.generation = ++generation;
    const parsed = parsePgn(pgn)[0];
    if (!parsed) throw Error('No game in PGN.');
    this.root = parsed.moves;
    this.root.data = { id: 'root', pos: startingPosition(parsed.headers).unwrap(), parent: null };
    this.current = this.root;
    this.selected = null;
    this.nextId = 0;
    this.nodes = new Map([['root', this.root]]);
    this.preferredNext = new Map();
    const visit = parent => {
      for (const child of parent.children) {
        const move = parseSan(parent.data.pos, child.data.san);
        if (!move || !parent.data.pos.isLegal(move)) throw Error(`Illegal fixture move ${child.data.san}`);
        child.data = this.data(parent, move);
        this.nodes.set(child.data.id, child);
        visit(child);
      }
    };
    visit(this.root);
    this.project();
  }
  data(parent, move) {
    const before = parent.data.pos, pos = before.clone(), san = makeSan(before, move);
    pos.play(move);
    return { id: `n${++this.nextId}`, parent, pos, move, san, uci: makeUci(move), ui: uiMove(before, move),
      number: `${before.fullmoves}${before.turn === 'white' ? '.' : '…'}` };
  }
  select(square) { this.selected = square; }
  play(uci) {
    const parsed = parseUci(uci), before = this.current.data.pos;
    if (!parsed || !('from' in parsed)) return false;
    const move = normalizeMove(before, parsed);
    if (before.isEnd() || !before.isLegal(move)) return false;
    let next = this.current.children.find(child => child.data.uci === makeUci(move));
    if (!next) {
      next = new ChildNode(this.data(this.current, move));
      this.current.children.push(next);
      this.nodes.set(next.data.id, next);
    }
    this.current = next;
    this.rememberPath(next);
    this.selected = null;
    this.project();
    return true;
  }
  navigate(cursor) {
    const node = this.cursors.get(cursorKey(cursor));
    if (!node || node === this.current) return false;
    this.current = node;
    this.rememberPath(node);
    this.selected = null;
    return true;
  }
  command(command) {
    let target = this.current;
    if (command === 'previous') target = target.data.parent || target;
    if (command === 'next') target = this.next(target) || target;
    if (command === 'start') target = this.root;
    if (command === 'end') while (this.next(target)) target = this.next(target);
    if (target === this.current) return false;
    this.current = target;
    this.selected = null;
    return true;
  }
  next(node) { return this.preferredNext.get(node.data.id) || node.children[0]; }
  rememberPath(node) {
    for (let child = node; child.data.parent; child = child.data.parent) {
      this.preferredNext.set(child.data.parent.data.id, child);
    }
  }
  project() {
    this.cursors = new Map();
    this.root.data.cursor = { kind: 'main', ply: 0 };
    this.cursors.set('m:0', this.root);
    this.main = [{ cursor: this.root.data.cursor, label: 'Start' }];
    this.branches = [];
    const visit = (parent, line, branch, ply) => {
      parent.children.forEach((child, i) => {
        let active = branch, items = line;
        if (i > 0) {
          active = { id: child.data.id, ...(branch ? {parentId: branch.id} : {}), anchor: parent.children[0].data.cursor, moves: [] };
          this.branches.push(active);
          items = active.moves;
        }
        child.data.cursor = active ? { kind: 'branch', branchId: active.id, index: items.length } : { kind: 'main', ply: ply + 1 };
        items.push({ cursor: child.data.cursor, label: child.data.san, number: child.data.number, copyPrefix: child.data.number });
        this.cursors.set(cursorKey(child.data.cursor), child);
        visit(child, items, active, ply + 1);
      });
    };
    visit(this.root, this.main, null, 0);
  }
  strip() {
    const path = [], tail = [];
    for (let node = this.current; node; node = node.data.parent) path.unshift(node.data.cursor);
    for (let node = this.next(this.current); node; node = this.next(node)) tail.push(node.data.cursor);
    return { main: this.main, branches: this.branches, current: this.current.data.cursor, selectedLine: [...path, ...tail], label: 'Shared game variations' };
  }
  board(orientation = 'white', acceptedIntentId) {
    const pos = this.current.data.pos, position = {}, legalMoves = [];
    for (const [square, piece] of pos.board) {
      const code = roleToChar(piece.role);
      position[makeSquare(square)] = piece.color === 'white' ? code.toUpperCase() : code;
    }
    for (const [from, targets] of pos.allDests()) for (const to of targets) {
      const promotions = pos.board.get(from)?.role === 'pawn' && (to < 8 || to >= 56) ? ['queen','rook','bishop','knight'] : [undefined];
      for (const promotion of promotions) legalMoves.push(makeUci(uiMove(pos, {from,to,...(promotion ? {promotion} : {})})));
    }
    const move = this.current.data.ui;
    return { position, orientation, positionKey: `${this.generation}:${this.current.data.id}`, selectedSquare: this.selected,
      permissions: {select:true,move:!pos.isEnd(),draggable:true}, legalMoves,
      ...(acceptedIntentId ? {acceptedIntentId} : {}), ...(move ? {lastMove: [makeSquare(move.from),makeSquare(move.to)]} : {}),
      label: `Shared position, ${orientation} perspective` };
  }
  summary() {
    const pos = this.current.data.pos;
    return { node: this.current.data.id, fen: makeFen(pos.toSetup()), turn: pos.turn,
      move: this.current.data.san || 'Starting position', positions: this.nodes.size, branches: this.branches.length,
      status: pos.isCheckmate() ? 'Checkmate' : pos.isStalemate() ? 'Stalemate' : pos.isInsufficientMaterial() ? 'Draw: insufficient material' : pos.isCheck() ? 'Check' : `${pos.turn === 'white' ? 'White' : 'Black'} to move` };
  }
}

/** Shared rendering leaf. Chess legality belongs to the host; controlled-board owns interaction and animation. */
export type BoardOrientation = 'white' | 'black';
export type Square = `${'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'}${'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'}`;
export const BOARD_FILES = 'abcdefgh';
export function isBoardSquare(value: unknown): value is Square { return typeof value === 'string' && /^[a-h][1-8]$/.test(value); }
export function boardSquares(orientation: BoardOrientation): Square[] {
  const squares: Square[] = [];
  for (let row = 0; row < 8; row++) for (let column = 0; column < 8; column++) {
    squares.push((BOARD_FILES[orientation === 'black' ? 7-column : column] + (orientation === 'black' ? row+1 : 8-row)) as Square);
  }
  return squares;
}
export interface SquareRendererOptions {
  orientation: BoardOrientation;
  /** Called before coordinate labels are appended; may add pieces, ghosts and badges. */
  decorate(square: HTMLDivElement, name: Square): void;
}
export function renderBoardSquares(board: HTMLElement, options: SquareRendererOptions): void {
  const document = board.ownerDocument;
  board.replaceChildren();
  boardSquares(options.orientation).forEach((name, index) => {
    const square = document.createElement('div');
    square.className = 'sq ' + ((8-Number(name[1])+BOARD_FILES.indexOf(name[0]))%2 ? 'dark' : 'light');
    square.dataset.square = name;
    options.decorate(square, name);
    if (index%8 === 0) { const rank = document.createElement('small'); rank.className = 'rank'; rank.textContent = name[1]; square.appendChild(rank); }
    if (index >= 56) { const file = document.createElement('small'); file.className = 'file'; file.textContent = name[0]; square.appendChild(file); }
    board.appendChild(square);
  });
}
export function boardSquareCenter(square: Square, orientation: BoardOrientation): { x: number; y: number } {
  return { x: ((orientation === 'black' ? 7-BOARD_FILES.indexOf(square[0]) : BOARD_FILES.indexOf(square[0]))+.5)*12.5,
    y: (orientation === 'black' ? Number(square[1])-.5 : 8.5-Number(square[1]))*12.5 };
}

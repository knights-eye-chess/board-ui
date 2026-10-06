import assert from 'node:assert/strict';
import test from 'node:test';
import { boardSquares, boardSquareCenter, renderBoardSquares } from '../dist/controlled-board-renderer.js';
import { mountControlledBoard } from '../dist/controlled-board.js';

test('KE-BOARD-004: square projection and overlays preserve algebraic identity when flipped', () => {
  const white=boardSquares('white'),black=boardSquares('black');
  assert.equal(new Set(white).size,64);assert.deepEqual(black,white.slice().reverse());
  assert.equal(white[0],'a8');assert.equal(black[0],'h1');
  assert.deepEqual(boardSquareCenter('e4','white'),{x:56.25,y:56.25});
  assert.deepEqual(boardSquareCenter('e4','black'),{x:43.75,y:43.75});
});

test('KE-BOARD-004: rendering uses the owning document, retains supplied content before coordinates', () => {
  const nodes=[];
  const ownerDocument={createElement(tag){return {tag,dataset:{},children:[],appendChild(node){this.children.push(node);}};}};
  const board={ownerDocument,replaceChildren(){nodes.length=0;},appendChild(node){nodes.push(node);}};
  renderBoardSquares(board,{orientation:'black',decorate(node,name){if(name==='h1')node.appendChild({tag:'piece'});}});
  assert.equal(nodes.length,64);assert.equal(nodes[0].dataset.square,'h1');
  assert.deepEqual(nodes[0].children.map(node=>node.tag),['piece','small']);
  assert.equal(nodes[0].children[1].textContent,'1');
  assert.equal(nodes.at(-1).children[0].textContent,'a');
});

test('KE-BOARD-004: invalid host inputs fail before mounting rather than silently accepting malformed state', () => {
  const state={position:{a1:'K'},orientation:'white',selectedSquare:null,permissions:{select:true,move:true},legalMoves:['a1a2']};
  for(const altered of [{orientation:'sideways'},{position:{a9:'K'}},{position:{a1:'X'}},{legalMoves:['a1a1']},{legalMoves:['a1a2z']},{selectedSquare:'i1'},{arrows:[{from:'a1',to:'a1',label:'bad'}]}]) {
    assert.throws(()=>mountControlledBoard({}, {state:{...state,...altered}}),TypeError);
  }
});

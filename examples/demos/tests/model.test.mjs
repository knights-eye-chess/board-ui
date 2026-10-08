import {ChildNode} from 'chessops/pgn';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DemoGame, SCENARIOS} from '../src/model.mjs';

test('Chessops PGN nodes project into stable, nested strip cursors',()=>{
  const game=new DemoGame();
  assert.equal(game.root.data.parent,null);
  assert.equal(game.nodes.size,21);
  const strip=game.strip(),nested=strip.branches.find(b=>b.parentId);
  assert.equal(strip.branches.length,3);
  assert.equal(nested.moves[0].label,'d3');
  assert.equal(nested.anchor.kind,'branch');
  assert.equal(nested.anchor.branchId,nested.parentId);
  assert.ok(game.navigate(nested.moves[1].cursor));
  assert.equal(game.summary().move,'Bc5');
  assert.equal(game.board().position.c5,'b');
  assert.equal(game.board().position.d3,'P');
  assert.deepEqual(game.strip().selectedLine.slice(-2),nested.moves.map(m=>m.cursor));
  assert.ok(game.nodes.get(game.current.data.id)===game.current);
  game.command('previous');assert.equal(game.summary().move,'d3');
  game.command('next');assert.equal(game.summary().move,'Bc5');
  game.command('start');assert.equal(game.current,game.root);
});

test('legal events reuse PGN children or append a variation; all views share one position',()=>{
  const game=new DemoGame(),original=game.nodes.size;
  assert.equal(game.play('e2e5'),false);
  assert.equal(game.play('e2e4'),true);
  assert.equal(game.nodes.size,original);
  const canonical=game.current;
  assert.ok(canonical instanceof ChildNode);
  const white=game.board('white'),black=game.board('black'),mini=game.board('white','accepted-drag');
  assert.deepEqual(white.position,black.position);
  assert.deepEqual(black.position,mini.position);
  assert.equal(white.positionKey,mini.positionKey);
  assert.equal(mini.acceptedIntentId,'accepted-drag');
  assert.equal(black.acceptedIntentId,undefined);
  game.command('start');assert.equal(game.play('d2d4'),true);
  assert.equal(game.nodes.size,original+1);
  const cursor=game.current.data.cursor;
  assert.equal(cursor.kind,'branch');
  assert.ok(game.root.children.includes(canonical));
  assert.ok(game.nodes.get(game.current.data.id)===game.current);
  assert.equal(game.branches.find(b=>b.id===cursor.branchId).anchor.ply,1);
  game.command('start');game.play('d2d4');assert.equal(game.nodes.size,original+1);
  assert.deepEqual(game.current.data.cursor,cursor);
});

test('previous, next and end retain the chosen nested variation',()=>{
  const game=new DemoGame();
  const nested=game.branches.find(branch=>branch.parentId);
  game.navigate(nested.moves[1].cursor);
  game.command('previous');game.command('previous');
  assert.equal(game.summary().move,'Nf6');
  assert.deepEqual(game.strip().selectedLine.slice(-2),nested.moves.map(move=>move.cursor));
  game.command('next');assert.equal(game.summary().move,'d3');
  game.command('start');game.command('end');assert.equal(game.summary().move,'Bc5');
});

test('vertical branch navigation preserves ply and handles nested boundaries',()=>{
  const game=new DemoGame(),early=game.branches.find(b=>b.anchor.kind==='main'&&b.anchor.ply===4),
    later=game.branches.find(b=>b.anchor.kind==='main'&&b.anchor.ply===6),nested=game.branches.find(b=>b.parentId);
  const rows={[early.id]:40,[later.id]:80,[nested.id]:120};
  game.navigate(game.main[6].cursor);
  assert.equal(game.command('branchDown',rows),true);assert.deepEqual(game.current.data.cursor,early.moves[2].cursor);
  game.command('branchDown',rows);assert.deepEqual(game.current.data.cursor,later.moves[0].cursor);
  game.command('branchDown',rows);assert.deepEqual(game.current.data.cursor,nested.moves[0].cursor); // Later fork fallback.
  game.command('branchUp',rows);assert.deepEqual(game.current.data.cursor,later.moves[1].cursor);
  game.command('branchUp',rows);assert.deepEqual(game.current.data.cursor,early.moves[3].cursor);
  game.command('branchUp',rows);assert.deepEqual(game.current.data.cursor,game.main[7].cursor);
  assert.equal(game.command('branchUp',rows),false);
  game.navigate(nested.moves[1].cursor);game.command('start');game.command('end');
  assert.deepEqual(game.current.data.cursor,nested.moves[1].cursor,'chosen variation survives navigation');
  assert.equal(game.command('branchDown',rows),false,'last visible row has no downward destination');
  assert.equal(game.command('branchUp',{}),false,'no rendered row means no branch command');
  const long=new DemoGame('1. e4 e5 (1... c5 2. Nf3 d6 3. d4) *'),branch=long.branches[0];
  long.navigate(branch.moves.at(-1).cursor);long.command('branchUp',{[branch.id]:40});
  assert.deepEqual(long.current.data.cursor,long.main[2].cursor,'beyond main line returns to divergence');
});

test('castling retains conventional destinations and moves both pieces',()=>{
  const game=new DemoGame(SCENARIOS.castling);
  assert.ok(game.board().legalMoves.includes('e1g1'));
  assert.ok(game.board().legalMoves.includes('e1c1'));
  assert.ok(!game.board().legalMoves.includes('e1h1'));
  assert.equal(game.play('e1g1'),true);
  assert.equal(game.current.data.uci,'e1h1');
  assert.equal(game.summary().move,'O-O');
  assert.equal(game.board().position.g1,'K');assert.equal(game.board().position.f1,'R');
  assert.equal(game.board().position.h1,undefined);
  assert.deepEqual(game.board().lastMove,['e1','g1']);
  game.command('start');assert.equal(game.play('e1c1'),true);
  assert.equal(game.board().position.c1,'K');assert.equal(game.board().position.d1,'R');
});

test('underpromotion, en passant and checkmate reach correct shared snapshots',()=>{
  const game=new DemoGame(SCENARIOS.promotion);
  for(const piece of ['q','r','b','n'])assert.ok(game.board().legalMoves.includes('a7a8'+piece));
  assert.equal(game.play('a7a8'),false);
  assert.equal(game.play('a7a8n'),true);assert.equal(game.board().position.a8,'N');
  assert.equal(game.summary().status,'Draw: insufficient material');assert.equal(game.board().permissions.move,false);
  game.command('previous');assert.equal(game.board().position.a7,'P');
  const ep=new DemoGame('1. e4 a6 2. e5 d5 *');ep.command('end');
  assert.equal(ep.play('e5d6'),true);assert.equal(ep.board().position.d5,undefined);assert.equal(ep.board().position.d6,'P');
  const mate=new DemoGame('1. f3 e5 2. g4 Qh4# *');mate.command('end');
  assert.equal(mate.summary().status,'Checkmate');assert.equal(mate.board().permissions.move,false);
  assert.deepEqual(mate.board().legalMoves,[]);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { planPieceTransitions, validatePieceTransitionHint } from '../dist/piece-transitions.js';

const require=createRequire(import.meta.url);
const {chromium}=require('playwright');

 test('piece transition matching covers capture, en passant, castling, promotion and reverse jump',()=>{
  assert.doesNotThrow(()=>validatePieceTransitionHint({animate:false}));
  assert.throws(()=>validatePieceTransitionHint({from:'e2'}),TypeError);
  const capture=planPieceTransitions({e4:'P',d5:'p'},{d5:'P'},{from:'e4',to:'d5',captureSquare:'d5'});
  assert.deepEqual(capture.travels.map(({from,to})=>[from,to]),[['e4','d5']]);
  assert.deepEqual(capture.exits.map(({square,kind})=>[square,kind]),[['d5','capture']]);
  const enPassant=planPieceTransitions({e5:'P',d5:'p'},{d6:'P'},{from:'e5',to:'d6',captureSquare:'d5'});
  assert.deepEqual(enPassant.travels.map(({from,to})=>[from,to]),[['e5','d6']]);
  assert.deepEqual(enPassant.exits.map(item=>item.square),['d5']);
  const castle=planPieceTransitions({e1:'K',h1:'R'},{g1:'K',f1:'R'},{from:'e1',to:'g1',rookFrom:'h1',rookTo:'f1'});
  assert.deepEqual(new Set(castle.travels.map(({from,to})=>`${from}${to}`)),new Set(['e1g1','h1f1']));
  const promotion=planPieceTransitions({a7:'P'},{a8:'Q'},{from:'a7',to:'a8'});
  assert.deepEqual(promotion.travels.map(({from,to,changedIdentity})=>[from,to,changedIdentity]),[['a7','a8',true]]);
  const reverse=planPieceTransitions({a8:'Q'},{a7:'P'},{from:'a8',to:'a7',reversePromotion:true});
  assert.deepEqual(reverse.travels.map(({from,to,changedIdentity})=>[from,to,changedIdentity]),[['a8','a7',true]]);
 });

 test('KE-BOARD-004: native touch scrolls empty squares, drags pieces, and restores taps after cancellation',async()=>{
  const root=new URL('../',import.meta.url);
  const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(path==='/'){res.setHeader('content-type','text/html');res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div style="height:60px"></div><div id="host" style="width:375px"></div><div style="height:1800px"></div></body>');return;}const file=new URL('.'+path,root);if(!file.href.startsWith(root.href))throw Error('path');res.setHeader('content-type',path.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(readFileSync(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.evaluate(async()=>{
      const {mountControlledBoard}=await import('/dist/controlled-board.js');
      window.events=[];window.state={position:{e2:'P',e7:'p'},orientation:'white',selectedSquare:null,positionKey:'touch',permissions:{select:true,move:true,draggable:true},legalMoves:['e2e4']};
      window.instance=mountControlledBoard(document.querySelector('#host'),{state:window.state,pieceUrl:()=> 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/%3E',onSelect(square){window.events.push(['select',square]);window.state={...window.state,selectedSquare:square};window.instance.update(window.state);},onMove(intent){window.events.push(['move',intent.uci]);},onDragStart(from){window.events.push(['start',from]);},onDragCancel(from){window.events.push(['cancel',from]);}});
    });
    const cdp=await page.context().newCDPSession(page);
    const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1,radiusX:1,radiusY:1,force:1}]});
    const center=async square=>{const rect=await page.locator(`#host .sq[data-square="${square}"]`).boundingBox();return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};};
    async function swipeEmpty(){
      const start=await center('d4');await touch('touchStart',start.x,start.y);
      for(let step=1;step<=8;step++){await touch('touchMove',start.x,start.y-step*15);await page.waitForTimeout(20);}
      await touch('touchEnd');await page.waitForFunction(()=>window.scrollY>50);
      assert.equal(await page.locator('body > img.drag-piece').count(),0);
      assert.equal((await page.evaluate(()=>window.events)).some(event=>event[0]==='move'),false);
    }
    await swipeEmpty();
    // Stop native momentum before the next independent gesture.
    await page.waitForTimeout(600);await page.evaluate(()=>{window.scrollTo(0,0);window.state={...window.state,permissions:{select:false,move:false}};window.instance.update(window.state);});
    await swipeEmpty();
    await page.waitForTimeout(600);await page.evaluate(()=>{window.scrollTo(0,0);window.state={...window.state,permissions:{select:true,move:true,draggable:true}};window.instance.update(window.state);});
    const from=await center('e2'),to=await center('e4');
    await touch('touchStart',from.x,from.y);await touch('touchMove',to.x,to.y);
    assert.equal(await page.locator('body > img.drag-piece').count(),1);
    assert.equal(await page.locator('#host .sq[data-square="e4"].drag-target-hover').count(),1);
    assert.equal(await page.evaluate(()=>window.scrollY),0);
    await touch('touchEnd');await page.waitForTimeout(30);
    assert.deepEqual((await page.evaluate(()=>window.events)).filter(event=>event[0]==='move'),[['move','e2e4']]);
    for(const cancel of ['touchCancel','blur','update','cancelGesture']){
      await page.evaluate(()=>{window.events=[];window.state={...window.state,selectedSquare:null};window.instance.update(window.state);});
      await touch('touchStart',from.x,from.y);await touch('touchMove',to.x,to.y);
      assert.equal(await page.locator('body > img.drag-piece').count(),1);
      if(cancel==='touchCancel')await touch('touchCancel');
      // Complete the canceled native input too; a synthetic window blur alone
      // does not reset Chromium's touch gesture recognizer.
      else {await page.evaluate(reason=>{if(reason==='blur')window.dispatchEvent(new Event('blur'));else if(reason==='update'){window.state={...window.state,positionKey:window.state.positionKey+'!'};window.instance.update(window.state);}else window.instance.cancelGesture();},cancel);await touch('touchCancel');}
      await page.locator('body > img.drag-piece').waitFor({state:'detached',timeout:3000});
      assert.equal(await page.locator('body > img.drag-piece').count(),0,cancel);
      await page.waitForTimeout(30);
      await page.touchscreen.tap(from.x,from.y);
      assert.equal(await page.evaluate(()=>window.state.selectedSquare),'e2',`${cancel} must not swallow the next tap: ${JSON.stringify(await page.evaluate(()=>window.events))}`);
      assert.deepEqual((await page.evaluate(()=>window.events)).filter(event=>event[0]==='cancel'),[['cancel','e2']],cancel);
    }
    assert.deepEqual(errors,[]);await cdp.detach();await page.close();
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
 });

 test('browser drag survives synchronous selection update, keeps image nodes on overlay update, and avoids replay animation',async()=>{
  const root=new URL('../',import.meta.url);
  const server=createServer((req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(path==='/'){res.setHeader('content-type','text/html');res.end('<div id="host" style="width:400px"></div>');return;}const file=new URL('.'+path,root);if(!file.href.startsWith(root.href))throw Error('path');res.setHeader('content-type',path.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(readFileSync(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.evaluate(async()=>{
      const {mountControlledBoard}=await import('/dist/controlled-board.js');
      const tiny='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="8" height="8"%3E%3Ccircle cx="4" cy="4" r="3"/%3E%3C/svg%3E';
      window.events=[];window.acceptMoves=true;
      window.state={position:{e2:'P'},orientation:'white',selectedSquare:'e2',positionKey:'first',permissions:{select:true,move:true,draggable:true},legalMoves:['e2e4']};
      window.instance=mountControlledBoard(document.querySelector('#host'),{state:window.state,pieceUrl:()=>tiny,onSelect(square){window.events.push(['select',square]);window.state={...window.state,selectedSquare:square,legalMoves:square?['e2e4']:[]};window.instance.update(window.state);},onMove(intent){window.events.push(['move',intent.uci,intent.source]);window.state={...window.state,position:{e4:'P'},positionKey:'second',selectedSquare:null,legalMoves:[],transition:{from:intent.from,to:intent.to},acceptedIntentId:window.acceptMoves?intent.intentId:undefined};window.instance.update(window.state);},onDragStart(from){window.events.push(['start',from]);},onDragCommit(detail){window.events.push(['commit',detail.from,detail.to,detail.accepted]);}});
      const shadow=document.querySelector('#host').firstElementChild.shadowRoot;
      window.originalImage=shadow.querySelector('.sq[data-square="e2"] .piece img');
      window.state={...window.state,highlights:['a1'],badges:[{square:'a1',label:'Hint',text:'!'}]};window.instance.update(window.state);
      window.imageRetained=window.originalImage===shadow.querySelector('.sq[data-square="e2"] .piece img');
    });
    assert.equal(await page.evaluate(()=>window.imageRetained),true);
    const from=await page.locator('#host .sq[data-square="e2"]').boundingBox(),to=await page.locator('#host .sq[data-square="e4"]').boundingBox();
    const x=from.x+from.width/2,y=from.y+from.height/2;
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+6,y);
    assert.equal(await page.locator('body > img.drag-piece').count(),0);
    await page.mouse.move(x+8,y);
    assert.equal(await page.locator('body > img.drag-piece').count(),1);
    assert.equal(await page.locator('#host .sq.selected,#host .sq.target').count(),0);
    await page.evaluate(()=>{window.instance.updateAppearance({themeTokens:{light:'#ffeedd'},coordinates:{visible:false,size:14},animation:{durationMs:300}});window.instance.updateOverlays('reference',{highlights:['a1'],arrows:[{from:'e2',to:'e4',label:'Reference',tag:'reference'}]});});
    assert.equal(await page.locator('#host svg.arrows[data-tag="reference"]').count(),1);
    assert.equal(await page.locator('body > img.drag-piece').count(),1);
    await page.mouse.move(to.x+to.width/2,to.y+to.height/2);
    assert.equal(await page.locator('#host .sq[data-square="e4"].drag-target-hover').count(),1);
    await page.mouse.up();
    assert.deepEqual(await page.evaluate(()=>window.events),[['start','e2'],['select',null],['commit','e2','e4',true],['move','e2e4','drag']]);
    assert.equal(await page.locator('#host .sq[data-square="e4"] .piece.moved').count(),0);
    assert.equal(await page.locator('body > img.drag-piece').count(),0);
    assert.match(await page.evaluate(()=>window.state.acceptedIntentId),/^board-\d+:\d+$/);
    await page.evaluate(()=>window.instance.updateOverlays('reference',null));
    assert.equal(await page.locator('#host svg.arrows[data-tag="reference"]').count(),0);
    await page.evaluate(()=>{window.acceptMoves=false;window.state={...window.state,position:{e2:'P'},positionKey:'new-drag',selectedSquare:null,legalMoves:['e2e4'],transition:{animate:false},acceptedIntentId:undefined};window.instance.update(window.state);});
    const fromAgain=await page.locator('#host .sq[data-square="e2"]').boundingBox(),toAgain=await page.locator('#host .sq[data-square="e4"]').boundingBox();
    await page.mouse.move(fromAgain.x+fromAgain.width/2,fromAgain.y+fromAgain.height/2);await page.mouse.down();
    await page.mouse.move(toAgain.x+toAgain.width/2,toAgain.y+toAgain.height/2,{steps:3});await page.mouse.up();
    assert.equal(await page.locator('#host .sq[data-square="e4"] .piece.moved').count(),1);
    await page.evaluate(()=>{window.acceptMoves=true;window.state={...window.state,badges:[{square:'e4',label:'Best move',icon:'best'}]};window.instance.update(window.state);window.instance.updateAppearance({qualityColors:{best:'#123456'}});});
    assert.equal((await page.locator('#host .badge img').getAttribute('src')).startsWith('data:image/svg+xml,'),true);
    await page.evaluate(()=>{window.state={...window.state,position:{e2:'P'},positionKey:'reverse',transition:{from:'e4',to:'e2'},lastMove:['e4','e2'],badges:[]};window.instance.update(window.state);});
    assert.equal(await page.locator('#host .sq[data-square="e2"] .piece.moved').count(),1);
    await page.evaluate(()=>{window.state={...window.state,position:{e2:'P',d3:'p'},positionKey:'capture-before',transition:{animate:false},lastMove:[]};window.instance.update(window.state);window.state={...window.state,position:{d3:'P'},positionKey:'capture-after',transition:{from:'e2',to:'d3',captureSquare:'d3'},lastMove:['e2','d3']};window.instance.update(window.state);});
    assert.equal(await page.locator('#host .sq[data-square="d3"] .piece.capture-animating').count(),1);
    const legacyBoard=await page.evaluate(()=>{
      window.state={...window.state,position:{h7:'Q'},positionKey:'badge-before',selectedSquare:null,legalMoves:[],badges:[],transition:{animate:false}};window.instance.update(window.state);
      window.state={...window.state,position:{h8:'Q'},positionKey:'badge-after',lastMove:['h7','h8'],badges:[{square:'h8',label:'Best move',icon:'best'}],transition:{from:'h7',to:'h8'}};window.instance.update(window.state);
      const shadow=document.querySelector('#host').firstElementChild.shadowRoot,board=shadow.querySelector('.board'),piece=shadow.querySelector('.sq[data-square="h8"] .piece'),badge=piece.querySelector('.badge');
      const travel=piece.getAnimations().find(animation=>animation.animationName==='travel');travel.pause();travel.currentTime=100;
      const hidden=getComputedStyle(badge).opacity;travel.currentTime=200;
      const visible=getComputedStyle(badge).opacity;travel.currentTime=300;const box=badge.getBoundingClientRect(),bounds=board.getBoundingClientRect(),badgeFilter=getComputedStyle(badge.querySelector('img')).filter;
      window.instance.updateOverlays('legacy-reference',{highlights:[{square:'h8',tag:'answer-reference'},{square:'a1',tag:'custom'}],arrows:[{from:'h7',to:'h8',label:'Reference',tag:'reference',shadow:true},{from:'a1',to:'a2',label:'Plain',tag:'plain'}]});
      const square=shadow.querySelector('.sq[data-square="h8"]'),outline=getComputedStyle(square,':before');
      return {hostShadow:getComputedStyle(document.querySelector('#host')).boxShadow,boardShadow:getComputedStyle(board).boxShadow,overflow:getComputedStyle(board).overflow,pieceZ:getComputedStyle(piece).zIndex,willChange:getComputedStyle(piece).willChange,badgeWidth:box.width,badgeTop:box.top-bounds.top,badgeRight:bounds.right-box.right,opacity:[hidden,visible],badgeFilter,referenceBorder:outline.borderTopWidth,referenceRadius:outline.borderTopLeftRadius,referenceShadow:outline.boxShadow,referencePreservesMove:getComputedStyle(square).boxShadow.includes('999px'),genericHighlight:getComputedStyle(shadow.querySelector('.sq[data-square="a1"]'),':before').borderTopWidth,arrowFilter:getComputedStyle(shadow.querySelector('[data-arrow-tag="reference"]')).filter,plainArrowFilter:getComputedStyle(shadow.querySelector('[data-arrow-tag="plain"]')).filter};
    });
    assert.equal(legacyBoard.hostShadow,'none');assert.notEqual(legacyBoard.boardShadow,'none');
    assert.deepEqual([legacyBoard.overflow,legacyBoard.pieceZ,legacyBoard.willChange],['visible','8','transform']);
    assert.deepEqual([legacyBoard.badgeWidth,legacyBoard.badgeTop,legacyBoard.badgeRight],[25,-8,1]);
    assert.deepEqual(legacyBoard.opacity,['0','1'],'legacy travel reveals the classification icon halfway through');assert.equal(legacyBoard.badgeFilter,'none','classification SVGs do not inherit the piece sprite shadow');
    assert.deepEqual([legacyBoard.referenceBorder,legacyBoard.referenceRadius,legacyBoard.referencePreservesMove,legacyBoard.genericHighlight],['3px','12%',true,'3px']);
    assert.notEqual(legacyBoard.referenceShadow,'none');assert.match(legacyBoard.arrowFilter,/drop-shadow/);assert.equal(legacyBoard.plainArrowFilter,'none');
    await page.evaluate(()=>window.instance.updateOverlays('legacy-reference',null));
    await page.evaluate(()=>{window.state={...window.state,position:{a7:'P'},positionKey:'promotion',selectedSquare:'a7',legalMoves:['a7a8q','a7a8r','a7a8b','a7a8n'],badges:[],transition:{animate:false}};window.instance.update(window.state);});
    await page.locator('#host .sq[data-square="a8"]').click();
    assert.equal(await page.locator('#host [role="dialog"]').count(),1);
    await page.evaluate(()=>window.instance.updateAppearance({themeTokens:{dark:'#112233',dialog:'#232825',dialogText:'#eef4f0'},coordinates:{visible:true,size:16}}));
    assert.equal(await page.locator('#host [role="dialog"]').count(),1);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>document.querySelector('#host').firstElementChild.shadowRoot.activeElement.getAttribute('aria-label')),'Promote to rook');
    const promotionStyle=await page.evaluate(()=>{const shadow=document.querySelector('#host').firstElementChild.shadowRoot,panel=shadow.querySelector('.promotion-panel'),button=shadow.activeElement,img=button.querySelector('img'),style=getComputedStyle(button);return {padding:[style.paddingTop,style.paddingRight],radius:style.borderTopLeftRadius,imageWidth:img.getBoundingClientRect().width,imageDisplay:getComputedStyle(img).display,outline:[style.outlineWidth,style.outlineOffset],panelColors:[getComputedStyle(panel).backgroundColor,getComputedStyle(panel).color]};});
    assert.deepEqual(promotionStyle,{padding:['7px','2px'],radius:'11px',imageWidth:64,imageDisplay:'block',outline:['3px','2px'],panelColors:['rgb(35, 40, 37)','rgb(238, 244, 240)']});
    await page.locator('#host .promotion').click({position:{x:5,y:5}});
    assert.equal(await page.locator('#host [role="dialog"]').count(),0);
    await page.locator('#host .sq[data-square="a8"]').click();
    assert.equal(await page.locator('#host [role="dialog"]').count(),1);
    await page.evaluate(()=>{window.state={...window.state,positionKey:'stale'};window.instance.update(window.state);});
    assert.equal(await page.locator('#host [role="dialog"]').count(),0);
    const restored=await page.evaluate(async()=>{window.instance.dispose();const host=document.querySelector('#host');host.style.setProperty('box-shadow','1px 2px 3px rgb(12, 34, 56)','important');const original=host.style.boxShadow;const {mountControlledBoard}=await import('/dist/controlled-board.js');const next=mountControlledBoard(host,{state:window.state,onSelect(){},onMove(){},pieceUrl:()=> 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E'});const mounted=host.style.boxShadow;next.dispose();const disposed=host.style.boxShadow;let failed=false;try{mountControlledBoard(host,{state:window.state,onSelect(){},onMove(){},pieceUrl(){throw new Error('asset failure');}});}catch{failed=true;}return {mounted,restored:disposed===original,failed,failureRestored:host.style.boxShadow===original&&host.style.getPropertyPriority('box-shadow')==='important'};});
    assert.deepEqual(restored,{mounted:'none',restored:true,failed:true,failureRestored:true});
    assert.deepEqual(errors,[]);
    await page.close();
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
 });

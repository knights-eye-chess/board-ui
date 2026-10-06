/** Capture the actual library without image manipulation. */
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const server=createServer((req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=new URL('.'+pathname,root);
  if(!file.href.startsWith(root.href))throw Error('Outside repository');
  res.setHeader('content-type',pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.png')?'image/png':'text/html');
  res.end(readFileSync(file));
 }catch{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
 const page=await browser.newPage({viewport:{width:800,height:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/examples/standalone.html`);
 await page.waitForFunction(()=>window.ready);
 await page.evaluate(()=>{
  document.querySelector('main').style.maxWidth='640px';
  const position={};
  for(let i=0;i<8;i++){
   const file='abcdefgh'[i];position[file+'8']='rnbqkbnr'[i];position[file+'7']='p';
   position[file+'2']='P';position[file+'1']='RNBQKBNR'[i];
  }
  delete position.e2;position.e4='P';
  delete position.e7;position.e5='p';
  window.boardDemo.set({...window.demoState,position,positionKey:'docs:after-e4-e5',selectedSquare:'g1',legalMoves:['g1f3','g1h3'],lastMove:['e7','e5'],badges:[{square:'g1',label:'Host-defined suggested piece',text:'!',background:'#7856bb',color:'white'}],arrows:[{from:'g1',to:'f3',label:'Host-defined knight development',color:'#7856bb',opacity:0.7}]});
 });
 await page.waitForFunction(()=>[...document.querySelector('#board').firstElementChild.shadowRoot.querySelectorAll('img')].every(img=>img.complete&&img.naturalWidth>0));
 assert.equal(await page.locator('#board .sq').count(),64);
 assert.equal(await page.locator('#board .piece img').count(),32);
 assert.deepEqual(errors,[]);
 mkdirSync(new URL('docs/screenshots/',root),{recursive:true});
 await page.locator('#board').screenshot({path:new URL('docs/screenshots/board.png',root).pathname});
 console.log('Captured 64 squares, 32 loaded original sprites and host overlays; no browser errors.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}

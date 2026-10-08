import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium,webkit} from 'playwright';
import {demoServer} from '../serve.mjs';

// Exercise the same subpath as GitHub Pages, not only a root-mounted server.
const server=demoServer({basePath:'/board-ui/'});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/board-ui`;
const engine=process.env.DEMO_BROWSER||'chromium';
assert.ok(['chromium','webkit'].includes(engine),'Supported browser engine');
const browser=await ({chromium,webkit}[engine]).launch({headless:true,...(engine==='chromium'&&process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:engine==='chromium'?['--no-sandbox']:[]});
const out=fileURLToPath(new URL(`../dist/qualification/${engine}/`,import.meta.url));mkdirSync(out,{recursive:true});
const results=[];
try {
  for(const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:1000},isMobile:width<650,hasTouch:width<650}),errors=[],outside=[],failed=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
    await page.route('**/*',route=>{if(!route.request().url().startsWith(base)){outside.push(route.request().url());return route.abort()}return route.continue()});
    const sq=(view,square)=>page.locator(`#${view}-viewer .sq[data-square="${square}"]`);
    const move=async(view,from,to)=>{await sq(view,from)[width<650?'tap':'click']();await sq(view,to)[width<650?'tap':'click']()};
    const snapshot=()=>page.locator('#snapshot').evaluate(e=>JSON.parse(e.textContent));
    const current=()=>page.locator('#current-move').textContent();
    const imagesLoaded=async()=>{await page.waitForFunction(()=>{
      const images=[];const collect=root=>{images.push(...root.querySelectorAll('img'));for(const e of root.querySelectorAll('*'))if(e.shadowRoot)collect(e.shadowRoot)};collect(document);
      return images.length>0&&images.every(i=>i.complete&&i.naturalWidth>0);
    })};
    await page.goto(base+'/');await page.locator('#white-viewer .sq').first().waitFor();await imagesLoaded();
    assert.equal(await page.locator('.sq').count(),192);
    assert.equal(await page.locator('.viewport').count(),1);
    assert.ok((await page.locator('#shared-strip').boundingBox()).width>width*.8);
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.equal(await page.locator('#theme-toggle').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#shared-strip .icon-slot').count(),0);
    const stripText=()=>page.locator('#shared-strip .san').first().evaluate(e=>getComputedStyle(e).color);
    assert.equal(await stripText(),'rgb(232, 240, 234)');
    await page.locator('#theme-toggle').click();assert.equal(await stripText(),'rgb(34, 49, 46)');
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('#black-viewer .sq').first().getAttribute('data-square'),'h1');
    await move('white','e2','e4');assert.equal(await current(),'e4');
    await move('black','e7','e5');assert.equal(await current(),'e5');
    await move('mini','g1','f3');assert.equal(await current(),'Nf3');
    for(const view of ['white','black','mini']) {
      assert.equal(await sq(view,'e4').locator('img[data-piece="P"]').count(),1);
      assert.equal(await sq(view,'f3').locator('img[data-piece="N"]').count(),1);
      assert.equal(await page.locator('#shared-strip button[aria-current="true"]').getAttribute('data-cursor'),'m:3');
    }
    // Transport in any instance navigates all three, including a flipped board.
    await page.getByRole('button',{name:'Previous move'}).click();assert.equal(await current(),'e5');
    await page.getByRole('button',{name:'Next move'}).click();assert.equal(await current(),'Nf3');
    await page.locator('#start').click();
    // Add a legal alternative by dragging. Only the source receives acceptedIntentId.
    const from=await sq('white','b1').boundingBox(),to=await sq('white','c3').boundingBox();
    await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:10});await page.mouse.up();
    assert.equal(await current(),'Nc3');assert.equal((await snapshot()).positions,22);
    for(const view of ['white','black','mini'])assert.equal(await sq(view,'c3').locator('img[data-piece="N"]').count(),1);
    await page.locator('#reset').click();
    // Activate the fixture's nested branch from the one shared strip.
    await page.locator('#end').click();
    const nested=page.locator('#shared-strip .branch-segment.nested button').filter({has:page.locator('.san',{hasText:'d3'})}).first();
    await nested.click();assert.equal(await current(),'d3');
    for(const view of ['white','black','mini'])assert.equal(await sq(view,'d3').locator('img[data-piece="P"]').count(),1);
    // Navigate adjacent visible rows from each board, retaining the same ply.
    for(const [view,expected] of [['white','O-O'],['black','Nf3'],['mini','Ba4']]){
      await sq(view,'e4').focus();await page.keyboard.press('ArrowUp');assert.equal(await current(),expected);
    }
    await page.locator('#shared-strip button[aria-current="true"]').focus();
    for(const expected of ['Nf3','O-O','d3']){
      await page.keyboard.press('ArrowDown');assert.equal(await current(),expected);
      assert.equal(await page.locator('#shared-strip button[aria-current="true"]').evaluate(b=>b===b.getRootNode().activeElement),true);
    }
    await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');assert.equal(await current(),'Bc5');
    for(const view of ['white','black','mini'])assert.equal(await sq(view,'c5').locator('img[data-piece="b"]').count(),1);
    await page.locator('#scenario').selectOption('promotion');await move('mini','a7','a8');
    await page.getByRole('button',{name:'Promote to knight'}).click();
    assert.equal(await page.locator('#status').textContent(),'Draw: insufficient material');
    for(const view of ['white','black','mini'])assert.equal(await sq(view,'a8').locator('img[data-piece="N"]').count(),1);
    await page.locator('#scenario').selectOption('castling');await move('black','e1','g1');
    assert.equal(await current(),'O-O');
    for(const view of ['white','black','mini'])assert.equal(await sq(view,'f1').locator('img[data-piece="R"]').count(),1);
    await sq('black','g1').focus();await page.keyboard.press('Home');assert.equal(await current(),'Starting position');
    await page.locator('#scenario').selectOption('opening');await move('white','e2','e4');await move('black','e7','e5');await move('mini','g1','f3');
    await imagesLoaded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.waitForTimeout(250); // Finish the demo's 200ms piece travel before the receipt.
    await page.screenshot({path:out+`three-views-${width}.png`,fullPage:true});

    await page.goto(base+'/gallery.html');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.locator('#theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.locator('#theme-toggle').click();
    await page.locator('#gallery-viewer .sq').first().waitFor();await imagesLoaded();
    const form=page.locator('#appearance-controls'),board=page.locator('#gallery-viewer');
    await form.locator('[name="theme"]').selectOption('midnight');
    assert.equal(await board.locator('.sq.light').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(205, 214, 229)');
    await form.locator('[name="pieces"]').selectOption('outlined-silhouette');
    await form.locator('[name="icons"]').selectOption('diamond-marks');
    await imagesLoaded();
    assert.ok((await board.locator('.sq[data-square="e1"] img[data-piece="K"]').getAttribute('src')).endsWith('/custom/pieces/wk.svg'));
    assert.ok((await board.locator('.badge[aria-label="Host-defined saved idea"] img').getAttribute('src')).endsWith('/custom/icons/bookmark.svg'));
    assert.equal(await board.locator('.icon').count(),12);
    await form.locator('[name="arrow"]').selectOption('arrow-chevron-head');
    assert.equal(await board.locator('svg[data-arrow-style="arrow-chevron-head"]').count(),2);
    await form.locator('[name="coordinates"]').uncheck();
    assert.equal(await board.locator('.rank').first().evaluate(e=>getComputedStyle(e).display),'none');
    assert.ok((await board.locator('.sq[data-square="a1"]').getAttribute('aria-label')).includes('a1'));
    await form.locator('[name="coordinates"]').check();
    await form.locator('[name="size"]').fill('20');await form.locator('[name="size"]').dispatchEvent('input');
    assert.equal(await board.locator('.rank').first().evaluate(e=>getComputedStyle(e).fontSize),'20px');
    await form.locator('[name="orientation"]').selectOption('black');assert.equal(await board.locator('.sq').first().getAttribute('data-square'),'h1');
    await form.locator('[name="animation"]').fill('1000');await form.locator('[name="animation"]').dispatchEvent('input');
    await page.locator('#replay').click();assert.equal(await board.locator('.sq[data-square="g1"] img[data-piece="N"]').count(),1);
    await page.waitForFunction(()=>{
      const root=document.querySelector('#gallery-viewer [data-board]').firstElementChild.shadowRoot;
      return root.querySelector('.piece.moved') && getComputedStyle(root.querySelector('.piece.moved')).animationDuration==='1s';
    });
    await form.locator('[name="animation"]').fill('0');await form.locator('[name="animation"]').dispatchEvent('input');
    await page.locator('#replay').click();assert.equal(await board.locator('.sq[data-square="f3"] img[data-piece="N"]').count(),1);
    assert.equal(await board.locator('.piece.moved').count(),0);
    await form.locator('[name="arrows"]').uncheck();assert.equal(await board.locator('svg.arrows').count(),0);
    await form.locator('[name="arrows"]').check();await imagesLoaded();
    // Custom-only IDs must leave the board before changing back to bundled icons.
    // Check complete geometry during travel and after settling, not just the knight.
    const intactGrid=async()=>{
      const geometry=await board.locator('.board').evaluate(b=>{
        const rect=b.getBoundingClientRect(),squares=[...b.querySelectorAll('.sq')];
        return {count:squares.length,rows:b.querySelectorAll('[role="row"]').length,
          correct:squares.every((sq,i)=>{const r=sq.getBoundingClientRect();return Math.abs(r.width-rect.width/8)<.1&&Math.abs(r.height-rect.height/8)<.1&&Math.abs(r.x-rect.x-i%8*rect.width/8)<.1&&Math.abs(r.y-rect.y-Math.floor(i/8)*rect.height/8)<.1})};
      });
      assert.deepEqual(geometry,{count:64,rows:8,correct:true},`${engine}: full eight-by-eight board`);
      assert.equal(await board.locator('svg.arrows').count(),2);
    };
    await form.locator('[name="animation"]').fill('200');await form.locator('[name="animation"]').dispatchEvent('input');
    for(const orientation of ['black','white'])for(const pieces of ['glossy','outlined-silhouette']) {
      await form.locator('[name="orientation"]').selectOption(orientation);
      await form.locator('[name="pieces"]').selectOption(pieces);
      for(const icons of ['diamond-marks','quality','diamond-marks','quality']) {
        await form.locator('[name="icons"]').selectOption(icons);await intactGrid();
        const custom=icons==='diamond-marks';
        assert.equal(await board.locator(`.badge[aria-label="${custom?'Host-defined saved idea':'Book icon sample'}"]`).count(),1);
        assert.equal(await board.locator(`.badge[aria-label="${custom?'Book icon sample':'Host-defined saved idea'}"]`).count(),0);
        await page.locator('#replay').click();await intactGrid();
        assert.equal(await board.locator('.piece.moved').count(),1);
        await page.waitForTimeout(250);await intactGrid();
      }
    }

    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:out+`appearance-${width}.png`,fullPage:true});
    assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);assert.deepEqual(failed,[]);
    for(const file of ['LICENSE','LICENSE-GPL','LICENSE-ARTWORK','THIRD-PARTY.txt','source/board-ui-demo-source.tar.gz']) {
      const response=await page.request.get(base+'/'+file);assert.equal(response.status(),200,file);
    }
    results.push({engine,width,branchKeyboard:true,plainMoves:true,iconSetRoundTrips:true,replayGridGeometry:true,pagesSubpath:true,sourceDownload:true,licenseFiles:true,sharedFullWidthStrip:true,darkModePersistence:true,synchronized:true,nestedVariation:true,drag:true,underpromotion:true,castling:true,keyboard:true,customAssets:true,customArrow:true,coordinates:true,animation:true,overflow:false,externalRequests:outside,pageErrors:errors});await page.close();
  }
} finally {await browser.close();await new Promise(resolve=>server.close(resolve))}
writeFileSync(out+'browser-results.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));

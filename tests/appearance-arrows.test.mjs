import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { boardSquareCenter } from '../dist/controlled-board-renderer.js';
import { createBoardAppearance, defaultBoardAppearance, DEFAULT_QUALITY_COLORS, DEFAULT_QUALITY_DEFINITIONS, resolveAppearanceAsset, resolveAppearanceSelection, resolveIconPresentation } from '../dist/appearance.js';
import { ARROW_STYLE_SLIM, ARROW_STYLE_BROAD, ARROW_STYLE_ROUNDED, DEFAULT_ARROW_STYLES, renderArrowSvg } from '../dist/arrows.js';

const hash = value => createHash('sha256').update(value).digest('hex');

// Golden path hashes were captured from knightseye-net/lib/widget-template-script.ts
// drawArrow on 2026-10-07, for source kinds candidate, alternative and legacy-alternative.
// Rows cover a straight move, knight move and one-square move in both orientations.
const productionPaths = [
  ['white','e2e4',1,['f2ee3653e239f44a5d209635f33fede3b82c713bb0f377a7f3f143ce4b847d4b','02d5cc6220fb5f5a12eea1e4f0723a357456d0ccbf6bc1c810c951f665f09187','f585e3d0225cda8365a814eb92cbba4cf30d370a0a180a71bc704aa68e6f469d']],
  ['white','g1f3',.88,['df3d0904a33e1cd371da286e6dbf0f2024c548cf05b1fac58299d0502a1de317','a5a7041145197f524c559cb79404e9a07f84f32d0237290dff6c152a06f0a137','d55646e293157c950d5c892c79ec25b59df94c2ba600b84fc41b2cfb770c84fe']],
  ['white','b7b8',1.2,['230d731c7daa1f7b202f5bae4fffff06a3fffbea3d3dab1d2034f5ee1e759322','cc53785758a1c0bc2eb12e69d68b51a41abce4b052c21e9beaf974bb8ce5f028','5eff7d4bb45e874089fd685ae34375760e6d9a476784dade7b6234f5884b27b9']],
  ['black','e2e4',1,['c5e0f74a32654d5b8074de36134a02c4ee6d9feca68ad4c12bca602cd79667bc','07c7ea5af563ff2bcdb8317052d5fb0bf601f7539dfb87b1f85ab816e8bcf1cd','1d740f81b809fe6a68d3e654abe5db33183d5bb1e5fcede638555d47f26779f1']],
  ['black','g1f3',.88,['d6c47f68330ca8193ee18d56b8ccb6da243cc2a1e0bb188cf3633de7c0af61fb','bb2ea38e9d4a424d216947256abf80e9d88491d15a49003529db7956c9199ccd','bc30a3b0d1ce157bf04bbafdbb9d7b1ba08b070039eee6cef3457f3970c1b119']],
  ['black','b7b8',1.2,['866f65ea45dbb922fe7a66cd7b1f04a30708f21cb2e287707202f17921d025da','c8a294b9b7113aae0b33afe46ef342adcb4da4dda8073e13854b5a22bb782cdb','4c03672c58394843fb765ddc63a18670a67908f1f1d3ab2760c1eb6c82da5b9c']],
];

test('all default arrow paths match production geometry goldens', () => {
  const styles=[ARROW_STYLE_SLIM,ARROW_STYLE_BROAD,ARROW_STYLE_ROUNDED];
  for (const [orientation,uci,weight,goldens] of productionPaths) {
    const from=boardSquareCenter(uci.slice(0,2),orientation),to=boardSquareCenter(uci.slice(2,4),orientation);
    const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
    for (let index=0;index<styles.length;index++) {
      const layers=DEFAULT_ARROW_STYLES[styles[index]]({from,to,unit:{x:dx/length,y:dy/length},weight,color:'#a571ea',opacity:1,outlineOpacity:.88}).layers;
      assert.equal(hash(layers[0].d),goldens[index],`${orientation} ${uci} ${styles[index]}`);
      assert.equal(layers[0].fill,'#a571ea');
      assert.equal(layers[0].fillOpacity,index===1 ? .46 : .4);
      assert.equal(Boolean(layers[0].outline),index!==1);
    }
  }
});

function fakeDocument() {
  const node = tag => ({tag,attributes:{},children:[],style:{},setAttribute(key,value){this.attributes[key]=String(value);},append(...children){this.children.push(...children);},appendChild(child){this.children.push(child);}});
  return {createElementNS(_namespace,tag){return node(tag);}};
}

test('renderer owns masks, layer order and accessible labels; custom shapes use the same path', () => {
  const document=fakeDocument();
  const options={from:'g1',to:'f3',orientation:'white',style:ARROW_STYLE_ROUNDED,color:'#abc123',label:'Suggested move',layer:24,tag:'host-reference'};
  const first=renderArrowSvg(document,options),second=renderArrowSvg(document,options);
  assert.equal(first.attributes['aria-label'],'Suggested move');
  assert.equal(first.attributes.role,'img');
  assert.equal(first.style.zIndex,'24');
  assert.equal(first.attributes['data-tag'],'host-reference');
  assert.equal(first.children[0].tag,'defs');
  assert.equal(first.children[1].tag,'path');
  assert.equal(first.children[2].tag,'path');
  assert.notEqual(first.children[0].children[0].attributes.id,second.children[0].children[0].attributes.id);
  const custom=createBoardAppearance({arrowStyles:{'my-double':geometry => ({layers:[{d:`M ${geometry.from.x} ${geometry.from.y} L ${geometry.to.x} ${geometry.to.y}`,fill:geometry.color,fillOpacity:geometry.opacity}]})}});
  const svg=renderArrowSvg(document,{...options,style:'my-double',catalogue:custom,label:undefined});
  assert.equal(svg.attributes['aria-hidden'],'true');
  assert.equal(svg.children.length,1);
  assert.match(svg.children[0].attributes.d,/^M 81\.25 93\.75 L 68\.75 68\.75$/);
  assert.throws(()=>renderArrowSvg(document,{...options,style:'missing'}),/Unknown arrow style/);
});

test('default assets, labels, palette and provenance match the imported artwork', () => {
  const catalogue=defaultBoardAppearance, selection=resolveAppearanceSelection(catalogue);
  assert.equal(Object.keys(selection.pieceSet.pieces).length,12);
  assert.deepEqual(Object.keys(selection.iconSet.icons),DEFAULT_QUALITY_DEFINITIONS.map(item=>item.name));
  for (const item of DEFAULT_QUALITY_DEFINITIONS) {
    assert.deepEqual(selection.iconSet.icons[item.name],{asset:`icons/${item.file}`,color:item.color,label:item.label,group:item.group,scale:1});
    assert.equal(DEFAULT_QUALITY_COLORS[item.name],item.color);
  }
  const manifest=JSON.parse(readFileSync(new URL('../assets/icons/ICONS.json',import.meta.url)));
  assert.equal(manifest.files.length,33);
  assert.equal(manifest.byteChanges,false);
  for(const item of manifest.files) assert.equal(hash(readFileSync(new URL(`../assets/icons/${item.file}`,import.meta.url))),item.sha256,item.file);
  assert.match(resolveAppearanceAsset(catalogue,'pieces/wp.png'),/assets\/pieces\/wp\.png$/);
  assert.match(resolveAppearanceAsset(catalogue,'icons/best.svg'),/assets\/icons\/best\.svg$/);
  assert.equal(resolveAppearanceAsset(createBoardAppearance({assetUrls:{'icons/best.svg':'/built/best-a1.svg'}}),'icons/best.svg'),'/built/best-a1.svg');
  const original=resolveIconPresentation(catalogue,'best');
  assert.match(original.src,/assets\/icons\/best\.svg$/);
  const recolored=resolveIconPresentation(catalogue,'best',{color:'#123abc',label:'Chosen move'});
  assert.equal(recolored.label,'Chosen move');
  assert.match(decodeURIComponent(recolored.src),/fill="#123abc"/);
  assert.doesNotMatch(decodeURIComponent(recolored.src),/aria-label=/);
});

test('named extensions validate complete sets, duplicate names and selected names', () => {
  const pieces=defaultBoardAppearance.pieceSets.glossy.pieces;
  const catalogue=createBoardAppearance({pieceSets:{custom:{pieces:{...pieces}}},iconSets:{marks:{icons:{spark:{asset:'/spark.svg',label:'Spark'}}}},squareThemes:{ocean:{light:'#e4e8e0',dark:'#42719a'}},arrowStyles:{'my-wave':()=>({layers:[{d:'M 0 0 L 1 1',fill:'red',fillOpacity:1}]})}});
  const selected=resolveAppearanceSelection(catalogue,{pieceSet:'custom',iconSet:'marks',squareTheme:'ocean'});
  assert.equal(selected.pieceSetName,'custom'); assert.equal(selected.iconSet.icons.spark.label,'Spark'); assert.equal(selected.squareTheme.dark,'#42719a');
  assert.throws(()=>createBoardAppearance({pieceSets:{broken:{pieces:{P:{asset:'p.png'}}}}}),/all twelve pieces/);
  assert.throws(()=>createBoardAppearance({squareThemes:{classic:{light:'#fff',dark:'#000'}}}),/already exists/);
  assert.equal(createBoardAppearance({replaceDefaults:true,squareThemes:{classic:{light:'#fff',dark:'#000'}}}).squareThemes.classic.dark,'#000');
  assert.throws(()=>resolveIconPresentation(catalogue,'spark',{iconSet:'marks',color:'#ff0000'}),/cannot be recolored/);
  assert.throws(()=>resolveIconPresentation(catalogue,'best',{color:'red'}),/Invalid icon color/);
  assert.throws(()=>resolveAppearanceSelection(catalogue,{iconSet:'unknown'}),/Unknown icon set/);
});

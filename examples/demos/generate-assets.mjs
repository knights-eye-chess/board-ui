import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {DEFAULT_QUALITY_DEFINITIONS} from '../../dist/appearance.js';

// Original demo artwork. No external fonts, sprites, or image dependencies.
const crowns = {
  p: '<circle cx="50" cy="25" r="11"/><path d="M40 38h20l-3 16 10 19H33l10-19z"/>',
  r: '<path d="M28 17h10v12h8V17h8v12h8V17h10v25H61l3 31H36l3-31H28z"/>',
  n: '<path d="M31 73l5-21-13-3 3-17 19-13 4-10 10 12c17 7 21 23 18 52z"/><path d="M29 37l15 3-10 11M48 24l-5 8" fill="none"/>',
  b: '<path d="M50 10c-3 10-18 16-18 31 0 10 7 15 13 18l-13 14h36L55 59c6-3 13-8 13-18 0-15-15-21-18-31z"/><path d="M55 25L43 42" fill="none"/>',
  q: '<path d="M29 29l10 14 11-19 11 19 10-14-9 32 7 12H31l7-12z"/><circle cx="27" cy="23" r="5"/><circle cx="50" cy="18" r="5"/><circle cx="73" cy="23" r="5"/>',
  k: '<path d="M45 9h10v8h8v9h-8v10H45V26h-8v-9h8zM36 36h28l7 17-13 8 9 12H33l9-12-13-8z"/>',
};
export function generateAssets(destination) {
  mkdirSync(path.join(destination,'pieces'),{recursive:true});
  mkdirSync(path.join(destination,'icons'),{recursive:true});
  for (const color of ['w','b']) for (const [role,shape] of Object.entries(crowns)) {
    const fill=color==='w'?'#fffaf0':'#263b36',stroke=color==='w'?'#263b36':'#fffaf0';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="${fill}" stroke="${stroke}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">${shape}<path d="M30 75h40l6 10H24z"/><path d="M24 85h52v6H24z"/></g></svg>\n`;
    writeFileSync(path.join(destination,'pieces',color+role+'.svg'),svg);
  }
  const marks={interesting:'!?',great:'!',brilliant:'!!',blunder:'??',miss:'×',mistake:'?',dubious:'?!',okay:'−',good:'+',best:'★',book:'B',forced:'=',bookmark:'◆'};
  for(const q of [...DEFAULT_QUALITY_DEFINITIONS,{name:'bookmark',color:'#8b5cf6'}]) {
    const mark=q.name==='bookmark'?'<path d="M37 25h26v52L50 65 37 77z" fill="white"/>':`<text x="50" y="53" text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="${marks[q.name].length>1?32:42}" font-weight="800" fill="white">${marks[q.name]}</text>`;
    writeFileSync(path.join(destination,'icons',q.name+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 3L97 50 50 97 3 50z" fill="${q.color}" stroke="white" stroke-width="3"/>${mark}</svg>\n`);
  }
}

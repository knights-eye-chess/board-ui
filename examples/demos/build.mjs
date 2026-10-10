import {build} from 'esbuild';
import {cpSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {generateAssets} from './generate-assets.mjs';

const here=fileURLToPath(new URL('.',import.meta.url)), root=path.resolve(here,'../..'), out=path.join(here,'dist');
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
const pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
// Resolve only the package's declared public entry points to its freshly built files.
const publicEntries={name:'board-ui-public-entries',setup(b){
  b.onResolve({filter:/^@knights-eye-chess\/board-ui(?:\/.*)?$/},args=>{
    const name=args.path.slice(pkg.name.length),entry=pkg.exports[name||'.'] || pkg.exports['.'+name];
    if(!entry?.import) throw Error(`Not a public JavaScript export: ${args.path}`);
    return {path:path.join(root,entry.import)};
  });
}};
const outputs={};
for(const name of ['sync','gallery']) {
  const result=await build({entryPoints:[path.join(here,'src',name+'.mjs')],bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022',outfile:path.join(out,name+'.js'),metafile:true,plugins:[publicEntries],legalComments:'linked'});
  const inputs=Object.keys(result.metafile.inputs);
  if(name==='gallery' && inputs.some(i=>i.includes('/node_modules/'))) throw Error('Gallery must not include a runtime dependency.');
  const bytes=readFileSync(path.join(out,name+'.js'));
  outputs[name]={bytes:bytes.length,gzipBytes:gzipSync(bytes).length,inputs};
}
await build({entryPoints:[path.join(here,'src','theme.mjs')],bundle:true,minify:true,format:'iife',platform:'browser',target:'es2022',outfile:path.join(out,'theme.js')});
for(const name of ['index.html','gallery.html','style.css']) cpSync(path.join(here,name),path.join(out,name));
for(const name of ['pieces','icons']) cpSync(path.join(root,'assets',name),path.join(out,'assets',name),{recursive:true});
generateAssets(path.join(out,'assets','custom'));
// Publish an explicit source/notice allowlist, never the private checkout/history.
const librarySource=path.join(out,'source','board-ui');
mkdirSync(librarySource,{recursive:true});
for(const file of ['src','dist','tests','scripts','assets','build.mjs','package.json','npm-shrinkwrap.json','npm-release.json','SOURCE-ORIGIN.json','README.md','NPM-PUBLISHING.md','LICENSE','LICENSE-ARTWORK','LICENSING.md','NOTICE','THIRD_PARTY_NOTICES.md','licenses']) {
  cpSync(path.join(root,file),path.join(librarySource,file),{recursive:true});
}
// Keep the README's guides and screenshot available in the source download too.
for(const file of ['GETTING_STARTED.md','APPEARANCE.md','MOVE_STRIP.md','API.md','DEVELOPMENT.md','VISUAL-CONTRACT.md','images']) {
  mkdirSync(path.join(librarySource,'docs'),{recursive:true});
  cpSync(path.join(root,'docs',file),path.join(librarySource,'docs',file),{recursive:true});
}
const demoSource=path.join(librarySource,'examples','demos');
mkdirSync(demoSource,{recursive:true});
for(const file of ['src','tests','vendor','generate-assets.mjs','build.mjs','serve.mjs','package.json','package-lock.json','README.md','index.html','gallery.html','style.css']) {
  cpSync(path.join(here,file),path.join(demoSource,file),{recursive:true});
}
for(const file of ['LICENSE','LICENSE-ARTWORK']) cpSync(path.join(root,file),path.join(out,file));
for(const [name,license] of [['chessops','LICENSE.txt'],['@badrap/result','LICENSE']]) {
  const from=path.join(here,'node_modules',name),to=path.join(out,'third-party',name);
  mkdirSync(to,{recursive:true});
  for(const file of [license,'package.json','README.md','src','dist']) cpSync(path.join(from,file),path.join(to,file),{recursive:true});
}
cpSync(path.join(here,'vendor','chessops','tsconfig.json'),path.join(out,'third-party','chessops','tsconfig.json'));
cpSync(path.join(here,'node_modules','chessops','LICENSE.txt'),path.join(out,'LICENSE-GPL'));
writeFileSync(path.join(out,'THIRD-PARTY.txt'),`Board UI playground\n\nCombined synchronized demo: GPL-3.0-or-later, due to chessops. Full terms: ./LICENSE-GPL\nOur library and demo host source retain their MIT grant: ./LICENSE\nThe independent appearance gallery contains no GPL dependency.\nDemo and library source, assets, lockfiles and build scripts: ./source/board-ui/\nDownload the full corresponding source: ./source/board-ui-demo-source.tar.gz\n\nArtwork: Knight's Eye artwork — Knight's Eye contributors, CC BY 4.0.\nProject: https://github.com/knights-eye-chess/board-ui\nLicense: https://creativecommons.org/licenses/by/4.0/\nFull legal text: ./LICENSE-ARTWORK\nDefault piece and classification artwork is copied without modification.\nCustom silhouette pieces and diamond icons are original demo artwork generated\nby ./source/board-ui/examples/demos/generate-assets.mjs, under the same CC BY 4.0 terms.\nIdentify any modifications when reusing this artwork.\n\nchessops 0.15.1 (GPL-3.0-or-later), https://github.com/niklasf/chessops\nCopyright Niklas Fiekas and contributors; full copyright/license and source: ./third-party/chessops/\n@badrap/result 0.3.1 (MIT), https://github.com/badrap/result\nFull copyright/license and source: ./third-party/@badrap/result/\n\nThe static website is public; public npm publication and access to the private\nrepository/history are separate decisions.\n`);
const archive=spawnSync('tar',['-czf',path.join(out,'source','board-ui-demo-source.tar.gz'),'-C',out,'source/board-ui','third-party','LICENSE','LICENSE-ARTWORK','LICENSE-GPL','THIRD-PARTY.txt'],{encoding:'utf8'});
if(archive.status!==0) throw Error(archive.stderr||'Could not archive corresponding source.');
writeFileSync(path.join(out,'build-report.json'),JSON.stringify({boardUi:pkg.version,outputs},null,2)+'\n');
console.log(JSON.stringify({boardUi:pkg.version,outputs:Object.fromEntries(Object.entries(outputs).map(([k,v])=>[k,{bytes:v.bytes,gzipBytes:v.gzipBytes}]))}));

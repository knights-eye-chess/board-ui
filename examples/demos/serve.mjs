import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.txt':'text/plain'};
export function demoServer({basePath='/'}={}) {
  if(!basePath.startsWith('/') || !basePath.endsWith('/')) throw Error('basePath must start and end with /.');
  return createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,'http://localhost');
      if(!url.pathname.startsWith(basePath)) throw Error('Outside base path');
      const relative='/'+decodeURIComponent(url.pathname.slice(basePath.length));
      const file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative));
      if(!file.startsWith(root+path.sep)) throw Error('Outside demo');
      const body=await readFile(file);
      res.setHeader('Content-Type',`${types[path.extname(file)]||'application/octet-stream'}; charset=utf-8`);
      res.setHeader('X-Content-Type-Options','nosniff');res.end(body);
    } catch {res.statusCode=404;res.end('Not found');}
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.DEMO_PORT||4173),server=demoServer();
  server.listen(port,'0.0.0.0',()=>console.log(`Demo server listening on port ${port}`));
  for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>server.close());
}

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = process.env.VNUI_SITE_ROOT ? path.resolve(process.env.VNUI_SITE_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.wav':'audio/wav','.ogg':'audio/ogg'};
http.createServer((req, res) => {
  let filename;
  try { filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (filename !== root && !filename.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
  if (filename === root) filename = path.join(root, fs.existsSync(path.join(root,'index.html'))?'index.html':'app.html');
  fs.stat(filename, (error, stat) => {
    if (error || !stat.isFile()) {res.writeHead(404).end('Not found'); return;}
    const headers={'Content-Type':mime[path.extname(filename)] || 'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
    let start=0,end=stat.size-1,status=200;
    if(req.headers.range){
      const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if(!match){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;
      if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);
    if(req.method==='HEAD'){res.end();return;}
    const stream=fs.createReadStream(filename,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`下午的节目 http://127.0.0.1:${port}/app.html`));

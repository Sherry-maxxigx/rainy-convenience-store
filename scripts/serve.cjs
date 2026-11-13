const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.gltf': 'model/gltf+json', '.hdr': 'application/octet-stream',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

function createServer({ basePath = '/' } = {}) {
  if (!basePath.startsWith('/') || !basePath.endsWith('/')) throw new Error('basePath must start and end with /');
  return http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end('Invalid path'); return; }
    if (basePath !== '/' && pathname === basePath.slice(0, -1)) { res.writeHead(302, { Location: basePath }).end(); return; }
    if (!pathname.startsWith(basePath)) { res.writeHead(404).end('Not found'); return; }
    const relative = pathname.slice(basePath.length) || 'index.html';
    if (relative.includes('\\') || relative.split('/').some(s => s.startsWith('.') || s === 'node_modules')) {
      res.writeHead(403).end('Forbidden'); return;
    }
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) { res.writeHead(404).end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-cache' });
      if (req.method === 'HEAD') res.end();
      else fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000), server = createServer();
  server.on('error', error => { console.error(`Cannot start preview: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Rainy store preview: http://127.0.0.1:${port}\nPress Ctrl+C to stop.`));
}
module.exports = { createServer };

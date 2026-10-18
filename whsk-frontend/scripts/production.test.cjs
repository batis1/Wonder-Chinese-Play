const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
let upstream;
let child;
let base;

before(async () => {
  upstream = http.createServer((req, res) => {
    if (req.url === '/redirect') {
      res.writeHead(301, { Location: '/example?redirected=true' });
      return res.end();
    }
    if (req.url === '/media') {
      res.writeHead(206, { 'Content-Range': 'bytes 2-5/8', 'Content-Length': 4 });
      return res.end('cdef');
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ path: req.url, method: req.method, body })); });
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  child = spawn(process.execPath, [path.join(__dirname, 'production.cjs')], { env: { ...process.env, PORT: '0', API_PROXY_TARGET: `http://127.0.0.1:${upstream.address().port}` }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Local server did not start')), 10000);
    child.once('error', reject);
    child.stdout.on('data', chunk => { output += chunk; const match = output.match(/ready on port (\d+)/); if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); } });
  });
});
after(async () => {
  if (child && child.exitCode === null) { const closed = new Promise(resolve => child.once('exit', resolve)); child.kill(); await closed; }
  if (upstream) await new Promise(resolve => upstream.close(resolve));
});
test('direct SPA routes load the local API configuration with fresh HTML', async () => {
  const response = await fetch(base + '/tutorial');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-cache');
  assert.ok((await response.text()).includes('window.__WHSK_API_BASE_URL__="/api"'));
});
test('the API proxy forwards methods, query strings and request bodies', async () => {
  const response = await fetch(base + '/api/example?value=5', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"value":5}' });
  const data = await response.json();
  assert.equal(data.path, '/example?value=5'); assert.equal(data.method, 'POST'); assert.equal(data.body, '{"value":5}');
});
test('the API proxy preserves audio byte ranges', async () => {
  const response = await fetch(base + '/api/media', { headers: { Range: 'bytes=2-5' } });
  assert.equal(response.status, 206); assert.equal(response.headers.get('content-range'), 'bytes 2-5/8'); assert.equal(await response.text(), 'cdef');
});

test('backend redirects remain inside the local API proxy', async () => {
  const response = await fetch(base + '/api/redirect');
  assert.equal((await response.json()).path, '/example?redirected=true');
});
test('hashed JavaScript is compressed and cached, and missing chunks return 404', async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../build/asset-manifest.json')));
  const script = manifest.entrypoints.find(file => file.endsWith('.js') && !file.includes('runtime'));
  const response = await fetch(base + '/' + script, { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-encoding'), 'gzip'); assert.ok(response.headers.get('cache-control').includes('immutable'));
  assert.equal((await fetch(base + '/static/js/missing.js')).status, 404);
});

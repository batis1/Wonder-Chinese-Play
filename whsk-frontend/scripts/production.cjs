const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const express = require('../../whsk-backend/node_modules/express');
const compression = require('../../whsk-backend/node_modules/compression');
const app = express();
const build = path.join(__dirname, '../build');
const upstream = new URL(process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000');
const transport = upstream.protocol === 'https:' ? https : http;
const agent = new transport.Agent({ keepAlive: true, maxSockets: 32 });
let html;
let htmlVersion;
function getHtml() {
  const file = path.join(build, 'index.html');
  const version = fs.statSync(file).mtimeMs;
  if (version !== htmlVersion) {
    html = fs.readFileSync(file, 'utf8').replace('<head>', '<head><script>window.__WHSK_API_BASE_URL__="/api";</script>');
    htmlVersion = version;
  }
  return html;
}

// Stream requests and responses so audio seeking and uploads keep their headers/body.
app.use('/api', (req, res) => {
  const proxy = transport.request({ hostname: upstream.hostname, port: upstream.port, path: req.url, method: req.method, agent, headers: { ...req.headers, host: upstream.host } }, response => {
    const headers = { ...response.headers };
    if (headers.location) {
      const destination = new URL(headers.location, upstream);
      if (destination.origin === upstream.origin) headers.location = `/api${destination.pathname}${destination.search}${destination.hash}`;
    }
    res.writeHead(response.statusCode, headers);
    response.pipe(res);
  });
  proxy.on('error', () => {
    if (res.headersSent) return res.destroy();
    res.status(503).json({ message: 'The local API is unavailable. Start the backend and try again.' });
  });
  res.on('close', () => proxy.destroy());
  req.pipe(proxy);
});
app.use(compression({ level: 4 }));
app.use('/static', express.static(path.join(build, 'static'), { maxAge: '1y', immutable: true }), (req, res) => res.sendStatus(404));
app.use(express.static(build, { index: false, maxAge: '1h' }));
app.get('*', (req, res) => {
  if (path.extname(req.path)) return res.sendStatus(404);
  res.set('Cache-Control', 'no-cache').type('html').send(getHtml());
});
const server = app.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log(`WHSK optimized local server ready on port ${server.address().port}`));
const shutdown = () => { agent.destroy(); server.close(() => process.exit(0)); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

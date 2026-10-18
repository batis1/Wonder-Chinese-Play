const path = require('node:path');
const express = require('../../whsk-backend/node_modules/express');
const app = express();
const build = path.join(__dirname, '../build');
app.use(express.static(build));
app.get('*', (req, res) => res.sendFile(path.join(build, 'index.html')));
app.listen(Number(process.env.PREVIEW_PORT || 3100), '127.0.0.1', () => console.log('Production preview ready'));

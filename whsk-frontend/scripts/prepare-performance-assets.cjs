const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const publicDir = path.join(__dirname, '../public');

(async () => {
  const fontDir = path.join(publicDir, 'fonts');
  await fs.mkdir(fontDir, { recursive: true });
  await fs.mkdir(path.join(publicDir, 'styles'), { recursive: true });
  const bootstrap = await fetch('https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css');
  if (!bootstrap.ok) throw new Error('Bootstrap download failed');
  const bootstrapBytes = Buffer.from(await bootstrap.arrayBuffer());
  const expected = 'ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T';
  if (crypto.createHash('sha384').update(bootstrapBytes).digest('base64') !== expected) throw new Error('Bootstrap integrity mismatch');
  await fs.writeFile(path.join(publicDir, 'styles/bootstrap-4.3.1.min.css'), bootstrapBytes);
  const url = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Roboto+Mono:wght@600&family=Luckiest+Guy&family=Nunito:wght@700;800;900;1000&display=swap';
  const cssResponse = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } });
  if (!cssResponse.ok) throw new Error('Font CSS download failed');
  const css = await cssResponse.text();
  const faces = [...css.matchAll(/\/\* (latin(?:-ext)?) \*\/\s*(@font-face\s*\{[^}]+\})/g)];
  if (!faces.length) throw new Error('Expected font subsets not present');
  const downloaded = new Map();
  const rules = [];
  const critical = [];
  for (const [unused, subset, block] of faces) {
    const remote = block.match(/url\((https:[^)]+)\)/)?.[1];
    if (!remote) throw new Error('Missing font URL');
    if (!downloaded.has(remote)) {
      const response = await fetch(remote);
      if (!response.ok) throw new Error('Font download failed');
      const filename = `font-${crypto.createHash('sha256').update(remote).digest('hex').slice(0, 12)}.woff2`;
      await fs.writeFile(path.join(fontDir, filename), Buffer.from(await response.arrayBuffer()));
      downloaded.set(remote, filename);
    }
    const local = `/fonts/${downloaded.get(remote)}`;
    rules.push(block.replace(remote, local));
    if (subset === 'latin' && (block.includes("'Nunito'") || (block.includes("'Poppins'") && block.includes('font-weight: 400;')))) critical.push(local);
  }
  await fs.writeFile(path.join(fontDir, 'fonts.css'), '/* Google Fonts: local Latin and Latin Extended subsets; see bundled licenses. */\n' + rules.join('\n'));
  for (const [family, location] of [['poppins', 'ofl/poppins/OFL.txt'], ['nunito', 'ofl/nunito/OFL.txt'], ['robotomono', 'ofl/robotomono/OFL.txt'], ['luckiestguy', 'apache/luckiestguy/LICENSE.txt']]) {
    const response = await fetch(`https://raw.githubusercontent.com/google/fonts/main/${location}`);
    if (!response.ok) throw new Error(`Missing font license: ${family}`);
    await fs.writeFile(path.join(fontDir, `${family}-LICENSE.txt`), await response.text());
  }
  console.log(JSON.stringify({ fontFiles: downloaded.size, criticalPreloads: [...new Set(critical)] }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const workspace = path.resolve(process.argv[2] || path.join(root, '..'));

async function copyApp(name) {
  const allowed = new Set(name === 'whsk-frontend'
    ? ['src', 'public', 'scripts', 'package.json', 'package-lock.json', '.gitignore']
    : ['api', 'config', 'db', 'data', 'lib', 'models', 'public', 'routes', 'tests', 'scripts', 'package.json', 'package-lock.json', '.gitignore', '.npmrc']);
  await fs.cp(path.join(workspace, name), path.join(root, name), {
    recursive: true,
    filter: source => {
      const relative = path.relative(path.join(workspace, name), source);
      return !relative || (allowed.has(relative.split(path.sep)[0]) && !relative.split(path.sep).some(part => part.startsWith('.env') || part === 'node_modules' || part === 'output' || part === '__pycache__'));
    },
  });
}

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  child.once('error', reject);
  let error = '';
  child.stderr.on('data', chunk => { error += chunk; });
  child.once('exit', code => code === 0 ? resolve() : reject(new Error(error || `${command} exited ${code}`)));
});

async function main() {
  await copyApp('whsk-frontend');
  await copyApp('whsk-backend');
  const data = path.join(workspace, 'whsk-backend/data');
  const media = JSON.parse(await fs.readFile(path.join(data, 'hsk5-media.json')));
  const course = JSON.parse(await fs.readFile(path.join(data, 'hsk5-course.json')));
  const answers = JSON.parse(await fs.readFile(path.join(data, 'hsk5-answers.json')));
  const destination = path.join(root, 'whsk-backend/public/workbook/hsk5');
  const sourcePath = file => path.join(workspace, ...file.split(/[\\/]/));
  let sourceBytes = 0, outputBytes = 0, count = 0;
  const tracks = Object.entries(media).flatMap(([volume, files]) => Object.entries(files).map(([name, file]) => ({ volume, name, file })));
  async function worker() {
    while (tracks.length) {
      const { volume, name, file } = tracks.shift();
      const source = sourcePath(file);
      const target = path.join(destination, 'audio', volume, name);
      await fs.mkdir(path.dirname(target), { recursive: true });
      try { await fs.access(target); } catch {
        await run('ffmpeg', ['-nostdin', '-v', 'error', '-i', source, '-map_metadata', '-1', '-codec:a', 'libmp3lame', '-b:a', '64k', '-ac', '1', '-ar', '44100', target]);
      }
      const [sourceInfo, targetInfo] = await Promise.all([fs.stat(source), fs.stat(target)]);
      sourceBytes += sourceInfo.size;
      outputBytes += targetInfo.size;
      if (++count % 12 === 0) console.log(`Prepared ${count}/72 audio tracks`);
    }
  }
  await Promise.all([worker(), worker()]);
  for (const volume of ['upper', 'lower']) {
    for (const [kind, file] of [['book', course.volumes[volume].file], ['answers', answers.sources[volume].file]]) {
      const target = path.join(destination, kind, volume);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(sourcePath(file), target);
    }
  }
  const report = { audioTracks: count, sourceBytes, outputBytes, reductionPercent: Math.round((1 - outputBytes / sourceBytes) * 100), originalsModified: false };
  await fs.mkdir(path.join(root, 'reports'), { recursive: true });
  await fs.writeFile(path.join(root, 'reports/media.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

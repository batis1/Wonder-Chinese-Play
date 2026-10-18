const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const next = path.join(root, '.build-next');
const build = path.join(root, 'build');
const result = spawnSync(process.execPath, [require.resolve('react-scripts/scripts/build')], {
  stdio: 'inherit',
  env: { ...process.env, BUILD_PATH: next, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --openssl-legacy-provider`.trim() },
});
if (result.status !== 0) process.exit(result.status ?? 1);
// Publish HTML last so the running local app stays usable throughout a rebuild.
fs.mkdirSync(build, { recursive: true });
fs.cpSync(next, build, { recursive: true, filter: source => source !== path.join(next, 'index.html') });
fs.copyFileSync(path.join(next, 'index.html'), path.join(build, 'index.next.html'));
fs.renameSync(path.join(build, 'index.next.html'), path.join(build, 'index.html'));

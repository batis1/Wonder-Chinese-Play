const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

function load(connection) {
  const calls = [];
  const code = babel.transformSync(fs.readFileSync(path.join(__dirname, '../src/lib/routePreload.js'), 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const context = { exports: {}, navigator: { connection }, require: name => {
    if (name === './apiList') return { __esModule: true, default: { workbook: '/api/workbook', questions: '/api/questions', hskWords: '/api/hsk-words' } };
    if (name === './course') return { ACTIVE_HSK_LEVEL: 'HSK5' };
    if (name === './cachedGet') return { cachedGet: url => { calls.push(url); return Promise.resolve({}); } };
    throw new Error('Unexpected module');
  } };
  vm.runInNewContext(code, context);
  for (const name of Object.keys(context.exports.routeModules)) context.exports.routeModules[name] = () => { calls.push(`chunk:${name}`); return Promise.resolve({}); };
  return { ...context.exports, calls };
}

test('data saver and slow networks do not spend bandwidth preloading', () => {
  for (const connection of [{ saveData: true }, { effectiveType: '2g' }, { effectiveType: 'slow-2g' }]) {
    const context = load(connection);
    context.preloadRoute('/quiz');
    assert.equal(context.calls.length, 0);
  }
});
test('game intent loads matching public data before navigation', () => {
  const context = load({ effectiveType: '4g' });
  context.preloadRoute('/quiz');
  assert.deepEqual(context.calls, ['chunk:quiz', '/api/questions?hskLevel=HSK5', '/api/hsk-words?version=2.0&compact=true']);
});
test('profile intent preloads code without caching private account data', () => {
  const context = load();
  context.preloadRoute('/Profile');
  assert.deepEqual(context.calls, ['chunk:profile']);
});

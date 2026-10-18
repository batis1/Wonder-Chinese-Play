const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

function load(fetch) {
  const filename = path.join(__dirname, '../src/lib/cachedGet.js');
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const context = { exports: {}, fetch, Date: { now: () => context.time }, time: 1000, Map };
  vm.runInNewContext(code, context, { filename });
  return context;
}
test('public data shares an in-flight request and serves the same cached object on repeat navigation', async () => {
  let calls = 0;
  const context = load(async () => { calls++; return { ok: true, json: async () => ({ course: 5 }) }; });
  const { cachedGet, peekCachedGet } = context.exports;
  const first = cachedGet('/course', 100);
  assert.equal(first, cachedGet('/course', 100));
  const value = await first;
  assert.equal(await cachedGet('/course', 100), value);
  assert.equal(peekCachedGet('/course'), value);
  assert.equal(calls, 1);
  context.time += 101;
  await cachedGet('/course', 100);
  assert.equal(calls, 2);
});
test('network failures are evicted so retry uses a fresh request', async () => {
  let calls = 0;
  const context = load(async () => { calls++; if (calls === 1) return { ok: false, status: 503 }; return { ok: true, json: async () => ({ ok: true }) }; });
  await assert.rejects(context.exports.cachedGet('/course'));
  assert.equal((await context.exports.cachedGet('/course')).ok, true);
  assert.equal(calls, 2);
});

test('slow requests stay shared and receive a full TTL after completing', async () => {
  let complete, calls = 0;
  const context = load(() => { calls++; return new Promise(resolve => { complete = resolve; }); });
  const first = context.exports.cachedGet('/slow', 100);
  context.time += 500;
  assert.equal(context.exports.cachedGet('/slow', 100), first);
  complete({ ok: true, json: async () => ({ ready: true }) });
  await first;
  context.time += 99;
  assert.equal((await context.exports.cachedGet('/slow', 100)).ready, true);
  assert.equal(calls, 1);
});
test('cache bounds and explicit invalidation release entries', async () => {
  const context = load(async () => ({ ok: true, json: async () => ({ ok: true }) }));
  for (let index = 0; index < 13; index++) await context.exports.cachedGet('/catalogue/' + index);
  assert.equal(context.exports.peekCachedGet('/catalogue/0'), undefined);
  context.exports.clearCachedGet();
  assert.equal(context.exports.peekCachedGet('/catalogue/12'), undefined);
});

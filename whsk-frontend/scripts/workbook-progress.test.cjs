const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

// Test this small module without upgrading the legacy CRA/Jest toolchain.
const filename = path.join(__dirname, '../src/Components/Tutorial/workbookProgress.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs']
}).code;
const storage = new Map();
const context = {
  exports: {}, Date,
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
};
vm.runInNewContext(code, context, { filename });
const { emptyProgress, isAvailable, nextActivity, readProgress, saveAttempt } = context.exports;
const lesson = { number: 1, activities: [{ id: '1-listening-1' }, { id: '1-reading-1' }] };
afterEach(() => storage.clear());

test('only completed prior activities unlock the next one', () => {
  const initial = emptyProgress();
  assert.equal(isAvailable(lesson, lesson.activities[0], initial), true);
  assert.equal(isAvailable(lesson, lesson.activities[1], initial), false);
  const draft = saveAttempt(initial, lesson, lesson.activities[0], { 1: 'A' });
  assert.equal(isAvailable(lesson, lesson.activities[1], draft), false);
  const completed = saveAttempt(draft, lesson, lesson.activities[0], { 1: 'A' }, true);
  assert.equal(isAvailable(lesson, lesson.activities[1], completed), true);
  assert.equal(nextActivity(lesson, completed).id, '1-reading-1');
  assert.equal(isAvailable(lesson, { id: 'unknown' }, completed), false);
});

test('answers survive serialization and remain isolated by account', () => {
  const state = saveAttempt(emptyProgress(), lesson, lesson.activities[0], { 1: 'B' }, true, { reviewMode: 'practice' });
  storage.set('account-a', JSON.stringify(state));
  assert.equal(readProgress('account-a').activities['1-listening-1'].answers[1], 'B');
  assert.equal(Object.keys(readProgress('account-b').activities).length, 0);
  assert.equal(state.activities['1-listening-1'].score, undefined);
});

test('malformed storage starts a usable course without deleting other records', () => {
  storage.set('broken', '{');
  storage.set('other', 'keep');
  assert.equal(readProgress('broken').currentLesson, 1);
  assert.equal(Object.keys(readProgress('broken').activities).length, 0);
  assert.equal(storage.get('other'), 'keep');
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const filename = path.join(__dirname, '../src/lib/storedUser.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
function read(value) {
  const context = { exports: {}, sessionStorage: { getItem: () => value } };
  vm.runInNewContext(code, context, { filename });
  return context.exports.readStoredUser();
}
test('raw password-login sessions restore both application and context identity', () => {
  const user = read(JSON.stringify({ _id: 'a', username: 'Test', hskLevel: 'HSK5' }));
  assert.equal(user.id, 'a'); assert.equal(user._doc._id, 'a'); assert.equal(user._doc.username, 'Test');
});
test('wrapped Google/signup sessions retain their account fields', () => {
  const timestamp = Date.now();
  const user = read(JSON.stringify({ id: 'a', timeStamp: timestamp, _doc: { _id: 'a', username: 'Test', googleId: 'google-test', hskLevel: 'HSK5' } }));
  assert.equal(user.id, 'a'); assert.equal(user.googleId, 'google-test'); assert.equal(user.timeStamp, timestamp);
});
test('missing and malformed browser sessions recover as signed-out', () => {
  assert.equal(read(null), null); assert.equal(read('{'), null); assert.equal(read('{}'), null);
});
test('the existing expiry window is preserved for timestamped sessions', () => {
  assert.equal(read(JSON.stringify({ _id: 'a', timeStamp: Date.now() - 12000001 })), null);
});

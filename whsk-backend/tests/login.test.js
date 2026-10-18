const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models/User');
let server, base, user;
const originalFind = User.findOne;
const originalDb = User.db;
before(async () => {
  user = new User({ username: 'login-fixture', email: 'fixture@example.test', hskLevel: 'HSK5', password: await bcrypt.hash('fixture-password', 4) });
  const app = express();
  app.use(express.json());
  app.use('/user', require('../routes/user'));
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}/user/login`;
});
afterEach(() => { User.findOne = originalFind; User.db = originalDb; });
after(async () => { await new Promise(resolve => server.close(resolve)); });
function connected() { User.db = { readyState: 1 }; }
async function login(data = { username: 'login-fixture', password: 'fixture-password' }) {
  const response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return { status: response.status, data: await response.json() };
}

test('valid passwords return the expected session identity without database internals or password hashes', async () => {
  connected(); User.findOne = async () => user;
  const result = await login();
  assert.equal(result.status, 200); assert.equal(result.data.auth, true);
  assert.equal(result.data.user._doc._id, String(user._id));
  assert.equal(result.data.user.id, String(user._id));
  assert.equal(result.data.user.username, 'login-fixture');
  assert.equal(result.data.user._doc.role, 'normalUser');
  assert.equal(result.data.user._doc.status, 'active');
  assert.ok(result.data.user.timeStamp);
  assert.equal(result.data.user.password, undefined);
  assert.equal(result.data.user._doc.password, undefined);
  assert.equal(result.data.user.$__, undefined);
});

test('incorrect passwords and unknown accounts are rejected without returning a user', async () => {
  connected(); User.findOne = async () => user;
  const incorrect = await login({ username: 'login-fixture', password: 'incorrect' });
  User.findOne = async () => null;
  const missing = await login();
  for (const result of [incorrect, missing]) {
    assert.equal(result.status, 401); assert.equal(result.data.auth, false); assert.equal(result.data.user, undefined);
  }
  assert.equal(incorrect.data.message, missing.data.message);
});

test('accounts without a password do not crash password sign-in', async () => {
  connected(); User.findOne = async () => ({ username: 'Google user' });
  assert.equal((await login()).status, 401);
});

test('database outages return a service error and never pretend the account is missing', async () => {
  User.db = { readyState: 0 };
  User.findOne = async () => { throw new Error('Must not buffer a disconnected query'); };
  const disconnected = await login();
  assert.equal(disconnected.status, 503); assert.match(disconnected.data.message, /reconnecting/);
  connected();
  User.findOne = async () => { throw new Error('Database query failed'); };
  const failure = await login();
  assert.equal(failure.status, 503); assert.match(failure.data.message, /unavailable/);
});

test('missing or non-string credentials are rejected before querying the database', async () => {
  User.findOne = async () => { throw new Error('Unexpected query'); };
  for (const credentials of [{}, { username: { value: 'x' }, password: 'x' }, { username: 'x', password: '' }]) {
    assert.equal((await login(credentials)).status, 400);
  }
});

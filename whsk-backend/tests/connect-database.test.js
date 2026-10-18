const { test } = require('node:test');
const assert = require('node:assert/strict');
const { connectDatabase } = require('../lib/connectDatabase');
const flush = () => new Promise(resolve => setImmediate(resolve));

test('an initial connection failure retries and recovers without logging the URI', async () => {
  let calls = 0, scheduled, delay;
  const logs = [];
  const mongoose = { connect: async (uri, options) => {
    assert.equal(uri, 'private-uri');
    assert.equal(options.serverSelectionTimeoutMS, 5000);
    if (++calls === 1) throw new Error('private-uri');
  } };
  const stop = connectDatabase(mongoose, 'private-uri', {
    schedule: (callback, milliseconds) => { scheduled = callback; delay = milliseconds; return { unref() {} }; },
    logger: { info: value => logs.push(value), error: value => logs.push(value) }
  });
  await flush();
  assert.equal(calls, 1); assert.equal(delay, 5000);
  await scheduled();
  assert.equal(calls, 2); assert.ok(logs.includes('Connected to DB'));
  assert.ok(logs.every(value => !value.includes('private-uri')));
  stop();
});

test('stopping reconnection prevents a pending retry from making another connection', async () => {
  let callback, calls = 0;
  const stop = connectDatabase({ connect: async () => { calls++; throw new Error(); } }, 'private-uri', {
    schedule: next => { callback = next; return { unref() {} }; }, logger: { info() {}, error() {} }
  });
  await flush(); stop(); await callback();
  assert.equal(calls, 1);
});

test('simultaneous cold requests share one connection and reuse a warm pool', async () => {
  let resolveConnection, calls = 0;
  const mongoose = { connection: { readyState: 0 }, connect: () => { calls++; return new Promise(resolve => { resolveConnection = resolve; }); } };
  const stop = connectDatabase(mongoose, 'private-uri', { logger: { info() {}, error() {} } });
  const first = stop.ready();
  assert.equal(first, stop.ready());
  assert.equal(calls, 1);
  mongoose.connection.readyState = 1;
  resolveConnection();
  await first;
  await stop.ready();
  assert.equal(calls, 1);
  stop();
});

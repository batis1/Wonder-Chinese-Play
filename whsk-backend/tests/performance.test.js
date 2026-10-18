const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const compression = require('compression');
const { createJsonCache } = require('../lib/jsonCache');
const { Score } = require('../models/Score');
const { User } = require('../models/User');
const { Word } = require('../models/WordModel');
const { Lesson } = require('../models/LessonModel');
const { HskWord } = require('../models/HskWord');
const servers = [];
async function serve(app) {
  const server = await new Promise(resolve => { const value = app.listen(0, '127.0.0.1', () => resolve(value)); });
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}
after(async () => { await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve)))); });

test('concurrent catalogue requests share work, vary by query, and expire', async () => {
  const app = express();
  const cache = createJsonCache({ ttl: 70 });
  let loads = 0;
  app.use(cache.middleware);
  app.get('/catalogue', async (req, res) => { loads++; await new Promise(resolve => setTimeout(resolve, 20)); res.json({ value: req.query.value || 'a' }); });
  const base = await serve(app);
  const rows = await Promise.all(Array.from({ length: 6 }, () => fetch(base + '/catalogue').then(response => response.json())));
  assert.ok(rows.every(row => row.value === 'a'));
  assert.equal(loads, 1);
  assert.equal((await fetch(base + '/catalogue?value=b').then(response => response.json())).value, 'b');
  assert.equal(loads, 2);
  await new Promise(resolve => setTimeout(resolve, 90));
  await fetch(base + '/catalogue');
  assert.equal(loads, 3);
});

test('successful writes invalidate cached reads and errors are never cached', async () => {
  const app = express();
  const cache = createJsonCache();
  let value = 1;
  let errors = 0;
  app.use(cache.invalidateOnWrite, cache.middleware);
  app.get('/value', (req, res) => res.json({ value }));
  app.post('/value', (req, res) => { value++; res.json({ value }); });
  app.get('/error', (req, res) => { errors++; res.status(503).json({ error: true }); });
  const base = await serve(app);
  assert.equal((await fetch(base + '/value').then(response => response.json())).value, 1);
  await fetch(base + '/value', { method: 'POST' });
  assert.equal((await fetch(base + '/value').then(response => response.json())).value, 2);
  await fetch(base + '/error'); await fetch(base + '/error');
  assert.equal(errors, 2);
});

test('catalogue cache evicts entries and does not retain oversized responses', async () => {
  const app = express();
  const cache = createJsonCache({ maxEntries: 1, maxBytes: 100 });
  let loads = 0;
  app.use(cache.middleware);
  app.get('/value', (req, res) => { loads++; res.json({ value: req.query.large ? 'x'.repeat(200) : req.query.key }); });
  const base = await serve(app);
  for (const suffix of ['?key=a', '?key=b', '?key=a', '?large=1', '?large=1']) await fetch(base + '/value' + suffix);
  assert.equal(loads, 5);
});

test('global ranking is one aggregation with one best score per user and a five-user limit', async () => {
  const original = Score.aggregate;
  let stages;
  let calls = 0;
  Score.aggregate = async pipeline => { stages = pipeline; calls++; return [{ _id: 'score', userID: 'person', username: 'Test', score: 12, hskLevel: 'HSK5' }]; };
  try {
    const app = express(); app.use('/score', require('../routes/scoreRouter'));
    const base = await serve(app);
    const rows = await fetch(base + '/score').then(response => response.json());
    assert.equal(calls, 1);
    assert.equal(stages.find(stage => stage.$group).$group._id, '$userID');
    assert.equal(stages.find(stage => stage.$limit).$limit, 5);
    assert.equal(rows[0].score, 12);
  } finally { Score.aggregate = original; }
});

test('saved vocabulary uses one word query and preserves saved-word order and duplicates', async () => {
  const oldUser = User.findById, oldWords = Word.find;
  let queries = 0;
  User.findById = async () => ({ savedWords: ['b', 'a', 'b', 'missing'] });
  Word.find = () => { queries++; return { lean: async () => [{ _id: 'a' }, { _id: 'b' }] }; };
  try {
    const app = express(); app.use('/words', require('../routes/wordRoute'));
    const base = await serve(app);
    const data = await fetch(base + '/words?userId=test').then(response => response.json());
    assert.equal(queries, 1);
    assert.deepEqual(data.docs.map(word => word._id), ['b', 'a', 'b']);
  } finally { User.findById = oldUser; Word.find = oldWords; }
});

test('lessons with vocabulary batch the word query across all returned lessons', async () => {
  const oldLessons = Lesson.find, oldWords = Word.find;
  let queries = 0;
  Lesson.find = () => ({ lean: async () => [{ _id: 'a' }, { _id: 'b' }] });
  Word.find = () => { queries++; return { lean: async () => [{ _id: 'word', lessonId: 'b' }] }; };
  try {
    const app = express(); app.use('/lessons', require('../routes/lessonsRoute'));
    const base = await serve(app);
    const data = await fetch(base + '/lessons?withWords=true').then(response => response.json());
    assert.equal(queries, 1);
    assert.deepEqual(data.docs[0].words, []);
    assert.equal(data.docs[1].words[0]._id, 'word');
  } finally { Lesson.find = oldLessons; Word.find = oldWords; }
});

test('compact dictionary projects popup fields, and normal dictionary reads keep the original shape', async () => {
  const oldFind = HskWord.find;
  const projections = [];
  HskWord.find = () => ({ select(value) { projections.push(value); return this; }, lean: async () => [{ hanzi: 'test', version: '2.0', level: 5 }] });
  try {
    const app = express(); app.use('/hsk-words', require('../routes/hskWordRouter'));
    const base = await serve(app);
    const compact = await fetch(base + '/hsk-words?compact=true&version=2.0').then(response => response.json());
    assert.ok(projections[0].includes('pinyin english'));
    assert.ok(Array.isArray(compact.data));
    const combined = await fetch(base + '/hsk-words?combined=true').then(response => response.json());
    assert.equal(combined.data['2.0'].length, 1);
    assert.deepEqual(combined.data['3.0'], []);
  } finally { HskWord.find = oldFind; }
});

test('compression preserves decoded JSON', async () => {
  const app = express(); app.use(compression({ level: 4 }));
  const value = { words: Array.from({ length: 100 }, () => 'Chinese vocabulary') };
  app.get('/', (req, res) => res.json(value));
  const base = await serve(app);
  const response = await fetch(base, { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(response.headers.get('content-encoding'), 'gzip');
  assert.deepEqual(await response.json(), value);
});

test('user lists with scores batch score loading for all accounts', async () => {
  const oldUsers = User.find, oldScores = Score.find;
  let queries = 0;
  User.find = () => ({ lean: async () => [{ _id: 'a' }, { _id: 'b' }] });
  Score.find = () => { queries++; return { lean: async () => [{ _id: 'score-b', userID: 'b', score: 1 }] }; };
  try {
    const app = express(); app.use('/user', require('../routes/user'));
    const base = await serve(app);
    const data = await fetch(base + '/user?withScores=true').then(response => response.json());
    assert.equal(queries, 1); assert.deepEqual(data.docs[0].scores, []); assert.equal(data.docs[1].scores[0]._id, 'score-b');
  } finally { User.find = oldUsers; Score.find = oldScores; }
});

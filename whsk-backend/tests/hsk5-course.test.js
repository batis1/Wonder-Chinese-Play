const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const course = require('../data/hsk5-course.json');
const media = require('../data/hsk5-media.json');
const { Question } = require('../models/Question');
const { Lesson } = require('../models/LessonModel');
const { User } = require('../models/User');
const { Score } = require('../models/Score');
const root = path.resolve(__dirname, '../..');
let server;
let base;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));
  app.use('/workbook', require('../routes/workbook'));
  app.use('/questions', require('../routes/questionRouter'));
  app.use('/lessons', require('../routes/lessonsRoute'));
  app.use('/score', require('../routes/scoreRouter'));
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });

test('the manifest maps all 36 lessons, 1152 responses and 72 HSK 5 audio tracks to existing files', () => {
  assert.equal(course.sections.length, 12);
  const lessons = course.sections.flatMap(section => section.lessons);
  assert.deepEqual(lessons.map(lesson => lesson.number), Array.from({ length: 36 }, (_, i) => i + 1));
  let count = 0;
  for (const lesson of lessons) {
    assert.equal(lesson.activities.length, 6);
    for (const activity of lesson.activities) {
      count += activity.questions.length;
      for (const page of activity.pages) {
        assert.ok(fs.statSync(path.join(__dirname, `../public/workbook/hsk5/${lesson.volume}/${page}.webp`)).size > 1000);
      }
      if (activity.audioFile) {
        const relative = media[lesson.volume][activity.audioFile];
        assert.ok(relative);
        assert.ok(!relative.includes('hsk 6'));
        const original = path.join(root, ...relative.split(/[\\/]/));
        const bundled = path.join(__dirname, '../public/workbook/hsk5/audio', lesson.volume, activity.audioFile);
        assert.ok(fs.statSync(fs.existsSync(original) ? original : bundled).size > 10000);
      }
    }
    for (const page of lesson.answerPages) assert.ok(page <= course.volumes[lesson.volume].pageCount);
  }
  assert.equal(count, 1152);
  assert.equal(Object.values(media).reduce((sum, files) => sum + Object.keys(files).length, 0), 72);
});

test('real workbook audio supports byte ranges and rejects files outside its allowlist', async () => {
  for (const endpoint of ['/workbook/hsk5/audio/upper/01-1.mp3', '/workbook/hsk5/audio/lower/36-2.mp3', '/workbook/hsk5/book/upper', '/workbook/hsk5/book/lower']) {
    const response = await fetch(base + endpoint, { headers: { Range: 'bytes=0-1023' } });
    assert.equal(response.status, 206);
    assert.equal((await response.arrayBuffer()).byteLength, 1024);
  }
  assert.equal((await fetch(base + '/workbook/hsk5/audio/lower/not-a-file.mp3')).status, 404);
  assert.equal((await fetch(base + '/workbook/hsk5/audio/hsk6/01-1.mp3')).status, 404);
});

test('legacy or omitted level parameters cannot load other course levels', async () => {
  const originalQuestionFind = Question.find;
  const originalLessonFind = Lesson.find;
  const seen = [];
  Question.find = query => { seen.push(query); return { lean: async () => [] }; };
  Lesson.find = query => { seen.push(query); return { lean: async () => [] }; };
  try {
    for (const endpoint of ['/questions?hskLevel=HSK3', '/questions', '/lessons?hskLevel=HSK4', '/lessons']) {
      assert.equal((await fetch(base + endpoint)).status, 200);
    }
    assert.equal(seen.length, 4);
    assert.ok(seen.every(query => query.hskLevel === 'HSK5'));
  } finally { Question.find = originalQuestionFind; Lesson.find = originalLessonFind; }
});

test('new game scores carry an explicit HSK 5 level without touching MongoDB', async () => {
  const originalCreate = Score.create;
  let payload;
  Score.create = async data => { payload = data; return {}; };
  try {
    const response = await fetch(base + '/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'Test', userID: 'test', score: 1, date: 1, hskLevel: 'HSK3' }) });
    assert.equal(response.status, 200);
    assert.equal(payload.hskLevel, 'HSK5');
  } finally { Score.create = originalCreate; }
});

test('legacy HSK 5 history remains available while other profiles use explicitly tagged scores', async () => {
  const originalUserFind = User.findById;
  const originalScoreFind = Score.find;
  const queries = [];
  let profileLevel = 'HSK5';
  User.findById = async () => ({ username: 'Test', hskLevel: profileLevel });
  Score.find = query => {
    queries.push(query);
    return { sort() { return this; }, limit() { return this; }, async exec() { return []; } };
  };
  try {
    assert.equal((await fetch(base + '/score/test')).status, 200);
    assert.ok(queries[0].$or.some(item => item.hskLevel?.$exists === false));
    profileLevel = 'HSK3';
    assert.equal((await fetch(base + '/score/test')).status, 200);
    assert.equal(queries[1].hskLevel, 'HSK5');
    assert.equal(queries[1].$or, undefined);
  } finally { User.findById = originalUserFind; Score.find = originalScoreFind; }
});

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const keys = require('../data/hsk5-answers.json');
const course = require('../data/hsk5-course.json');
let server, base;
before(async () => {
  const app = express(); app.use('/workbook', require('../routes/workbook'));
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}/workbook/hsk5`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });

test('all 36 lessons map to 1008 objective keys, 108 sentence references and 36 explicitly omitted paragraphs', () => {
  assert.equal(Object.keys(keys.lessons).length, 36);
  let choices = 0, sentences = 0, open = 0;
  for (const lesson of course.sections.flatMap(section => section.lessons)) {
    const source = keys.lessons[lesson.number];
    assert.equal(source.volume, lesson.volume);
    assert.equal(source.title.replace(/\s/g, ''), lesson.title.replace(/\s/g, ''));
    assert.equal(Object.keys(source.questions).length, 32);
    assert.equal(lesson.answerSource.answerPage, source.answerPage);
    for (let number = 1; number <= 32; number++) {
      const key = source.questions[number];
      if (number <= 28) { choices++; assert.equal(key.kind, 'choice'); assert.match(key.correct, /^[ABCD]$/); }
      else if (number < 32) { sentences++; assert.equal(key.kind, 'sentence'); assert.ok(key.acceptedAnswers.length > 0); }
      else { open++; assert.equal(key.kind, 'open'); assert.equal(key.reference, null); assert.equal(key.sourceNote, '略'); }
    }
  }
  assert.deepEqual([choices, sentences, open], [1008, 108, 36]);
});

test('source files are the supplied workbook answer PDFs and match their recorded digests', () => {
  for (const source of Object.values(keys.sources)) {
    assert.ok(source.file.startsWith('Workbook/Answers/'));
    assert.ok(source.file.endsWith('.pdf'));
    const file = fs.readFileSync(path.resolve(__dirname, '../..', source.file));
    assert.equal(crypto.createHash('sha256').update(file).digest('hex'), source.sha256);
  }
  assert.equal(keys.sources.upper.pageCount, 73); assert.equal(keys.sources.lower.pageCount, 81);
});

test('first and last lesson keys and sentence alternatives match visually reviewed source sheets', () => {
  assert.equal(Array.from({ length: 6 }, (_, i) => keys.lessons[1].questions[i + 1].correct).join(''), 'DBDCAB');
  assert.equal(Array.from({ length: 6 }, (_, i) => keys.lessons[36].questions[i + 1].correct).join(''), 'DCBBAC');
  assert.deepEqual(keys.lessons[1].questions[29].acceptedAnswers, ['她居然放弃了这次的机会。', '这次的机会她居然放弃了。']);
  assert.equal(keys.lessons[36].questions[31].acceptedAnswers[0], '他用剪刀剪出了一朵美丽的花。');
});

test('lesson responses include keys and answer PDFs support range requests for both volumes', async () => {
  for (const number of [1, 18, 19, 36]) {
    const response = await fetch(`${base}/lesson/${number}?answers=1`);
    const data = await response.json();
    assert.equal(response.status, 200); assert.equal(Object.keys(data.answerKey).length, 32);
    assert.equal(data.answerSource.answerPage, keys.lessons[number].answerPage);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
  }
  for (const volume of ['upper', 'lower']) {
    const response = await fetch(`${base}/answers/${volume}`, { headers: { Range: 'bytes=0-1023' } });
    assert.equal(response.status, 206); assert.equal((await response.arrayBuffer()).byteLength, 1024);
  }
  for (const volume of ['unknown', 'constructor', 'hsk6']) assert.equal((await fetch(`${base}/answers/${volume}`)).status, 404);
});

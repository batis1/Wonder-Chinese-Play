const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const course = require('../data/hsk5-course.json');
let server, base;
before(async () => {
  const app = express();
  app.use('/workbook', require('../routes/workbook'));
  server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });

test('all workbook activities have typed questions, complete options, passages and original illustrations', () => {
  const counts = { listening: 0, reading: 0, writing: 0 };
  const pictures = new Set();
  for (const lesson of course.sections.flatMap(section => section.lessons)) {
    const data = require(`../data/hsk5-exercises/${lesson.number}.json`);
    assert.equal(data.lesson, lesson.number);
    assert.equal(Object.keys(data.questions).length, 32);
    for (const activity of lesson.activities) for (const number of activity.questions) {
      counts[activity.kind]++;
      const q = data.questions[number];
      assert.equal(q.number, number);
      assert.ok(activity.pages.includes(q.sourcePage));
      assert.ok(q.instruction);
      if (activity.kind !== 'writing') {
        assert.deepEqual(q.options.map(option => option.id), ['A', 'B', 'C', 'D']);
        assert.ok(q.options.every(option => option.text.trim()));
      }
      if (activity.kind === 'reading') assert.ok(q.passage.trim());
      if (q.type === 'cloze') assert.ok(q.passage.includes(`[[${number}]]`));
      if (q.type === 'sentence') assert.ok(q.wordBank.length >= 3);
      if (q.type === 'composition') { assert.equal(q.targetLength, 80); assert.ok(q.wordBank.length); }
      for (const picture of q.illustrations || []) {
        assert.ok(fs.statSync(path.join(__dirname, '../public/workbook/hsk5', picture.src)).size > 500);
        pictures.add(picture.src);
      }
    }
  }
  assert.deepEqual(counts, { listening: 504, reading: 504, writing: 144 });
  assert.equal(pictures.size, 60);
});

test('source spot checks preserve first questions, rare text and the printed numbering error', () => {
  const first = require('../data/hsk5-exercises/1.json').questions;
  assert.deepEqual(first[1].options.map(option => option.text), ['太累了', '太热了', '和老婆吵架了', '为老婆赶蚊子']);
  assert.ok(first[15].passage.includes('[[15]]'));
  assert.ok(first[23].passage.includes('攥'));
  assert.ok(first[23].passage.includes('第二天'));
  assert.deepEqual(first[29].wordBank, ['她', '这次的', '放弃了', '居然', '机会']);
  assert.deepEqual(first[32].wordBank, ['等待', '抱怨', '对比', '如何', '不耐烦']);
  const tenth = require('../data/hsk5-exercises/10.json').questions;
  assert.equal(tenth[28].printedNumber, 26);
  assert.notDeepEqual(tenth[26].options, tenth[28].options);
});

test('lesson endpoints return both volumes and reject invalid lesson numbers', async () => {
  for (const number of [1, 19, 36]) {
    const response = await fetch(`${base}/workbook/hsk5/lesson/${number}`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.lesson, number);
    assert.equal(Object.keys(data.questions).length, 32);
  }
  for (const number of ['0', '37', '01', '1.json', 'constructor']) {
    assert.equal((await fetch(`${base}/workbook/hsk5/lesson/${number}`)).status, 404);
  }
});

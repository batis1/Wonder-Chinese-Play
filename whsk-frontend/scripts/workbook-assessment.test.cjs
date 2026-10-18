const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const code = babel.transformSync(fs.readFileSync(path.join(__dirname, '../src/Components/Tutorial/workbookAssessment.js'), 'utf8'), {
  babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs']
}).code;
const scope = { exports: {} }; vm.runInNewContext(code, scope);
const { assessAnswer, summarizeAssessment } = scope.exports;
const question = require('../../whsk-backend/data/hsk5-exercises/1.json').questions;
const key = require('../../whsk-backend/data/hsk5-answers.json').lessons[1].questions;

test('objective questions use the supplied answer rather than a default choice', () => {
  assert.equal(assessAnswer(question[1], key[1], 'D').status, 'correct');
  assert.equal(assessAnswer(question[1], key[1], 'A').status, 'incorrect');
  assert.equal(assessAnswer(question[1], key[1], 'A').correct, 'D');
  assert.equal(assessAnswer(question[1], key[1], ''), null);
});

test('all printed sentence alternatives match despite spacing and punctuation, while other answers remain for review', () => {
  assert.equal(assessAnswer(question[29], key[29], '她 居然放弃了这次的机会！').status, 'correct');
  assert.equal(assessAnswer(question[29], key[29], '这次的机会她居然放弃了').status, 'correct');
  assert.equal(assessAnswer(question[29], key[29], '这次她居然放弃了机会。').status, 'review');
  assert.equal(assessAnswer(question[29], key[29], '完全不同的句子').status, 'review');
});

test('open paragraphs check required words without inventing a correctness grade or model answer', () => {
  const result = assessAnswer(question[32], key[32], '等待 抱怨 对比 如何 不耐烦');
  assert.equal(result.status, 'self-review'); assert.equal(result.missingWords.length, 0);
  assert.equal(result.correct, undefined); assert.equal(result.references, undefined);
  assert.equal(assessAnswer(question[32], key[32], '等待').missingWords.length, 4);
});

test('activity summaries keep objective accuracy separate from sentence and open-writing review', () => {
  const objective = summarizeAssessment({ questions: [1, 2] }, question, key, { 1: 'D', 2: 'A' });
  assert.equal(objective.correct, 1); assert.equal(objective.total, 2);
  const writing = summarizeAssessment({ questions: [29, 30, 31, 32] }, question, key,
    { 29: key[29].acceptedAnswers[0], 30: 'other order', 31: key[31].acceptedAnswers[0], 32: '等待' });
  assert.equal(writing.total, 0); assert.equal(writing.matchingSentences, 2);
  assert.equal(writing.sentencesToReview, 1); assert.equal(writing.selfReview, 1);
});

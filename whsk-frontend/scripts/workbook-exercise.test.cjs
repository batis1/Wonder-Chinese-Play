const { test, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLElement.prototype.scrollIntoView = () => {};
// Let React's scheduler use timers instead of Node's persistent MessagePort.
global.MessageChannel = undefined;
window.scrollTo = () => {};
const React = require('react');
const ReactDOM = require('react-dom');
const { act, Simulate } = require('react-dom/test-utils');
const course = require('../../whsk-backend/data/hsk5-course.json');
const root = document.getElementById('root');
const noop = () => null;
function load(filename, imports = {}) {
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    babelrc: false, configFile: false, presets: ['@babel/preset-react'],
    plugins: ['@babel/plugin-transform-modules-commonjs']
  }).code;
  const context = { exports: {}, require: name => imports[name] || require(name), window, document, localStorage: window.localStorage, Date };
  vm.runInNewContext(code, context, { filename });
  return context.exports;
}
const progressApi = load(path.join(__dirname, '../src/Components/Tutorial/workbookProgress.js'));
const assessmentApi = load(path.join(__dirname, '../src/Components/Tutorial/workbookAssessment.js'));
const lessons = course.sections.flatMap(section => section.lessons);
let saved, fixture, lastHistory;
const { WorkbookExercise } = load(path.join(__dirname, '../src/Components/Tutorial/WorkbookExercise.jsx'), {
  'react-router-dom': {
    Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
    Redirect: () => React.createElement('p', { 'data-redirect': true }, 'Locked'),
    useHistory: () => ({ push: url => { lastHistory = url; } })
  },
  '@ant-design/icons': new Proxy({}, { get: () => noop }),
  '../../lib/apiList': { workbook: '/api/workbook/hsk5' },
  '../../lib/cachedGet': { peekCachedGet: () => fixture, cachedGet: async () => fixture },
  './workbookProgress': progressApi,
  './workbookAssessment': assessmentApi,
  './WorkbookPath': { activityUrl: (lesson, activity) => `/tutorial/${lesson.number}/${activity.id.slice(String(lesson.number).length + 1)}` },
  './WorkbookBuddy': { WorkbookBuddy: noop },
  './WorkbookPage': { WorkbookPage: () => React.createElement('div', { 'data-reference': true }) }
});
async function mount(key, options = {}) {
  const lesson = lessons.find(item => item.number === (options.lesson || 1));
  const answers = require('../../whsk-backend/data/hsk5-answers.json').lessons[lesson.number];
  fixture = { ...require(`../../whsk-backend/data/hsk5-exercises/${lesson.number}.json`), answerKey: answers.questions,
    answerSource: { volume: answers.volume, firstPage: answers.firstPage, answerPage: answers.answerPage } };
  const index = lesson.activities.findIndex(item => item.id === `${lesson.number}-${key}`);
  saved = options.progress || progressApi.emptyProgress();
  if (!options.locked) for (const prior of lesson.activities.slice(0, index)) saved.activities[prior.id] = { finished: true, answers: {} };
  function Harness() {
    const [progress, setProgress] = React.useState(saved);
    return React.createElement(WorkbookExercise, { course, progress, lessonNumber: lesson.number, activityKey: key,
      saveProgress: next => { saved = next; setProgress(next); return true; } });
  }
  await act(async () => { ReactDOM.render(React.createElement(Harness), root); });
}
const field = () => root.querySelector('fieldset');
const question = () => Number(field()?.dataset.question);
const button = name => [...root.querySelectorAll('button')].find(item => item.textContent.trim() === name);
const click = element => act(() => { Simulate.click(element); });
const submit = () => act(() => { Simulate.submit(root.querySelector('form')); });
const choose = value => act(() => { Simulate.change(root.querySelector(`input[value="${value}"]`)); });
const jump = index => act(() => { Simulate.change(root.querySelector('[aria-label="Question"]'), { target: { value: String(index) } }); });
afterEach(() => { act(() => { ReactDOM.unmountComponentAtNode(root); }); window.localStorage.clear(); });
after(() => dom.window.close());

test('listening shows one typed question, retains audio, validates and restores answers while navigating', async () => {
  await mount('listening-1');
  assert.equal(root.querySelectorAll('fieldset').length, 1);
  assert.equal(question(), 1);
  assert.ok(root.textContent.includes('为老婆赶蚊子'));
  assert.equal(root.querySelector('.workbook-print-frame'), null);
  assert.equal(button('Previous').disabled, true);
  submit();
  assert.match(root.querySelector('[role="alert"]').textContent, /Choose an answer/);
  const audio = root.querySelector('audio');
  choose('D');
  assert.equal(saved.activities['1-listening-1'].answers[1], 'D');
  assert.equal(saved.activities['1-listening-1'].finished, false);
  submit();
  assert.equal(question(), 1);
  assert.match(root.querySelector('.workbook-answer-feedback').textContent, /Correct!/);
  assert.equal(saved.activities['1-listening-1'].checkedAnswers[1], 'D');
  submit();
  assert.equal(question(), 2);
  assert.equal(root.querySelector('audio'), audio);
  click(button('Previous'));
  assert.equal(question(), 1);
  assert.equal(root.querySelector('input:checked').value, 'D');
  const restored = JSON.parse(JSON.stringify(saved));
  act(() => { ReactDOM.unmountComponentAtNode(root); });
  await mount('listening-1', { progress: restored });
  assert.equal(question(), 2);
  jump(0);
  assert.equal(root.querySelector('input:checked').value, 'D');
  assert.ok(root.querySelector('.workbook-answer-feedback'));
  choose('A');
  assert.equal(root.querySelector('.workbook-answer-feedback'), null);
  submit();
  assert.match(root.querySelector('.workbook-answer-feedback').textContent, /D · 为老婆赶蚊子/);
});

test('finishing cannot skip unanswered items and unlocks only after all six responses', async () => {
  await mount('listening-1');
  jump(5); choose('A'); submit(); submit();
  assert.equal(question(), 1);
  assert.equal(saved.activities['1-listening-1'].finished, false);
  for (let index = 0; index < 5; index++) { choose('B'); submit(); submit(); }
  assert.equal(question(), 6);
  submit();
  assert.match(root.textContent, /Practice saved/);
  assert.equal(saved.activities['1-listening-1'].finished, true);
  assert.equal(progressApi.isAvailable(lessons[0], lessons[0].activities[1], saved), true);
  assert.equal(saved.activities['1-listening-1'].score, undefined);
  assert.equal(saved.activities['1-listening-1'].assessment.total, 6);
  assert.equal(saved.activities['1-listening-1'].assessment.correct, 1);
});

test('reading starts at question 15, updates the current blank and shows source illustrations with the passage', async () => {
  await mount('reading-1');
  assert.equal(question(), 15);
  assert.ok(root.querySelector('.workbook-reading-passage').textContent.length > 100);
  choose('A');
  assert.equal(root.querySelector('.is-current-blank').textContent, fixture.questions[15].options[0].text);
  submit();
  assert.match(root.querySelector('.workbook-answer-feedback').textContent, /Correct answer/);
  submit();
  assert.equal(question(), 16);
  act(() => { ReactDOM.unmountComponentAtNode(root); });
  await mount('reading-3');
  assert.equal(question(), 23);
  assert.ok(root.querySelector('.workbook-reading-passage').textContent.includes('攥'));
  assert.match(root.querySelector('.workbook-passage-illustration').src, /illustrations\/upper-13/);
});

test('writing starts at question 29 with its word bank, then shows the composition prompt and character count', async () => {
  await mount('writing');
  assert.equal(question(), 29);
  assert.equal(root.querySelectorAll('.workbook-word-bank button').length, 5);
  click(root.querySelector('.workbook-word-bank button'));
  assert.equal(root.querySelector('textarea').value, '她');
  assert.equal(saved.activities['1-writing'].answers[29], '她');
  act(() => Simulate.change(root.querySelector('textarea'), { target: { value: '她居然放弃了这次的机会。' } }));
  submit(); assert.match(root.querySelector('.workbook-answer-feedback').textContent, /Matches the reference/);
  submit(); assert.equal(question(), 30);
  jump(3); assert.equal(question(), 32);
  assert.equal(root.querySelectorAll('.workbook-word-bank span').length, 5);
  act(() => Simulate.change(root.querySelector('textarea'), { target: { value: '等待 以后' } }));
  assert.equal(root.querySelector('.workbook-character-count').textContent, '4 / 80 characters');
  assert.equal(root.querySelector('audio'), null);
  submit();
  assert.match(root.querySelector('.workbook-answer-feedback').textContent, /source omits a model paragraph/);
  assert.ok(root.querySelector('.workbook-answer-feedback.is-self-review'));
});

test('existing locks and lower-volume self-review references remain intact', async () => {
  await mount('reading-1', { locked: true });
  assert.ok(root.querySelector('[data-redirect]'));
  act(() => { ReactDOM.unmountComponentAtNode(root); });
  await mount('listening-1', { lesson: 19 });
  while (field()) { choose('A'); submit(); submit(); }
  assert.ok(root.querySelector('.workbook-answer-reference'));
  assert.ok(root.querySelector('a[href="/api/workbook/hsk5/answers/lower#page=4"]'));
  assert.match(root.textContent, /6 correct/);
});

test('answering through the question selector still requires checking each response before completion', async () => {
  await mount('listening-1');
  for (let index = 0; index < 6; index++) { jump(index); choose('A'); }
  submit(); submit();
  assert.equal(question(), 1);
  assert.match(root.querySelector('[role=alert]').textContent, /Check each answer/);
  assert.equal(saved.activities['1-listening-1'].finished, false);
});

test('legacy completed activities and their answers remain completed when reviewed with the new key', async () => {
  const progress = progressApi.emptyProgress();
  progress.activities['1-listening-1'] = { finished: true, answers: { 1: 'A', 2: 'B', 3: 'D', 4: 'C', 5: 'A', 6: 'B' } };
  await mount('listening-1', { progress });
  assert.equal(question(), 1);
  assert.equal(root.querySelector('input:checked').value, 'A');
  submit();
  assert.equal(saved.activities['1-listening-1'].finished, true);
  assert.equal(progressApi.isAvailable(lessons[0], lessons[0].activities[1], saved), true);
});

const { test, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
global.window = dom.window; global.document = dom.window.document; global.navigator = dom.window.navigator;
global.MessageChannel = undefined;
const React = require('react');
const ReactDOM = require('react-dom');
const { act, Simulate } = require('react-dom/test-utils');
const root = document.getElementById('root');
const context = React.createContext();
let response, request, user, dispatches, navigation;
const history = { push: url => navigation.push(url) };
function Form({ onFinish, children }) {
  return React.createElement('form', { onSubmit: event => {
    event.preventDefault();
    const fields = event.currentTarget.elements;
    onFinish({ username: fields.namedItem('username').value, password: fields.namedItem('password').value });
  } }, children);
}
Form.Item = ({ name, children }) => React.cloneElement(children, { name });
const Input = props => React.createElement('input', props);
Input.Password = props => React.createElement('input', { ...props, type: 'password' });
const imports = {
  antd: { Form, Input, Button: ({ htmlType, children }) => React.createElement('button', { type: htmlType }, children), Tabs: ({ items }) => items[0].children },
  'react-router-dom': { useHistory: () => history },
  '@ant-design/icons': new Proxy({}, { get: () => () => null }),
  axios: { post: async (...args) => { request = args; return response(); } },
  '../../App': { GlobalContext: context, actions: { SET_USER: 'SET_USER' } },
  '../../lib/apiList': { login: '/api/user/login' },
  './Login.css': {}
};
const filename = path.join(__dirname, '../src/Components/Login/Login.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  babelrc: false, configFile: false, presets: [['@babel/preset-react', { runtime: 'automatic' }]], plugins: ['@babel/plugin-transform-modules-commonjs']
}).code;
const scope = { exports: {}, require: name => imports[name] || require(name), window, document };
vm.runInNewContext(code, scope, { filename });
const Login = scope.exports.default;
async function mount(result) {
  response = result; request = null; user = null; dispatches = []; navigation = [];
  await act(async () => ReactDOM.render(React.createElement(context.Provider, { value: { dispatch: value => dispatches.push(value) } },
    React.createElement(Login, { user: null, setUser: value => { user = value; } })), root));
  root.querySelector('[name=username]').value = 'login-fixture';
  root.querySelector('[name=password]').value = 'fixture-password';
}
async function submit() { await act(async () => { Simulate.submit(root.querySelector('form')); }); }
afterEach(() => { act(() => { ReactDOM.unmountComponentAtNode(root); }); window.sessionStorage.clear(); });
after(() => dom.window.close());

test('successful authentication stores a full session and opens the home page', async () => {
  const record = { id: 'fixture', _id: 'fixture', timeStamp: Date.now(), username: 'login-fixture', _doc: { _id: 'fixture', username: 'login-fixture' } };
  await mount(async () => ({ data: { auth: true, user: record } })); await submit();
  assert.equal(user, record); assert.equal(dispatches[0].payload.user, record._doc);
  assert.deepEqual(navigation, ['/']);
  assert.equal(JSON.parse(window.sessionStorage.getItem('currentUser')).timeStamp, record.timeStamp);
  assert.equal(request[0], '/api/user/login'); assert.equal(request[2].timeout, 15000);
});

test('legacy auth:false responses never create a session, even when they include a user', async () => {
  await mount(async () => ({ data: { auth: false, user: { _doc: { _id: 'fixture' } } } })); await submit();
  assert.equal(user, null); assert.equal(dispatches.length, 0); assert.equal(navigation.length, 0);
  assert.equal(window.sessionStorage.getItem('currentUser'), null);
  assert.match(root.querySelector('[role=alert]').textContent, /incorrect/);
});

test('database service errors are visible and keep the entered fields for retry', async () => {
  await mount(async () => { throw { response: { status: 503, data: { message: 'The database is reconnecting. Please try again shortly.' } } }; }); await submit();
  assert.match(root.querySelector('[role=alert]').textContent, /database is reconnecting/);
  assert.equal(root.querySelector('[name=username]').value, 'login-fixture');
  assert.equal(root.querySelector('[name=password]').value, 'fixture-password');
  assert.equal(user, null);
});

test('network failures show a connection error without storing a user', async () => {
  await mount(async () => { throw { request: {}, code: 'ECONNABORTED' }; }); await submit();
  assert.match(root.querySelector('[role=alert]').textContent, /Cannot reach the server/);
  assert.equal(window.sessionStorage.getItem('currentUser'), null);
});

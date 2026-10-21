/* Actual React lifecycle + the installed Clerk callback component. Clerk's
 * resource and Next's URL hook are injected; no network, DB, or real OAuth.
 *
 * One-time isolated test runtime (does not change the app's dependencies):
 * npm install --prefix /tmp/menora-callback-test-runtime --ignore-scripts --no-audit --no-fund react@19.1.0 react-test-renderer@19.1.0
 * node tests/community/sso-callback.cjs
 *
 * SSO_CALLBACK_SOURCE may point at an older page.tsx to demonstrate the
 * regression. COMMUNITY_TEST_RUNTIME can override the temporary runtime.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const ts = require('typescript');
const React = require('react');
const { AuthenticateWithRedirectCallback } = require('@clerk/react');
const { ClerkInstanceContext, useClerk } = require('@clerk/shared/react');

const root = path.resolve(__dirname, '../..');
const runtime = process.env.COMMUNITY_TEST_RUNTIME || '/tmp/menora-callback-test-runtime';
const runtimeRequire = createRequire(path.join(runtime, 'package.json'));
assert.equal(runtimeRequire('react/package.json').version, React.version,
  'The temporary renderer runtime must use the same React version as the app');
assert.equal(runtimeRequire('react-test-renderer/package.json').version, React.version,
  'The renderer version must match the app React version');
// Renderer and the installed SDK must share the same React dispatcher.
require.cache[runtimeRequire.resolve('react')] = require.cache[require.resolve('react')];
const { create, act } = runtimeRequire('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const callbackFile = process.env.SSO_CALLBACK_SOURCE || path.join(root, 'app/sso-callback/page.tsx');
const draft = '12345678-1234-4123-8123-123456789abc';
const context = new URLSearchParams({ returnTo: '/events/original-event', registration: '1', draft });
let passed = 0;

function source(file, overrides = {}) {
  const sourceModule = { exports: {} };
  function localRequire(id) {
    if (id in overrides) return overrides[id];
    if (id === 'react' || id === 'react/jsx-runtime') return require(id);
    if (id === '@clerk/nextjs') return { AuthenticateWithRedirectCallback, useClerk };
    if (id === '@/lib/community/policy') return source(path.join(root, 'lib/community/policy.ts'));
    throw new Error('Blocked import in isolated callback regression: ' + id);
  }
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, {
    module: sourceModule, exports: sourceModule.exports, require: localRequire,
    window: overrides.window, URL, URLSearchParams, console,
  }, { filename: file });
  return sourceModule.exports;
}

function clock() {
  let now = 0, sequence = 0;
  const pending = new Map();
  return {
    pending,
    setTimeout(callback, delay) {
      const id = ++sequence;
      pending.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout(id) { pending.delete(id); },
    advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of pending) if (timer.due <= now) {
        pending.delete(id);
        timer.callback();
      }
    },
  };
}

async function harness({ query = context, loaded = false, settled = true, resource } = {}) {
  const timer = clock(), calls = resource?.calls || [];
  let params = new URLSearchParams(query), renderer;
  const clerk = resource?.clerk || {
    loaded,
    handleRedirectCallback(options) {
      calls.push(options);
      return settled ? Promise.resolve() : new Promise(() => {});
    },
  };
  const Page = source(callbackFile, {
    'next/navigation': { useSearchParams: () => params }, window: timer,
  }).default;
  // The SDK changes the context wrapper when loaded changes, while preserving
  // the actual Clerk instance. The URLSearchParams object is also stable.
  const tree = () => React.createElement(ClerkInstanceContext.Provider,
    { value: { value: clerk } }, React.createElement(Page));
  await act(async () => { renderer = create(tree()); });
  return {
    clerk, calls, timer,
    links: () => renderer.root.findAllByType('a').map(link => ({ href: link.props.href, text: link.children.join('') })),
    status: () => renderer.root.findAllByProps({ role: 'status' }).map(node => node.children.join('')).join(' '),
    async update(nextQuery) {
      if (nextQuery) params = new URLSearchParams(nextQuery);
      await act(async () => { renderer.update(tree()); });
    },
    async advance(milliseconds) { await act(async () => { timer.advance(milliseconds); }); },
    async unmount() { await act(async () => { renderer.unmount(); }); },
  };
}

function assertJourney(location, pathname, expected = {}) {
  const url = new URL(location, 'https://test.invalid');
  assert.equal(url.origin, 'https://test.invalid');
  assert.equal(url.pathname, pathname);
  assert.equal(url.searchParams.get('returnTo'), expected.returnTo || '/events/original-event');
  assert.equal(url.searchParams.get('draft'), expected.draft === undefined ? draft : expected.draft);
  assert.equal(url.searchParams.get('registration'), expected.registration === undefined ? '1' : expected.registration);
}

function assertDestinations(options, expected = {}) {
  assertJourney(options.signInUrl, '/sign-in/continue', expected);
  assertJourney(options.signUpUrl, '/sign-up', expected);
  for (const name of ['signInForceRedirectUrl', 'signUpForceRedirectUrl',
    'signInFallbackRedirectUrl', 'signUpFallbackRedirectUrl']) {
    assertJourney(options[name], '/auth/complete', expected);
  }
}

async function test(name, callback) {
  await callback();
  passed++;
  console.log('PASS ' + name);
}

(async () => {
  await test('cold SDK load starts callback once after a stable Clerk instance becomes ready', async () => {
    const page = await harness();
    try {
      assert.equal(page.calls.length, 0, 'Callback must not start before SDK readiness');
      const sameClerk = page.clerk;
      page.clerk.loaded = true;
      await page.update();
      assert.equal(page.clerk, sameClerk);
      assert.equal(page.calls.length, 1, 'Cold loaded=false → true must start the callback');
      assertDestinations(page.calls[0]);
      await page.update();
      assert.equal(page.calls.length, 1, 'Ordinary rerenders must not replay the callback');
    } finally { await page.unmount(); }
  });

  await test('warm SDK load preserves all signup and signin continuation destinations', async () => {
    const page = await harness({ loaded: true });
    try { assert.equal(page.calls.length, 1); assertDestinations(page.calls[0]); }
    finally { await page.unmount(); }
  });

  await test('external return targets, nested callbacks and invalid attempts cannot escape the server completion route', async () => {
    for (const target of ['https://outside.invalid', '//outside.invalid', '/sso-callback', '/auth/complete']) {
      const page = await harness({ loaded: true, query: { returnTo: target, draft: 'invalid&injected=1', registration: 'yes' } });
      try {
        assertDestinations(page.calls[0], { returnTo: '/dashboard/events', draft: null, registration: null });
      } finally { await page.unmount(); }
    }
  });

  await test('missing event context uses dashboard events without inventing a registration attempt', async () => {
    const page = await harness({ loaded: true, query: {} });
    try { assertDestinations(page.calls[0], { returnTo: '/dashboard/events', draft: null, registration: null }); }
    finally { await page.unmount(); }
  });

  await test('unloaded SDK gives recovery after 20 seconds with the entire original journey intact', async () => {
    const page = await harness();
    try {
      await page.advance(19_999);
      assert.equal(page.links().length, 0);
      assert.match(page.status(), /Завершаем вход/);
      await page.advance(1);
      assert.match(page.status(), /больше времени/);
      assert.equal(page.calls.length, 0, 'Timeout must not force OAuth or grant a session');
      const links = page.links();
      assert.equal(links.length, 2);
      assertJourney(links.find(link => link.text === 'Продолжить вход').href, '/auth/complete');
      assertJourney(links.find(link => link.text === 'Вернуться ко входу').href, '/sign-in');
    } finally { await page.unmount(); }
  });

  await test('pending or resolved callback without navigation gives recovery without automatic retries or direct event navigation', async () => {
    for (const settled of [false, true]) {
      const page = await harness({ loaded: true, settled });
      try {
        await page.advance(20_000);
        assert.equal(page.calls.length, 1);
        assert.equal(page.links().length, 2);
        for (const link of page.links()) assert.ok(!link.href.startsWith('/events/'));
        await page.advance(60_000);
        await page.update();
        assert.equal(page.calls.length, 1);
      } finally { await page.unmount(); }
    }
  });

  await test('late SDK readiness still starts its callback after the recovery message appears', async () => {
    const page = await harness();
    try {
      await page.advance(20_000);
      page.clerk.loaded = true;
      await page.update();
      assert.equal(page.calls.length, 1);
      assertDestinations(page.calls[0]);
    } finally { await page.unmount(); }
  });

  await test('a different callback journey remounts its handler with the correct event and attempt', async () => {
    const page = await harness({ loaded: true });
    const nextDraft = '87654321-4321-4321-8321-cba987654321';
    try {
      await page.update({ returnTo: '/events/second-event', draft: nextDraft });
      assert.equal(page.calls.length, 2);
      assertDestinations(page.calls[1], { returnTo: '/events/second-event', draft: nextDraft, registration: null });
    } finally { await page.unmount(); }
  });

  await test('remount with a simulated active session keeps completion owned by Clerk and preserves the attempt', async () => {
    const first = await harness({ loaded: true });
    first.clerk.session = { id: 'synthetic-session', status: 'active' };
    await first.unmount();
    const reloaded = await harness({ resource: first });
    try {
      assert.equal(reloaded.clerk, first.clerk);
      assert.equal(reloaded.calls.length, 2);
      assertDestinations(reloaded.calls[1]);
      assert.equal(reloaded.links().length, 0);
      await reloaded.update();
      assert.equal(reloaded.calls.length, 2);
    } finally { await reloaded.unmount(); }
  });

  await test('unmount clears the watchdog instead of updating an abandoned callback', async () => {
    const page = await harness();
    assert.equal(page.timer.pending.size, 1);
    await page.unmount();
    assert.equal(page.timer.pending.size, 0);
    page.timer.advance(60_000);
    assert.equal(page.calls.length, 0);
  });

  console.log(`Callback regression: ${passed}/${passed} PASS. Real Google OAuth and database finalization are outside this isolated suite.`);
})().catch(error => { console.error(error); process.exitCode = 1; });

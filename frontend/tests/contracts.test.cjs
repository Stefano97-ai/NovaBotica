const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = path => require(`../.test-build/${path}`);
const { canAccess, safeDestination } = core('shared/domain/access');
const { createHttpClient, HttpError } = core('shared/infrastructure/http-client');
const { ApplicationError } = core('shared/application/errors');
const { createAuthUseCases } = core('features/auth/application/auth-use-cases');
const { createHttpAuthRepository } = core('features/auth/infrastructure/http-auth-repository');
const { createSessionLoaders } = core('app/routing/session-loaders');
const { createBrowserThemeRepository } = core('shared/infrastructure/browser-theme-repository');
const user = { id: '1', username: 'test', nombre: 'Test', rol: 'VENDEDOR' };

test('permissions reject unknown routes and unsafe or disallowed destinations', () => {
  assert.equal(canAccess('/ventas', 'VENDEDOR'), true);
  assert.equal(canAccess('/usuarios', 'VENDEDOR'), false);
  for (const path of ['https://example.com', '//example.com', '__proto__', '/usuarios', null]) {
    assert.equal(safeDestination(path, 'VENDEDOR'), '/');
  }
  assert.equal(safeDestination('/ventas', 'VENDEDOR'), '/ventas');
});

test('login normalizes username while preserving password and repository failures', async () => {
  let received;
  const failure = new Error('offline');
  const auth = createAuthUseCases({
    login: async credentials => { received = credentials; return user; },
    logout: async () => { throw failure; },
  });
  assert.equal(await auth.login({ username: ' test ', password: ' secret ' }), user);
  assert.deepEqual(received, { username: 'test', password: ' secret ' });
  await assert.rejects(auth.logout(), error => error === failure);
});

test('HTTP transport preserves cookie and mutation contract, including empty logout response', async () => {
  const http = createHttpClient(async (url, options) => {
    assert.equal(url, '/api/auth/logout');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.headers['X-Nova-Client'], 'web');
    assert.equal(options.body, '{}');
    return new Response(null, { status: 204 });
  });
  assert.equal(await http.request('auth/logout', { method: 'POST', body: {} }), undefined);
});

test('HTTP timeout and caller cancellation terminate pending requests', async () => {
  const pendingFetch = (_, { signal }) => new Promise((resolve, reject) => {
    if (signal.aborted) reject(signal.reason);
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  await assert.rejects(createHttpClient(pendingFetch, 10).request('inicio'));
  const controller = new AbortController();
  const result = createHttpClient(pendingFetch).request('inicio', { signal: controller.signal });
  controller.abort();
  await assert.rejects(result);
});

test('auth adapter unwraps user and translates HTTP failures for application consumers', async () => {
  const repository = createHttpAuthRepository({ request: async () => ({ user }) });
  assert.equal(await repository.currentUser(), user);
  for (const [status, code] of [[401, 'unauthorized'], [403, 'forbidden'], [429, 'rate-limit'], [503, 'unavailable']]) {
    const failing = createHttpAuthRepository({ request: async () => { throw new HttpError(status); } });
    await assert.rejects(failing.login({}), error => error instanceof ApplicationError && error.code === code);
  }
});

test('session loaders preserve destination, enforce roles, and expose service failures', async () => {
  const args = { request: new Request('http://localhost/ventas') };
  const loaders = createSessionLoaders({ currentUser: async () => user });
  assert.equal(await loaders.authorize('/ventas')(args), null);
  assert.equal((await loaders.authorize('/usuarios')(args)).headers.get('Location'), '/');
  const expired = createSessionLoaders({ currentUser: async () => { throw new ApplicationError('unauthorized', 'expired'); } });
  assert.equal((await expired.session(args)).headers.get('Location'), '/login?next=%2Fventas');
  const error = new ApplicationError('unavailable', 'offline');
  const offline = createSessionLoaders({ currentUser: async () => { throw error; } });
  await assert.rejects(offline.session(args), value => value === error);
  assert.equal(await offline.login(args), null);
});

test('theme still changes when browser persistence is blocked', () => {
  const root = { dataset: { theme: 'light' } };
  const theme = createBrowserThemeRepository(root, { setItem() { throw new Error('blocked'); } });
  theme.save('dark');
  assert.equal(theme.read(), 'dark');
});

const { createMemoryDraftRepository } = core('shared/infrastructure/memory-draft-repository');
const { createDraftUseCases } = core('shared/application/draft-use-cases');
const { saleTotal, validateSaleLine } = core('features/ventas/domain/sale-draft');
test('drafts validate before saving, isolate modules and cannot mutate repository by reference', () => {
  const repository = createMemoryDraftRepository();
  const drafts = createDraftUseCases(repository, () => 'draft-1');
  const rules = [{ key: 'name', required: true }, { key: 'quantity', kind: 'number', min: 1, integer: true }];
  assert.ok(drafts.save('products', { name: '', quantity: '1.5' }, rules).errors.name);
  assert.equal(drafts.list('products').length, 0);
  drafts.save('products', { name: 'Test', quantity: '2' }, rules);
  const snapshot = drafts.list('products');
  snapshot[0].values.name = 'Mutation';
  assert.equal(drafts.list('products')[0].values.name, 'Test');
  assert.equal(drafts.list('suppliers').length, 0);
  drafts.save('products', { name: 'Updated', quantity: '3' }, rules, 'draft-1');
  assert.equal(drafts.list('products').length, 1);
  assert.equal(createMemoryDraftRepository().list('products').length, 0);
  drafts.remove('products', 'draft-1');
  assert.equal(drafts.list('products').length, 0);
});
test('quotation uses integer cents and rejects invalid quantities and prices', () => {
  assert.equal(saleTotal([{ id: 'a', product: 'A', price: 0.1, quantity: 3 }, { id: 'b', product: 'B', price: 0.2, quantity: 1 }]), 50);
  assert.ok(validateSaleLine('A', 1.5, 5));
  assert.ok(validateSaleLine('A', 1, NaN));
  assert.ok(validateSaleLine('A', -1, 5));
  assert.ok(validateSaleLine('', 1, 5));
  assert.equal(validateSaleLine('A', 1, 5), null);
});

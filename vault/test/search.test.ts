import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer, type Server } from './rpc.js';
import { makeFixture, git, TRAIL_BODY, type Fixture } from './fixture.js';

const F = {
  refresh: {
    symptom: '401 on POST /auth/refresh when two tabs refresh within 50 ms',
    cause: 'the token store rotates the refresh token before the second request reads it',
    files: ['src/auth/token-store.ts', 'src/auth/refresh.ts'],
  },
  cron: {
    symptom: 'cron job runs at 02:00 local instead of 02:00 UTC after the DST switch',
    cause: 'the scheduler parses the cron expression with the host timezone; the container has TZ unset',
    files: ['src/jobs/scheduler.ts'],
  },
  upload: {
    symptom: 'image upload returns 413 for files under the configured 10 MB limit',
    cause: 'nginx client_max_body_size is 1m in the sidecar and overrides the app setting',
    files: ['deploy/nginx.conf'],
  },
};

const finding = (f: { symptom: string; cause: string; files: string[] }) => ({
  type: 'finding',
  fields: { ...f, confidence: 'Confirmed', verify: ['pnpm', 'test'] },
  body: 'details',
});

const env = (fx: Fixture, data = 'data') => ({ MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data(data), MORGAN_VAULT_PULL_TTL_MS: '0' });

async function seed(srv: Server): Promise<Record<string, string>> {
  const paths: Record<string, string> = {};
  for (const [k, f] of Object.entries(F)) {
    const w = await srv.tool('write', finding(f));
    assert.equal(w.ok, true, JSON.stringify(w));
    paths[k] = String(w.path);
  }
  return paths;
}

test('search ranks the note whose symptom holds the words first, and returns fields without bodies', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: env(fx), cwd: fx.proj });
  try {
    const paths = await seed(srv);
    const r = await srv.tool('search', { query: 'refresh token 401' });
    assert.equal(r.ok, true, JSON.stringify(r));
    const results = r.results as Array<Record<string, unknown>>;
    assert.equal(results[0]!.path, paths.refresh);
    assert.equal(results[0]!.type, 'finding');
    assert.equal(results[0]!.status, 'active');
    assert.equal(results[0]!.title, F.refresh.symptom);
    assert.deepEqual(results[0]!.files, F.refresh.files);
    assert.equal(typeof results[0]!.score, 'number');
    assert.equal('body' in results[0]!, false);
    assert.equal('verify' in results[0]!, false);
    assert.equal(r.stale_since, null);

    const byFile = await srv.tool('search', { query: 'deploy/nginx.conf' });
    assert.equal((byFile.results as Array<{ path: string }>)[0]!.path, paths.upload);

    const byType = await srv.tool('search', { query: 'scheduler timezone', type: 'trail' });
    assert.deepEqual(byType.results, []);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('search stays inside the current project unless the project allows crossing', async () => {
  const fx = makeFixture();
  const other = join(fx.dir, 'other');
  execFileSync('git', ['init', '-q', '--initial-branch=main', other]);
  git(['config', 'user.name', 'Dev B'], other);
  git(['config', 'user.email', 'dev-b@example.test'], other);
  writeFileSync(join(other, 'x'), 'x');
  git(['add', 'x'], other);
  git(['commit', '-q', '-m', 'init'], other);
  git(['remote', 'add', 'origin', 'https://github.com/acme/web.git'], other);

  const a = await startServer({ env: env(fx), cwd: fx.proj });
  const b = await startServer({ env: env(fx, 'data-b'), cwd: other });
  try {
    await seed(a);
    const wb = await b.tool('write', finding({ symptom: 'web: refresh token loop on the login page', cause: 'the web client retries refresh forever on 401', files: ['app/login.ts'] }));
    assert.equal(wb.ok, true, JSON.stringify(wb));

    const scoped = await a.tool('search', { query: 'refresh token' });
    const paths = (scoped.results as Array<{ path: string }>).map((x) => x.path);
    assert.ok(paths.every((p) => p.startsWith('projects/acme--repo/')), paths.join('\n'));

    const refused = await a.tool('search', { query: 'refresh token', cross_project: true });
    assert.equal(refused.ok, false);
    assert.equal(refused.code, 'cross_project_not_allowed');

    mkdirSync(join(fx.proj, '.claude/skills/morgan/references'), { recursive: true });
    writeFileSync(join(fx.proj, '.claude/skills/morgan/references/project-context.md'), '## Vault\n\n- cross_project: true\n');
    const crossed = await a.tool('search', { query: 'refresh token', cross_project: true });
    const all = (crossed.results as Array<{ path: string }>).map((x) => x.path);
    assert.ok(all.includes(String(wb.path)), all.join('\n'));
  } finally {
    await a.close();
    await b.close();
    fx.cleanup();
  }
});

test('search hides superseded findings unless asked for them', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: env(fx), cwd: fx.proj });
  try {
    const first = await srv.tool('write', finding(F.refresh));
    const second = await srv.tool('write', { ...finding(F.refresh), fields: { ...finding(F.refresh).fields, supersedes: first.ulid } });
    assert.equal(second.ok, true, JSON.stringify(second));
    const r = (await srv.tool('search', { query: 'refresh token' })).results as Array<{ path: string }>;
    assert.deepEqual(r.map((x) => x.path), [second.path]);
    const old = (await srv.tool('search', { query: 'refresh token', status: 'superseded' })).results as Array<{ path: string }>;
    assert.deepEqual(old.map((x) => x.path), [first.path]);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('search pulls first, so a teammate\'s note written a moment ago is found', async () => {
  const fx = makeFixture();
  const a = await startServer({ env: env(fx, 'home-a'), cwd: fx.proj });
  const b = await startServer({ env: env(fx, 'home-b'), cwd: fx.proj });
  try {
    await a.tool('status');
    await b.tool('status');
    const wb = await b.tool('write', finding(F.cron));
    const r = (await a.tool('search', { query: 'DST timezone' })).results as Array<{ path: string }>;
    assert.deepEqual(r.map((x) => x.path), [wb.path]);
  } finally {
    await a.close();
    await b.close();
    fx.cleanup();
  }
});

test('offline: search answers from the clone and says since when it may be stale', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: env(fx), cwd: fx.proj });
  try {
    const paths = await seed(srv);
    const clone = String((await srv.tool('status')).clone);
    git(['remote', 'set-url', 'origin', join(fx.dir, 'gone.git')], clone);
    const r = await srv.tool('search', { query: 'nginx' });
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal((r.results as Array<{ path: string }>)[0]!.path, paths.upload);
    assert.match(String(r.stale_since), /^\d{4}-\d{2}-\d{2}T/);
    const s = await srv.tool('status');
    assert.equal(s.stale_since, r.stale_since);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('recent lists what appeared since a moment, newest first, same scope and shape', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: env(fx), cwd: fx.proj });
  try {
    const before = new Date(Date.now() - 60_000).toISOString();
    const paths = await seed(srv);
    const t = await srv.tool('write', { type: 'trail', fields: { goal: 'queue work', files: [] }, body: TRAIL_BODY });
    const all = (await srv.tool('recent', { since: before })).results as Array<{ path: string; created: string }>;
    assert.deepEqual(new Set(all.map((x) => x.path)), new Set([...Object.values(paths), String(t.path)]));
    for (let i = 1; i < all.length; i++) assert.ok(all[i - 1]!.created >= all[i]!.created, 'newest first');
    const trails = (await srv.tool('recent', { since: before, type: 'trail' })).results as Array<{ path: string }>;
    assert.deepEqual(trails.map((x) => x.path), [t.path]);
    const open = (await srv.tool('recent', { since: before, type: 'trail', status: 'open' })).results as Array<{ path: string }>;
    assert.deepEqual(open.map((x) => x.path), [t.path]);
    const closed = (await srv.tool('recent', { since: before, type: 'trail', status: 'closed' })).results;
    assert.deepEqual(closed, []);
    const none = (await srv.tool('recent', { since: new Date(Date.now() + 60_000).toISOString() })).results;
    assert.deepEqual(none, []);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('search without a resolvable project says so', async () => {
  const fx = makeFixture();
  git(['remote', 'set-url', 'origin', join(fx.dir, 'local.git')], fx.proj);
  const srv = await startServer({ env: env(fx), cwd: fx.proj });
  try {
    const r = await srv.tool('search', { query: 'anything' });
    assert.equal(r.ok, false);
    assert.equal(r.code, 'project_unknown');
    assert.match(String(r.detail), /vault\.project/);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

// A configured-but-unreachable repo is not the same as no repo. write and status say not_ready;
// search and recent must agree, or a missing clone reads back as "you never set a vault".
test('search and recent on an unreachable repo say not_ready, not not_configured', async () => {
  const fx = makeFixture();
  const srv = await startServer({
    env: { MORGAN_VAULT_REPO: join(fx.dir, 'missing.git'), MORGAN_VAULT_DATA: fx.data(), MORGAN_VAULT_PULL_TTL_MS: '0' },
    cwd: fx.proj,
  });
  try {
    const s = await srv.tool('search', { query: 'anything' });
    assert.equal(s.ok, false);
    assert.equal(s.code, 'not_ready', JSON.stringify(s));
    const r = await srv.tool('recent', { since: '2020-01-01' });
    assert.equal(r.ok, false);
    assert.equal(r.code, 'not_ready', JSON.stringify(r));
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

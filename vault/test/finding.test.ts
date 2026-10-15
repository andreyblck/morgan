import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from './rpc.js';
import { makeFixture, cloneOf, git } from './fixture.js';

const FINDING = {
  symptom: '401 on POST /auth/refresh when two tabs refresh within 50 ms',
  cause: 'the token store rotates the refresh token before the second request reads it; the second read sends the old token and the server rejects it',
  confidence: 'Confirmed',
  verify: ['pnpm', 'test', '--', 'auth/refresh.race'],
  files: ['src/auth/token-store.ts', 'src/auth/refresh.ts'],
};

const finding = (over: Record<string, unknown> = {}, body = 'Ruled out: network timeout (reproduces offline).') => ({
  type: 'finding',
  fields: { ...FINDING, ...over },
  body,
});

test('write(finding) round-trips with verify as an array the reader must not run on its own', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const w = await srv.tool('write', finding());
    assert.equal(w.ok, true, JSON.stringify(w));
    assert.match(String(w.path), /^projects\/acme--repo\/findings\/[0-9A-HJKMNP-TV-Z]{26}-401-on-post-auth-refresh/);

    const r = await srv.tool('read', { path: w.path });
    assert.equal(r.ok, true, JSON.stringify(r));
    const fm = r.frontmatter as Record<string, unknown>;
    assert.equal(fm.type, 'finding');
    assert.equal(fm.status, 'active');
    assert.equal(fm.confidence, 'Confirmed');
    assert.deepEqual(fm.verify, FINDING.verify);
    assert.deepEqual(r.verify, FINDING.verify);
    assert.equal(r.verify_policy, 'show_to_user_never_autorun');
    assert.equal(r.read_confidence, 'Inferred');
    assert.deepEqual(r.stale, { changed: false, commits: 0 });
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('only a Confirmed cause is a finding; status is the server\'s field', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    for (const confidence of ['Strong theory', 'Working theory', 'Inconclusive', 'confirmed']) {
      const r = await srv.tool('write', finding({ confidence }));
      assert.equal(r.code, 'confidence_not_confirmed', confidence);
    }
    const st = await srv.tool('write', finding({ status: 'superseded' }));
    assert.equal(st.code, 'field_not_writable');
    assert.equal(git(['rev-list', '--count', '--all'], cloneOf(fx.repo, fx.dir)), '0');
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('verify is argv: no shell, no empty command', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    for (const verify of [['sh', '-c', 'a && b'], ['pnpm test | tee out'], ['echo', '$(id)'], ['cat', 'x; rm -rf /'], ['echo', 'a\nb'], ['echo', '`id`'], ['echo', '>', 'f']]) {
      const r = await srv.tool('write', finding({ verify }));
      assert.equal(r.code, 'verify_not_argv', JSON.stringify(verify));
    }
    const empty = await srv.tool('write', finding({ verify: [] }));
    assert.equal(empty.code, 'schema_error');
    const str = await srv.tool('write', finding({ verify: 'pnpm test' }));
    assert.equal(str.code, 'schema_error');
    const ok = await srv.tool('write', finding({ verify: ['node', '--test', 'test/auth-refresh.test.js'] }));
    assert.equal(ok.ok, true, JSON.stringify(ok));
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('a near-duplicate finding is refused with the path of the one that exists', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const a = await srv.tool('write', finding());
    assert.equal(a.ok, true);
    // Same words, different order and punctuation: a rephrase, not a new finding.
    const dup = await srv.tool('write', finding({
      symptom: 'two tabs refresh within 50 ms → 401 on POST /auth/refresh',
      cause: 'before the second request reads it the token store rotates the refresh token, so the second read sends the old token and the server rejects it',
    }));
    assert.equal(dup.ok, false);
    assert.equal(dup.code, 'duplicate');
    assert.equal(dup.existing, a.path);
    assert.match(String(dup.detail), /supersede/);

    const other = await srv.tool('write', finding({
      symptom: 'cron job runs at 02:00 local instead of 02:00 UTC after the DST switch',
      cause: 'the scheduler parses the cron expression with the host timezone; the container has TZ unset',
      files: ['src/jobs/scheduler.ts'],
    }));
    assert.equal(other.ok, true, JSON.stringify(other));
    assert.equal(git(['rev-list', '--count', 'HEAD'], cloneOf(fx.repo, fx.dir)), '2');
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('supersedes: the new note and the old note\'s status change land in one commit', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const a = await srv.tool('write', finding());
    const bad = await srv.tool('write', finding({ supersedes: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }));
    assert.equal(bad.code, 'schema_error');
    assert.match(String(bad.detail), /supersedes/);

    const c = await srv.tool('write', finding({
      supersedes: a.ulid,
      cause: 'the token store rotates the refresh token before the second request reads it; fixed by serialising refresh calls per session',
    }));
    assert.equal(c.ok, true, JSON.stringify(c));

    const v = cloneOf(fx.repo, fx.dir);
    assert.equal(git(['rev-list', '--count', 'HEAD'], v), '2');
    const files = git(['show', '--name-only', '--format=', 'HEAD'], v).split('\n').sort();
    assert.deepEqual(files, [String(a.path), String(c.path)].sort());

    const old = await srv.tool('read', { path: a.path });
    const fm = old.frontmatter as Record<string, unknown>;
    assert.equal(fm.status, 'superseded');
    assert.equal(fm.superseded_by, c.ulid);
    const fresh = (await srv.tool('read', { path: c.path })).frontmatter as Record<string, unknown>;
    assert.equal(fresh.status, 'active');
    assert.equal(fresh.supersedes, a.ulid);

    const again = await srv.tool('write', finding({ supersedes: a.ulid }));
    assert.equal(again.code, 'schema_error', 'a superseded note cannot be superseded twice');
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('stale: a finding knows when the files it names moved on, or when its sha is not in history', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const w = await srv.tool('write', finding({ files: ['src/auth/token-store.ts'] }));
    writeFileSync(join(fx.proj, 'README.md'), '# project\nunrelated\n');
    git(['commit', '-q', '-am', 'unrelated'], fx.proj);
    assert.deepEqual((await srv.tool('read', { path: w.path })).stale, { changed: false, commits: 0 });

    mkdirSync(join(fx.proj, 'src/auth'), { recursive: true });
    writeFileSync(join(fx.proj, 'src/auth/token-store.ts'), 'export const x = 1;\n');
    git(['add', 'src/auth/token-store.ts'], fx.proj);
    git(['commit', '-q', '-m', 'touch the store'], fx.proj);
    assert.deepEqual((await srv.tool('read', { path: w.path })).stale, { changed: true, commits: 1 });

    // Rewrite history so the note's sha is no longer an ancestor of HEAD.
    git(['reset', '-q', '--hard', 'HEAD~2'], fx.proj);
    git(['commit', '-q', '--allow-empty', '--amend', '-m', 'rewritten'], fx.proj);
    assert.deepEqual((await srv.tool('read', { path: w.path })).stale, { unknown: true });
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

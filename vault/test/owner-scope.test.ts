import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from './rpc.js';
import { makeFixture, TRAIL_BODY } from './fixture.js';

// makeFixture's project is owned by "acme" (remote github.com/acme/repo). MORGAN_VAULT_OWNERS pins
// the owners this vault serves, so the test doesn't need a URL-form vault repo to exercise scope.
const envWith = (fx: ReturnType<typeof makeFixture>, owners: string) => ({
  MORGAN_VAULT_REPO: fx.repo,
  MORGAN_VAULT_DATA: fx.data(),
  MORGAN_VAULT_OWNERS: owners,
});

test('owner scope: a matching owner is in scope — status configured, write lands', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: envWith(fx, 'acme'), cwd: fx.proj });
  try {
    const st = await srv.tool('status');
    assert.equal(st.configured, true, JSON.stringify(st));
    assert.equal((st.project as { slug: string }).slug, 'acme--repo');
    const w = await srv.tool('write', { type: 'trail', fields: { goal: 'in scope', files: [] }, body: TRAIL_BODY });
    assert.equal(w.ok, true, JSON.stringify(w));
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('owner scope: a foreign owner behaves as no vault — status not configured, write and search refuse', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: envWith(fx, 'other-org'), cwd: fx.proj });
  try {
    const st = await srv.tool('status');
    assert.equal(st.configured, false, JSON.stringify(st));
    assert.match(String(st.reason), /other-org/);
    const w = await srv.tool('write', { type: 'trail', fields: { goal: 'should not write', files: [] }, body: TRAIL_BODY });
    assert.equal(w.ok, false);
    assert.equal(w.code, 'not_configured', JSON.stringify(w));
    const s = await srv.tool('search', { query: 'anything' });
    assert.equal(s.ok, false);
    assert.equal(s.code, 'not_configured', JSON.stringify(s));
    // Out of scope means the vault is never even cloned for this project.
    const vaultDir = join(fx.data(), 'vault');
    const clones = existsSync(vaultDir) ? readdirSync(vaultDir).filter((e) => statSync(join(vaultDir, e)).isDirectory()) : [];
    assert.deepEqual(clones, [], 'no clone for an out-of-scope project');
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

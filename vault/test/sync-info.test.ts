import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './rpc.js';
import { makeFixture, TRAIL_BODY } from './fixture.js';

type SyncInfo = { source: string | null; head: string | null; last_pull: string | null; last_good_sync: string | null; notes_indexed: number };

// Where search answers come from must be visible from outside: which remote branch, at which
// commit, pulled when, how many notes indexed. Status pulls too, so it never shows a clone
// that search has already moved past.
test('sync: status and search say where their answers come from', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data(), MORGAN_VAULT_PULL_TTL_MS: '0' }, cwd: fx.proj });
  try {
    const w = await srv.tool('write', { type: 'trail', fields: { goal: 'move mail onto the queue', files: [] }, body: TRAIL_BODY });
    assert.equal(w.ok, true, JSON.stringify(w));

    const st = await srv.tool('status');
    const sync = st.sync as SyncInfo;
    assert.ok(sync, JSON.stringify(st));
    assert.equal(sync.source, 'origin/main');
    assert.match(String(sync.head), /^[0-9a-f]{12}$/);
    assert.match(String(sync.last_pull), /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(sync.notes_indexed, 1);

    const s = await srv.tool('search', { query: 'mail queue' });
    assert.equal(s.ok, true, JSON.stringify(s));
    assert.equal((s.sync as SyncInfo).head, sync.head);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

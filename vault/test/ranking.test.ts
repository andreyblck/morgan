import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, type Server } from './rpc.js';
import { makeFixture, type Fixture } from './fixture.js';

const env = (fx: Fixture) => ({ MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data(), MORGAN_VAULT_PULL_TTL_MS: '0' });

const finding = (symptom: string, cause: string, files: string[], body = 'details') => ({
  type: 'finding',
  fields: { symptom, cause, confidence: 'Confirmed', verify: ['pnpm', 'test'], files },
  body,
});

async function write(srv: Server, f: ReturnType<typeof finding>): Promise<string> {
  const w = await srv.tool('write', f);
  assert.equal(w.ok, true, JSON.stringify(w));
  return String(w.path);
}

const FILLER = [
  finding('login page loads slowly on first visit', 'the bundle ships every locale', ['src/login/page.tsx']),
  finding('avatar upload rejects small images', 'the size check is inverted', ['src/profile/avatar.ts']),
  finding('email digest sent twice on mondays', 'the cron and the queue both schedule it', ['src/jobs/digest.ts']),
];

// Search exists to find a finding by its symptom. A note that only mentions the words in a long
// body must not outrank the one whose symptom is about exactly that.
test('ranking: the note whose symptom holds the words beats one whose body repeats them', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: env(fx), cwd: fx.proj });
  try {
    for (const f of FILLER) await write(srv, f);
    const target = await write(srv, finding('invoice total rounds down instead of up', 'the formatter truncates the third decimal', ['src/billing/format.ts']));
    const log = Array.from({ length: 12 }, (_, i) => `row ${i}: invoice total rounds down, invoice total rounds down`).join('\n');
    await write(srv, finding('nightly export job times out', 'the export query scans every row without an index', ['src/jobs/export.ts'], log));
    const r = await srv.tool('search', { query: 'invoice total rounds down' });
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal((r.results as Array<{ path: string }>)[0]!.path, target);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

// A quoted phrase means those words, together, in that order.
test('ranking: a "quoted phrase" matches the words together, not scattered', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: env(fx), cwd: fx.proj });
  try {
    for (const f of FILLER) await write(srv, f);
    const phrase = await write(srv, finding('checkout page flickers on every keystroke', 'a negative cart total is recomputed on each render', ['src/checkout/page.tsx']));
    const scattered = await write(srv, finding('cart list sorts by total in the wrong order', 'the comparator reads the cart name before the total', ['src/cart/list.ts']));
    const r = await srv.tool('search', { query: '"negative cart total"' });
    assert.equal(r.ok, true, JSON.stringify(r));
    const paths = (r.results as Array<{ path: string }>).map((h) => h.path);
    assert.equal(paths[0], phrase);
    assert.equal(paths.includes(scattered), false, `scattered words must not match a phrase: ${JSON.stringify(paths)}`);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

// What you remember is rarely the exact word form: the quoted phrase's last word is a prefix.
test('ranking: a quoted phrase also finds its plural ("cart total" finds "cart totals")', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: env(fx), cwd: fx.proj });
  try {
    for (const f of FILLER) await write(srv, f);
    const plural = await write(srv, finding('refund report looks wrong after a partial refund', 'the report shows negative cart totals when a refund is split', ['src/reports/refunds.ts']));
    const r = await srv.tool('search', { query: '"negative cart total"' });
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal((r.results as Array<{ path: string }>)[0]?.path, plural);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

// The reader should see why a result is there: how many of the query's words it holds.
test('ranking: each hit says how many of the query terms it matched', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: env(fx), cwd: fx.proj });
  try {
    for (const f of FILLER) await write(srv, f);
    await write(srv, finding('invoice total rounds down instead of up', 'the formatter truncates the third decimal', ['src/billing/format.ts']));
    const r = await srv.tool('search', { query: 'invoice rounds nonexistentword' });
    const top = (r.results as Array<{ matched: number; terms: number }>)[0]!;
    assert.equal(top.terms, 3);
    assert.equal(top.matched, 2);
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

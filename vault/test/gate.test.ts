import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { userInfo } from 'node:os';
import { join } from 'node:path';
import { startServer, type Server } from './rpc.js';
import { makeFixture, cloneOf, git, TRAIL_BODY, type Fixture } from './fixture.js';

const trail = (body: string, over: Record<string, unknown> = {}) => ({
  type: 'trail',
  fields: { goal: 'move mail sending onto the queue', files: ['src/mail/send.ts'], ...over },
  body,
});

async function refused(srv: Server, fx: Fixture, input: unknown, code: string): Promise<Record<string, unknown>> {
  const r = await srv.tool('write', input as Record<string, unknown>);
  assert.equal(r.ok, false, JSON.stringify(r));
  assert.equal(r.code, code, JSON.stringify(r));
  // After a refusal the clone is untouched and the remote has nothing.
  const clone = String((await srv.tool('status')).clone);
  assert.equal(git(['status', '--porcelain'], clone), '');
  assert.equal(git(['rev-list', '--count', '--all'], cloneOf(fx.repo, fx.dir)), '0');
  return r;
}

test('limits: a body over 4000 chars or a fence over 30 lines is refused', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const padded = TRAIL_BODY + '\n' + 'x'.repeat(4001 - TRAIL_BODY.length - 1);
    assert.equal(padded.length, 4001);
    await refused(srv, fx, trail(padded), 'body_too_long');

    const fence31 = TRAIL_BODY + '\n```\n' + Array.from({ length: 31 }, (_, i) => `log line ${i}`).join('\n') + '\n```';
    await refused(srv, fx, trail(fence31), 'fence_too_long');

    const fence30 = TRAIL_BODY + '\n```\n' + Array.from({ length: 30 }, (_, i) => `log line ${i}`).join('\n') + '\n```';
    const ok = await srv.tool('write', trail(fence30));
    assert.equal(ok.ok, true, JSON.stringify(ok));
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('deny-list: home paths, the git user name and the project override are personal data', async () => {
  const fx = makeFixture();
  mkdirSync(join(fx.proj, '.claude/skills/morgan/references'), { recursive: true });
  writeFileSync(
    join(fx.proj, '.claude/skills/morgan/references/project-context.md'),
    '# Project context\n\n## Vault\n\n- project: acme--repo\n- deny: AcmeCorp, Globex Ltd\n\n## Something else\n\n- deny: NotThis\n',
  );
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const me = userInfo().username;
    const r1 = await refused(srv, fx, trail(TRAIL_BODY + `\nsee /Users/${me}/work/notes.txt`), 'personal_data');
    assert.match(String(r1.detail), /home path/);
    await refused(srv, fx, trail(TRAIL_BODY + `\nsee /home/${me}/notes.txt`), 'personal_data');
    const r2 = await refused(srv, fx, trail(TRAIL_BODY + '\nDev A said it was fine'), 'personal_data');
    assert.match(String(r2.detail), /git user name/);
    const r3 = await refused(srv, fx, trail(TRAIL_BODY, { goal: 'fix the Globex Ltd import' }), 'personal_data');
    assert.match(String(r3.detail), /deny list/);
    // The deny bullet under another heading is not a vault setting.
    const ok = await srv.tool('write', trail(TRAIL_BODY + '\nNotThis is fine here'));
    assert.equal(ok.ok, true, JSON.stringify(ok));
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

// Samples are the documented example formats of each provider, not real credentials. Each is
// assembled from fragments so the source file carries no contiguous secret-shaped literal for a
// scanner (GitHub push protection) to flag; the gate still sees the whole string at runtime.
const SECRET_SAMPLES: Array<[string, string]> = [
  ['aws_access_key', 'key ' + 'AKIA' + 'IOSFODNN7EXAMPLE' + ' was used'],
  ['github_token', 'token ' + 'gh' + 'p_' + '16C7e42F292c6912E7710c838347Ae178B4a' + ' in the log'],
  // github_pat_ + 22 chars + _ + 59 chars, per GitHub's documented format.
  ['github_fine_grained', 'git' + 'hub_pat_' + '11ABCDEFG0abcdefghijkl' + '_' + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456'],
  ['slack_token', 'xox' + 'b-123456789012-1234567890123-AbCdEfGhIjKlMnOpQrStUvWx'],
  ['stripe_key', 's' + 'k_' + 'live_' + '4eC39HqLyjWDarjtT1zdp7dc'],
  ['private_key', '-----BEGIN ' + 'RSA PRIVATE KEY' + '-----\nMIIEpAIBAAKCAQEA\n-----END ' + 'RSA PRIVATE KEY' + '-----'],
  ['jwt', 'eyJ' + 'hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' + '.eyJ' + 'zdWIiOiIxMjM0NTY3ODkwIn0' + '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'],
  ['generic_credential', 'api_key = ' + '9f8e7d6c5b4a3210ffee'],
  ['url_credentials', 'postgres://app:' + 'hunter2hunter2' + '@db.internal:5432/app'],
];

test('secrets: documented token formats are refused by rule name, and the value is not echoed', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    for (const [rule, sample] of SECRET_SAMPLES) {
      const r = await refused(srv, fx, trail(TRAIL_BODY + '\n' + sample), 'secret_detected');
      assert.match(String(r.detail), new RegExp(rule), `rule ${rule}`);
      const value = sample.split(/\s+/).find((w) => w.length >= 20) ?? sample;
      assert.ok(!String(r.detail).includes(value), `detail must not echo the value for ${rule}`);
    }
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('secrets: any value from the project\'s .env files is refused, short ones ignored', async () => {
  const fx = makeFixture();
  writeFileSync(join(fx.proj, '.env'), 'DB_PASSWORD="s3cr3tpassw0rd"\nPORT=3000\nAPP_NAME=billing\n');
  writeFileSync(join(fx.proj, '.env.local'), 'export SMTP_TOKEN=tok_local_abcdef\n');
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    const r = await refused(srv, fx, trail(TRAIL_BODY + '\nconnection used s3cr3tpassw0rd and failed'), 'secret_detected');
    assert.match(String(r.detail), /env_value/);
    assert.match(String(r.detail), /DB_PASSWORD/);
    assert.ok(!String(r.detail).includes('s3cr3tpassw0rd'));
    await refused(srv, fx, trail(TRAIL_BODY + '\ntok_local_abcdef'), 'secret_detected');
    // "billing" and "3000" are under eight characters and ordinary words.
    const ok = await srv.tool('write', trail(TRAIL_BODY + '\nbilling listens on 3000'));
    assert.equal(ok.ok, true, JSON.stringify(ok));
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

test('gate order: a note that fails several checks is refused by the first one', async () => {
  const fx = makeFixture();
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: fx.repo, MORGAN_VAULT_DATA: fx.data() }, cwd: fx.proj });
  try {
    // Too long and carrying a token: limits run before secrets.
    const body = TRAIL_BODY + '\n' + 'AKIA' + 'IOSFODNN7EXAMPLE' + '\n' + 'x'.repeat(4100);
    await refused(srv, fx, trail(body), 'body_too_long');
  } finally {
    await srv.close();
    fx.cleanup();
  }
});

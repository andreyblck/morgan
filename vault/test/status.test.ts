import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { startServer } from './rpc.js';

const sh = (args: string[], cwd: string) => execFileSync('git', args, { cwd, stdio: 'pipe' }).toString().trim();

// realpath: on macOS the temp dir is a symlink, and the server reports process.cwd() resolved.
function scratch(): string {
  return realpathSync(mkdtempSync(join(tmpdir(), 'vault-status-')));
}

function bareRepo(dir: string): string {
  const repo = join(dir, 'team-vault.git');
  execFileSync('git', ['init', '-q', '--bare', '--initial-branch=main', repo]);
  return repo;
}

function project(dir: string, remote: string | null): string {
  const p = join(dir, 'project');
  execFileSync('git', ['init', '-q', p]);
  if (remote) sh(['remote', 'add', 'origin', remote], p);
  return p;
}

test('status without MORGAN_VAULT_REPO reports not configured and touches nothing', async () => {
  const dir = scratch();
  const srv = await startServer({ env: { MORGAN_VAULT_DATA: dir }, cwd: dir });
  try {
    const s = await srv.tool('status');
    assert.equal(s.configured, false);
    assert.equal(s.reason, 'MORGAN_VAULT_REPO is empty');
    assert.equal(existsSync(join(dir, 'vault')), false);
  } finally {
    await srv.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('status with a repo clones it once and resolves the project from the URL remote', async () => {
  const dir = scratch();
  const repo = bareRepo(dir);
  const proj = project(dir, 'https://github.com/Acme/Repo.git');
  const data = join(dir, 'data');
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: repo, MORGAN_VAULT_DATA: data }, cwd: proj });
  try {
    const s = await srv.tool('status');
    assert.equal(s.configured, true);
    assert.equal(s.ready, true);
    assert.equal(s.repo, repo);
    const clone = String(s.clone);
    assert.ok(clone.startsWith(join(data, 'vault') + '/'), `clone lives under the data dir: ${clone}`);
    assert.equal(sh(['remote', 'get-url', 'origin'], clone), repo);
    assert.deepEqual(s.project, { slug: 'acme--repo', remote: 'github.com/acme/repo' });
    assert.equal(s.project_reason, null);
    assert.equal(s.unpushed, 0);
    assert.equal(s.stale_since, null);
    assert.equal(s.project_dir, proj);

    // Second call reuses the clone instead of cloning again.
    const again = await srv.tool('status');
    assert.equal(again.clone, clone);
  } finally {
    await srv.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('status with a path remote has no project and says what to do', async () => {
  const dir = scratch();
  const repo = bareRepo(dir);
  const proj = project(dir, join(dir, 'origin.git'));
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: repo, MORGAN_VAULT_DATA: join(dir, 'data') }, cwd: proj });
  try {
    const s = await srv.tool('status');
    assert.equal(s.configured, true);
    assert.equal(s.project, null);
    assert.match(String(s.project_reason), /vault\.project/);
  } finally {
    await srv.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('status in a directory with no git remote has no project', async () => {
  const dir = scratch();
  const repo = bareRepo(dir);
  const proj = project(dir, null);
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: repo, MORGAN_VAULT_DATA: join(dir, 'data') }, cwd: proj });
  try {
    const s = await srv.tool('status');
    assert.equal(s.project, null);
    assert.match(String(s.project_reason), /origin/);
  } finally {
    await srv.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('status with an unreachable repo is configured but not ready', async () => {
  const dir = scratch();
  const proj = project(dir, 'https://github.com/acme/repo.git');
  const srv = await startServer({ env: { MORGAN_VAULT_REPO: join(dir, 'missing.git'), MORGAN_VAULT_DATA: join(dir, 'data') }, cwd: proj });
  try {
    const s = await srv.tool('status');
    assert.equal(s.configured, true);
    assert.equal(s.ready, false);
    assert.match(String(s.reason), /clone failed/);
  } finally {
    await srv.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

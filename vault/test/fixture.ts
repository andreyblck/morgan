// A vault and a project, both throwaway, both real git.
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

export const git = (args: string[], cwd: string): string => {
  try {
    return execFileSync('git', args, { cwd, stdio: 'pipe', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
      .toString()
      .trim();
  } catch (e) {
    const err = e as { stderr?: Buffer; message: string };
    throw new Error(`git ${args.join(' ')} in ${cwd}: ${err.stderr?.toString().trim() || err.message}`);
  }
};

export interface Fixture {
  dir: string;
  /** bare remote of the team vault */
  repo: string;
  /** a project checkout with one commit and a URL-form origin */
  proj: string;
  /** that project's HEAD sha */
  sha: string;
  data: (name?: string) => string;
  cleanup: () => void;
}

export function makeFixture(remote = 'https://github.com/Acme/Repo.git'): Fixture {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'vault-')));
  const repo = join(dir, 'team-vault.git');
  execFileSync('git', ['init', '-q', '--bare', '--initial-branch=main', repo]);

  const proj = join(dir, 'project');
  execFileSync('git', ['init', '-q', '--initial-branch=main', proj]);
  git(['config', 'user.name', 'Dev A'], proj);
  git(['config', 'user.email', 'dev-a@example.test'], proj);
  writeFileSync(join(proj, 'README.md'), '# project\n');
  git(['add', 'README.md'], proj);
  git(['commit', '-q', '-m', 'init'], proj);
  git(['remote', 'add', 'origin', remote], proj);
  const sha = git(['rev-parse', 'HEAD'], proj);

  return {
    dir,
    repo,
    proj,
    sha,
    data: (name = 'data') => join(dir, name),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

/** Fresh clone of the remote, to check what actually landed. */
export function cloneOf(repo: string, dir: string, name = 'verify'): string {
  const target = join(dir, name);
  rmSync(target, { recursive: true, force: true });
  execFileSync('git', ['clone', '-q', repo, target]);
  return target;
}

export const TRAIL_BODY = [
  '## Goal',
  'move mail sending onto the queue',
  '## Timeline',
  '- Tried wrapping send() → got a timeout in the worker.',
  '## Ruled out',
  '- Not the SMTP pool — same timeout with the fake transport.',
  '## Open / untried',
  '- Maybe the job payload is too large — check the queue limits.',
  '## Confidence',
  'Working theory',
  '## Next',
  'measure payload size on a real send',
].join('\n');

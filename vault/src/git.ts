import { execFile } from 'node:child_process';

export interface GitResult {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * The only way this server runs git. A fixed argv through execFile, never a shell,
 * so nothing read from a note or a query can become a flag or a second command.
 * Callers put `--` before any path they pass.
 */
export function git(args: string[], cwd: string): Promise<GitResult> {
  return new Promise((resolve) => {
    execFile(
      'git',
      args,
      {
        cwd,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' },
        maxBuffer: 16 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const code = error && typeof (error as { code?: unknown }).code === 'number' ? (error as { code: number }).code : error ? 1 : 0;
        resolve({ ok: !error, code, stdout: String(stdout), stderr: String(stderr) });
      },
    );
  });
}

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Refusal } from './limits.js';

/**
 * Known token shapes. Each regex is the provider's documented format; the detail names
 * the rule and never the match. This is the cheap half; the `.env` match below is the
 * half that catches a project's own secrets, which no public rule set knows.
 */
export const SECRET_RULES: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: 'aws_access_key', re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: 'github_fine_grained', re: /\bgithub_pat_[0-9A-Za-z]{22}_[0-9A-Za-z]{59}\b/ },
  { name: 'github_token', re: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/ },
  { name: 'slack_token', re: /\bxox[abpr]-[0-9A-Za-z-]{10,}\b/ },
  { name: 'stripe_key', re: /\b[sr]k_(live|test)_[0-9A-Za-z]{20,}\b/ },
  { name: 'private_key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'jwt', re: /\beyJ[0-9A-Za-z_-]{8,}\.eyJ[0-9A-Za-z_-]{8,}\.[0-9A-Za-z_-]{8,}\b/ },
  { name: 'url_credentials', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]{4,}@[^\s/]+/i },
  { name: 'generic_credential', re: /\b(api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*["']?[^\s"']{8,}/i },
];

export function matchSecretRules(text: string): Refusal | null {
  for (const rule of SECRET_RULES) {
    if (rule.re.test(text)) return { code: 'secret_detected', detail: `matches rule ${rule.name}` };
  }
  return null;
}

const MIN_ENV_VALUE = 8;

/** KEY=VALUE pairs from every `.env*` file in the project. Unreadable files are skipped, not errors. */
export async function loadEnvValues(projectDir: string): Promise<Array<{ key: string; value: string; file: string }>> {
  let names: string[];
  try {
    names = (await readdir(projectDir)).filter((n) => n === '.env' || n.startsWith('.env.'));
  } catch {
    return [];
  }
  const out: Array<{ key: string; value: string; file: string }> = [];
  for (const file of names) {
    let text: string;
    try {
      text = await readFile(join(projectDir, file), 'utf8');
    } catch {
      continue;
    }
    for (const raw of text.split('\n')) {
      const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(raw);
      if (!m) continue;
      let value = m[2]!.trim();
      if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
      value = value.replace(/\s+#.*$/, '');
      if (value.length >= MIN_ENV_VALUE) out.push({ key: m[1]!, value, file });
    }
  }
  return out;
}

export function matchEnvValues(text: string, env: Array<{ key: string; value: string; file: string }>): Refusal | null {
  for (const e of env) {
    if (text.includes(e.value)) return { code: 'secret_detected', detail: `env_value: the value of ${e.key} from ${e.file}` };
  }
  return null;
}

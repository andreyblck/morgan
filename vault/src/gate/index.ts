import { checkDeny } from './deny.js';
import { checkLimits, type Refusal } from './limits.js';
import { loadEnvValues, matchEnvValues, matchSecretRules } from './secrets.js';

export type { Refusal } from './limits.js';

export interface GateInput {
  /** Everything the client sent, as the text it will become: fields and body together. */
  text: string;
  body: string;
  projectDir: string;
  gitUserName: string | null;
  deny: string[];
}

/**
 * The write gate, in a fixed order. The first refusal stops the chain. Nothing here
 * touches the clone, so a refusal leaves no trace to clean up.
 */
export async function runGate(input: GateInput): Promise<Refusal | null> {
  const limits = checkLimits(input.body);
  if (limits) return limits;

  const deny = checkDeny(input.text, { gitUserName: input.gitUserName, deny: input.deny });
  if (deny) return deny;

  // Fail closed: a scanner that cannot run is a scanner that found something.
  try {
    const rule = matchSecretRules(input.text);
    if (rule) return rule;
    const env = matchEnvValues(input.text, await loadEnvValues(input.projectDir));
    if (env) return env;
  } catch (e) {
    return { code: 'scan_failed', detail: `secret scan did not run: ${(e as Error).message}` };
  }
  return null;
}

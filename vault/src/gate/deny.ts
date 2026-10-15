import { userInfo } from 'node:os';
import type { Refusal } from './limits.js';

export interface DenyContext {
  /** The project's git user.name — the author's own name has no place in a note about the system. */
  gitUserName: string | null;
  /** Names the project declared under `## Vault` → `deny:`. */
  deny: string[];
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A note about the system must not carry a person or a client in it. */
export function checkDeny(text: string, ctx: DenyContext): Refusal | null {
  const user = (() => {
    try {
      return userInfo().username;
    } catch {
      return null;
    }
  })();
  if (user) {
    const home = new RegExp(`(^|[\\s"'\`(])/(Users|home)/${escapeRe(user)}(/|\\b)`);
    if (home.test(text)) return { code: 'personal_data', detail: 'home path of the current user' };
  }
  if (ctx.gitUserName && ctx.gitUserName.length >= 3) {
    const name = new RegExp(`(^|\\W)${escapeRe(ctx.gitUserName)}(\\W|$)`, 'i');
    if (name.test(text)) return { code: 'personal_data', detail: 'git user name of the author' };
  }
  for (const term of ctx.deny) {
    if (term.length < 2) continue;
    if (new RegExp(`(^|\\W)${escapeRe(term)}(\\W|$)`, 'i').test(text)) {
      return { code: 'personal_data', detail: `matches the project's deny list` };
    }
  }
  return null;
}

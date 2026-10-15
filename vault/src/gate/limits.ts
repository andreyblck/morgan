export const MAX_BODY_CHARS = 4000;
export const MAX_FENCE_LINES = 30;

export type Refusal = { code: string; detail: string };

/** Bodies are notes, not dumps: a cap on the whole, and a cap on any fenced block. */
export function checkLimits(body: string): Refusal | null {
  if (body.length > MAX_BODY_CHARS) {
    return { code: 'body_too_long', detail: `${body.length} chars, limit ${MAX_BODY_CHARS}` };
  }
  let open: number | null = null;
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i]!)) {
      if (open === null) {
        open = i;
      } else {
        const inner = i - open - 1;
        if (inner > MAX_FENCE_LINES) {
          return { code: 'fence_too_long', detail: `fenced block of ${inner} lines at line ${open + 1}, limit ${MAX_FENCE_LINES}` };
        }
        open = null;
      }
    }
  }
  if (open !== null && lines.length - open - 1 > MAX_FENCE_LINES) {
    return { code: 'fence_too_long', detail: `unclosed fence at line ${open + 1} runs ${lines.length - open - 1} lines, limit ${MAX_FENCE_LINES}` };
  }
  return null;
}

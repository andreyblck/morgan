import { randomBytes } from 'node:crypto';

// Crockford base32, as ULID specifies: no I, L, O, U.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 26 chars: 10 of timestamp (ms), 16 random. Sorts by creation time; never collides in practice. */
export function ulid(now: number = Date.now()): string {
  let time = '';
  let t = now;
  for (let i = 0; i < 10; i++) {
    time = ALPHABET[t % 32] + time;
    t = Math.floor(t / 32);
  }
  const bytes = randomBytes(16);
  let rand = '';
  for (let i = 0; i < 16; i++) rand += ALPHABET[bytes[i]! % 32];
  return time + rand;
}

export const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

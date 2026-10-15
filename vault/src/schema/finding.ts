import { z } from 'zod';
import { ULID_RE } from '../ulid.js';
import { projectFile } from './trail.js';

/** Characters that would make an argv element mean something to a shell. */
const SHELL_META = /[;&|$()`<>\n\r]/;

export const argvElement = z
  .string()
  .min(1)
  .max(300)
  .refine((s) => !SHELL_META.test(s), 'shell metacharacters are not allowed in an argv element');

/**
 * A finding is a proven cause: the gate takes nothing below Confirmed, and the proof is a
 * command as argv, so the reader can show it before running it and a shell can never
 * see it as a string.
 */
export const findingFields = z
  .object({
    symptom: z.string().min(1).max(500),
    cause: z.string().min(1).max(1000),
    confidence: z.literal('Confirmed'),
    verify: z.array(argvElement).min(1).max(30),
    files: z.array(projectFile).min(1).max(50),
    fix_sha: z.string().regex(/^[0-9a-f]{7,40}$/).optional(),
    supersedes: z.string().regex(ULID_RE).optional(),
  })
  .strict();

export type FindingFields = z.infer<typeof findingFields>;

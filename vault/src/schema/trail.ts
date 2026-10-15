import { z } from 'zod';

/** Fields the server sets itself. A client that sends one is refused, not corrected. */
export const SERVER_FIELDS = ['type', 'project', 'author', 'created', 'sha', 'branch'] as const;

/** A path inside the project: relative, no `..` segment. */
export const projectFile = z
  .string()
  .min(1)
  .max(300)
  .refine((p) => !p.startsWith('/') && !/(^|\/)\.\.(\/|$)/.test(p), 'must be a relative path inside the project');

/** The six sections of the in-flight working log (handing-off reference), in order. */
export const TRAIL_SECTIONS = ['## Goal', '## Timeline', '## Ruled out', '## Open / untried', '## Confidence', '## Next'] as const;

export const trailFields = z
  .object({
    goal: z.string().min(1).max(200),
    files: z.array(projectFile).max(50),
    status: z.enum(['open', 'closed']).default('open'),
    closed_by: z.string().max(200).optional(),
  })
  .strict();

export type TrailFields = z.infer<typeof trailFields>;

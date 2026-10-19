import { z } from 'zod';
import type { Config } from '../config.js';
import type { Hit } from '../index.js';
import { ownerAllowed, outOfScopeReason, resolveScopedProject } from '../project.js';
import { loadVaultSettings } from '../projectContext.js';
import { NOTE_TYPES } from '../schema/index.js';
import type { Sync, SyncInfo } from '../sync.js';

export const searchInput = {
  query: z.string().min(1).max(500),
  type: z.enum(NOTE_TYPES).optional(),
  status: z.enum(['active', 'superseded', 'open', 'closed']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  cross_project: z.boolean().optional(),
};

export const recentInput = {
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/, 'ISO 8601 date or datetime'),
  type: z.enum(NOTE_TYPES).optional(),
  status: z.enum(['active', 'superseded', 'open', 'closed']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  cross_project: z.boolean().optional(),
};

export type ListResult =
  | { ok: true; project: string | null; results: Hit[]; stale_since: string | null; sync: SyncInfo }
  | { ok: false; code: 'not_configured' | 'not_ready' | 'project_unknown' | 'cross_project_not_allowed' | 'fts_unavailable'; detail: string };

/** The scope every read-list shares: this project, or all of them only when the project said so. */
async function scope(cfg: Config, cross: boolean | undefined): Promise<{ project: string | null } | ListResult> {
  const { project, reason } = await resolveScopedProject(cfg);
  if (cross) {
    const settings = await loadVaultSettings(cfg.projectDir);
    if (!settings.cross_project) {
      return { ok: false, code: 'cross_project_not_allowed', detail: 'set `- cross_project: true` under ## Vault in the project-context override to search other projects' };
    }
    return { project: null };
  }
  if (!project) return { ok: false, code: 'project_unknown', detail: reason ?? 'no project' };
  // A project outside this vault's owners behaves as no vault.
  if (!ownerAllowed(cfg, project)) return { ok: false, code: 'not_configured', detail: outOfScopeReason(cfg, project) };
  return { project: project.slug };
}

/**
 * Scope first, clone second: a project outside this vault's owners is answered from config alone,
 * so the vault is never cloned into a session that may not use it. The sync is a getter for that
 * reason — creating it clones.
 */
async function ready(
  cfg: Config,
  getSync: () => Promise<Sync | null>,
  cross: boolean | undefined,
): Promise<{ project: string | null; sync: Sync } | ListResult> {
  if (cfg.repo === null) return { ok: false, code: 'not_configured', detail: 'MORGAN_VAULT_REPO is empty' };
  const s = await scope(cfg, cross);
  if ('ok' in s) return s;
  const sync = await getSync();
  if (!sync) return { ok: false, code: 'not_ready', detail: 'the vault clone is not available (clone failed or the remote is unreachable)' };
  await sync.refresh();
  if (sync.index.error) return { ok: false, code: 'fts_unavailable', detail: sync.index.error };
  return { project: s.project, sync };
}

export async function searchNotes(cfg: Config, getSync: () => Promise<Sync | null>, input: z.infer<z.ZodObject<typeof searchInput>>): Promise<ListResult> {
  const r = await ready(cfg, getSync, input.cross_project);
  if ('ok' in r) return r;
  const results = r.sync.index.query({ text: input.query, project: r.project, type: input.type, status: input.status, limit: input.limit ?? 10 });
  return { ok: true, project: r.project, results, stale_since: r.sync.staleSince, sync: r.sync.info };
}

export async function recentNotes(cfg: Config, getSync: () => Promise<Sync | null>, input: z.infer<z.ZodObject<typeof recentInput>>): Promise<ListResult> {
  const r = await ready(cfg, getSync, input.cross_project);
  if ('ok' in r) return r;
  const results = r.sync.index.recent({ since: input.since, project: r.project, type: input.type, status: input.status, limit: input.limit ?? 20 });
  return { ok: true, project: r.project, results, stale_since: r.sync.staleSince, sync: r.sync.info };
}

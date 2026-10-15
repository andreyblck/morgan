import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { cloneDir, type Config } from '../config.js';
import { listNotes, type StoredNote } from '../findings.js';
import { findDuplicate } from '../gate/dedup.js';
import { runGate } from '../gate/index.js';
import { git } from '../git.js';
import { parseNote, serializeNote, type Frontmatter } from '../notes.js';
import { loadVaultSettings } from '../projectContext.js';
import { Repo } from '../repo.js';
import { resolveScopedProject } from '../project.js';
import { KINDS, NOTE_TYPES, type NoteType } from '../schema/index.js';
import { ulid } from '../ulid.js';

export const writeInput = {
  type: z.enum(NOTE_TYPES),
  fields: z.record(z.string(), z.unknown()),
  body: z.string(),
};

export type WriteResult =
  | { ok: true; path: string; ulid: string }
  | { ok: false; code: string; detail: string; existing?: string };

const refuse = (code: string, detail: string, existing?: string): WriteResult =>
  existing === undefined ? { ok: false, code, detail } : { ok: false, code, detail, existing };
const exists = (p: string) => access(p).then(() => true, () => false);

function slugOf(text: string): string {
  const s = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
  return s || 'note';
}

async function projectHead(projectDir: string): Promise<{ sha: string | null; branch: string | null }> {
  const sha = await git(['rev-parse', '--verify', '--quiet', 'HEAD'], projectDir);
  const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD'], projectDir);
  return { sha: sha.ok ? sha.stdout.trim() : null, branch: branch.ok ? branch.stdout.trim() : null };
}

async function projectAuthor(projectDir: string): Promise<{ name: string; email: string }> {
  const name = await git(['config', 'user.name'], projectDir);
  const email = await git(['config', 'user.email'], projectDir);
  return { name: name.stdout.trim() || 'unknown', email: email.stdout.trim() || 'unknown' };
}

function checkSections(body: string, sections: readonly string[]): string | null {
  const lines = new Set(body.split('\n').map((l) => l.trimEnd()));
  for (const s of sections) if (!lines.has(s)) return `missing section "${s}"`;
  return null;
}

/** Schema refusals, in the order a reader would want to hear them. */
function schemaRefusal(type: NoteType, fields: Record<string, unknown>): WriteResult | null {
  const kind = KINDS[type];
  for (const f of kind.serverFields) if (f in fields) return refuse('field_not_writable', `"${f}" is set by the server`);
  if (type === 'finding' && 'confidence' in fields && fields.confidence !== 'Confirmed') {
    return refuse('confidence_not_confirmed', `a finding needs confidence "Confirmed"; got ${JSON.stringify(fields.confidence)}`);
  }
  const parsed = kind.fields.safeParse(fields);
  if (parsed.success) return null;
  const issue = parsed.error.issues[0]!;
  if (issue.code === 'unrecognized_keys') return refuse('unknown_field', `unknown field(s): ${(issue as { keys: string[] }).keys.join(', ')}`);
  if (issue.path[0] === 'verify' && issue.path.length > 1) return refuse('verify_not_argv', `verify[${String(issue.path[1])}]: ${issue.message}`);
  return refuse('schema_error', `${issue.path.join('.') || '(root)'}: ${issue.message}`);
}

export async function writeNote(cfg: Config, input: { type: NoteType; fields: Record<string, unknown>; body: string }, sharedRepo?: Repo): Promise<WriteResult> {
  if (cfg.repo === null) return refuse('not_configured', 'MORGAN_VAULT_REPO is empty');
  const kind = KINDS[input.type];

  const schemaError = schemaRefusal(input.type, input.fields);
  if (schemaError) return schemaError;
  const fields = kind.fields.parse(input.fields) as Record<string, unknown>;
  const sectionError = checkSections(input.body, kind.sections);
  if (sectionError) return refuse('schema_error', sectionError);

  const author = await projectAuthor(cfg.projectDir);
  const settings = await loadVaultSettings(cfg.projectDir);
  const refusal = await runGate({
    text: serializeNote(fields, input.body),
    body: input.body,
    projectDir: cfg.projectDir,
    gitUserName: author.name === 'unknown' ? null : author.name,
    deny: settings.deny,
  });
  if (refusal) return refuse(refusal.code, refusal.detail);

  const { project, reason } = await resolveScopedProject(cfg);
  if (!project) return refuse('project_unknown', reason ?? 'no project');

  const repo = sharedRepo ?? new Repo(cloneDir({ ...cfg, repo: cfg.repo }), cfg.repo);
  const cloneError = await repo.ensure();
  if (cloneError) return refuse('not_ready', cloneError);

  // Dedup and supersede need the project's findings as they are now.
  let superseded: StoredNote | null = null;
  if (input.type === 'finding') {
    const existing = await listNotes(repo.clone, project.slug, 'findings');
    const target = typeof fields.supersedes === 'string' ? fields.supersedes : null;
    if (target !== null) {
      superseded = existing.find((n) => n.ulid === target && n.frontmatter.status === 'active') ?? null;
      if (!superseded) return refuse('schema_error', `supersedes: no active finding ${target} in ${project.slug}`);
    }
    const dup = findDuplicate(fields as { symptom: string; cause: string }, existing, target);
    if (dup) return refuse(dup.code, dup.detail, dup.existing);
  }

  const id = ulid();
  const head = await projectHead(cfg.projectDir);
  const created = new Date().toISOString();

  const frontmatter: Frontmatter = {
    type: input.type,
    project: project.slug,
    author: `${author.name} <${author.email}>`,
    created,
    sha: head.sha,
    branch: head.branch,
    ...fields,
    ...(input.type === 'finding' ? { status: 'active' } : {}),
  };
  const notePath = `projects/${project.slug}/${kind.dir}/${id}-${slugOf(String(fields[kind.slugFrom] ?? ''))}.md`;
  const projectPath = `projects/${project.slug}/project.md`;

  const paths = [notePath];
  const result = await repo.commitAndPush({
    paths,
    message: `vault: ${input.type} ${id} (${project.slug})`,
    author,
    write: async () => {
      // Files that only exist on a first write are the server's own too. Their content is
      // the same whichever clone writes them first, so two first writes rebase cleanly.
      if (!(await exists(join(repo.clone, projectPath)))) {
        await mkdir(join(repo.clone, dirname(projectPath)), { recursive: true });
        await writeFile(join(repo.clone, projectPath), serializeNote({ slug: project.slug, remotes: project.remote ? [project.remote] : [] }, `# ${project.slug}\n`));
        paths.push(projectPath);
      }
      if (!(await exists(join(repo.clone, '.gitignore')))) {
        await writeFile(join(repo.clone, '.gitignore'), '.obsidian/\n');
        paths.push('.gitignore');
      }
      if (superseded) {
        // Re-read after the pull: the file on disk is the one the commit will carry.
        const current = parseNote(await readFile(join(repo.clone, superseded.path), 'utf8'));
        if (!('invalid' in current)) {
          await writeFile(join(repo.clone, superseded.path), serializeNote({ ...current.frontmatter, status: 'superseded', superseded_by: id }, current.body));
          paths.push(superseded.path);
        }
      }
      await mkdir(join(repo.clone, dirname(notePath)), { recursive: true });
      await writeFile(join(repo.clone, notePath), serializeNote(frontmatter, input.body));
    },
  });
  if (!result.ok) return refuse(result.code, result.detail);
  return { ok: true, path: notePath, ulid: id };
}

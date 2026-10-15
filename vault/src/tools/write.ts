import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { cloneDir, type Config } from '../config.js';
import { runGate } from '../gate/index.js';
import { git } from '../git.js';
import { serializeNote, type Frontmatter } from '../notes.js';
import { loadVaultSettings } from '../projectContext.js';
import { Repo } from '../repo.js';
import { SERVER_FIELDS, TRAIL_SECTIONS, trailFields } from '../schema/trail.js';
import { ulid } from '../ulid.js';
import { resolveProject } from './status.js';

export const writeInput = {
  type: z.enum(['trail']),
  fields: z.record(z.string(), z.unknown()),
  body: z.string(),
};

export type WriteResult =
  | { ok: true; path: string; ulid: string }
  | { ok: false; code: string; detail: string; existing?: string };

const refuse = (code: string, detail: string): WriteResult => ({ ok: false, code, detail });
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

export async function writeNote(cfg: Config, input: { type: 'trail'; fields: Record<string, unknown>; body: string }): Promise<WriteResult> {
  if (cfg.repo === null) return refuse('not_configured', 'MORGAN_VAULT_REPO is empty');

  for (const f of SERVER_FIELDS) if (f in input.fields) return refuse('field_not_writable', `"${f}" is set by the server`);

  const parsed = trailFields.safeParse(input.fields);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    if (issue.code === 'unrecognized_keys') return refuse('unknown_field', `unknown field(s): ${(issue as { keys: string[] }).keys.join(', ')}`);
    return refuse('schema_error', `${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  const sectionError = checkSections(input.body, TRAIL_SECTIONS);
  if (sectionError) return refuse('schema_error', sectionError);

  const author = await projectAuthor(cfg.projectDir);
  const settings = await loadVaultSettings(cfg.projectDir);
  const refusal = await runGate({
    text: serializeNote(parsed.data, input.body),
    body: input.body,
    projectDir: cfg.projectDir,
    gitUserName: author.name === 'unknown' ? null : author.name,
    deny: settings.deny,
  });
  if (refusal) return refuse(refusal.code, refusal.detail);

  const { project, reason } = await resolveProject(cfg.projectDir);
  if (!project) return refuse('project_unknown', reason ?? 'no project');

  const repo = new Repo(cloneDir({ ...cfg, repo: cfg.repo }), cfg.repo);
  const cloneError = await repo.ensure();
  if (cloneError) return refuse('not_ready', cloneError);

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
    ...parsed.data,
  };
  const notePath = `projects/${project.slug}/trails/${id}-${slugOf(parsed.data.goal)}.md`;
  const projectPath = `projects/${project.slug}/project.md`;

  const paths = [notePath];
  const result = await repo.commitAndPush({
    paths,
    message: `vault: ${input.type} ${id} (${project.slug})`,
    author,
    write: async () => {
      // Files that only exist on a first write are the server's own too.
      if (!(await exists(join(repo.clone, projectPath)))) {
        await mkdir(join(repo.clone, dirname(projectPath)), { recursive: true });
        await writeFile(join(repo.clone, projectPath), serializeNote({ slug: project.slug, remotes: [project.remote], created }, `# ${project.slug}\n`));
        paths.push(projectPath);
      }
      if (!(await exists(join(repo.clone, '.gitignore')))) {
        await writeFile(join(repo.clone, '.gitignore'), '.obsidian/\n');
        paths.push('.gitignore');
      }
      await mkdir(join(repo.clone, dirname(notePath)), { recursive: true });
      await writeFile(join(repo.clone, notePath), serializeNote(frontmatter, input.body));
    },
  });
  if (!result.ok) return refuse(result.code, result.detail);
  return { ok: true, path: notePath, ulid: id };
}

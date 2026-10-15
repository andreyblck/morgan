import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The `## Vault` section of the project's own override of the project-context reference:
 * labelled bullets, `- key: value`, until the next `## ` heading. Absent file or section
 * means defaults, the same way an absent `## Ship recipe` means branch reach.
 */
export interface VaultSettings {
  project: string | null;
  cross_project: boolean;
  deny: string[];
}

export const OVERRIDE_PATH = '.claude/skills/morgan/references/project-context.md';

export function parseVaultSection(markdown: string): VaultSettings {
  const settings: VaultSettings = { project: null, cross_project: false, deny: [] };
  const lines = markdown.split('\n');
  let inVault = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^##\s/.test(line)) {
      inVault = /^##\s+vault\s*$/i.test(line);
      continue;
    }
    if (!inVault) continue;
    const m = /^-\s*([a-z_]+)\s*:\s*(.*)$/i.exec(line.trim());
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (key === 'project' && /^[a-z0-9-]+$/.test(value)) settings.project = value;
    else if (key === 'cross_project') settings.cross_project = /^(true|yes)$/i.test(value);
    else if (key === 'deny') settings.deny = value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return settings;
}

export async function loadVaultSettings(projectDir: string): Promise<VaultSettings> {
  try {
    return parseVaultSection(await readFile(join(projectDir, OVERRIDE_PATH), 'utf8'));
  } catch {
    return { project: null, cross_project: false, deny: [] };
  }
}

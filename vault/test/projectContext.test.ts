import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVaultSection } from '../src/projectContext.js';

// M6 — the shipped skeleton uses bold labels; the parser must read them.
test('M6: the documented bold-label ## Vault format parses', () => {
  const doc = [
    '# Project context',
    '',
    '## Vault',
    '',
    '- **project:** acme--repo',
    '- **cross_project:** true',
    '- **deny:** AcmeCorp, Globex Ltd',
    '',
    '## Something else',
    '',
    '- deny: NotThis',
  ].join('\n');
  const v = parseVaultSection(doc);
  assert.equal(v.project, 'acme--repo');
  assert.equal(v.cross_project, true);
  assert.deepEqual(v.deny, ['AcmeCorp', 'Globex Ltd']);
});

test('M6: the plain-label form still parses, and a deny under another heading is ignored', () => {
  const doc = ['## Vault', '', '- project: acme--web', '- deny: Initech', '', '## Other', '- deny: NotThis'].join('\n');
  const v = parseVaultSection(doc);
  assert.equal(v.project, 'acme--web');
  assert.deepEqual(v.deny, ['Initech']);
});

test('M6: no ## Vault section means defaults', () => {
  const v = parseVaultSection('# Project context\n\nNothing here.\n');
  assert.deepEqual(v, { project: null, cross_project: false, deny: [] });
});

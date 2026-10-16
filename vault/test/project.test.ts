import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRemote } from '../src/project.js';

// Expected slugs come from the breakdown (W1.1): both URL forms of one repo give one slug.
const cases: Array<[string, { remote: string; slug: string } | null]> = [
  ['https://github.com/Acme/Repo.git', { remote: 'github.com/acme/repo', slug: 'acme--repo' }],
  ['git@github.com:acme/repo', { remote: 'github.com/acme/repo', slug: 'acme--repo' }],
  ['ssh://git@github.com/acme/repo.git', { remote: 'github.com/acme/repo', slug: 'acme--repo' }],
  ['ssh://git@gitlab.example.com:2222/group/sub/repo.git', { remote: 'gitlab.example.com/group/sub/repo', slug: 'group--sub--repo' }],
  ['https://user:token@github.com/acme/repo/', { remote: 'github.com/acme/repo', slug: 'acme--repo' }],
  // A path is not an identity: the fixture's bare remote lives at a path (make-fixture.sh:675-679).
  ['/tmp/fixture-origin.git', null],
  ['../other.git', null],
  ['file:///tmp/fixture-origin.git', null],
  ['', null],
];

for (const [input, expected] of cases) {
  test(`normalizeRemote(${JSON.stringify(input)})`, () => {
    assert.deepEqual(normalizeRemote(input), expected);
  });
}

// --- owner scope (0.2.1): the vault serves its owner's projects, not third-party ones ---
import { allowedOwners, ownerAllowed, ownerOf } from '../src/project.js';
import type { Config } from '../src/config.js';

const cfg = (over: Partial<Config>): Config => ({ repo: null, dataDir: '/tmp/d', projectDir: '/tmp/p', owners: null, ...over });

test('ownerOf: the owner segment of a normalized remote', () => {
  assert.equal(ownerOf('github.com/acme-corp/acme-api'), 'acme-corp');
  assert.equal(ownerOf('github.com/acme/repo'), 'acme');
  assert.equal(ownerOf(null), null);
  assert.equal(ownerOf('github.com/onlyhost'), null);
});

test('allowedOwners: explicit list, else the vault repo owner, else null for a path vault', () => {
  assert.deepEqual(allowedOwners(cfg({ owners: ['a', 'b'] })), ['a', 'b']);
  assert.deepEqual(allowedOwners(cfg({ repo: 'https://github.com/acme-corp/morgan-vault.git' })), ['acme-corp']);
  assert.equal(allowedOwners(cfg({ repo: '/tmp/team-vault.git' })), null);
  assert.equal(allowedOwners(cfg({ repo: null })), null);
});

test('ownerAllowed: in scope for the vault owner, out for others, always for override/path', () => {
  const vault = cfg({ repo: 'https://github.com/acme-corp/morgan-vault.git' });
  assert.equal(ownerAllowed(vault, { remote: 'github.com/acme-corp/acme-api', slug: 'acme-corp--acme-api' }), true);
  assert.equal(ownerAllowed(vault, { remote: 'github.com/acme-corp/acme-webapp', slug: 'acme-corp--acme-webapp' }), true);
  assert.equal(ownerAllowed(vault, { remote: 'github.com/andreyblck/pet-project', slug: 'andreyblck--pet-project' }), false);
  assert.equal(ownerAllowed(vault, { remote: null, slug: 'declared--slug' }), true);
  assert.equal(ownerAllowed(cfg({ repo: '/tmp/team-vault.git' }), { remote: 'github.com/anyone/x', slug: 'anyone--x' }), true);
});

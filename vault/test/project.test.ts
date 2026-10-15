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

// Bundle the server into one file the plugin ships. Runtime deps are inlined so an
// installed plugin needs no `npm install`; the bundle is committed next to the manifest.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/server.ts'],
  outfile: '../plugin/vault/server.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  banner: { js: '#!/usr/bin/env node\n// Built from vault/src — do not edit by hand. `npm run build` in vault/.' },
  legalComments: 'none',
  logLevel: 'warning',
});

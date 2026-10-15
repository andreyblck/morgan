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
  banner: {
    // CommonJS dependencies (yaml, ajv) call require() at load time; an ESM bundle has
    // none unless we make one. Without this line the bundle throws before the first
    // JSON-RPC message, which is exactly what the bundle test in `npm run check` catches.
    js: [
      '#!/usr/bin/env node',
      '// Built from vault/src — do not edit by hand. `npm run build` in vault/.',
      "import { createRequire as __createRequire } from 'node:module';",
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
  legalComments: 'none',
  logLevel: 'warning',
});

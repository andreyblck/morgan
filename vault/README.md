# vault — the server behind `mcp__plugin_morgan_vault__*`

Source of the MCP server the plugin ships. The built file is `plugin/vault/server.mjs`; it is
committed, so an installed plugin needs no `npm install`. Edit here, rebuild, commit both.

```bash
cd vault
npm install --ignore-scripts
npm run check        # typecheck, tests, rebuild the bundle, fail if the committed bundle is stale
```

Tests talk to the server the way Claude Code does: JSON-RPC over stdio (`test/rpc.ts`), against
a bare git repo in a temp dir. Nothing in `src/` is imported by a test directly except pure functions.

Runtime: Node ≥ 22.5. Configuration is two environment variables, both optional:

| Variable | Meaning |
|---|---|
| `MORGAN_VAULT_REPO` | git URL or path of the team vault. Empty → every tool answers `not_configured`. |
| `MORGAN_VAULT_DATA` | where the clone, index and log live. Default: `$CLAUDE_PLUGIN_DATA`. |

The contract the plugin follows is `plugin/skills/morgan/references/vault.md`.

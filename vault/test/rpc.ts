// Drives the server through the same door Claude Code uses: JSON-RPC over stdio.
import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const entry = join(here, '..', 'src', 'server.ts');
// The server runs with the project as cwd, so resolve tsx from here, not from there.
const tsx = createRequire(import.meta.url).resolve('tsx');

type Json = Record<string, unknown>;

export interface Server {
  call(method: string, params?: Json): Promise<Json>;
  tool(name: string, args?: Json): Promise<Json>;
  close(): Promise<void>;
}

export async function startServer(opts: { env?: NodeJS.ProcessEnv; cwd?: string } = {}): Promise<Server> {
  const env: NodeJS.ProcessEnv = { ...process.env, ...opts.env };
  // Tests must not pick up the developer's own vault.
  if (!('MORGAN_VAULT_REPO' in (opts.env ?? {}))) delete env.MORGAN_VAULT_REPO;
  delete env.CLAUDE_PLUGIN_DATA;
  delete env.CLAUDE_PROJECT_DIR;

  const child: ChildProcess = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', '--import', tsx, entry], {
    cwd: opts.cwd ?? here,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const stderr: string[] = [];
  child.stderr!.on('data', (d) => stderr.push(String(d)));

  const pending = new Map<number, (msg: Json) => void>();
  const rl = createInterface({ input: child.stdout! });
  rl.on('line', (line) => {
    let msg: Json;
    try { msg = JSON.parse(line); } catch { return; }
    const id = msg.id;
    if (typeof id === 'number' && pending.has(id)) {
      pending.get(id)!(msg);
      pending.delete(id);
    }
  });

  let nextId = 1;
  const call = (method: string, params: Json = {}): Promise<Json> =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`rpc timeout: ${method}\nstderr:\n${stderr.join('')}`));
      }, 20_000);
      pending.set(id, (msg) => { clearTimeout(timer); resolve(msg); });
      child.stdin!.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });

  await call('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'vault-test', version: '0' },
  });
  child.stdin!.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  return {
    call,
    async tool(name, args = {}) {
      const res = await call('tools/call', { name, arguments: args });
      if (res.error) throw new Error(`tool ${name} failed: ${JSON.stringify(res.error)}`);
      const result = res.result as { content: Array<{ type: string; text?: string }>; isError?: boolean };
      const text = result.content.find((c) => c.type === 'text')?.text ?? '';
      return JSON.parse(text) as Json;
    },
    close() {
      return new Promise((resolve) => {
        child.once('exit', () => resolve());
        child.stdin!.end();
        setTimeout(() => child.kill(), 2000).unref();
      });
    },
  };
}

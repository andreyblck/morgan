import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * One line per tool call: time, tool, outcome, duration. Never a note body and never
 * a secret — the log exists to answer "what did the server do", not "what did it say".
 */
export class Log {
  constructor(private readonly file: string | null) {}

  async line(tool: string, outcome: string, startedAt: number): Promise<void> {
    if (!this.file) return;
    const ms = Date.now() - startedAt;
    try {
      await mkdir(dirname(this.file), { recursive: true });
      await appendFile(this.file, `${new Date().toISOString()} ${tool} ${outcome} ${ms}ms\n`);
    } catch {
      // Logging must never fail a tool call.
    }
  }
}

import { promises as fs } from 'fs';
import path from 'path';

const SESSIONS_DIR = process.env.SESSIONS_DIR ?? '/sessions';
const SESSION_ID_FILE = 'session-id';

/**
 * Manages claude session IDs per agent+task on disk.
 * Directory layout: {SESSIONS_DIR}/{agentId}/{taskId}/session-id
 */
export class ClaudeSessionManager {
  private sessionsDir: string;

  constructor(sessionsDir?: string) {
    this.sessionsDir = sessionsDir ?? SESSIONS_DIR;
  }

  private sessionDir(agentId: string, taskId: string): string {
    return path.join(this.sessionsDir, agentId, taskId);
  }

  /** Persist sessionId to disk so future runs can resume. */
  async saveSession(agentId: string, taskId: string, sessionId: string): Promise<void> {
    const dir = this.sessionDir(agentId, taskId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, SESSION_ID_FILE), sessionId, 'utf-8');
  }

  /** Load saved sessionId, or null if not found. */
  async loadSession(agentId: string, taskId: string): Promise<string | null> {
    const filePath = path.join(this.sessionDir(agentId, taskId), SESSION_ID_FILE);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.trim() || null;
    } catch {
      return null;
    }
  }

  /** Remove session directories older than maxAgeDays. */
  async cleanOldSessions(maxAgeDays: number): Promise<void> {
    const cutoffMs = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    let agentDirs: string[];
    try {
      agentDirs = await fs.readdir(this.sessionsDir);
    } catch {
      return; // sessions dir doesn't exist yet
    }

    for (const agentId of agentDirs) {
      const agentPath = path.join(this.sessionsDir, agentId);
      let taskDirs: string[];
      try {
        taskDirs = await fs.readdir(agentPath);
      } catch {
        continue;
      }

      for (const taskId of taskDirs) {
        const taskPath = path.join(agentPath, taskId);
        try {
          const stat = await fs.stat(taskPath);
          if (stat.mtimeMs < cutoffMs) {
            await fs.rm(taskPath, { recursive: true, force: true });
          }
        } catch {
          // skip unreadable dirs
        }
      }

      // Remove empty agent dir
      try {
        const remaining = await fs.readdir(agentPath);
        if (remaining.length === 0) {
          await fs.rmdir(agentPath);
        }
      } catch {
        // ignore
      }
    }
  }
}

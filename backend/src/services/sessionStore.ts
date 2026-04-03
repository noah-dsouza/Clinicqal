import { DigitalTwin } from "../types/digitalTwin";

interface SessionEntry {
  twin: DigitalTwin;
  expires_at: number;
}

const store = new Map<string, SessionEntry>();

const TTL_MS = parseInt(process.env.SESSION_TTL_MS || "86400000", 10);

function cleanup(): void {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expires_at < now) {
      store.delete(id);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanup, 30 * 60 * 1000);

export const sessionStore = {
  get(sessionId: string): DigitalTwin | null {
    const entry = store.get(sessionId);
    if (!entry) return null;
    if (entry.expires_at < Date.now()) {
      store.delete(sessionId);
      return null;
    }
    return entry.twin;
  },

  set(sessionId: string, twin: DigitalTwin): void {
    store.set(sessionId, {
      twin,
      expires_at: Date.now() + TTL_MS,
    });
  },

  delete(sessionId: string): void {
    store.delete(sessionId);
  },

  has(sessionId: string): boolean {
    const entry = store.get(sessionId);
    if (!entry) return false;
    if (entry.expires_at < Date.now()) {
      store.delete(sessionId);
      return false;
    }
    return true;
  },

  size(): number {
    cleanup();
    return store.size;
  },
};

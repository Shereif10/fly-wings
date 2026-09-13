import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Public pages read the same settings documents from several components.
 * This helper de-duplicates those reads in one page view and keeps a short
 * session cache so navigating between pages doesn't re-fetch the same doc.
 */
const TTL_MS = 5 * 60 * 1000;

const inflight = new Map<string, Promise<DocumentData | null>>();
const memory = new Map<string, { at: number; data: DocumentData | null }>();

const sessionKey = (path: string) => `fw-doc:${path}`;

const readSession = (path: string): { at: number; data: DocumentData | null } | null => {
  try {
    const raw = sessionStorage.getItem(sessionKey(path));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSession = (path: string, entry: { at: number; data: DocumentData | null }) => {
  try {
    sessionStorage.setItem(sessionKey(path), JSON.stringify(entry));
  } catch {
    /* storage full or unavailable — memory cache still applies */
  }
};

/** Cached read of a Firestore document, e.g. cachedDoc('site_settings', 'general') */
export const cachedDoc = async (...segments: string[]): Promise<DocumentData | null> => {
  const path = segments.join('/');

  const mem = memory.get(path);
  if (mem && Date.now() - mem.at < TTL_MS) return mem.data;

  const stored = readSession(path);
  if (stored && Date.now() - stored.at < TTL_MS) {
    memory.set(path, stored);
    return stored.data;
  }

  const existing = inflight.get(path);
  if (existing) return existing;

  const request = (async () => {
    try {
      const snap = await getDoc(doc(db, segments[0], ...segments.slice(1)));
      const data = snap.exists() ? snap.data() : null;
      const entry = { at: Date.now(), data };
      memory.set(path, entry);
      writeSession(path, entry);
      return data;
    } finally {
      inflight.delete(path);
    }
  })();

  inflight.set(path, request);
  return request;
};

/** Clears the cache (used by the dashboard after saving settings) */
export const clearDocCache = (path?: string) => {
  if (path) {
    memory.delete(path);
    try {
      sessionStorage.removeItem(sessionKey(path));
    } catch {
      /* ignore */
    }
    return;
  }
  memory.clear();
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith('fw-doc:'))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};

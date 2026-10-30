import { hasChrome } from '../env';
import { seedSessions } from '../mock/data';
import type { Bindings, Session } from '../types';

const SESSIONS_KEY = 'monavi.sessions';
const BINDINGS_KEY = 'monavi.bindings';

export interface StoreState {
  sessions: Session[];
  bindings: Bindings;
}

async function read<T>(key: string, fallback: T): Promise<T> {
  if (hasChrome) {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T | undefined) ?? fallback;
  }
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

async function write(key: string, value: unknown): Promise<void> {
  if (hasChrome) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export async function loadState(): Promise<StoreState> {
  let sessions = await read<Session[] | null>(SESSIONS_KEY, null);
  if (!sessions) {
    sessions = seedSessions(Date.now());
    await write(SESSIONS_KEY, sessions);
  }
  const bindings = await read<Bindings>(BINDINGS_KEY, {});
  return { sessions, bindings };
}

export const saveSessions = (sessions: Session[]) => write(SESSIONS_KEY, sessions);

export const saveBindings = (bindings: Bindings) => write(BINDINGS_KEY, bindings);

export function onStateChange(callback: () => void): () => void {
  if (hasChrome) {
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && (SESSIONS_KEY in changes || BINDINGS_KEY in changes)) callback();
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
  const listener = (event: StorageEvent) => {
    if (event.key === SESSIONS_KEY || event.key === BINDINGS_KEY) callback();
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}

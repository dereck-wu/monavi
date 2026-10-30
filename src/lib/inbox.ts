import { hasChrome } from '../env';

export type InboxKind = 'ask' | 'explain' | 'translate' | 'rewrite';

export interface InboxItem {
  kind: InboxKind;
  text: string;
  at: number;
}

const FRESH_MS = 15_000;

const keyOf = (tabId: number) => `monavi.inbox.${tabId}`;

export async function takeInbox(tabId: number | undefined): Promise<InboxItem | null> {
  if (!hasChrome || tabId === undefined) return null;
  const key = keyOf(tabId);
  const stored = await chrome.storage.local.get(key);
  const item = stored[key] as InboxItem | undefined;
  if (!item) return null;
  await chrome.storage.local.remove(key);
  return Date.now() - item.at < FRESH_MS ? item : null;
}

export function onInbox(tabId: number | undefined, callback: () => void): () => void {
  if (!hasChrome || tabId === undefined) return () => undefined;
  const key = keyOf(tabId);
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes[key]?.newValue) callback();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export function inboxPrompt(item: InboxItem): string {
  switch (item.kind) {
    case 'explain':
      return `解释这段内容：「${item.text}」`;
    case 'translate':
      return `把这段内容翻译成英文：「${item.text}」`;
    case 'rewrite':
      return `改写这段内容，让表达更清晰：「${item.text}」`;
    default:
      return item.text;
  }
}

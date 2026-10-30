import { hasChrome } from '../env';
import { pageContext } from '../mock/data';

export interface TabInfo {
  id?: number;
  title: string;
  url: string;
}

export interface BoundTab {
  id: number;
  title: string;
  url: string;
}

const fallbackTab: TabInfo = { title: pageContext.title, url: pageContext.url };

export function currentTabId(): number | undefined {
  const raw = new URLSearchParams(window.location.search).get('tabId');
  const id = Number(raw);
  return raw && Number.isInteger(id) ? id : undefined;
}

export async function getTab(tabId: number | undefined): Promise<TabInfo> {
  if (!hasChrome || tabId === undefined) return fallbackTab;
  try {
    const tab = await chrome.tabs.get(tabId);
    return { id: tabId, title: tab.title ?? tab.url ?? '', url: tab.url ?? '' };
  } catch {
    return { id: tabId, title: '', url: '' };
  }
}

export async function getBoundTabs(tabIds: number[]): Promise<BoundTab[]> {
  if (!hasChrome) return [];
  const tabs = await Promise.all(tabIds.map((id) => chrome.tabs.get(id).catch(() => undefined)));
  return tabs.flatMap((tab) =>
    tab && tab.id !== undefined ? [{ id: tab.id, title: tab.title ?? tab.url ?? '', url: tab.url ?? '' }] : [],
  );
}

export function onTabUpdated(tabId: number | undefined, callback: () => void): () => void {
  if (!hasChrome || tabId === undefined) return () => undefined;
  const listener = (id: number, info: chrome.tabs.OnUpdatedInfo) => {
    if (id === tabId && (info.title || info.url)) callback();
  };
  chrome.tabs.onUpdated.addListener(listener);
  return () => chrome.tabs.onUpdated.removeListener(listener);
}

export function closePanel(tabId: number | undefined): void {
  if (!hasChrome || tabId === undefined) return;
  chrome.tabs.sendMessage(tabId, { type: 'close' }).catch(() => undefined);
}

export async function openWebAndClose(sessionId: string | null, tabId: number | undefined): Promise<void> {
  const query = sessionId ? `?session=${encodeURIComponent(sessionId)}` : '';
  if (!hasChrome) {
    window.open(`/web.html${query}`, '_blank');
    return;
  }
  await chrome.tabs.create({ url: `${chrome.runtime.getURL('web.html')}${query}` });
  closePanel(tabId);
}

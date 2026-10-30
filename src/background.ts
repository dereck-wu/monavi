import { unbindTab } from './lib/chat';
import { loadState, saveBindings } from './lib/storage';

const OPEN_KEY = 'monavi.openTabs';

async function openTabs(): Promise<number[]> {
  const result = await chrome.storage.session.get(OPEN_KEY);
  return (result[OPEN_KEY] as number[] | undefined) ?? [];
}

async function setOpen(tabId: number, open: boolean) {
  const ids = (await openTabs()).filter((id) => id !== tabId);
  await chrome.storage.session.set({ [OPEN_KEY]: open ? [...ids, tabId] : ids });
}

chrome.runtime.onMessage.addListener((message: { type: string; open?: boolean }, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return;
  if (message.type === 'ready') {
    openTabs().then((ids) => sendResponse({ tabId, open: ids.includes(tabId) }));
    return true;
  }
  if (message.type === 'state') void setOpen(tabId, Boolean(message.open));
});

chrome.action.onClicked.addListener(async (tab) => {
  const openWeb = () => chrome.tabs.create({ url: chrome.runtime.getURL('web.html') });
  if (tab.id === undefined) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'toggle' });
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      await chrome.tabs.sendMessage(tab.id, { type: 'toggle' });
    } catch {
      await openWeb();
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await setOpen(tabId, false);
  const { bindings } = await loadState();
  if (String(tabId) in bindings) await saveBindings(unbindTab(bindings, tabId));
});

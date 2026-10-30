import { initSelectionToolbar } from './selection';

const HOST_ID = 'monavi-root';
const STYLE_ID = 'monavi-style-right-space';
const WIDTH_KEY = 'monavi.panelWidth';
const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 320;
const MAX_RATIO = 0.6;

let host: HTMLElement | null = null;
let frame: HTMLIFrameElement | null = null;
let style: HTMLStyleElement | null = null;
let tabId: number | undefined;
let width = DEFAULT_WIDTH;
let framePending = false;
let observer: MutationObserver | null = null;
let adjustTimer: number | undefined;
let pendingRestore = false;
let lastAdjust = 0;

interface Saved {
  left: [string, string];
  right: [string, string];
  maxWidth: [string, string];
}

const adjusted = new Map<HTMLElement, Saved>();

const ready = Promise.all([
  chrome.runtime.sendMessage({ type: 'ready' }) as Promise<{ tabId: number; open: boolean }>,
  chrome.storage.local.get(WIDTH_KEY),
])
  .then(([reply, stored]) => {
    tabId = reply.tabId;
    width = clamp(Number(stored[WIDTH_KEY]) || DEFAULT_WIDTH);
    if (reply.open) open();
  })
  .catch(() => undefined);

function clamp(value: number) {
  const max = Math.max(MIN_WIDTH, Math.floor(document.documentElement.clientWidth * MAX_RATIO));
  return Math.min(max, Math.max(MIN_WIDTH, Math.round(value)));
}

function report(isOpen: boolean) {
  chrome.runtime.sendMessage({ type: 'state', open: isOpen }).catch(() => undefined);
}

function notifyResize() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(() => {
    framePending = false;
    window.dispatchEvent(new Event('resize'));
  });
}

function remember(el: HTMLElement): Saved {
  const read = (name: string): [string, string] => [el.style.getPropertyValue(name), el.style.getPropertyPriority(name)];
  return { left: read('left'), right: read('right'), maxWidth: read('max-width') };
}

function restoreFixed() {
  for (const [el, saved] of adjusted) {
    const write = (name: string, [value, priority]: [string, string]) =>
      value ? el.style.setProperty(name, value, priority) : el.style.removeProperty(name);
    write('left', saved.left);
    write('right', saved.right);
    write('max-width', saved.maxWidth);
  }
  adjusted.clear();
}

function adjustFixed(restoreFirst: boolean) {
  if (!host) return;
  if (restoreFirst) restoreFixed();
  const panelLeft = document.documentElement.clientWidth - width;
  const targets: Array<{ el: HTMLElement; rect: DOMRect }> = [];
  for (const el of document.body.querySelectorAll<HTMLElement>('*')) {
    if (host.contains(el) || adjusted.has(el)) continue;
    const style = getComputedStyle(el);
    if (style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 16 || rect.right <= panelLeft + 2) continue;
    targets.push({ el, rect });
  }
  for (const { el, rect } of targets) {
    adjusted.set(el, remember(el));
    if (rect.left >= panelLeft - 2) {
      el.style.setProperty('left', `${Math.max(0, rect.left - width)}px`, 'important');
      el.style.setProperty('right', 'auto', 'important');
    } else {
      el.style.setProperty('max-width', `calc(100% - ${width}px)`, 'important');
    }
  }
}

function scheduleAdjust(restoreFirst: boolean) {
  if (restoreFirst && adjustTimer !== undefined) {
    window.clearTimeout(adjustTimer);
    adjustTimer = undefined;
  }
  pendingRestore ||= restoreFirst;
  if (adjustTimer !== undefined) return;
  const wait = restoreFirst ? 150 : Math.max(150, 1000 - (Date.now() - lastAdjust));
  adjustTimer = window.setTimeout(() => {
    adjustTimer = undefined;
    lastAdjust = Date.now();
    const restore = pendingRestore;
    pendingRestore = false;
    adjustFixed(restore);
  }, wait);
}

function layout() {
  if (!host || !style) return;
  host.style.setProperty('width', `${width}px`, 'important');
  style.textContent = `html { width: calc(100% - ${width}px) !important; position: relative !important; min-height: 100vh !important; }`;
  notifyResize();
  scheduleAdjust(true);
}

function createHandle() {
  const handle = document.createElement('div');
  handle.style.cssText = [
    'position: absolute !important',
    'top: 0 !important',
    'bottom: 0 !important',
    'left: -4px !important',
    'width: 8px !important',
    'cursor: col-resize !important',
    'z-index: 1 !important',
  ].join(';');
  let dragging = false;
  handle.addEventListener('pointerdown', (event) => {
    dragging = true;
    handle.setPointerCapture(event.pointerId);
    if (frame) frame.style.setProperty('pointer-events', 'none', 'important');
    event.preventDefault();
  });
  handle.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    width = clamp(document.documentElement.clientWidth - event.clientX);
    layout();
  });
  const finish = () => {
    if (!dragging) return;
    dragging = false;
    if (frame) frame.style.removeProperty('pointer-events');
    void chrome.storage.local.set({ [WIDTH_KEY]: width });
  };
  handle.addEventListener('pointerup', finish);
  handle.addEventListener('pointercancel', finish);
  return handle;
}

function open() {
  if (host || tabId === undefined) return;
  style = document.createElement('style');
  style.id = STYLE_ID;
  (document.head ?? document.documentElement).append(style);
  host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = [
    'all: initial !important',
    'display: block !important',
    'position: fixed !important',
    'top: 0 !important',
    'right: 0 !important',
    'bottom: 0 !important',
    'z-index: 2147483647 !important',
    'background: #f0f0ef !important',
    'box-shadow: -1px 0 0 #dcdcda !important',
  ].join(';');
  frame = document.createElement('iframe');
  frame.src = `${chrome.runtime.getURL('panel.html')}?tabId=${tabId}`;
  frame.style.cssText = 'display: block !important; width: 100% !important; height: 100% !important; border: 0 !important';
  host.append(frame, createHandle());
  document.documentElement.append(host);
  layout();
  observer = new MutationObserver((records) => {
    if (records.some((record) => record.addedNodes.length > 0)) scheduleAdjust(false);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  report(true);
}

function close() {
  if (!host) return;
  observer?.disconnect();
  observer = null;
  if (adjustTimer !== undefined) window.clearTimeout(adjustTimer);
  adjustTimer = undefined;
  restoreFixed();
  host.remove();
  style?.remove();
  host = null;
  frame = null;
  style = null;
  window.dispatchEvent(new Event('resize'));
  report(false);
}

window.addEventListener('resize', (event) => {
  if (!event.isTrusted || !host) return;
  width = clamp(width);
  layout();
});

chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === 'toggle') {
    void ready.then(() => (host ? close() : open()));
  }
  if (message.type === 'close') close();
});

initSelectionToolbar({
  rightLimit: () => document.documentElement.clientWidth - (host ? width : 0),
  onAction: async (kind, text) => {
    await ready;
    if (tabId === undefined) return;
    await chrome.storage.local.set({ [`monavi.inbox.${tabId}`]: { kind, text: text.slice(0, 4000), at: Date.now() } });
    if (!host) open();
  },
});

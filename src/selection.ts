export type SelectionAction = 'ask' | 'explain' | 'translate' | 'rewrite';

interface SelectionToolbarOptions {
  rightLimit: () => number;
  onAction: (kind: SelectionAction, text: string) => void;
}

const SPARKLE =
  '<svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"></path></svg>';

const STYLE = `
.bar {
  position: absolute;
  top: 0;
  left: 0;
  width: max-content;
  height: 38px;
  box-sizing: border-box;
  padding: 0 6px;
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 6px 20px rgba(0, 0, 0, 0.12);
  font: 13px/1 Inter, 'Noto Sans SC', system-ui, sans-serif;
  color: #1c1c1e;
  white-space: nowrap;
  user-select: none;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}
.bar.visible {
  opacity: 1;
  pointer-events: auto;
}
button {
  height: 30px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
button:hover {
  background: rgba(0, 0, 0, 0.06);
}
.primary {
  font-weight: 500;
}
.badge {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: #5b5bd6;
}
.sep {
  width: 1px;
  height: 16px;
  background: #e3e3e1;
}
`;

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), #monavi-root';

export function initSelectionToolbar({ rightLimit, onAction }: SelectionToolbarOptions) {
  const container = document.createElement('div');
  container.id = 'monavi-selection';
  container.style.cssText =
    'all: initial !important; position: fixed !important; top: 0 !important; left: 0 !important; z-index: 2147483646 !important';
  const root = container.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${STYLE}</style><div class="bar" role="toolbar" aria-label="Monavi"><button class="primary" type="button" data-kind="ask"><span class="badge">${SPARKLE}</span>问 Monavi</button><span class="sep"></span><button type="button" data-kind="explain">解释</button><button type="button" data-kind="translate">翻译</button><button type="button" data-kind="rewrite">改写</button></div>`;
  const bar = root.querySelector('.bar') as HTMLElement;
  let text = '';
  let framePending = false;

  const hide = () => {
    bar.classList.remove('visible');
    text = '';
  };

  const update = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return hide();
    const value = selection.toString().trim();
    if (!value) return hide();
    const anchor = selection.anchorNode;
    const element = anchor instanceof Element ? anchor : anchor?.parentElement;
    if (element?.closest(EDITABLE)) return hide();
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    const first = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
    const last = rects.length > 0 ? rects[rects.length - 1] : first;
    if ((first.width === 0 && first.height === 0) || last.bottom < 0 || first.top > window.innerHeight) return hide();
    text = value;
    const width = bar.offsetWidth;
    const height = bar.offsetHeight;
    const left = Math.min(Math.max(8, first.left), Math.max(8, rightLimit() - width - 8));
    let top = first.top - height - 10;
    if (top < 8) top = last.bottom + 10;
    bar.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    bar.classList.add('visible');
  };

  const scheduleUpdate = () => {
    if (framePending || !bar.classList.contains('visible')) return;
    framePending = true;
    requestAnimationFrame(() => {
      framePending = false;
      update();
    });
  };

  const insideToolbar = (event: Event) => event.composedPath().includes(container);

  root.addEventListener('mousedown', (event) => event.preventDefault());
  bar.addEventListener('click', (event) => {
    const button = (event.target as Element).closest('button');
    if (!button) return;
    const picked = text;
    hide();
    window.getSelection()?.removeAllRanges();
    if (picked) onAction(button.dataset.kind as SelectionAction, picked);
  });

  document.addEventListener(
    'mouseup',
    (event) => {
      if (!insideToolbar(event)) window.setTimeout(update, 10);
    },
    true,
  );
  document.addEventListener(
    'mousedown',
    (event) => {
      if (!insideToolbar(event)) hide();
    },
    true,
  );
  document.addEventListener(
    'keyup',
    (event) => {
      const extend = event.shiftKey || /^(Arrow|Home$|End$|Page)/.test(event.key);
      const selectAll = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a';
      if (extend || selectAll) window.setTimeout(update, 10);
    },
    true,
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') hide();
    },
    true,
  );
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) hide();
  });
  window.addEventListener('scroll', scheduleUpdate, true);
  window.addEventListener('resize', scheduleUpdate);

  document.documentElement.append(container);
}

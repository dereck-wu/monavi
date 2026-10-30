import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Composer } from '../components/Composer';
import { Messages } from '../components/Messages';
import { exchange, sessionTabIds, sortedSessions, unbindTab } from '../lib/chat';
import { getBoundTabs, type BoundTab } from '../lib/tabs';
import { formatRelative } from '../lib/time';
import { useStore } from '../lib/useStore';
import { mockReply } from '../mock/data';

export function App() {
  const { state, commit } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('session'),
  );
  const [pages, setPages] = useState<BoundTab[]>([]);
  const sessions = state?.sessions ?? [];
  const sorted = sortedSessions(sessions);
  const selected = sessions.find((session) => session.id === selectedId) ?? null;
  const selectedKey = selected?.id ?? null;
  const bindings = state?.bindings;

  useEffect(() => {
    if (!bindings || !selectedKey) {
      setPages([]);
      return;
    }
    let alive = true;
    getBoundTabs(sessionTabIds(bindings, selectedKey)).then((next) => {
      if (alive) setPages(next);
    });
    return () => {
      alive = false;
    };
  }, [bindings, selectedKey]);

  const select = (id: string | null) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('session', id);
    else url.searchParams.delete('session');
    window.history.replaceState(null, '', url);
  };

  const send = (text: string) => {
    if (!state) return;
    const result = exchange(state.sessions, selectedKey, text, mockReply);
    commit({ sessions: result.sessions, bindings: state.bindings });
    select(result.sessionId);
  };

  const unbind = (tabId: number) => {
    if (!state) return;
    commit({ sessions: state.sessions, bindings: unbindTab(state.bindings, tabId) });
  };

  return (
    <div className="web">
      <aside className="web-nav">
        <button className="web-new" type="button" onClick={() => select(null)}>
          <Plus size={14} />
          新对话
        </button>
        <ul className="web-nav-list">
          {sorted.map((session) => (
            <li key={session.id}>
              <button
                className={session.id === selectedKey ? 'web-nav-row active' : 'web-nav-row'}
                type="button"
                onClick={() => select(session.id)}
              >
                <span className="ellipsis">{session.title}</span>
                <span className="meta">{formatRelative(session.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="web-main">
        <header className="web-head">
          <span className="ellipsis">{selected?.title ?? '新对话'}</span>
        </header>
        {pages.length > 0 && (
          <div className="bound-pages">
            <span className="section-label">已绑定的网页</span>
            {pages.map((page) => (
              <div key={page.id} className="page-chip">
                <span className="ellipsis">{page.title}</span>
                <button type="button" onClick={() => unbind(page.id)}>
                  解绑
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="web-body">
          {selected ? <Messages messages={selected.messages} /> : <p className="empty-hint">选择左侧对话，或直接输入开始新对话</p>}
        </div>
        <div className="web-composer">
          <Composer onSend={send} />
        </div>
      </section>
    </div>
  );
}

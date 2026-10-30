import { useEffect, useRef, useState } from 'react';
import { ChatsPage } from '../components/ChatsPage';
import { Composer } from '../components/Composer';
import { EmptyState } from '../components/EmptyState';
import { Header } from '../components/Header';
import { Messages } from '../components/Messages';
import { bindTab, exchange, sortedSessions, unbindTab } from '../lib/chat';
import { inboxPrompt, onInbox, takeInbox } from '../lib/inbox';
import { closePanel, currentTabId, getTab, onTabUpdated, openWebAndClose, type TabInfo } from '../lib/tabs';
import { useStore } from '../lib/useStore';
import { mockReply, suggestions } from '../mock/data';
import type { View } from '../types';

const tabId = currentTabId();

export function App() {
  const { state, commit } = useStore();
  const [tab, setTab] = useState<TabInfo | null>(null);
  const [view, setView] = useState<View>('empty');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [focusSignal, setFocusSignal] = useState(0);
  const loaded = state !== null;

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      getTab(tabId).then((next) => {
        if (alive) setTab(next);
      });
    };
    refresh();
    const unsubscribe = onTabUpdated(tabId, refresh);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const bound = tabId === undefined ? undefined : state.bindings[tabId];
    setSelectedId(bound ?? null);
    setView(bound ? 'conversation' : 'empty');
  }, [loaded]);

  const sessions = state?.sessions ?? [];
  const sorted = sortedSessions(sessions);
  const selected = sessions.find((session) => session.id === selectedId) ?? null;
  const pageTitle = tab?.title ?? '';
  const title = view === 'chats' ? '对话历史' : (selected?.title ?? '新对话');

  const openSession = (id: string) => {
    if (!state) return;
    commit({ sessions: state.sessions, bindings: bindTab(state.bindings, tabId, id) });
    setSelectedId(id);
    setView('conversation');
  };

  const newChat = () => {
    if (!state) return;
    commit({ sessions: state.sessions, bindings: unbindTab(state.bindings, tabId) });
    setSelectedId(null);
    setView('empty');
  };

  const send = (text: string) => {
    if (!state) return;
    const result = exchange(state.sessions, selectedId, text, mockReply);
    commit({
      sessions: result.sessions,
      bindings: selectedId ? state.bindings : bindTab(state.bindings, tabId, result.sessionId),
    });
    setSelectedId(result.sessionId);
    setView('conversation');
  };

  const submit = (text: string) => {
    const body = quote ? (text ? `「${quote}」\n${text}` : `「${quote}」`) : text;
    setQuote(null);
    send(body);
  };

  const applyInbox = async () => {
    const item = await takeInbox(tabId);
    if (!item) return;
    if (item.kind === 'ask') {
      setQuote(item.text);
      setView(selected ? 'conversation' : 'empty');
      setFocusSignal((count) => count + 1);
      return;
    }
    send(inboxPrompt(item));
  };

  const latestInbox = useRef(applyInbox);
  latestInbox.current = applyInbox;

  useEffect(() => {
    if (!loaded) return;
    void latestInbox.current();
    return onInbox(tabId, () => void latestInbox.current());
  }, [loaded]);

  const openWeb = () => {
    void openWebAndClose(selectedId, tabId);
  };

  return (
    <div className="app">
      <Header
        title={title}
        onNewChat={newChat}
        onOpenChats={() => setView('chats')}
        onOpenWeb={openWeb}
        onClose={() => closePanel(tabId)}
      />
      <main className="body">
        {view === 'empty' && (
          <EmptyState
            pageTitle={pageTitle}
            suggestions={suggestions}
            recent={sorted.slice(0, 3)}
            onSuggest={send}
            onOpen={openSession}
          />
        )}
        {view === 'conversation' && selected && (
          <div className="conversation">
            <div className="context">
              <span className="swatch" />
              <span className="ellipsis">{pageTitle}</span>
            </div>
            <Messages messages={selected.messages} />
          </div>
        )}
        {view === 'chats' && <ChatsPage sessions={sorted} onOpen={openSession} />}
      </main>
      {view !== 'chats' && (
        <Composer
          onSend={submit}
          quote={quote}
          onClearQuote={() => setQuote(null)}
          focusSignal={focusSignal}
        />
      )}
    </div>
  );
}

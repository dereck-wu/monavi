import type { Bindings, Message, Session } from '../types';

export function sortedSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function bindTab(bindings: Bindings, tabId: number | undefined, sessionId: string): Bindings {
  return tabId === undefined ? bindings : { ...bindings, [tabId]: sessionId };
}

export function unbindTab(bindings: Bindings, tabId: number | undefined): Bindings {
  if (tabId === undefined) return bindings;
  const next = { ...bindings };
  delete next[tabId];
  return next;
}

export function sessionTabIds(bindings: Bindings, sessionId: string): number[] {
  return Object.entries(bindings)
    .filter(([, id]) => id === sessionId)
    .map(([tabId]) => Number(tabId));
}

export function exchange(
  sessions: Session[],
  sessionId: string | null,
  text: string,
  reply: string,
): { sessions: Session[]; sessionId: string } {
  const now = Date.now();
  const pair: Message[] = [
    { id: `m-${now}`, role: 'user', text },
    { id: `m-${now}-reply`, role: 'assistant', text: reply },
  ];
  if (sessionId && sessions.some((session) => session.id === sessionId)) {
    return {
      sessionId,
      sessions: sessions.map((session) =>
        session.id === sessionId ? { ...session, updatedAt: now, messages: [...session.messages, ...pair] } : session,
      ),
    };
  }
  const created: Session = { id: `s-${now}`, title: text, updatedAt: now, messages: pair };
  return { sessionId: created.id, sessions: [created, ...sessions] };
}

import { Search } from 'lucide-react';
import { useState } from 'react';
import { formatRelative } from '../lib/time';
import type { Session } from '../types';

interface ChatsPageProps {
  sessions: Session[];
  onOpen: (id: string) => void;
}

export function ChatsPage({ sessions, onOpen }: ChatsPageProps) {
  const [query, setQuery] = useState('');
  const keyword = query.trim().toLowerCase();
  const visible = sessions.filter((session) => session.title.toLowerCase().includes(keyword));

  return (
    <div className="chats">
      <label className="search">
        <Search size={14} />
        <input value={query} placeholder="搜索对话" onChange={(event) => setQuery(event.target.value)} />
      </label>
      {visible.length === 0 ? (
        <p className="empty-hint">没有匹配的对话</p>
      ) : (
        <ul className="chat-list">
          {visible.map((session) => (
            <li key={session.id}>
              <button className="chat-row" type="button" onClick={() => onOpen(session.id)}>
                <span className="ellipsis">{session.title}</span>
                <span className="meta">{formatRelative(session.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

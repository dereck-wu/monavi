import { Check, CircleHelp, FileText, Globe, type LucideIcon } from 'lucide-react';
import { formatRelative } from '../lib/time';
import type { Session, Suggestion } from '../types';

const suggestionIcons: Record<Suggestion['icon'], LucideIcon> = {
  summary: FileText,
  todo: Check,
  translate: Globe,
  question: CircleHelp,
};

interface EmptyStateProps {
  pageTitle: string;
  suggestions: Suggestion[];
  recent: Session[];
  onSuggest: (text: string) => void;
  onOpen: (id: string) => void;
}

export function EmptyState({ pageTitle, suggestions, recent, onSuggest, onOpen }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="greeting">
        <h1>下午好，有什么可以帮你？</h1>
        <p>我能读懂你正在看的页面，也能跨标签页帮你整理信息。</p>
      </div>

      <div className="context">
        <span className="swatch" />
        <span className="ellipsis">针对「{pageTitle}」</span>
      </div>

      <section className="card">
        {suggestions.map((suggestion) => {
          const Icon = suggestionIcons[suggestion.icon];
          return (
            <button key={suggestion.id} className="row" type="button" onClick={() => onSuggest(suggestion.label)}>
              <Icon size={16} />
              <span className="ellipsis">{suggestion.label}</span>
            </button>
          );
        })}
      </section>

      <section className="recent">
        <span className="section-label">最近对话</span>
        {recent.map((session) => (
          <button key={session.id} className="recent-row" type="button" onClick={() => onOpen(session.id)}>
            <span className="ellipsis">{session.title}</span>
            <span className="meta">{formatRelative(session.updatedAt)}</span>
          </button>
        ))}
      </section>
    </div>
  );
}

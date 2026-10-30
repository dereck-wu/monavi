import { ChevronDown, Clock, ExternalLink, Plus, X } from 'lucide-react';

interface HeaderProps {
  title: string;
  onNewChat: () => void;
  onOpenChats: () => void;
  onOpenWeb: () => void;
  onClose: () => void;
}

export function Header({ title, onNewChat, onOpenChats, onOpenWeb, onClose }: HeaderProps) {
  return (
    <header className="header">
      <button className="title-button" type="button">
        <span className="ellipsis">{title}</span>
        <ChevronDown size={13} />
      </button>
      <span className="spacer" />
      <button className="icon-button" type="button" aria-label="新对话" onClick={onNewChat}>
        <Plus size={15} />
      </button>
      <button className="icon-button" type="button" aria-label="历史对话" onClick={onOpenChats}>
        <Clock size={15} />
      </button>
      <button className="icon-button" type="button" aria-label="转入 Monavi Web" onClick={onOpenWeb}>
        <ExternalLink size={15} />
      </button>
      <button className="icon-button" type="button" aria-label="关闭" onClick={onClose}>
        <X size={15} />
      </button>
    </header>
  );
}

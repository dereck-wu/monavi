export type View = 'empty' | 'conversation' | 'chats';

export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  text: string;
}

export interface Session {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}

export type Bindings = Record<string, string>;

export interface PageContext {
  title: string;
  url: string;
}

export interface Suggestion {
  id: string;
  label: string;
  icon: 'summary' | 'todo' | 'translate' | 'question';
}

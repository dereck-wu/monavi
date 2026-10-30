import type { Message, PageContext, Session, Suggestion } from '../types';

const HOUR = 3_600_000;

export const pageContext: PageContext = {
  title: '远程协作三年：我们从异步沟通中学到的五件事',
  url: 'https://slowread.example.com/posts/async-collaboration',
};

export const modelName = 'DeepSeek V4.1 Flash';

export const effortLevel = 'Low';

export const mockReply = '（mock）这是占位回复，接入真实模型后在这里显示内容。';

export const suggestions: Suggestion[] = [
  { id: 'summary', label: '总结这篇文章', icon: 'summary' },
  { id: 'todo', label: '提取可执行的待办', icon: 'todo' },
  { id: 'translate', label: '翻译成英文', icon: 'translate' },
  { id: 'question', label: '这篇文章有哪些值得质疑的地方', icon: 'question' },
];

const summaryMessages: Message[] = [
  { id: 'm1', role: 'user', text: '帮我总结这篇文章的核心观点' },
  {
    id: 'm2',
    role: 'assistant',
    text: '文章复盘了一个团队三年远程协作的经验，核心观点有三点：\n1. 决定必须落成文字。会议和私聊里的共识容易被记偏，每个决定都应记录背景、选项和理由。\n2. 默认异步。非紧急事务先写提案、留 24 小时评论，结论往往比临时拍板更周全。\n3. 文档优先于会议。人均每周开会 11 小时，过半会议没有书面产出。',
  },
  { id: 'm3', role: 'user', text: '这句话在我们团队怎么落地？' },
];

export function seedSessions(now: number): Session[] {
  return [
    { id: 'c1', title: '对比三家云服务商的 GPU 报价', updatedAt: now - 2 * HOUR, messages: [] },
    { id: 'c2', title: '周报要点整理', updatedAt: now - 24 * HOUR, messages: [] },
    { id: 'c3', title: '帮我回复这封合作邮件', updatedAt: now - 72 * HOUR, messages: [] },
    { id: 'c4', title: '远程协作三年：异步沟通要点', updatedAt: now - HOUR / 2, messages: summaryMessages },
    { id: 'c5', title: '帮我整理本周的 GitHub 通知', updatedAt: now - 26 * HOUR, messages: [] },
    { id: 'c6', title: 'Chrome MV3 扩展概念解析', updatedAt: now - HOUR, messages: [] },
    { id: 'c7', title: '侧边栏如何与页面通信', updatedAt: now - 20 * HOUR, messages: [] },
    { id: 'c8', title: 'Service Worker 休眠时的状态保存', updatedAt: now - 21 * HOUR, messages: [] },
  ];
}

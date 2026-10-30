import type { Message } from '../types';

export function Messages({ messages }: { messages: Message[] }) {
  return (
    <>
      {messages.map((message) =>
        message.role === 'user' ? (
          <div key={message.id} className="message user">
            <div className="bubble">{message.text}</div>
          </div>
        ) : (
          <div key={message.id} className="message assistant">
            {message.text}
          </div>
        ),
      )}
    </>
  );
}

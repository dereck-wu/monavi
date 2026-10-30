import { ArrowUp, Plus, Wrench, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { effortLevel, modelName } from '../mock/data';

interface ComposerProps {
  onSend: (text: string) => void;
  quote?: string | null;
  onClearQuote?: () => void;
  focusSignal?: number;
}

export function Composer({ onSend, quote, onClearQuote, focusSignal }: ComposerProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSignal) inputRef.current?.focus();
  }, [focusSignal]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = value.trim();
    if (!text && !quote) return;
    onSend(text);
    setValue('');
  };

  return (
    <form className="composer" onSubmit={submit}>
      {quote && (
        <div className="quote">
          <span className="ellipsis">「{quote}」</span>
          <button type="button" aria-label="移除引用" onClick={onClearQuote}>
            <X size={12} />
          </button>
        </div>
      )}
      <div className="input-row">
        <button className="icon-button round" type="button" aria-label="添加上下文">
          <Plus size={14} />
        </button>
        <input
          ref={inputRef}
          aria-label="提问"
          placeholder="提问，输入 @ 引用上下文"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button className="send" type="submit" aria-label="发送">
          <ArrowUp size={15} />
        </button>
      </div>
      <div className="toolbar">
        <button className="tool" type="button" aria-label="工具">
          <Wrench size={16} />
        </button>
        <span className="spacer" />
        <button className="tool model" type="button">
          {modelName}
        </button>
        <button className="tool" type="button">
          {effortLevel}
        </button>
      </div>
    </form>
  );
}

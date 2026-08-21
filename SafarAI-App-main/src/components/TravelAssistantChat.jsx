import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/cn';
import Icon from './ui/Icon';
import Button from './ui/Button';
import { useAssistant } from '../context/AssistantContext';
import { aiStatus } from '../services/aiService';
import { useToast } from '../context/ToastContext';

/**
 * TravelAssistantChat — the conversational surface of SafarAI.
 * `mode="page"` renders the full-height experience used by /assistant,
 * `mode="floating"` renders the dock available on every other route.
 */

const QUICK_PROMPTS = [
  { label: '5-day Kerala plan', icon: 'sparkles', text: 'Plan 5 days in Kerala for two people on a mid-range budget.' },
  { label: 'Best time for Ladakh', icon: 'calendar', text: 'When is the best time to visit Leh Ladakh and why?' },
  { label: 'Budget for Goa', icon: 'wallet', text: 'What does a 4-day Goa trip cost per person in December?' },
  { label: 'Solo safety tips', icon: 'shield', text: 'Give me solo travel safety tips for Varanasi.' },
];

const markdownComponents = {
  p: ({ children }) => <p className="mb-2 leading-6 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-fg">{children}</strong>,
  em: ({ children }) => <em className="text-fg-muted">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-6 marker:text-brand-400">{children}</li>,
  h1: ({ children }) => <h3 className="mb-1.5 mt-3 text-base font-bold text-fg first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-1.5 mt-3 text-[15px] font-bold text-fg first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-bold text-fg first:mt-0">{children}</h4>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 underline-offset-2 hover:underline dark:text-brand-300">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-200">{children}</code>
  ),
  hr: () => <hr className="my-3 border-line" />,
};

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce-dot"
          style={{ animationDelay: `${index * 140}ms` }}
        />
      ))}
    </span>
  );
}

function MessageBubble({ message, onCopy }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex w-full gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-float">
          <Icon name="sparkles" size="sm" />
        </span>
      )}

      <div className={cn('group/msg max-w-[86%] sm:max-w-[80%]', isUser && 'flex flex-col items-end')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm shadow-xs',
            isUser
              ? 'rounded-br-md bg-brand-600 text-white'
              : message.failed
              ? 'rounded-bl-md border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
              : 'rounded-bl-md border border-line bg-surface text-fg-muted'
          )}
        >
          {message.pending ? (
            <TypingDots />
          ) : isUser ? (
            <p className="leading-6">{message.text}</p>
          ) : (
            <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
          )}
        </div>

        {!isUser && !message.pending && message.text && (
          <button
            type="button"
            onClick={() => onCopy(message.text)}
            className="mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-semibold text-fg-subtle opacity-0 transition hover:bg-surface-muted hover:text-fg focus-visible:opacity-100 group-hover/msg:opacity-100"
          >
            <Icon name="copy" size="xs" />
            Copy
          </button>
        )}
      </div>

      {isUser && (
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-fg-muted">
          <Icon name="user" size="sm" />
        </span>
      )}
    </div>
  );
}

function Composer({ value, onChange, onSubmit, disabled, compact }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, compact ? 96 : 140)}px`;
  }, [value, compact]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-xs transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Ask about destinations, budgets, routes…"
        aria-label="Message the SafarAI assistant"
        className="max-h-36 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-fg outline-none placeholder:text-fg-subtle"
      />
      <Button
        type="submit"
        size="sm"
        iconOnly
        leadingIcon="send"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="mb-0.5"
      />
    </form>
  );
}

function TravelAssistantChat({ mode = 'floating', initialQuestion }) {
  const isPageMode = mode === 'page';
  const { messages, isTyping, send, reset, retryLast, error, dockOpen, setDockOpen } = useAssistant();
  const toast = useToast();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const sentInitial = useRef(false);

  const isOpen = isPageMode || dockOpen;

  useEffect(() => {
    if (!initialQuestion || sentInitial.current) return;
    sentInitial.current = true;
    send(initialQuestion);
  }, [initialQuestion, send]);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (!dockOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setDockOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dockOpen, setDockOpen]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  };

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    send(text);
  };

  const showQuickPrompts = useMemo(() => messages.length <= 1, [messages.length]);

  const header = (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-3 text-white">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          <Icon name="sparkles" size="md" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand-600 bg-emerald-400" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">SafarAI Assistant</p>
          <p className="truncate text-2xs text-white/80">
            {isTyping ? 'Thinking…' : aiStatus.configured ? 'Online · Llama 3.3 70B' : 'Online · offline knowledge mode'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
          aria-label="Start a new conversation"
          title="New chat"
        >
          <Icon name="refresh" size="sm" />
        </button>
        {!isPageMode && (
          <button
            type="button"
            onClick={() => setDockOpen(false)}
            className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
            aria-label="Close assistant"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>
    </div>
  );

  const conversation = (
    <>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onCopy={copy} />
      ))}

      {showQuickPrompts && (
        <div className="pt-1">
          <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-fg-subtle">Try one of these</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => send(prompt.text)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg-muted transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm dark:hover:text-brand-200"
              >
                <Icon name={prompt.icon} size="xs" />
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <span className="flex items-center gap-2">
            <Icon name="alert" size="sm" />
            {error}
          </span>
          <button type="button" onClick={retryLast} className="font-bold underline-offset-2 hover:underline">
            Retry
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </>
  );

  if (isPageMode) {
    return (
      <div className="flex h-[min(72vh,760px)] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        {header}
        <div className="flex-1 space-y-4 overflow-y-auto bg-surface-muted/40 p-4 sm:p-5">{conversation}</div>
        <div className="border-t border-line bg-surface p-3 sm:p-4">
          <Composer value={input} onChange={setInput} onSubmit={submit} disabled={isTyping} />
          <p className="mt-2 text-center text-2xs text-fg-subtle">
            SafarAI can make mistakes — double-check prices, timings and visa rules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[95] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <div
        className={cn(
          'pointer-events-auto flex w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-lift transition-all duration-300 ease-smooth',
          dockOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-4 scale-95 opacity-0'
        )}
        role="dialog"
        aria-label="SafarAI assistant"
        aria-hidden={!dockOpen}
      >
        {header}
        <div className="h-[min(52vh,26rem)] space-y-4 overflow-y-auto bg-surface-muted/40 p-4">{conversation}</div>
        <div className="border-t border-line bg-surface p-3">
          <Composer value={input} onChange={setInput} onSubmit={submit} disabled={isTyping} compact />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDockOpen(!dockOpen)}
        aria-expanded={dockOpen}
        aria-label={dockOpen ? 'Close SafarAI assistant' : 'Open SafarAI assistant'}
        className={cn(
          'pointer-events-auto group relative inline-flex items-center gap-2.5 rounded-full bg-brand-gradient py-3 pl-3 pr-4 text-sm font-bold text-white shadow-glow transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:shadow-lift',
          dockOpen && 'pl-3.5 pr-3.5'
        )}
      >
        {!dockOpen && (
          <span className="absolute inset-0 -z-10 rounded-full bg-brand-500/45 animate-pulse-ring" aria-hidden="true" />
        )}
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
          <Icon name={dockOpen ? 'close' : 'sparkles'} size="sm" />
        </span>
        {!dockOpen && <span className="hidden sm:inline">Ask SafarAI</span>}
      </button>
    </div>
  );
}

export default TravelAssistantChat;

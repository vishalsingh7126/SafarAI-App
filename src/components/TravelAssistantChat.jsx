import { useEffect, useMemo, useRef, useState } from 'react';
import { generateAITravelResponse } from '../services/aiService';

const initialMessage = {
  id: 1,
  role: 'assistant',
  text: 'Hi! I am your SafarAI Travel Assistant. Ask me about destinations, budget, or trip planning.',
};

function TravelAssistantChat({ mode = 'floating' }) {
  const isPageMode = mode === 'page';
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([initialMessage]);
  const [isTyping, setIsTyping] = useState(false);
  const nextId = useRef(2);
  const bottomRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isTyping, [input, isTyping]);

  useEffect(() => {
    if (isPageMode || isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isPageMode]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessageId = nextId.current;
    const thinkingMessageId = nextId.current + 1;

    const userMessage = { id: userMessageId, role: 'user', text };
    const thinkingMessage = { id: thinkingMessageId, role: 'assistant', text: 'Thinking...' };

    nextId.current += 2;
    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput('');
    setIsTyping(true);

    const response = await generateAITravelResponse(text);

    setMessages((prev) =>
      prev.map((message) =>
        message.id === thinkingMessageId ? { ...message, text: response } : message
      )
    );
    setIsTyping(false);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const messageList = (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
              message.role === 'user'
                ? 'bg-brand-700 text-white'
                : 'border border-brand-100 bg-white text-slate-700'
            }`}
          >
            {message.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </>
  );

  const inputBar = (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask about destinations, budget, or routes..."
        className="interactive w-full rounded-xl border border-brand-100 bg-mist px-3 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white"
      />
      <button
        type="button"
        onClick={sendMessage}
        disabled={!canSend}
        className="interactive rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Send
      </button>
    </div>
  );

  // ── Page mode: always-open, fills its container ──────────────────────────
  if (isPageMode) {
    return (
      <div className="flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-xl">
        <header className="border-b border-brand-100 bg-gradient-to-r from-brand-700 to-accent-600 px-5 py-4 text-white">
          <h3 className="text-base font-bold sm:text-lg">SafarAI Travel Assistant</h3>
          <p className="text-xs text-white/90">Ask anything about your trip.</p>
        </header>
        <div className="min-h-[420px] space-y-3 overflow-y-auto bg-mist/60 p-5">
          {messageList}
        </div>
        <div className="border-t border-brand-100 bg-white p-4">
          {inputBar}
        </div>
      </div>
    );
  }

  // ── Floating mode: original fixed bottom-right toggle behavior ───────────
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div
        className={`w-[92vw] max-w-sm overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-panel transition-all duration-300 sm:max-w-md ${
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <header className="border-b border-brand-100 bg-gradient-to-r from-brand-700 to-accent-600 px-4 py-3 text-white">
          <h3 className="text-sm font-bold sm:text-base">SafarAI Travel Assistant</h3>
          <p className="text-xs text-white/90">Ask anything about your trip.</p>
        </header>
        <div className="max-h-80 space-y-3 overflow-y-auto bg-mist/60 p-4">
          {messageList}
        </div>
        <div className="border-t border-brand-100 bg-white p-3">
          {inputBar}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="interactive rounded-full bg-gradient-to-r from-brand-700 to-accent-600 px-5 py-3 text-sm font-semibold text-white shadow-float hover:from-brand-800 hover:to-accent-700"
        aria-expanded={isOpen}
        aria-label="Toggle SafarAI Travel Assistant chat"
      >
        {isOpen ? 'Close Assistant' : 'AI Travel Assistant'}
      </button>
    </div>
  );
}

export default TravelAssistantChat;

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { generateAITravelResponse } from '../services/aiService';
import { useWorkspace } from './WorkspaceContext';

/**
 * AssistantContext — one conversation shared by the floating dock and the
 * full-page assistant, so users never lose their thread when they switch.
 */

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text:
    'Hi! I am your **SafarAI travel assistant**.\n\nAsk me to plan an itinerary, compare destinations, estimate a budget, or find food and stays. Try:\n- “5 days in Kerala on a mid-range budget”\n- “Is Goa good in November?”\n- “Cheapest way from Delhi to Jaipur”',
  at: new Date().toISOString(),
};

const AssistantContext = createContext(null);

export function AssistantProvider({ children }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [isTyping, setIsTyping] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [error, setError] = useState(null);
  const nextId = useRef(1);
  const workspace = useWorkspace();

  const buildContext = useCallback(() => {
    const parts = [];
    const { preferences, recent, trips } = workspace;
    if (preferences?.homeCity) parts.push(`Home city: ${preferences.homeCity}`);
    if (preferences?.travelStyle) parts.push(`Preferred style: ${preferences.travelStyle}`);
    if (recent?.length) parts.push(`Recently viewed: ${recent.slice(0, 3).map((item) => item.title).join(', ')}`);
    if (trips?.length) parts.push(`Saved trips: ${trips.slice(-2).map((trip) => trip.destination).join(', ')}`);
    return parts.join('. ');
  }, [workspace]);

  const send = useCallback(
    async (rawText) => {
      const text = String(rawText || '').trim();
      if (!text || isTyping) return;

      nextId.current += 1;
      const userMessage = { id: `u${nextId.current}`, role: 'user', text, at: new Date().toISOString() };
      nextId.current += 1;
      const pendingId = `a${nextId.current}`;

      setError(null);
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: pendingId, role: 'assistant', text: '', pending: true, at: new Date().toISOString() },
      ]);
      setIsTyping(true);

      try {
        const history = messages
          .filter((message) => !message.pending && message.id !== 'welcome')
          .map(({ role, text: value }) => ({ role, text: value }));

        const answer = await generateAITravelResponse(text, { history, context: buildContext() });

        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId ? { ...message, text: answer, pending: false } : message
          )
        );
      } catch (requestError) {
        console.error(requestError);
        setError('The assistant could not respond. Check your connection and try again.');
        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? {
                  ...message,
                  pending: false,
                  failed: true,
                  text: 'Sorry — I could not complete that request.',
                }
              : message
          )
        );
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages, buildContext]
  );

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    if (!lastUser) return;
    setMessages((prev) => prev.filter((message) => !message.failed));
    send(lastUser.text);
  }, [messages, send]);

  const reset = useCallback(() => {
    setMessages([WELCOME]);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      messages,
      isTyping,
      error,
      send,
      reset,
      retryLast,
      dockOpen,
      setDockOpen,
      openDock: () => setDockOpen(true),
      closeDock: () => setDockOpen(false),
    }),
    [messages, isTyping, error, send, reset, retryLast, dockOpen]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) throw new Error('useAssistant must be used inside <AssistantProvider>');
  return context;
}

export default AssistantContext;

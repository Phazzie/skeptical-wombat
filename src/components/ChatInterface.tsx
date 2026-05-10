'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContextConfig } from '../domain/ports/outbound/InsightPort';
import { ChatMessage } from '../domain/entities/Project';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Yo! I'm the Skeptical Wombat. What's the plan for the story? Spill the details, I'm here for the subtext.",
};

interface ChatInterfaceProps {
  projectId: string | null;
  context: ContextConfig;
  initialMessages?: ChatMessage[];
  onHistoryUpdate?: (messages: ChatMessage[]) => void;
}

export function ChatInterface({ projectId, context, initialMessages, onHistoryUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages && initialMessages.length > 0 ? initialMessages : [WELCOME]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Sync when parent loads history from DB
  useEffect(() => {
    if (!initializedRef.current && initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      initializedRef.current = true;
    }
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !projectId) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Optimistic empty bubble for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, messages: newMessages, context }),
      });

      if (!res.ok) {
        let errMsg = 'Something went wrong.';
        try { const d = await res.json(); errMsg = (d as { error?: string }).error ?? errMsg; } catch { /* ignore */ }
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: `Error: ${errMsg}` }]);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: accumulated }]);
        }
      }

      const finalMessages: ChatMessage[] = [
        ...newMessages,
        { role: 'assistant', content: accumulated },
      ];
      setMessages(finalMessages);
      onHistoryUpdate?.(finalMessages);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'The Wombat went quiet. Check your connection.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const cleared = [WELCOME];
    setMessages(cleared);
    onHistoryUpdate?.(cleared);
  };

  return (
    <div className="flex flex-col h-[600px] bg-[var(--ink-black)] text-[var(--paper-white)] border-4 border-fuchsia-500 shadow-[12px_12px_0_0_rgba(217,70,239,1)]">
      <div className="p-4 border-b border-fuchsia-900/50 flex justify-between items-center bg-fuchsia-900/20">
        <h3 className="font-display text-xl uppercase tracking-tighter text-[var(--neon-accent)] flex items-center gap-2">
          <Bot size={20} /> Diskuss with the Wombat
        </h3>
        <button onClick={handleClear} className="text-white/40 hover:text-red-500 transition-colors" title="Clear history">
          <Trash2 size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={i}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-sm text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-fuchsia-600 text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]'
                  : 'bg-white/10 border-l-4 border-[var(--neon-accent)]'
              }`}>
                <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-widest">
                  {m.role === 'user' ? <><User size={10} /> You</> : <><Bot size={10} /> Wombat</>}
                </div>
                {m.content || (
                  <span className="flex gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 bg-[var(--neon-accent)] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[var(--neon-accent)] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[var(--neon-accent)] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="p-4 bg-fuchsia-950/20 border-t border-fuchsia-900/50 flex gap-2">
        <input
          className="flex-1 bg-white/5 border-2 border-white/10 p-3 rounded-sm focus:outline-none focus:border-[var(--neon-accent)] transition-colors text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Defend your plot arc..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-[var(--neon-accent)] text-[var(--ink-black)] p-3 hover:translate-x-1 hover:-translate-y-1 transition-transform disabled:opacity-50 shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-0 active:translate-y-0"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

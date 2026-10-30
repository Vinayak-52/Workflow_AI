import React, { useState } from 'react';
import { X, Sparkles, Send, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ContextualAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  activeContext: {
    type: 'notes' | 'tasks' | 'inbox' | 'calendar' | 'dashboard' | 'settings' | 'global';
    id?: string;
    label?: string;
  };
}

export const ContextualAssistantDrawer: React.FC<ContextualAssistantDrawerProps> = ({
  open,
  onClose,
  activeContext,
}) => {
  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    sources?: Array<{ type: string; id: string; label: string }>;
    proposal?: { title: string; description: string; estimatedMinutes: number };
  }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am your contextual assistant. I can help organize tasks, draft outlines from your notes, or summarize commitments. External Google operations remain strictly read-only, and any task creation requires your direct confirmation.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmedTasks, setConfirmedTasks] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
        },
        body: JSON.stringify({
          message: userMsg,
          context: activeContext,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: data.answer || 'I evaluated your request.',
            sources: data.sources,
            proposal: data.proposals?.[0],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: data.error?.message || 'Unable to process assistant request.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Assistant backend is currently responding in offline mock mode.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const confirmSaveProposal = async (proposal: { title: string; description: string; estimatedMinutes: number }) => {
    try {
      await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'test-user-id' },
        body: JSON.stringify({
          title: proposal.title,
          description: proposal.description,
          estimatedMinutes: proposal.estimatedMinutes,
          sourceType: 'ai',
        }),
      });
      setConfirmedTasks((prev) => ({ ...prev, [proposal.title]: true }));
    } catch (err) {
      alert('Failed to save proposed task');
    }
  };

  return (
    <aside className="w-80 h-screen bg-workspace-sidebar border-l border-workspace-border flex flex-col justify-between shadow-xl z-20">
      {/* Header */}
      <div className="h-14 px-4 border-b border-workspace-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          <span className="font-semibold text-sm text-zinc-100">Contextual Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 rounded hover:bg-workspace-card"
        >
          <X size={16} />
        </button>
      </div>

      {/* Active Context Chip */}
      <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="text-zinc-400">Context:</span>
        <span className="font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded">
          {activeContext.label || activeContext.type}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col text-xs leading-relaxed ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[90%] rounded-lg px-3 py-2 ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-workspace-card border border-workspace-border text-zinc-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Source citations */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-700/60 text-[11px] text-zinc-400">
                  <span className="font-medium text-zinc-300">Sources:</span>
                  <ul className="mt-1 space-y-0.5">
                    {m.sources.map((s, sIdx) => (
                      <li key={sIdx} className="flex items-center gap-1 text-indigo-300">
                        • {s.label || s.id} ({s.type})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Proposal Confirmation Dialog */}
              {m.proposal && (
                <div className="mt-2.5 p-2 bg-zinc-900/90 border border-indigo-500/40 rounded">
                  <div className="flex items-center justify-between font-medium text-indigo-300 mb-1">
                    <span>Proposed Task</span>
                    <span className="text-[10px] text-zinc-400">{m.proposal.estimatedMinutes}m</span>
                  </div>
                  <p className="font-semibold text-zinc-100">{m.proposal.title}</p>
                  <p className="text-zinc-400 mt-0.5">{m.proposal.description}</p>
                  <div className="mt-2 flex justify-end">
                    {confirmedTasks[m.proposal.title] ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                        <Check size={12} /> Saved to workspace
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => confirmSaveProposal(m.proposal!)}
                      >
                        Confirm & Save Task
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-zinc-400 flex items-center gap-1.5 animate-pulse">
            <Sparkles size={12} /> Assistant is thinking...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-workspace-border bg-workspace-sidebar">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or request a plan..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-1.5 rounded-md transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </aside>
  );
};

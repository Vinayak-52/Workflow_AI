import React, { useState } from 'react';
import { X, Sparkles, Send, Check, AlertCircle, Link2, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

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
      text: 'Welcome! I am your contextual assistant. I synthesize your notes, tasks, emails, and calendar commitments to keep your focus intact.\n\nAll Google integrations remain strictly read-only, and any task creation requires your direct confirmation.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmedTasks, setConfirmedTasks] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const quickPrompts = [
    'Plan remaining free time today',
    'Summarize active priorities',
    'Extract action items from inbox',
  ];

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: promptText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
        },
        body: JSON.stringify({
          message: promptText,
          context: activeContext,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: data.answer || 'I analyzed your workspace request.',
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
    } catch {
      alert('Failed to save proposed task');
    }
  };

  return (
    <aside className="w-96 h-screen bg-[#0d0e14] border-l border-white/[0.08] flex flex-col justify-between shadow-2xl z-30 relative animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="h-16 px-5 border-b border-white/[0.06] flex items-center justify-between bg-[#0a0b10]/80 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white tracking-tight flex items-center gap-1.5">
              Contextual AI
              <span className="text-[9px] font-mono text-zinc-500 bg-white/[0.05] px-1.5 py-0.2 rounded border border-white/[0.06]">
                READ-ONLY
              </span>
            </h3>
            <span className="text-[10px] text-zinc-500">Grounded Assistance</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Active Context Banner */}
      <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between text-xs">
        <span className="text-[11px] text-zinc-400">Active context:</span>
        <Badge variant="purple" dot className="text-[10px] uppercase font-mono">
          {activeContext.label || activeContext.type}
        </Badge>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col text-xs leading-relaxed ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-xs shadow-[0_2px_8px_rgba(99,102,241,0.3)]'
                  : 'bg-[#14151e] border border-white/[0.08] text-zinc-200 rounded-tl-xs shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Source citations */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                  <span className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider block mb-1.5">
                    Grounded Evidence Sources:
                  </span>
                  <div className="space-y-1.5">
                    {m.sources.map((s, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-[11px] text-indigo-300"
                      >
                        <span className="truncate flex-1 mr-2 flex items-center gap-1.5">
                          <Link2 size={11} className="text-indigo-400 shrink-0" />
                          {s.label || s.id}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase px-1 rounded bg-black/40">
                          {s.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Task Confirmation Card */}
              {m.proposal && (
                <div className="mt-3 p-3 bg-gradient-to-b from-indigo-950/40 to-[#0e0f17] border border-indigo-500/40 rounded-xl">
                  <div className="flex items-center justify-between text-indigo-300 text-[10px] font-semibold uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles size={11} /> Suggested Task
                    </span>
                    <span className="font-mono bg-indigo-500/20 text-indigo-200 px-1.5 py-0.5 rounded">
                      {m.proposal.estimatedMinutes}m
                    </span>
                  </div>
                  <h4 className="font-semibold text-white text-xs mt-1">{m.proposal.title}</h4>
                  <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
                    {m.proposal.description}
                  </p>
                  <div className="mt-3 flex items-center justify-end">
                    {confirmedTasks[m.proposal.title] ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                        <Check size={13} /> Saved to workspace
                      </span>
                    ) : (
                      <Button
                        size="xs"
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
          <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl">
            <Sparkles size={13} className="animate-spin" />
            <span>Analyzing workspace context...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-white/[0.04] bg-[#0c0d13] flex gap-1.5 overflow-x-auto">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendPrompt(qp)}
            className="px-2 py-1 rounded-full text-[10px] text-zinc-400 hover:text-zinc-100 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] whitespace-nowrap transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Prompt Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt(input);
        }}
        className="p-3 border-t border-white/[0.06] bg-[#0a0b10]"
      >
        <div className="flex items-center gap-2 bg-[#14151e] border border-white/[0.08] focus-within:border-indigo-500/60 rounded-xl px-3 py-1.5 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or request a plan..."
            className="flex-1 bg-transparent text-xs text-zinc-100 focus:outline-none placeholder-zinc-600"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-[0_1px_4px_rgba(99,102,241,0.4)]"
          >
            <Send size={12} />
          </button>
        </div>
      </form>
    </aside>
  );
};

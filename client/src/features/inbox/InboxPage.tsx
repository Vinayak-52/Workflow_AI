import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Mail, Search, Sparkles, Check, Plus, Calendar, Clock, Link2, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';

export const InboxPage: React.FC = () => {
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: string;
    subject: string;
    date: string;
    snippet: string;
    unread: boolean;
  }>>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [actions, setActions] = useState<Array<{ title: string; dueAt?: string; minutes: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [savedActions, setSavedActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/v1/gmail/messages', {
      headers: { 'x-user-id': 'test-user-id' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
          if (data.messages.length > 0) setSelectedMessage(data.messages[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleSummarize = async () => {
    if (!selectedMessage) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/gmail/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'test-user-id' },
        body: JSON.stringify({ messageId: selectedMessage.id }),
      });
      const data = await res.json();
      setSummary(data.summary || 'Summary unavailable');
    } catch {
      setSummary('Failed to summarize email.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractActions = async () => {
    if (!selectedMessage) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/gmail/extract-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'test-user-id' },
        body: JSON.stringify({ messageId: selectedMessage.id }),
      });
      const data = await res.json();
      setActions(data.actions || []);
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActionToWorkspace = async (action: { title: string; dueAt?: string; minutes: number }) => {
    try {
      await api.createTask({
        title: action.title,
        description: `Extracted from email: "${selectedMessage?.subject}" (${selectedMessage?.sender})`,
        dueAt: action.dueAt || null,
        estimatedMinutes: action.minutes || 30,
        sourceType: 'email',
        sourceReference: {
          type: 'gmail_message',
          id: selectedMessage?.id || 'unknown',
          label: selectedMessage?.subject || 'Email Action',
        },
      });
      setSavedActions((prev) => ({ ...prev, [action.title]: true }));
    } catch {
      alert('Failed to save task to workspace');
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex gap-5">
      {/* Email List Column */}
      <div className="w-80 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Mail size={15} className="text-indigo-400" />
            <h3 className="font-semibold text-xs text-white tracking-tight">Inbox</h3>
          </div>
          <Badge variant="purple" className="text-[10px] font-mono">
            Read-Only
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6">
              No emails loaded. Check Google connection in Settings.
            </div>
          ) : (
            messages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;
              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    setSummary(null);
                    setActions([]);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#181926] border-indigo-500/50 shadow-md'
                      : 'bg-[#12131b] border-white/[0.06] hover:border-white/[0.14] hover:bg-[#151622]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span className="font-semibold text-zinc-200 truncate">{msg.sender}</span>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-1">
                      {msg.date.split(',')[0]}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white tracking-tight truncate flex items-center gap-1.5">
                    {msg.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                    )}
                    <span className="truncate">{msg.subject}</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                    {msg.snippet}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Email Reader & Action Extractor Column */}
      <div className="flex-1 h-full flex flex-col bg-[#12131b] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden">
        {selectedMessage ? (
          <div className="flex-1 overflow-y-auto p-7 space-y-6">
            {/* Subject and Metadata */}
            <div className="border-b border-white/[0.06] pb-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                  {selectedMessage.subject}
                </h2>
                <Badge variant="default" className="text-[10px] font-mono shrink-0">
                  {selectedMessage.id}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <div className="w-7 h-7 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedMessage.sender.charAt(0)}
                </div>
                <div>
                  <span className="font-medium text-white">{selectedMessage.sender}</span>
                  <span className="text-[11px] text-zinc-500 block font-mono">
                    {selectedMessage.date}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Message Content */}
            <div className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap bg-[#0c0d13] p-5 rounded-xl border border-white/[0.05] shadow-inner">
              {selectedMessage.body || selectedMessage.snippet}
            </div>

            {/* AI Contextual Insights Card */}
            <div className="rounded-2xl bg-gradient-to-b from-indigo-950/20 via-[#141522] to-[#12131b] border border-indigo-500/30 p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Sparkles size={13} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white tracking-tight">
                      AI Contextual Intelligence
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      Summarize thread & extract candidate workspace tasks
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="xs" variant="secondary" onClick={handleSummarize} disabled={loading}>
                    Summarize Message
                  </Button>
                  <Button size="xs" variant="primary" onClick={handleExtractActions} disabled={loading}>
                    Extract Actions
                  </Button>
                </div>
              </div>

              {summary && (
                <div className="p-3.5 bg-[#0e0f17] rounded-xl border border-white/[0.06] text-xs text-zinc-200 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block font-mono">
                    Message Summary:
                  </span>
                  <p className="leading-relaxed">{summary}</p>
                </div>
              )}

              {actions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block font-mono">
                    Candidate Action Items (Click to review & save into workspace):
                  </span>
                  {actions.map((act, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#0e0f17] border border-white/[0.07] flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <span className="font-semibold text-xs text-white truncate block">
                          {act.title}
                        </span>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono">
                          {act.dueAt && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-indigo-400" />
                              Due: {act.dueAt.split('T')[0]}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-zinc-500" />
                            {act.minutes}m
                          </span>
                          <span className="text-indigo-400 flex items-center gap-1">
                            <Link2 size={11} /> Source: {selectedMessage.id}
                          </span>
                        </div>
                      </div>

                      {savedActions[act.title] ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium shrink-0">
                          <Check size={13} /> Saved
                        </span>
                      ) : (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => handleSaveActionToWorkspace(act)}
                          className="shrink-0"
                        >
                          <Plus size={12} /> Save Task
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
            Select an email message from the list to view details.
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Mail, Search, Sparkles, ExternalLink, Plus, Check } from 'lucide-react';
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
    // Fetch inbox messages from backend
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
        description: `Extracted from email subject: "${selectedMessage?.subject}"`,
        dueAt: action.dueAt || null,
        estimatedMinutes: action.minutes || 30,
        sourceType: 'email',
        sourceReference: {
          type: 'gmail_message',
          id: selectedMessage?.id || 'unknown',
          label: selectedMessage?.subject || 'Email Action',
        },
      });
      setSavedActions(prev => ({ ...prev, [action.title]: true }));
    } catch {
      alert('Failed to save task to workspace');
    }
  };

  return (
    <div className="h-full flex gap-5">
      {/* Email List Column */}
      <div className="w-80 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Mail size={14} className="text-indigo-400" />
            <span className="font-semibold text-zinc-200">Gmail Messages</span>
          </div>
          <Badge variant="info" className="text-[10px]">Read-Only</Badge>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No emails loaded. (Check Google connection in Settings)
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
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-workspace-cardHover border-indigo-500/50 shadow-sm'
                      : 'bg-workspace-card border-workspace-border hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span className="font-medium text-zinc-200 truncate">{msg.sender}</span>
                    <span className="text-[10px] text-zinc-500">{msg.date}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-100 truncate">{msg.subject}</h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{msg.snippet}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Email Reader & AI Extraction Column */}
      <div className="flex-1 h-full flex flex-col bg-workspace-card border border-workspace-border rounded-lg overflow-hidden">
        {selectedMessage ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header info */}
            <div className="border-b border-workspace-border pb-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-zinc-100">{selectedMessage.subject}</h2>
                <Badge variant="default" className="text-[10px]">ID: {selectedMessage.id}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2">
                <span>From: <strong className="text-zinc-200">{selectedMessage.sender}</strong></span>
                <span>•</span>
                <span>{selectedMessage.date}</span>
              </div>
            </div>

            {/* Email Body */}
            <div className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap bg-zinc-950/40 p-4 rounded border border-zinc-800">
              {selectedMessage.snippet}
            </div>

            {/* AI Assistant Extraction Controls */}
            <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-zinc-200">AI Contextual Insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={handleSummarize} disabled={loading}>
                    Summarize
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleExtractActions} disabled={loading}>
                    Extract Actions
                  </Button>
                </div>
              </div>

              {summary && (
                <div className="p-3 bg-zinc-900/80 rounded border border-zinc-800 text-xs text-zinc-200">
                  <span className="font-semibold text-indigo-400 block mb-1">AI Summary:</span>
                  <p>{summary}</p>
                </div>
              )}

              {actions.length > 0 && (
                <div className="space-y-2 mt-2">
                  <span className="font-semibold text-indigo-400 text-xs block">
                    Candidate Action Items (Click to review & save to workspace):
                  </span>
                  {actions.map((act, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-zinc-100">{act.title}</span>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          {act.dueAt && <span>Due: {act.dueAt}</span>}
                          <span>Estimated: {act.minutes}m</span>
                          <span className="text-indigo-400 font-mono">Source: {selectedMessage.id}</span>
                        </div>
                      </div>
                      {savedActions[act.title] ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                          <Check size={14} /> Saved
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSaveActionToWorkspace(act)}
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
            Select an email message from the list to view and analyze.
          </div>
        )}
      </div>
    </div>
  );
};

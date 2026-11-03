import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Send, X, ExternalLink, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.ts';
import { FormattedMessage } from '../../components/FormattedMessage.tsx';

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext?: { type: string; id: string | null; label?: string };
  onTaskCreated?: () => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  isOpen,
  onClose,
  activeContext,
  onTaskCreated
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'recommendations'>('chat');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; sources?: any[]; proposals?: any[]; warnings?: string[] }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am your AI Workspace Assistant. I analyze your tasks, notes, documents, and calendar commitments to propose grounded daily schedules.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadRecommendations();
    }
  }, [isOpen]);

  const loadRecommendations = async () => {
    try {
      const res = await api.getRecommendations();
      setRecommendations(res.recommendations || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.chatAssistant(userMsg, activeContext);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: res.answer,
          sources: res.sources,
          proposals: res.proposals,
          warnings: res.warnings
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', text: `Sorry, an error occurred: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (proposal: any) => {
    try {
      await api.createTask({
        title: proposal.title,
        category: proposal.category || 'project',
        userPriority: proposal.userPriority || 'medium',
        sourceType: proposal.sourceType || 'ai',
        sourceReference: proposal.sourceReference
      });
      alert(`Task "${proposal.title}" saved into your workspace!`);
      if (onTaskCreated) onTaskCreated();
    } catch (e: any) {
      alert(`Failed to save task: ${e.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between bg-slate-50/80 dark:bg-charcoal-950/50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-brand-600/20 text-blue-600 dark:text-brand-500 flex items-center justify-center border border-blue-200 dark:border-brand-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-charcoal-100 flex items-center gap-1.5">
              AI Assistant
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-brand-500/10 dark:text-brand-400 font-semibold border border-blue-200 dark:border-brand-500/20">
                Grounded
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-charcoal-400">Context: {activeContext?.label || 'Global Workspace'}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-charcoal-400 dark:hover:text-charcoal-100 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'recommendations'
              ? 'border-blue-600 text-blue-600 dark:border-brand-500 dark:text-brand-400 bg-blue-50/50 dark:bg-charcoal-850'
              : 'border-transparent text-slate-400 dark:text-charcoal-400 hover:text-slate-700 dark:hover:text-charcoal-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Recommendations
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'chat'
              ? 'border-blue-600 text-blue-600 dark:border-brand-500 dark:text-brand-400 bg-blue-50/50 dark:bg-charcoal-850'
              : 'border-transparent text-slate-400 dark:text-charcoal-400 hover:text-slate-700 dark:hover:text-charcoal-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          Contextual Chat
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'recommendations' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-charcoal-400 uppercase tracking-wider">
                Smart Suggestions
              </span>
              <button
                onClick={loadRecommendations}
                className="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-brand-400 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-950/40">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs text-slate-700 dark:text-charcoal-300 font-medium">Schedule is well balanced!</p>
                <p className="text-[11px] text-slate-400 dark:text-charcoal-500 mt-1">No urgent bottlenecks detected today.</p>
              </div>
            ) : (
              recommendations.map(rec => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-charcoal-800 bg-slate-50/60 dark:bg-charcoal-950/60 hover:border-blue-400/80 dark:hover:border-brand-500/40 transition space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-brand-500/20 dark:text-brand-400">
                      {rec.type.replace('_', ' ')}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-charcoal-100">{rec.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-charcoal-400 leading-relaxed">{rec.description}</p>
                </div>
              ))
            )}

            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-charcoal-800/40 border border-blue-100 dark:border-charcoal-800 text-[11px] text-slate-600 dark:text-charcoal-400 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-charcoal-300">Continuous Learning:</span>
              <p>Your task completions and priority overrides automatically refine the Random Forest model weights.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 dark:bg-charcoal-800/90 text-slate-800 dark:text-charcoal-200 border border-slate-200/80 dark:border-charcoal-700/60 rounded-bl-none shadow-xs'
                  }`}
                >
                  <FormattedMessage content={m.text} />

                  {/* Grounded Sources */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-charcoal-700/80 text-[10px] space-y-1">
                      <div className="font-semibold text-slate-500 dark:text-charcoal-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-blue-500 dark:text-brand-400" /> Grounded Evidence:
                      </div>
                      {m.sources.map((s, sIdx) => (
                        <div key={sIdx} className="text-slate-700 dark:text-charcoal-300 pl-2 border-l border-blue-500/50">
                          [{s.type}]: {s.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {m.warnings && m.warnings.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[10px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>{m.warnings.join(' ')}</div>
                    </div>
                  )}

                  {/* Task Proposals */}
                  {m.proposals && m.proposals.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="text-[10px] font-semibold text-blue-600 dark:text-brand-400">Proposed Actions:</div>
                      {m.proposals.map((prop, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-2 rounded-xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-700 flex items-center justify-between gap-2"
                        >
                          <span className="text-[11px] text-slate-800 dark:text-charcoal-200 truncate">{prop.title}</span>
                          <button
                            onClick={() => handleAcceptProposal(prop)}
                            className="px-2.5 py-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
                          >
                            Add Task
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-charcoal-400 italic">
                <Bot className="w-4 h-4 animate-spin text-blue-600 dark:text-brand-500" />
                <span>Analyzing workspace context...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Form */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50/80 dark:bg-charcoal-950/70 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your day, notes, or tasks..."
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-charcoal-900 border border-slate-300 dark:border-charcoal-700 text-slate-800 dark:text-charcoal-100 placeholder-slate-400 dark:placeholder-charcoal-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </aside>
  );
};

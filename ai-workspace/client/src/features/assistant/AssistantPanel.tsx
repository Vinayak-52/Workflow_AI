import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Send, X, ExternalLink, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.ts';

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
  const [activeTab, setActiveTab] = useState<'chat' | 'recommendations'>('recommendations');
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
    <aside className="fixed inset-y-0 right-0 w-96 bg-charcoal-900 border-l border-charcoal-800 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-charcoal-800 flex items-center justify-between bg-charcoal-950/50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-500 flex items-center justify-center border border-brand-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-charcoal-100 flex items-center gap-1.5">
              AI Assistant
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Grounded
              </span>
            </h3>
            <p className="text-[11px] text-charcoal-400">Context: {activeContext?.label || 'Global Workspace'}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-charcoal-400 hover:text-charcoal-100 hover:bg-charcoal-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-charcoal-800 bg-charcoal-900 text-xs font-medium">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'recommendations'
              ? 'border-brand-500 text-brand-400 bg-charcoal-850'
              : 'border-transparent text-charcoal-400 hover:text-charcoal-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Recommendations
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'chat'
              ? 'border-brand-500 text-brand-400 bg-charcoal-850'
              : 'border-transparent text-charcoal-400 hover:text-charcoal-200'
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
              <span className="text-xs font-medium text-charcoal-400 uppercase tracking-wider">
                Smart Suggestions
              </span>
              <button
                onClick={loadRecommendations}
                className="text-xs text-charcoal-400 hover:text-brand-400 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-charcoal-800 bg-charcoal-950/40">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs text-charcoal-300 font-medium">Schedule is well balanced!</p>
                <p className="text-[11px] text-charcoal-500 mt-1">No urgent bottlenecks detected today.</p>
              </div>
            ) : (
              recommendations.map(rec => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-charcoal-800 bg-charcoal-950/60 hover:border-brand-500/40 transition space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                      {rec.type.replace('_', ' ')}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h4 className="text-xs font-semibold text-charcoal-100">{rec.title}</h4>
                  <p className="text-[11px] text-charcoal-400 leading-relaxed">{rec.description}</p>
                </div>
              ))
            )}

            <div className="p-3 rounded-lg bg-charcoal-800/40 border border-charcoal-800 text-[11px] text-charcoal-400 space-y-1">
              <span className="font-semibold text-charcoal-300">Continuous Learning:</span>
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
                  className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-charcoal-800/90 text-charcoal-200 border border-charcoal-700/60 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {/* Grounded Sources */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-charcoal-700/80 text-[10px] space-y-1">
                      <div className="font-semibold text-charcoal-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-brand-400" /> Grounded Evidence:
                      </div>
                      {m.sources.map((s, sIdx) => (
                        <div key={sIdx} className="text-charcoal-300 pl-2 border-l border-brand-500/50">
                          [{s.type}]: {s.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {m.warnings && m.warnings.length > 0 && (
                    <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>{m.warnings.join(' ')}</div>
                    </div>
                  )}

                  {/* Task Proposals */}
                  {m.proposals && m.proposals.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="text-[10px] font-semibold text-brand-400">Proposed Actions:</div>
                      {m.proposals.map((prop, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-2 rounded bg-charcoal-900 border border-charcoal-700 flex items-center justify-between gap-2"
                        >
                          <span className="text-[11px] text-charcoal-200 truncate">{prop.title}</span>
                          <button
                            onClick={() => handleAcceptProposal(prop)}
                            className="px-2 py-1 text-[10px] bg-brand-600 hover:bg-brand-500 text-white font-medium rounded transition"
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
              <div className="flex items-center space-x-2 text-xs text-charcoal-400 italic">
                <Bot className="w-4 h-4 animate-spin text-brand-500" />
                <span>Analyzing workspace context...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSend} className="p-3 border-t border-charcoal-800 bg-charcoal-950/70 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your day, notes, or tasks..."
            className="flex-1 px-3 py-2 text-xs rounded-lg bg-charcoal-900 border border-charcoal-700 text-charcoal-100 placeholder-charcoal-500 focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </aside>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  PlusCircle,
  Edit3,
  Trash2,
  ListTodo,
  Calendar,
  Terminal
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { FormattedMessage } from '../../components/FormattedMessage.tsx';

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext?: { type: string; id: string | null; label?: string };
  onTaskCreated?: () => void;
}

const SLASH_COMMANDS = [
  {
    cmd: '/create ',
    syntax: '/create <task title>',
    desc: 'Create and schedule a new task',
    icon: PlusCircle,
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  {
    cmd: '/update ',
    syntax: '/update <title> to <done|high>',
    desc: 'Update task status or priority',
    icon: Edit3,
    color: 'text-blue-500 bg-blue-500/10'
  },
  {
    cmd: '/delete ',
    syntax: '/delete <task title>',
    desc: 'Delete a task from workspace',
    icon: Trash2,
    color: 'text-rose-500 bg-rose-500/10'
  },
  {
    cmd: '/tasks',
    syntax: '/tasks',
    desc: 'List active tasks ranked by ML priority',
    icon: ListTodo,
    color: 'text-amber-500 bg-amber-500/10'
  },
  {
    cmd: '/plan',
    syntax: '/plan',
    desc: 'Generate daily focus schedule',
    icon: Calendar,
    color: 'text-purple-500 bg-purple-500/10'
  }
];

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
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadRecommendations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (input.startsWith('/')) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  }, [input]);

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
    setShowSlashMenu(false);
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

      // If a task was created, updated, or deleted
      if (res.proposals && res.proposals.length > 0 && onTaskCreated) {
        onTaskCreated();
      }
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
        title: proposal.title || proposal.task?.title,
        category: proposal.category || proposal.task?.category || 'project',
        userPriority: proposal.userPriority || proposal.task?.userPriority || 'medium',
        sourceType: proposal.sourceType || 'ai',
        sourceReference: proposal.sourceReference
      });
      alert(`Task "${proposal.title || proposal.task?.title}" saved into your workspace!`);
      if (onTaskCreated) onTaskCreated();
    } catch (e: any) {
      alert(`Failed to save task: ${e.message}`);
    }
  };

  const handleSelectSlashCommand = (cmd: string) => {
    setInput(cmd);
    setShowSlashMenu(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const filteredCommands = SLASH_COMMANDS.filter(c =>
    c.cmd.toLowerCase().startsWith(input.toLowerCase().split(' ')[0])
  );

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
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-charcoal-100">AI Assistant</h3>
              <span className="text-[9px] font-semibold bg-blue-100 text-blue-700 dark:bg-brand-900/60 dark:text-brand-300 px-1.5 py-0.2 rounded-md">
                Grounded
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-charcoal-400">
              Context: {activeContext?.label || 'WORKSPACE'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-charcoal-400 dark:hover:text-charcoal-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-charcoal-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'recommendations'
              ? 'border-blue-600 text-blue-600 dark:border-brand-500 dark:text-brand-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-charcoal-400 hover:text-slate-800 dark:hover:text-charcoal-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Recommendations</span>
          {recommendations.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-brand-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
            activeTab === 'chat'
              ? 'border-blue-600 text-blue-600 dark:border-brand-500 dark:text-brand-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-charcoal-400 hover:text-slate-800 dark:hover:text-charcoal-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Contextual Chat</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'recommendations' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-charcoal-400">
              <span className="font-semibold text-slate-700 dark:text-charcoal-300">Continuous Learning Feed</span>
              <button
                onClick={loadRecommendations}
                className="hover:text-blue-600 dark:hover:text-brand-400 flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-charcoal-500 space-y-1">
                <Sparkles className="w-6 h-6 mx-auto opacity-50 mb-2" />
                <p>No active alerts right now.</p>
                <p className="text-[10px]">Your schedule and priorities are well balanced!</p>
              </div>
            ) : (
              recommendations.map(rec => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-charcoal-800/80 border border-slate-200/80 dark:border-charcoal-700/80 space-y-2 text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <h4 className="font-semibold text-slate-800 dark:text-charcoal-100">{rec.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-charcoal-300 leading-relaxed">
                    {rec.description}
                  </p>
                  {rec.actionType === 'start_task' && (
                    <button
                      onClick={() => alert(`Starting focused sprint for task ID: ${rec.taskId}`)}
                      className="mt-1 text-[11px] text-blue-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      Allocate Focus Block →
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
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
                          <span className="text-[11px] text-slate-800 dark:text-charcoal-200 truncate">{prop.title || prop.task?.title}</span>
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

      {/* Slash Commands Floating Autocomplete Menu */}
      {activeTab === 'chat' && showSlashMenu && (
        <div className="p-2 mx-3 mb-2 bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-700 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-charcoal-400 uppercase flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-blue-500" />
              Workspace Commands
            </span>
            <span className="text-[9px] font-normal lowercase">Click to select</span>
          </div>
          <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-2 text-center text-[11px] text-slate-400">
                No matching slash command. Try <code>/create</code>, <code>/update</code>, or <code>/delete</code>.
              </div>
            ) : (
              filteredCommands.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.cmd}
                    type="button"
                    onClick={() => handleSelectSlashCommand(item.cmd)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-charcoal-800 transition group"
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-charcoal-100 group-hover:text-blue-600 dark:group-hover:text-brand-400 font-mono">
                        {item.syntax}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-charcoal-500 truncate">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Input Form */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50/80 dark:bg-charcoal-950/70 flex gap-2 relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') setShowSlashMenu(false);
            }}
            placeholder="Type / for task commands or ask anything..."
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-charcoal-900 border border-slate-300 dark:border-charcoal-700 text-slate-800 dark:text-charcoal-100 placeholder-slate-400 dark:placeholder-charcoal-500 focus:border-blue-500 outline-none"
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

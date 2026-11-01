import React, { useState, useEffect } from 'react';
import { api, Task, Note, GoogleIntegrationStatus } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  CheckSquare,
  FileText,
  Calendar,
  Mail,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Plus,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [integration, setIntegration] = useState<GoogleIntegrationStatus | null>(null);
  const [quickTaskText, setQuickTaskText] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'priority' | 'calendar' | 'notes'>('all');

  const refreshData = () => {
    api.getTasks().then((r) => setTasks(r.tasks)).catch(() => {});
    api.getNotes().then((r) => setNotes(r.notes)).catch(() => {});
    api.getIntegrationStatus().then(setIntegration).catch(() => {});
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      refreshData();
    } catch {
      alert('Failed to update task');
    }
  };

  const handleQuickCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskText.trim()) return;

    try {
      await api.createTask({
        title: quickTaskText.trim(),
        userPriority: 'medium',
        status: 'todo',
        sourceType: 'manual',
      });
      setQuickTaskText('');
      refreshData();
    } catch {
      alert('Failed to create task');
    }
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const highPriorityTasks = pendingTasks.filter((t) => t.userPriority === 'high');

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      {/* 1. Hero Atmospheric Header (Inspired by Reference 2 - Alien AI) */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#151726] via-[#10111a] to-[#0a0b10] border border-white/[0.08] p-8 overflow-hidden shadow-panel">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 right-10 w-96 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-20 w-80 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                Academic AI Workspace
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-xs text-zinc-400">Department of CSBS · HITK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good morning, Vinayak
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Workflow AI synthesizes your notes, tasks, emails, and calendar commitments into one calm, focused surface.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button size="sm" variant="secondary" onClick={() => onNavigate('calendar')}>
              <Calendar size={14} className="text-emerald-400" />
              <span>Calendar</span>
            </Button>
            <Button size="sm" variant="primary" onClick={() => onNavigate('tasks')}>
              <span>View Tasks</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {/* Category Pills (Directly Inspired by Alien AI reference) */}
        <div className="relative z-10 flex items-center gap-2 pt-6 mt-6 border-t border-white/[0.06] overflow-x-auto select-none">
          <span className="text-[11px] text-zinc-500 font-medium mr-1 shrink-0">Views:</span>
          {(
            [
              { id: 'all', label: 'All Overview' },
              { id: 'priority', label: 'High Priority (ML)' },
              { id: 'calendar', label: 'Calendar Agenda' },
              { id: 'notes', label: 'Notes & Research' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-[0_2px_10px_rgba(99,102,241,0.4)]'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#11121a] border border-white/[0.07] hover:border-white/[0.14] transition-all flex items-center gap-3.5 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <CheckSquare size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-400 block">Pending Tasks</span>
            <div className="text-xl font-bold text-white tracking-tight">{pendingTasks.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11121a] border border-white/[0.07] hover:border-white/[0.14] transition-all flex items-center gap-3.5 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-400 block">ML Priority High</span>
            <div className="text-xl font-bold text-white tracking-tight">{highPriorityTasks.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11121a] border border-white/[0.07] hover:border-white/[0.14] transition-all flex items-center gap-3.5 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-400 block">Saved Notes</span>
            <div className="text-xl font-bold text-white tracking-tight">{notes.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11121a] border border-white/[0.07] hover:border-white/[0.14] transition-all flex items-center gap-3.5 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-400 block">Google Guard</span>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              {integration?.connected ? 'Read-Only Active' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Left Priority Horizon & Right Context Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Priority Command Center */}
        <div className="lg:col-span-2 space-y-5">
          {/* Fast Command Input (Linear / Raycast Style) */}
          <form
            onSubmit={handleQuickCreateTask}
            className="flex items-center gap-2 p-2 rounded-2xl bg-[#11121a] border border-white/[0.08] focus-within:border-indigo-500/60 shadow-card transition-all"
          >
            <div className="pl-3 text-zinc-400">
              <Plus size={16} />
            </div>
            <input
              type="text"
              value={quickTaskText}
              onChange={(e) => setQuickTaskText(e.target.value)}
              placeholder="Quick capture a new task (press Enter to save)..."
              className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            <Button size="xs" variant="primary" type="submit" disabled={!quickTaskText.trim()}>
              Capture Task
            </Button>
          </form>

          {/* Priority Tasks Card */}
          <div className="p-5 rounded-2xl bg-[#11121a] border border-white/[0.07] shadow-panel space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Active Priority Tasks
                </h3>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                View all ({pendingTasks.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {pendingTasks.slice(0, 5).map((task) => {
                const isHigh = task.userPriority === 'high';
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-[#0c0d13] border border-white/[0.06] hover:border-white/[0.14] hover:bg-[#141520] flex items-center justify-between gap-3.5 transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className="text-zinc-500 hover:text-indigo-400 transition-colors shrink-0"
                      >
                        <Circle size={16} />
                      </button>
                      <div className="min-w-0">
                        <span className="text-xs text-zinc-200 font-medium truncate block group-hover:text-white">
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-[10px] text-zinc-500 truncate block">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Badge
                        variant={isHigh ? 'danger' : task.userPriority === 'medium' ? 'warning' : 'success'}
                        dot
                        className="text-[10px]"
                      >
                        {task.userPriority}
                      </Badge>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {task.estimatedMinutes}m
                      </span>
                    </div>
                  </div>
                );
              })}

              {pendingTasks.length === 0 && (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  No pending tasks. You are all caught up!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: ML Model Health & Today's Calendar Horizon */}
        <div className="space-y-5">
          {/* Today's Horizon Card */}
          <div className="p-5 rounded-2xl bg-[#11121a] border border-white/[0.07] shadow-panel space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Today's Schedule
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Google Read-Only
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#0c0d13] border border-emerald-500/20 border-l-4 border-l-emerald-500">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">
                  Next Fixed Meeting:
                </span>
                <h4 className="text-xs font-semibold text-white mt-0.5">
                  Lab 3: AI Workspace Mentor Review
                </h4>
                <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
                  10:00 – 11:30 (HITK)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0d13] border border-indigo-500/20 border-l-4 border-l-indigo-500">
                <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold block">
                  Prime Free Focus Window:
                </span>
                <span className="text-xs font-semibold text-white mt-0.5 block">
                  14:00 – 16:30 (150 mins available)
                </span>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Zero overlap with fixed Google Calendar meetings.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="w-full justify-center"
              onClick={() => onNavigate('calendar')}
            >
              Open Daily Planner
            </Button>
          </div>

          {/* Machine Learning Model Card (Random Forest) */}
          <div className="p-5 rounded-2xl bg-[#11121a] border border-white/[0.07] shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  ML Priority Engine
                </h3>
              </div>
              <Badge variant="purple" className="text-[9px] font-mono">
                rf-v1.0
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Model Architecture:</span>
                <span className="font-semibold text-white">Random Forest (100 trees)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Test Accuracy:</span>
                <span className="font-semibold text-emerald-400">96.20% (vs 79.0% rule)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Baseline Fallback:</span>
                <span className="font-mono text-zinc-300">Resilient (Active)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

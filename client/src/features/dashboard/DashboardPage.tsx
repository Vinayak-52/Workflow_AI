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
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [integration, setIntegration] = useState<GoogleIntegrationStatus | null>(null);
  const [quickTaskText, setQuickTaskText] = useState('');

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
    <div className="max-w-6xl mx-auto space-y-7 pb-10">
      {/* Hero Welcome Banner with Subtle Ambient Glow */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#141522] via-[#0f1017] to-[#0c0d12] border border-white/[0.08] p-7 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        {/* Soft chromatic background ambient light */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-80 h-28 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                AI Workspace · HITK
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-xs text-zinc-400">Spring Term</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Good morning, Vinayak
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Workflow AI keeps your academic priorities, notes, emails, and calendar commitments in one calm workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button size="sm" variant="secondary" onClick={() => onNavigate('calendar')}>
              <Calendar size={14} /> Schedule
            </Button>
            <Button size="sm" variant="primary" onClick={() => onNavigate('tasks')}>
              <span>View Tasks</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <CheckSquare size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-400 block">Pending Tasks</span>
            <div className="text-xl font-bold text-white tracking-tight">{pendingTasks.length}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-400 block">High Priority (ML)</span>
            <div className="text-xl font-bold text-white tracking-tight">{highPriorityTasks.length}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-400 block">Saved Notes</span>
            <div className="text-xl font-bold text-white tracking-tight">{notes.length}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-zinc-400 block">Google Sync</span>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {integration?.connected ? 'Read-Only Active' : 'Disconnected'}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Task Capture Bar */}
      <form
        onSubmit={handleQuickCreateTask}
        className="flex items-center gap-2 p-2 rounded-xl bg-[#12131b] border border-white/[0.08] focus-within:border-indigo-500/50 shadow-sm transition-all"
      >
        <div className="pl-2 text-zinc-500">
          <Plus size={16} />
        </div>
        <input
          type="text"
          value={quickTaskText}
          onChange={(e) => setQuickTaskText(e.target.value)}
          placeholder="Quick capture a new task or idea (press Enter to save)..."
          className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
        />
        <Button size="xs" variant="primary" type="submit" disabled={!quickTaskText.trim()}>
          Capture Task
        </Button>
      </form>

      {/* Split Grid: Priority Tasks & Recent Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks Card */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <CheckSquare size={15} className="text-indigo-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Priority Tasks
                </h3>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                View all ({pendingTasks.length})
              </button>
            </div>

            <div className="space-y-2">
              {pendingTasks.slice(0, 5).map((task) => {
                const isHigh = task.userPriority === 'high';
                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-[#0f1016] border border-white/[0.05] hover:border-white/[0.12] flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className="text-zinc-500 hover:text-indigo-400 transition-colors shrink-0"
                      >
                        <Circle size={15} />
                      </button>
                      <span className="text-xs text-zinc-200 font-medium truncate group-hover:text-white">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                <div className="text-center py-10 text-zinc-500 text-xs">
                  No pending tasks. You are all caught up!
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Recent Notes Card */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-indigo-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Recent Notes
                </h3>
              </div>
              <button
                onClick={() => onNavigate('notes')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                View all ({notes.length})
              </button>
            </div>

            <div className="space-y-2">
              {notes.slice(0, 5).map((note) => (
                <div
                  key={note.id}
                  onClick={() => onNavigate('notes')}
                  className="p-3 rounded-xl bg-[#0f1016] border border-white/[0.05] hover:border-white/[0.12] flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-zinc-200 font-medium truncate block group-hover:text-white">
                      {note.title || 'Untitled Note'}
                    </span>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {note.content.replace(/[#*`_]/g, '') || 'Empty content'}
                    </p>
                  </div>

                  <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}

              {notes.length === 0 && (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  No notes saved yet. Create your first note!
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

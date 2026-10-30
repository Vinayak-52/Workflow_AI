import React, { useState, useEffect } from 'react';
import { api, Task, Note, GoogleIntegrationStatus } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CheckSquare, FileText, Calendar, Mail, Sparkles, Clock, ArrowRight } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [integration, setIntegration] = useState<GoogleIntegrationStatus | null>(null);

  useEffect(() => {
    api.getTasks().then(r => setTasks(r.tasks)).catch(() => {});
    api.getNotes().then(r => setNotes(r.notes)).catch(() => {});
    api.getIntegrationStatus().then(setIntegration).catch(() => {});
  }, []);

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const highPriorityTasks = pendingTasks.filter(t => t.userPriority === 'high');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-workspace-card to-workspace-card border border-indigo-900/40 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Welcome to your Focused Workspace</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Workflow AI keeps your daily commitments, notes, and task priorities in one place without constant app switching.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('tasks')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>View Tasks</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
            <CheckSquare size={20} />
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 font-medium">Pending Tasks</span>
            <div className="text-lg font-bold text-zinc-100">{pendingTasks.length}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/40">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 font-medium">High Priority</span>
            <div className="text-lg font-bold text-zinc-100">{highPriorityTasks.length}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 font-medium">Total Notes</span>
            <div className="text-lg font-bold text-zinc-100">{notes.length}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <Mail size={20} />
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 font-medium">Google Status</span>
            <div className="text-xs font-semibold text-emerald-400">
              {integration?.connected ? 'Read-Only Active' : 'Disconnected'}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Priority Tasks & Recent Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks Card */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={14} className="text-indigo-400" />
                Active Priorities
              </h3>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {pendingTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                >
                  <span className="truncate text-zinc-200 font-medium">{task.title}</span>
                  <Badge
                    variant={
                      task.userPriority === 'high'
                        ? 'danger'
                        : task.userPriority === 'medium'
                        ? 'warning'
                        : 'success'
                    }
                    className="text-[10px]"
                  >
                    {task.userPriority}
                  </Badge>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className="text-xs text-zinc-500 py-6 text-center">No pending tasks.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Recent Notes Card */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-400" />
                Recent Notes
              </h3>
              <button
                onClick={() => onNavigate('notes')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {notes.slice(0, 4).map((note) => (
                <div
                  key={note.id}
                  onClick={() => onNavigate('notes')}
                  className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <span className="truncate text-zinc-200 font-medium">{note.title}</span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-zinc-500 py-6 text-center">No notes found.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

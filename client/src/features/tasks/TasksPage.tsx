import React, { useState, useEffect } from 'react';
import { api, Task } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Trash2,
  Calendar,
  Filter,
  Check,
  X,
  Cpu,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(30);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const res = await api.updateTask(task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
    } catch {
      alert('Failed to update task status');
    }
  };

  const handleOverridePriority = async (task: Task, newPriority: 'low' | 'medium' | 'high') => {
    try {
      const res = await api.updateTask(task.id, { userPriority: newPriority });
      setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
    } catch {
      alert('Failed to override priority');
    }
  };

  const handleRefreshModelPriority = async (taskId: string) => {
    try {
      const res = await api.refreshPriority(taskId);
      setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
    } catch {
      alert('Failed to refresh priority prediction');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      alert('Failed to delete task');
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await api.createTask({
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        userPriority: newTaskPriority,
        dueAt: newTaskDue ? new Date(newTaskDue).toISOString() : null,
        estimatedMinutes: Number(newTaskDuration),
        status: 'todo',
        sourceType: 'manual',
      });
      setTasks([res.task, ...tasks]);
      setShowCreateModal(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDue('');
      setNewTaskDuration(30);
    } catch {
      alert('Failed to create task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter !== 'all' && t.userPriority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Filter and Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        {/* Status Filter Segmented Control */}
        <div className="flex items-center p-1 rounded-xl bg-[#12131b] border border-white/[0.06] select-none">
          {(['all', 'todo', 'in_progress', 'done'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {st === 'all' ? 'All Tasks' : st === 'in_progress' ? 'In Progress' : st.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Priority Filter Dropdown + Add Task */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12131b] border border-white/[0.06] text-xs text-zinc-400">
            <Filter size={13} className="text-zinc-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#12131b]">All Priorities</option>
              <option value="high" className="bg-[#12131b]">High Priority</option>
              <option value="medium" className="bg-[#12131b]">Medium Priority</option>
              <option value="low" className="bg-[#12131b]">Low Priority</option>
            </select>
          </div>

          <Button size="sm" variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> New Task
          </Button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-xs bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6">
            No tasks match your selected filter. Create a new task to get started!
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            const hasOverride = task.userPriority !== task.predictedPriority;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 bg-[#12131b] ${
                  isDone
                    ? 'border-white/[0.04] opacity-50 bg-[#0f1016]'
                    : 'border-white/[0.07] hover:border-white/[0.16] hover:bg-[#161723] shadow-md'
                }`}
              >
                {/* Complete Status Checkbox */}
                <button
                  onClick={() => handleToggleStatus(task)}
                  className="mt-0.5 text-zinc-500 hover:text-indigo-400 transition-colors shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 size={19} className="text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Circle size={19} />
                  )}
                </button>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3
                      className={`text-xs font-semibold text-white tracking-tight ${
                        isDone ? 'line-through text-zinc-500' : ''
                      }`}
                    >
                      {task.title}
                    </h3>

                    {/* Priority Badge */}
                    <Badge
                      variant={
                        task.userPriority === 'high'
                          ? 'danger'
                          : task.userPriority === 'medium'
                          ? 'warning'
                          : 'success'
                      }
                      dot
                      className="text-[10px]"
                    >
                      {task.userPriority.toUpperCase()}
                    </Badge>

                    {/* Model prediction tag vs manual override */}
                    {hasOverride ? (
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        Manual Override (ML predicted: {task.predictedPriority})
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Cpu size={11} className="text-indigo-400" />
                        Random Forest: {(task.priorityScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-500 flex-wrap">
                    {task.dueAt && (
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Calendar size={12} className="text-indigo-400" />
                        Due {new Date(task.dueAt).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Clock size={12} className="text-zinc-500" />
                      {task.estimatedMinutes} mins
                    </span>
                    {task.sourceType !== 'manual' && (
                      <span className="text-indigo-400/90 text-[10px] font-mono bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                        Source: {task.sourceType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Task Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Priority selector override */}
                  <select
                    value={task.userPriority}
                    onChange={(e) =>
                      handleOverridePriority(task, e.target.value as 'low' | 'medium' | 'high')
                    }
                    className="bg-[#181926] border border-white/[0.08] text-zinc-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                    title="Change priority override"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <button
                    onClick={() => handleRefreshModelPriority(task.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-white/[0.06] transition-colors"
                    title="Re-run Random Forest priority prediction"
                  >
                    <Sparkles size={14} />
                  </button>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#12131b] border border-white/[0.12] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" /> Create Workspace Task
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 text-[11px] font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be accomplished?"
                  className="w-full bg-[#181926] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] font-medium mb-1">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Optional context, references, or instructions..."
                  className="w-full bg-[#181926] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none h-20 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) =>
                      setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')
                    }
                    className="w-full bg-[#181926] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1">Estimated Duration</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-full bg-[#181926] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="w-full bg-[#181926] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api, Task } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const handleOverridePriority = async (task: Task, newPriority: 'low' | 'medium' | 'high') => {
    try {
      const res = await api.updateTask(task.id, { userPriority: newPriority });
      setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
    } catch (err) {
      alert('Failed to override priority');
    }
  };

  const handleRefreshModelPriority = async (taskId: string) => {
    try {
      const res = await api.refreshPriority(taskId);
      setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
    } catch (err) {
      alert('Failed to refresh priority prediction');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
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
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter !== 'all' && t.userPriority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col gap-5 max-w-5xl mx-auto">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-workspace-border">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'todo', 'in_progress', 'done'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-workspace-card text-zinc-400 hover:text-zinc-200 border border-workspace-border'
              }`}
            >
              {st === 'all' ? 'All Tasks' : st.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Priority Filter + New Task Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Filter size={14} />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-workspace-card border border-workspace-border text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <Button size="sm" variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Add Task
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs">
            No tasks match your active filters. Create a new task!
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            const hasOverride = task.userPriority !== task.predictedPriority;

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-lg border transition-all flex items-start gap-3 bg-workspace-card ${
                  isDone
                    ? 'border-workspace-border/50 opacity-60'
                    : 'border-workspace-border hover:border-zinc-700'
                }`}
              >
                {/* Complete checkbox */}
                <button
                  onClick={() => handleToggleStatus(task)}
                  className="mt-0.5 text-zinc-400 hover:text-indigo-400 transition-colors"
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <Circle size={18} />
                  )}
                </button>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-xs font-medium text-zinc-100 ${
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
                      className="text-[10px]"
                    >
                      {task.userPriority.toUpperCase()}
                    </Badge>

                    {/* Model prediction tag vs manual override */}
                    {hasOverride ? (
                      <span className="text-[10px] text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                        Manual Override (Model predicted: {task.predictedPriority})
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Sparkles size={10} className="text-indigo-400" />
                        ML Score: {(task.priorityScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-500 flex-wrap">
                    {task.dueAt && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Calendar size={12} className="text-indigo-400" />
                        Due: {new Date(task.dueAt).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {task.estimatedMinutes} mins
                    </span>
                    {task.sourceType !== 'manual' && (
                      <span className="text-indigo-400/80">
                        From: {task.sourceType}
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
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] rounded px-1.5 py-1 focus:outline-none"
                    title="Change priority override"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <button
                    onClick={() => handleRefreshModelPriority(task.id)}
                    className="p-1 rounded text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800"
                    title="Recalculate AI Priority"
                  >
                    <Sparkles size={14} />
                  </button>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-workspace-card border border-workspace-border rounded-lg max-w-md w-full p-5 shadow-2xl">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Optional details or context..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) =>
                      setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-workspace-border">
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

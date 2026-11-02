import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Trash2, Edit3, CheckCircle2, Clock, AlertTriangle,
  Sparkles, RefreshCw, X, Check
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Task, TaskPriority, TaskCategory, TaskStatus } from '../../types/index.ts';

export const TasksView: React.FC<{ isCreateOpen: boolean; onCloseCreate: () => void }> = ({
  isCreateOpen,
  onCloseCreate
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Create / Edit modal states
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('project');
  const [userPriority, setUserPriority] = useState<TaskPriority>('medium');
  const [dueAt, setDueAt] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await api.createTask({
        title,
        description,
        category,
        userPriority,
        dueAt: dueAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        estimatedMinutes
      });
      setTasks(prev => [res.task, ...prev]);
      resetForm();
      onCloseCreate();
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || submitting) return;

    setSubmitting(true);
    try {
      const res = await api.updateTask(editingTask.id, {
        title,
        description,
        category,
        userPriority,
        dueAt: dueAt || editingTask.dueAt,
        estimatedMinutes
      });
      setTasks(prev => prev.map(t => (t.id === editingTask.id ? res.task : t)));
      setEditingTask(null);
      resetForm();
    } catch (err: any) {
      alert(`Error updating task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const res = await api.updateTask(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => (t.id === task.id ? res.task : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRepredict = async (id: string) => {
    try {
      const res = await api.repredictPriority(id);
      setTasks(prev => prev.map(t => (t.id === id ? res.task : t)));
      alert(`Updated priority score: ${res.task.priorityScore} (${res.task.predictedPriority.toUpperCase()})\n\n${res.mlRationale}`);
    } catch (e: any) {
      alert(`Error re-predicting priority: ${e.message}`);
    }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setUserPriority(task.userPriority);
    setDueAt(task.dueAt ? task.dueAt.slice(0, 16) : '');
    setEstimatedMinutes(task.estimatedMinutes);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('project');
    setUserPriority('medium');
    setDueAt('');
    setEstimatedMinutes(60);
  };

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.userPriority !== priorityFilter && t.predictedPriority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-100 flex items-center gap-2">
            Tasks &amp; Prioritization
            <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal-800 text-charcoal-400 font-mono">
              {filteredTasks.length}
            </span>
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Priorities predicted by Random Forest ML classifier with continuous learning adaptation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              onCloseCreate();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-3.5 rounded-xl bg-charcoal-900 border border-charcoal-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-charcoal-500 ml-1" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks by title or keyword..."
            className="w-full bg-transparent border-none text-charcoal-200 placeholder-charcoal-500 focus:outline-none text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-300 focus:border-brand-500"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-300 focus:border-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-300 focus:border-brand-500"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="project">Project</option>
            <option value="administrative">Administrative</option>
            <option value="personal">Personal</option>
          </select>

          <button
            onClick={loadTasks}
            title="Refresh"
            className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-12 text-center text-xs text-charcoal-400 italic">
            Loading tasks and priority models...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-charcoal-900 border border-charcoal-800 text-xs text-charcoal-500 space-y-2">
            <p>No tasks match your current filter criteria.</p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
                setSearch('');
              }}
              className="text-brand-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition ${
                task.status === 'done'
                  ? 'bg-charcoal-950/40 border-charcoal-900 opacity-60'
                  : 'bg-charcoal-900 border-charcoal-800 hover:border-charcoal-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      task.status === 'done'
                        ? 'bg-emerald-500 border-emerald-500 text-charcoal-950'
                        : 'border-charcoal-700 bg-charcoal-800 hover:border-brand-500'
                    }`}
                  >
                    {task.status === 'done' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <div>
                    <h3
                      className={`text-xs font-semibold ${
                        task.status === 'done'
                          ? 'line-through text-charcoal-500'
                          : 'text-charcoal-100'
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-[11px] text-charcoal-400 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-charcoal-400">
                      <span className="px-1.5 py-0.5 rounded bg-charcoal-800 text-charcoal-300 capitalize font-medium">
                        {task.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimatedMinutes}m duration
                      </span>
                      <span>•</span>
                      <span className={task.isOverdue && task.status !== 'done' ? 'text-rose-400 font-semibold' : ''}>
                        Due: {new Date(task.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {task.sourceType !== 'manual' && (
                        <>
                          <span>•</span>
                          <span className="text-brand-400 capitalize">via {task.sourceType}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Badges & Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* ML Priority Score Badge */}
                  <div
                    title="Random Forest ML Priority Score (0-100)"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-charcoal-800 border border-charcoal-700 text-[11px]"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-charcoal-400">Score:</span>
                    <span className="font-mono font-bold text-charcoal-200">
                      {task.priorityScore}
                    </span>
                  </div>

                  {/* Predicted vs User Priority Badge */}
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg border ${
                      task.predictedPriority === 'high'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : task.predictedPriority === 'medium'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    ML: {task.predictedPriority}
                  </span>

                  {task.userPriority !== task.predictedPriority && (
                    <span
                      title="User Override Applied"
                      className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    >
                      Override: {task.userPriority}
                    </span>
                  )}

                  {/* Action buttons */}
                  <button
                    onClick={() => handleRepredict(task.id)}
                    title="Re-run Random Forest priority prediction"
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-brand-400 hover:bg-charcoal-800 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(task)}
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-rose-400 hover:bg-charcoal-800 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {(isCreateOpen || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-charcoal-900 border border-charcoal-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
              <h2 className="text-sm font-bold text-charcoal-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                {editingTask ? 'Edit Workspace Task' : 'Create Task (ML Prioritized)'}
              </h2>
              <button
                onClick={() => {
                  setEditingTask(null);
                  onCloseCreate();
                }}
                className="text-charcoal-400 hover:text-charcoal-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-charcoal-400 mb-1 font-medium">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Complete Assignment 3 for Prof. Sajal Mitra"
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-100 placeholder-charcoal-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-charcoal-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Task details and deliverables..."
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-100 placeholder-charcoal-500 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-charcoal-400 mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-200 focus:border-brand-500"
                  >
                    <option value="academic">Academic</option>
                    <option value="project">Project</option>
                    <option value="administrative">Administrative</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-charcoal-400 mb-1 font-medium">User Priority</label>
                  <select
                    value={userPriority}
                    onChange={e => setUserPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-200 focus:border-brand-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-charcoal-400 mb-1 font-medium">Due Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={dueAt}
                    onChange={e => setDueAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-200 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-charcoal-400 mb-1 font-medium">Estimated Duration (mins)</label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-200 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-charcoal-800/60 border border-charcoal-700/80 text-[11px] text-charcoal-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>
                  The Random Forest model evaluates hours to deadline, available calendar time, and workload to assign priority score upon saving.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    onCloseCreate();
                  }}
                  className="px-4 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-md shadow-brand-500/20"
                >
                  {submitting ? 'Evaluating...' : editingTask ? 'Save Changes' : 'Create & Predict Priority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

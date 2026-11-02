import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Sparkles, Plus, BookOpen, FileText, Bell, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Task, CalendarEvent, DailyPlan, Reminder } from '../../types/index.ts';

interface DashboardProps {
  onNavigate: (view: string) => void;
  onOpenCreateTask: () => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ onNavigate, onOpenCreateTask }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [tasksRes, eventsRes, remRes] = await Promise.all([
        api.getTasks(),
        api.getCalendarEvents(),
        api.getReminders()
      ]);
      setTasks(tasksRes.tasks || []);
      setEvents(eventsRes.events || []);
      setReminders(remRes.reminders || []);

      const todayStr = new Date().toISOString().split('T')[0];
      const planRes = await api.getDailyPlan(todayStr);
      setPlan(planRes.plan || null);
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await api.updateTask(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, status: newStatus } : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const completedToday = tasks.filter(t => t.status === 'done');
  const overdueTasks = tasks.filter(t => t.isOverdue && t.status !== 'done');
  const highPriorityTasks = pendingTasks.filter(t => t.predictedPriority === 'high' || t.userPriority === 'high');

  return (
    <div className="space-y-6">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-charcoal-900 via-charcoal-850 to-charcoal-900 border border-charcoal-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            AI Workspace • HITK CSBS
          </span>
          <h1 className="text-2xl font-bold text-charcoal-100 mt-1">
            Welcome back, Vinayak
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            You have <strong className="text-charcoal-200">{pendingTasks.length} pending tasks</strong> and{' '}
            <strong className="text-charcoal-200">{events.length} calendar meetings</strong> scheduled today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
          <button
            onClick={() => onNavigate('notes')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 text-xs font-semibold border border-charcoal-700 transition"
          >
            <BookOpen className="w-4 h-4" />
            New Note
          </button>
          <button
            onClick={loadDashboardData}
            title="Refresh"
            className="p-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 border border-charcoal-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overdue / Critical Reminder Alert Banner */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <p className="text-xs font-semibold text-rose-200">
                {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''} Detected
              </p>
              <p className="text-[11px] text-rose-300/80">
                Action required: Prioritized focus recommended before working on new tasks.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs font-semibold text-rose-400 hover:underline flex items-center gap-1"
          >
            Review Tasks <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800">
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-xs font-medium">Pending Tasks</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-charcoal-100 mt-2">{pendingTasks.length}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Across 4 categories</p>
        </div>

        <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800">
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-xs font-medium">High Priority (ML)</span>
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-brand-400 mt-2">{highPriorityTasks.length}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Random Forest score &gt; 60</p>
        </div>

        <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800">
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-xs font-medium">Fixed Meetings</span>
            <Calendar className="w-4 h-4 text-brand-accent" />
          </div>
          <p className="text-2xl font-bold text-charcoal-100 mt-2">{events.length}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Google Calendar (read-only)</p>
        </div>

        <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800">
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{completedToday.length}</p>
          <p className="text-[11px] text-charcoal-500 mt-1">Continuous learning updated</p>
        </div>
      </div>

      {/* Main Grid: Agenda & Priority Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Priority Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-300">
              High Priority Tasks
            </h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-brand-400 hover:underline flex items-center gap-1 font-medium"
            >
              View All ({tasks.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {highPriorityTasks.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-charcoal-900/60 border border-charcoal-800 text-charcoal-400 text-xs">
                No high-priority tasks pending right now.
              </div>
            ) : (
              highPriorityTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => handleToggleTask(task)}
                      className="w-4 h-4 rounded border-charcoal-700 bg-charcoal-800 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-charcoal-100">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-charcoal-400">
                        <span className="px-1.5 py-0.5 rounded bg-charcoal-800 text-charcoal-300 capitalize">
                          {task.category}
                        </span>
                        <span>•</span>
                        <span>Due: {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{task.estimatedMinutes}m duration</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                      ML Score: {task.priorityScore}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold uppercase">
                      {task.predictedPriority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Daily Schedule Plan Card */}
          {plan && plan.blocks.length > 0 && (
            <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-200">
                    Today's Optimized Schedule Plan
                  </h3>
                </div>
                <span className="text-[11px] text-charcoal-400">
                  {plan.totalWorkMinutes}m Focus • {plan.totalBreakMinutes}m Breaks
                </span>
              </div>

              <div className="space-y-2">
                {plan.blocks.slice(0, 4).map(block => (
                  <div
                    key={block.id}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      block.kind === 'fixed_event_reference'
                        ? 'bg-charcoal-850/80 border-charcoal-700 text-charcoal-300'
                        : block.kind === 'break'
                        ? 'bg-charcoal-900/40 border-dashed border-charcoal-700 text-charcoal-400'
                        : 'bg-brand-950/30 border-brand-500/30 text-brand-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-charcoal-400">
                        {new Date(block.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-medium">{block.title}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-400">
                      {block.durationMinutes} min
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('calendar')}
                className="w-full py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-xs font-medium text-charcoal-300 transition"
              >
                Open Full Schedule & Free Time Analysis
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Calendar Agenda & Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-300">
              Today's Agenda
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-400">
              Read-Only
            </span>
          </div>

          <div className="space-y-2.5">
            {events.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-charcoal-900 border border-charcoal-800 text-xs text-charcoal-500">
                No calendar events today.
              </div>
            ) : (
              events.map(ev => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-charcoal-200">{ev.title}</span>
                    <span className="text-[10px] text-brand-accent font-mono">
                      {new Date(ev.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-400">
                    {ev.calendarName} • {ev.location || 'Google Meet'}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Quick Capture Card */}
          <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-300">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={onOpenCreateTask}
                className="p-2.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 text-left border border-charcoal-700 transition"
              >
                + Add Task
              </button>
              <button
                onClick={() => onNavigate('documents')}
                className="p-2.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 text-left border border-charcoal-700 transition"
              >
                + Upload Doc
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Sparkles, Plus, BookOpen, FileText, Bell, RefreshCw, Search, Paperclip,
  ChevronDown, ArrowUp, Activity, MoreVertical, Globe, File, Video,
  Check, CheckSquare, Lock
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
  const [prompt, setPrompt] = useState('');
  const [modelSelected, setModelSelected] = useState('Random Forest (ML)');
  const [prompting, setPrompting] = useState(false);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);

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

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || prompting) return;

    setPrompting(true);
    setAiResponseText(null);
    try {
      const res = await api.chatAssistant(prompt);
      setAiResponseText(res.answer);
      if (res.proposals && res.proposals.length > 0) {
        // Refresh tasks
        const tRes = await api.getTasks();
        setTasks(tRes.tasks || []);
      }
    } catch (err: any) {
      setAiResponseText(`Error: ${err.message}`);
    } finally {
      setPrompting(false);
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

  const topPrioritizedTasks = [...pendingTasks]
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .slice(0, 3);

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.endAt) >= now);
  const nextEvent = upcomingEvents[0] || events[0] || null;
  const nextPlanBlock = plan?.blocks?.find(b => new Date(b.endAt) >= now) || plan?.blocks?.[0] || null;

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* HERO SECTION - Streamlined compact height to prevent vertical scrolling   */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-4 md:py-4 md:px-6 border transition-all duration-300
        bg-gradient-to-br from-[#ffffff] via-[#f8faff] to-[#edf3ff] 
        dark:bg-gradient-to-br dark:from-charcoal-900 dark:via-charcoal-850 dark:to-charcoal-900 
        border-slate-200/80 dark:border-charcoal-800 shadow-md shadow-slate-200/30 dark:shadow-none">
        
        {/* Soft Ambient Glows behind Art */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-400/15 dark:bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 right-10 w-60 h-60 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 dark:text-charcoal-400">
                AI Workspace
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue dark:bg-brand-400"></span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-charcoal-500">HITK CSBS</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-charcoal-100 leading-tight">
              Turn ideas{' '}
              <span className="font-serif italic font-normal text-slate-800 dark:text-charcoal-100 tracking-normal">
                into momentum.
              </span>
            </h1>

            <p className="text-xs text-slate-500 dark:text-charcoal-400 max-w-lg leading-relaxed line-clamp-1">
              Consolidate tasks, deterministic calendar schedules, and extractive document insights with an adaptive Random Forest ML core.
            </p>
          </div>

          {/* Right Fluid 3D Wave Art & Compact Status Card */}
          <div className="lg:col-span-5 relative flex flex-row items-center justify-end gap-3">
            {/* Compact Floating Model Status Card */}
            <div className="p-2.5 rounded-2xl 
              bg-white/85 dark:bg-charcoal-900/90 backdrop-blur-md border border-white/90 dark:border-charcoal-800 
              shadow-sm space-y-1.5 text-[11px] shrink-0">
              
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 dark:text-charcoal-100">
                <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                <span>Analyzing request...</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-charcoal-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Context
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-brand-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span> RF Active
                </span>
              </div>
            </div>

            {/* Compact Fluid Translucent Ribbon Art Illustration */}
            <div className="relative w-[120px] h-[85px] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-md">
                <defs>
                  <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="ribbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glassBlur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Back Fluid Loop */}
                <path
                  d="M 50 180 C 100 80, 200 60, 290 120 C 360 170, 340 260, 260 250 C 180 240, 140 160, 220 130 C 300 100, 350 20, 250 10 C 170 0, 100 80, 50 180 Z"
                  fill="url(#ribbonGrad1)"
                  filter="url(#glassBlur)"
                  opacity="0.8"
                />

                {/* Front Fluid Ribbon with Specular Curve */}
                <path
                  d="M 80 200 C 140 100, 230 90, 310 150 C 380 200, 320 280, 240 260 C 170 240, 150 180, 210 150 C 270 120, 310 50, 240 30 C 180 10, 120 100, 80 200 Z"
                  fill="url(#ribbonGrad2)"
                  opacity="0.9"
                />

                {/* Specular Highlight Streak */}
                <path
                  d="M 120 180 C 180 110, 250 120, 300 170 C 270 210, 220 200, 190 180 C 150 150, 130 170, 120 180 Z"
                  fill="white"
                  opacity="0.45"
                />
              </svg>

              {/* Pill Badge: AI Online */}
              <div className="absolute bottom-1 right-0 flex items-center gap-1 px-2 py-0.5 rounded-full 
                bg-white/90 dark:bg-charcoal-800/90 backdrop-blur-md border border-white/60 dark:border-charcoal-700 
                shadow-sm text-[9px] font-semibold text-slate-800 dark:text-charcoal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span>AI online</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SLEEK FLOATING PROMPT CAPSULE (Compact)                                    */}
        {/* ========================================================================= */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-charcoal-800/80">
          <form
            onSubmit={handlePromptSubmit}
            className="p-2 px-3.5 rounded-2xl 
              bg-white/95 dark:bg-charcoal-900 border border-slate-200/90 dark:border-charcoal-700 
              shadow-md shadow-slate-200/40 dark:shadow-none space-y-1.5"
          >
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ask anything, create, analyze or brainstorm..."
              className="w-full px-2 py-1 bg-transparent text-xs text-slate-900 dark:text-charcoal-100 placeholder-slate-400 dark:placeholder-charcoal-500 focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-charcoal-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenCreateTask}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-slate-700 dark:text-charcoal-200 flex items-center justify-center transition"
                  title="Add attachment"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('tasks')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-slate-700 dark:text-charcoal-300 text-[11px] font-medium transition"
                >
                  <Globe className="w-3 h-3 text-slate-500 dark:text-charcoal-400" />
                  <span>Tasks</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('documents')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-slate-700 dark:text-charcoal-300 text-[11px] font-medium transition"
                >
                  <Paperclip className="w-3 h-3 text-slate-500 dark:text-charcoal-400" />
                  <span>Attach</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Model Selector Dropdown */}
                <div className="relative">
                  <select
                    value={modelSelected}
                    onChange={e => setModelSelected(e.target.value)}
                    className="appearance-none pl-2.5 pr-6 py-1 rounded-full bg-slate-100 dark:bg-charcoal-800 text-[11px] font-semibold text-slate-800 dark:text-charcoal-200 border border-slate-200/80 dark:border-charcoal-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Random Forest (ML)">✦ Random Forest (ML)</option>
                    <option value="GPT-4o (Reasoning)">✦ GPT-4o (Reasoning)</option>
                    <option value="Extractive NLP">✦ Extractive NLP</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-500 dark:text-charcoal-400 absolute right-2 top-2 pointer-events-none" />
                </div>

                {/* Dark circular submit button with Up-Arrow */}
                <button
                  type="submit"
                  disabled={prompting || !prompt.trim()}
                  className="w-7 h-7 rounded-full bg-slate-900 dark:bg-charcoal-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-charcoal-950 flex items-center justify-center transition shadow-xs disabled:opacity-40"
                >
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </form>

          {/* AI Response Output if prompt submitted */}
          {aiResponseText && (
            <div className="mt-2.5 p-3 rounded-2xl bg-white dark:bg-charcoal-900 border border-blue-200 dark:border-charcoal-700 text-xs text-slate-800 dark:text-charcoal-200 shadow-md space-y-1.5">
              <div className="flex items-center justify-between text-blue-600 dark:text-brand-400 font-bold uppercase text-[10px] tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Response from {modelSelected}
                </span>
                <button onClick={() => setAiResponseText(null)} className="text-slate-400 hover:text-slate-600">Dismiss</button>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{aiResponseText}</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 FEATURE CARDS (SUMMARIZE, GENERATE, ANALYZE) & RECENT ACTIVITY           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left 3 Feature Cards (8 Cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: SUMMARIZE */}
          <div
            onClick={() => onNavigate('documents')}
            className="group p-3.5 rounded-2xl cursor-pointer transition-all duration-200
              bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 
              hover:border-blue-400/80 dark:hover:border-charcoal-700 shadow-sm hover:shadow-md 
              flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-500 dark:text-charcoal-400 uppercase">
                  <FileText className="w-3 h-3 text-blue-500" />
                  Summarize
                </span>
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-charcoal-800 group-hover:bg-blue-500 group-hover:text-white text-slate-600 dark:text-charcoal-400 flex items-center justify-center text-xs transition">
                  →
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-charcoal-100 mt-2 leading-snug">
                Turn long content <span className="font-serif italic font-normal text-slate-700 dark:text-charcoal-200">into clear insights.</span>
              </h3>
            </div>

            <div className="flex items-center gap-1 pt-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-[9px] font-semibold text-slate-600 dark:text-charcoal-300">
                PDF
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-[9px] font-semibold text-slate-600 dark:text-charcoal-300">
                Notes
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-[9px] font-semibold text-slate-600 dark:text-charcoal-300">
                Article
              </span>
            </div>
          </div>

          {/* Card 2: GENERATE */}
          <div
            onClick={() => onNavigate('calendar')}
            className="group p-3.5 rounded-2xl cursor-pointer transition-all duration-200
              bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 
              hover:border-blue-400/80 dark:hover:border-charcoal-700 shadow-sm hover:shadow-md 
              flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-500 dark:text-charcoal-400 uppercase">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Generate
                </span>
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-charcoal-800 group-hover:bg-indigo-500 group-hover:text-white text-slate-600 dark:text-charcoal-400 flex items-center justify-center text-xs transition">
                  →
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-charcoal-100 mt-2 leading-snug">
                Create content that <span className="font-serif italic font-normal text-slate-700 dark:text-charcoal-200">fits your goals.</span>
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1 pt-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-[9px] font-semibold text-slate-600 dark:text-charcoal-300">
                Daily Plan
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-[9px] font-semibold text-slate-600 dark:text-charcoal-300">
                Tasks
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-[9px] font-semibold text-slate-600 dark:text-charcoal-300">
                Email
              </span>
            </div>
          </div>

          {/* Card 3: ANALYZE with Sparkline Chart */}
          <div
            onClick={() => onNavigate('tasks')}
            className="group p-3.5 rounded-2xl cursor-pointer transition-all duration-200
              bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 
              hover:border-blue-400/80 dark:hover:border-charcoal-700 shadow-sm hover:shadow-md 
              flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-500 dark:text-charcoal-400 uppercase">
                  <Activity className="w-3 h-3 text-blue-600" />
                  Analyze
                </span>
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-charcoal-800 group-hover:bg-blue-600 group-hover:text-white text-slate-600 dark:text-charcoal-400 flex items-center justify-center text-xs transition">
                  →
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-charcoal-100 mt-2 leading-snug">
                Find patterns and <span className="font-serif italic font-normal text-slate-700 dark:text-charcoal-200">opportunities.</span>
              </h3>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-sans">
                +12%
              </span>
              {/* Smooth Blue Sparkline Waveform */}
              <svg className="w-20 h-5" viewBox="0 0 100 30" fill="none">
                <path
                  d="M0 25 C 20 25, 30 18, 45 15 C 60 12, 70 20, 85 8 C 92 4, 98 6, 100 5"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="2 3"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: "Recent activity" Card (4 Cols) */}
        <div className="lg:col-span-4 p-3.5 rounded-2xl 
          bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 
          shadow-sm space-y-2.5">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-charcoal-100">
              Recent activity
            </h3>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-[10px] font-semibold text-blue-600 dark:text-brand-400 hover:underline"
            >
              See all
            </button>
          </div>

          <div className="space-y-2">
            {/* Activity 1 */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-200 to-orange-300 dark:from-amber-600/30 dark:to-orange-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="truncate">
                  <h4 className="font-semibold text-slate-800 dark:text-charcoal-100 truncate text-[11px]">
                    CBS3293 Lecture Slides
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-charcoal-500">2 hours ago</p>
                </div>
              </div>
              <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>

            {/* Activity 2 */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-200 to-pink-300 dark:from-rose-600/30 dark:to-pink-500/30 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-rose-700 dark:text-rose-300" />
                </div>
                <div className="truncate">
                  <h4 className="font-semibold text-slate-800 dark:text-charcoal-100 truncate text-[11px]">
                    Random Forest Evaluation
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-charcoal-500">5 hours ago</p>
                </div>
              </div>
              <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>

            {/* Activity 3 */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-200 to-teal-300 dark:from-emerald-600/30 dark:to-teal-500/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="truncate">
                  <h4 className="font-semibold text-slate-800 dark:text-charcoal-100 truncate text-[11px]">
                    Prof. Sajal Mitra Notes
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-charcoal-500">1 day ago</p>
                </div>
              </div>
              <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TODAY'S QUICK METRIC PILLS                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          onClick={() => onNavigate('tasks')}
          className="p-3.5 rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 shadow-sm hover:border-blue-400 dark:hover:border-charcoal-700 transition flex items-center gap-3 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-brand-600/15 text-blue-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-brand-500/20">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-lg font-bold text-slate-900 dark:text-charcoal-100 block leading-tight font-sans">
              {pendingTasks.length}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-charcoal-400 group-hover:text-blue-600 dark:group-hover:text-brand-400 transition truncate block">
              Tasks Due
            </span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('tasks')}
          className="p-3.5 rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 shadow-sm hover:border-amber-400 dark:hover:border-charcoal-700 transition flex items-center gap-3 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-lg font-bold text-slate-900 dark:text-charcoal-100 block leading-tight font-sans">
              {highPriorityTasks.length}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-charcoal-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition truncate block">
              High ML Priority
            </span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('calendar')}
          className="p-3.5 rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 shadow-sm hover:border-indigo-400 dark:hover:border-charcoal-700 transition flex items-center gap-3 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-lg font-bold text-slate-900 dark:text-charcoal-100 block leading-tight font-sans">
              {events.length}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-charcoal-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate block">
              Meetings Today
            </span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('tasks')}
          className="p-3.5 rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 shadow-sm hover:border-emerald-400 dark:hover:border-charcoal-700 transition flex items-center gap-3 text-left group"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            overdueTasks.length > 0
              ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
              : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
          }`}>
            {overdueTasks.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="truncate">
            <span className={`text-lg font-bold block leading-tight font-sans ${overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-charcoal-100'}`}>
              {overdueTasks.length > 0 ? overdueTasks.length : '0'}
            </span>
            <span className={`text-[11px] font-medium transition truncate block ${overdueTasks.length > 0 ? 'text-rose-500' : 'text-slate-500 dark:text-charcoal-400 group-hover:text-emerald-600'}`}>
              {overdueTasks.length > 0 ? 'Overdue Deadlines' : 'All Deadlines On Track'}
            </span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. NEXT UP SCHEDULE & 3. TOP 3 PRIORITIZED TASKS                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3. Top 3 Prioritized Tasks (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-charcoal-100">
                Top Prioritized Tasks
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-brand-600/15 text-blue-600 dark:text-brand-400 font-semibold border border-blue-100 dark:border-brand-500/30">
                Random Forest ML
              </span>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-blue-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View all ({tasks.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topPrioritizedTasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-charcoal-950/40 border border-slate-200/60 dark:border-charcoal-800 text-xs text-slate-500 dark:text-charcoal-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
                <p className="font-medium text-slate-700 dark:text-charcoal-300">You're all caught up!</p>
                <p className="text-[11px]">No pending tasks remaining in your workspace.</p>
                <button
                  onClick={onOpenCreateTask}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Task
                </button>
              </div>
            ) : (
              topPrioritizedTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-charcoal-850/60 border border-slate-200/80 dark:border-charcoal-800 hover:border-slate-300 dark:hover:border-charcoal-700 transition flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                        task.status === 'done'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-blue-500'
                      }`}
                    >
                      {task.status === 'done' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          task.status === 'done'
                            ? 'line-through text-slate-400 dark:text-charcoal-500'
                            : 'text-slate-900 dark:text-charcoal-100'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-charcoal-400">
                        <span className="px-1.5 py-0.2 rounded bg-white dark:bg-charcoal-800 text-slate-600 dark:text-charcoal-300 capitalize font-medium border border-slate-200/60 dark:border-charcoal-700">
                          {task.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimatedMinutes}m
                        </span>
                        <span>•</span>
                        <span className={task.isOverdue ? 'text-rose-500 font-semibold' : ''}>
                          Due {new Date(task.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      title="Random Forest Priority Score (0-100)"
                      className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-[10px]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-mono font-bold text-slate-800 dark:text-charcoal-200">
                        {task.priorityScore}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                        task.predictedPriority === 'high'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : task.predictedPriority === 'medium'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {task.predictedPriority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: 2. Next Up / Today's Schedule Snapshot (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-charcoal-100">
                Today's Schedule
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Read-Only
              </span>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs font-semibold text-blue-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Calendar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Next Up Highlight Card */}
          {nextEvent ? (
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-brand-950/20 border border-blue-200/80 dark:border-brand-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-semibold text-blue-700 dark:text-brand-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-brand-400" />
                  {new Date(nextEvent.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(nextEvent.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-brand-500/20 text-blue-700 dark:text-brand-300">
                  Next Up
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-charcoal-100">
                {nextEvent.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-charcoal-400">
                {nextEvent.calendarName} • {nextEvent.location || 'Google Meet (Virtual)'}
              </p>
            </div>
          ) : nextPlanBlock ? (
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-brand-950/20 border border-blue-200/80 dark:border-brand-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-semibold text-blue-700 dark:text-brand-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-brand-400" />
                  {new Date(nextPlanBlock.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(nextPlanBlock.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-brand-500/20 text-blue-700 dark:text-brand-300">
                  Focus Block
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-charcoal-100">
                {nextPlanBlock.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-charcoal-400">
                {nextPlanBlock.reason}
              </p>
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-charcoal-950/40 border border-slate-200/60 dark:border-charcoal-800 text-xs text-slate-500 dark:text-charcoal-500 space-y-1">
              <p className="font-medium text-slate-700 dark:text-charcoal-300">No scheduled events right now</p>
              <p className="text-[11px]">Your calendar is clear for free deep work blocks.</p>
            </div>
          )}

          {/* Quick Schedule Preview List */}
          {events.length > 1 && (
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-charcoal-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-charcoal-500 block">
                Later Today
              </span>
              {events.slice(1, 3).map(ev => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-charcoal-850/50 border border-slate-200/60 dark:border-charcoal-800 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-slate-800 dark:text-charcoal-200 truncate block">
                      {ev.title}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-charcoal-500">
                      {ev.location || 'Google Meet'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-charcoal-400 shrink-0">
                    {new Date(ev.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Clock, Sparkles, RefreshCw, AlertCircle,
  Coffee, CheckCircle2, ChevronLeft, ChevronRight, Lock, Check
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { CalendarEvent, DailyPlan, PlanBlock } from '../../types/index.ts';

export const CalendarView: React.FC = () => {
  const getLocalDateString = (d = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [freeBusy, setFreeBusy] = useState<any>(null);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastRegenerated, setLastRegenerated] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [selectedDate]);

  const loadCalendarData = async () => {
    setLoading(true);
    setSuccessNotice(null);
    try {
      const [eventsRes, fbRes, planRes] = await Promise.all([
        api.getCalendarEvents(),
        api.getFreeBusy(selectedDate),
        api.getDailyPlan(selectedDate)
      ]);
      setEvents(eventsRes.events || []);
      setFreeBusy(fbRes || null);
      setPlan(planRes.plan || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setSuccessNotice(null);
    try {
      // Refresh plan, free intervals, and calendar events concurrently
      const [res, fbRes, eventsRes] = await Promise.all([
        api.generateDailyPlan(selectedDate),
        api.getFreeBusy(selectedDate),
        api.getCalendarEvents(),
        new Promise(resolve => setTimeout(resolve, 500)) // Visual feedback interval
      ]);

      setPlan(res.plan);
      setFreeBusy(fbRes || null);
      setEvents(eventsRes.events || []);

      const focusCount = res.plan?.blocks?.filter(b => b.kind === 'proposed_focus').length || 0;
      const breakCount = res.plan?.blocks?.filter(b => b.kind === 'break').length || 0;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLastRegenerated(nowTime);
      setSuccessNotice(`Schedule regenerated at ${nowTime}! Allocated ${focusCount} focus blocks & ${breakCount} recovery breaks into free intervals.`);

      setTimeout(() => {
        setSuccessNotice(null);
      }, 6000);
    } catch (e: any) {
      alert(`Error generating plan: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleNavigateDay = (offsetDays: number) => {
    const current = new Date(`${selectedDate}T00:00:00`);
    current.setDate(current.getDate() + offsetDays);
    setSelectedDate(getLocalDateString(current));
  };

  const handleSetToday = () => {
    setSelectedDate(getLocalDateString());
  };

  const isToday = selectedDate === getLocalDateString();

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-charcoal-100">
              Calendar &amp; Daily Schedule
            </h1>
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <Lock className="w-2.5 h-2.5" /> Read-Only Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-charcoal-400 mt-1">
            Google Calendar events are strictly read-only. Tasks and focus blocks are scheduled into unbooked free slots.
          </p>
        </div>

        {/* Date Selector and Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Stepper */}
          <div className="flex items-center bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => handleNavigateDay(-1)}
              title="Previous Day"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-charcoal-400 dark:hover:text-charcoal-100 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSetToday}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                isToday
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-slate-600 dark:text-charcoal-300 hover:bg-slate-100 dark:hover:bg-charcoal-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleNavigateDay(1)}
              title="Next Day"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-charcoal-400 dark:hover:text-charcoal-100 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-xs text-slate-900 dark:text-charcoal-200 focus:border-brand-500 shadow-sm"
          />

          {/* Regenerate Button */}
          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Optimizing Plan...' : 'Regenerate Plan'}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Free Time & Workload Summary Card */}
      {freeBusy && (
        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-600/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-charcoal-200">
                Available Free Time: {freeBusy.totalFreeMinutes} minutes
              </span>
              <p className="text-[11px] text-slate-400 dark:text-charcoal-500 mt-0.5">
                Calculated across {freeBusy.freeSlots?.length || 0} open intervals outside calendar meetings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-charcoal-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-charcoal-700"></span>
              Google Event (Fixed)
            </span>
            <span className="flex items-center gap-1.5 ml-3">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
              Proposed Focus Block
            </span>
            <span className="flex items-center gap-1.5 ml-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Recovery Break
            </span>
          </div>
        </div>
      )}

      {/* Conflicts / Overloaded warnings */}
      {plan?.conflicts && plan.conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Scheduling Conflict Warnings:
          </div>
          {plan.conflicts.map((c, i) => (
            <p key={i} className="text-[11px] text-amber-700 dark:text-amber-300/80 pl-5">• {c}</p>
          ))}
        </div>
      )}

      {/* Schedule Timeline */}
      <div className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-charcoal-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-charcoal-300">
              Chronological Time Block Plan ({selectedDate})
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-charcoal-500 mt-0.5">
              Deterministic allocation prioritizing unbooked hours around Google Calendar
            </p>
          </div>
          {lastRegenerated && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-center flex items-center gap-1">
              <Check className="w-3 h-3" /> Last updated: {lastRegenerated}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-charcoal-500 italic flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
            <span>Computing calendar intervals and task ranking...</span>
          </div>
        ) : !plan || plan.blocks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-charcoal-500 space-y-3">
            <p>No planned schedule blocks for this date.</p>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate AI Schedule
            </button>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-charcoal-800 ml-4 space-y-4 py-2">
            {plan.blocks.map(block => {
              const isFixed = block.kind === 'fixed_event_reference';
              const isBreak = block.kind === 'break';
              const isFocus = block.kind === 'proposed_focus';

              return (
                <div key={block.id} className="relative pl-6 animate-in fade-in duration-300">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-[9px] top-3 w-4 h-4 rounded-full border-2 border-white dark:border-charcoal-900 flex items-center justify-center ${
                      isFixed
                        ? 'bg-slate-400 dark:bg-charcoal-600'
                        : isBreak
                        ? 'bg-emerald-500'
                        : 'bg-brand-500'
                    }`}
                  ></div>

                  {/* Block Card */}
                  <div
                    className={`p-4 rounded-xl border text-xs transition duration-200 ${
                      isFixed
                        ? 'bg-slate-50 dark:bg-charcoal-850/80 border-slate-200 dark:border-charcoal-700 text-slate-800 dark:text-charcoal-200'
                        : isBreak
                        ? 'bg-emerald-50/50 dark:bg-charcoal-900/50 border-emerald-200 dark:border-charcoal-800 text-emerald-800 dark:text-emerald-300 border-dashed'
                        : 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-500/30 text-slate-900 dark:text-charcoal-100 hover:border-brand-400 dark:hover:border-brand-500/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-charcoal-400">
                            {new Date(block.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {new Date(block.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                              isFixed
                                ? 'bg-slate-200 dark:bg-charcoal-800 text-slate-600 dark:text-charcoal-400 border border-slate-300 dark:border-charcoal-700'
                                : isBreak
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                            }`}
                          >
                            {isFixed ? 'Google Calendar (Fixed)' : isBreak ? 'Break' : 'Focus Time'}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-charcoal-100">{block.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-charcoal-400">{block.reason}</p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-charcoal-800 text-slate-700 dark:text-charcoal-300 text-[11px] font-mono">
                          {block.durationMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Clock, Sparkles, RefreshCw, AlertCircle,
  Coffee, CheckCircle2, ChevronLeft, ChevronRight, Lock
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { CalendarEvent, DailyPlan, PlanBlock } from '../../types/index.ts';

export const CalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [freeBusy, setFreeBusy] = useState<any>(null);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadCalendarData();
  }, [selectedDate]);

  const loadCalendarData = async () => {
    setLoading(true);
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
    try {
      const res = await api.generateDailyPlan(selectedDate);
      setPlan(res.plan);
    } catch (e: any) {
      alert(`Error generating plan: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-charcoal-100">
              Calendar &amp; Daily Schedule
            </h1>
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <Lock className="w-2.5 h-2.5" /> Read-Only Sync
            </span>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            Google Calendar events are strictly read-only. Tasks and focus blocks are scheduled into unbooked free slots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-charcoal-200 focus:border-brand-500"
          />
          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Optimizing...' : 'Regenerate Plan'}
          </button>
        </div>
      </div>

      {/* Free Time & Workload Summary Card */}
      {freeBusy && (
        <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-600/10 text-brand-400 border border-brand-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-charcoal-200">
                Available Free Time Today: {freeBusy.totalFreeMinutes} minutes
              </span>
              <p className="text-[11px] text-charcoal-500 mt-0.5">
                Calculated across {freeBusy.freeSlots?.length || 0} open intervals outside calendar meetings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-charcoal-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-charcoal-700"></span>
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
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Scheduling Conflict Warnings:
          </div>
          {plan.conflicts.map((c, i) => (
            <p key={i} className="text-[11px] text-amber-300/80 pl-5">• {c}</p>
          ))}
        </div>
      )}

      {/* Schedule Timeline */}
      <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-300">
          Chronological Time Block Plan ({selectedDate})
        </h2>

        {loading ? (
          <div className="p-12 text-center text-xs text-charcoal-500 italic">
            Computing calendar intervals and task ranking...
          </div>
        ) : !plan || plan.blocks.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-500 space-y-2">
            <p>No planned blocks for this date.</p>
            <button
              onClick={handleGeneratePlan}
              className="text-brand-400 hover:underline"
            >
              Generate AI Schedule
            </button>
          </div>
        ) : (
          <div className="relative border-l-2 border-charcoal-800 ml-4 space-y-4 py-2">
            {plan.blocks.map(block => {
              const isFixed = block.kind === 'fixed_event_reference';
              const isBreak = block.kind === 'break';
              const isFocus = block.kind === 'proposed_focus';

              return (
                <div key={block.id} className="relative pl-6">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-[9px] top-3 w-4 h-4 rounded-full border-2 border-charcoal-900 flex items-center justify-center ${
                      isFixed
                        ? 'bg-charcoal-600'
                        : isBreak
                        ? 'bg-emerald-500'
                        : 'bg-brand-500'
                    }`}
                  ></div>

                  {/* Block Card */}
                  <div
                    className={`p-4 rounded-xl border text-xs transition ${
                      isFixed
                        ? 'bg-charcoal-850/80 border-charcoal-700 text-charcoal-200'
                        : isBreak
                        ? 'bg-charcoal-900/50 border-charcoal-800 text-emerald-300 border-dashed'
                        : 'bg-brand-950/20 border-brand-500/30 text-charcoal-100 hover:border-brand-500/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-charcoal-400">
                            {new Date(block.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {new Date(block.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                              isFixed
                                ? 'bg-charcoal-800 text-charcoal-400 border border-charcoal-700'
                                : isBreak
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                            }`}
                          >
                            {isFixed ? 'Google Calendar (Fixed)' : isBreak ? 'Break' : 'Focus Time'}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-charcoal-100">{block.title}</h4>
                        <p className="text-[11px] text-charcoal-400">{block.reason}</p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span className="px-2.5 py-1 rounded bg-charcoal-800 text-charcoal-300 text-[11px] font-mono">
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

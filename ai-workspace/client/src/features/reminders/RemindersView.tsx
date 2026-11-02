import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, Sparkles, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Reminder } from '../../types/index.ts';

export const RemindersView: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const res = await api.getReminders();
      setReminders(res.reminders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await api.evaluateSmartReminders();
      setReminders(res.activeReminders || []);
      alert(`Smart Reminder evaluation complete! Evaluated ${res.evaluatedCount} active tasks against calendar availability.`);
    } catch (e: any) {
      alert(`Evaluation error: ${e.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.dismissReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-charcoal-100 flex items-center gap-2">
            Context-Aware Smart Reminders
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-mono">
              {reminders.length} Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-charcoal-400 mt-1">
            Dynamic notifications triggered not just by clock time, but by available calendar slots and workload deficits.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={evaluating}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
          {evaluating ? 'Evaluating Workload...' : 'Run Smart Evaluation'}
        </button>
      </div>

      {/* Reminder Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-charcoal-500 italic">
            Loading active reminders...
          </div>
        ) : reminders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 text-xs text-slate-500 dark:text-charcoal-500 space-y-2 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto opacity-70" />
            <p>No urgent reminders active right now. Your tasks are on schedule.</p>
            <button
              onClick={handleRunEvaluation}
              className="text-brand-500 dark:text-brand-400 hover:underline font-medium"
            >
              Evaluate against latest calendar changes
            </button>
          </div>
        ) : (
          reminders.map(rem => {
            const isCritical = rem.level === 'critical';
            const isUrgent = rem.level === 'urgent';
            const isWarning = rem.level === 'warning';

            return (
              <div
                key={rem.id}
                className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 shadow-sm ${
                  isCritical
                    ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-500/40 text-rose-900 dark:text-rose-200'
                    : isUrgent
                    ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
                    : isWarning
                    ? 'bg-white dark:bg-charcoal-850 border-slate-200 dark:border-charcoal-700 text-slate-800 dark:text-charcoal-200'
                    : 'bg-white dark:bg-charcoal-900 border-slate-200/80 dark:border-charcoal-800 text-slate-800 dark:text-charcoal-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCritical ? (
                      <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                    ) : isUrgent ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    ) : (
                      <Bell className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-charcoal-100">{rem.title}</span>
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                            : isUrgent
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/30'
                        }`}
                      >
                        {rem.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-charcoal-300 leading-relaxed">{rem.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-charcoal-500 font-mono">
                      <span>Urgency Score: {rem.urgencyScore}</span>
                      <span>•</span>
                      <span>Trigger: {new Date(rem.triggerAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(rem.id)}
                  title="Dismiss reminder"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-charcoal-400 dark:hover:text-charcoal-100 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

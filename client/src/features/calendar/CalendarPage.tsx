import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    calendar: string;
  }>>([]);
  const [freeSlots, setFreeSlots] = useState<Array<{ start: string; end: string; durationMinutes: number }>>([]);
  const [planBlocks, setPlanBlocks] = useState<Array<{
    title: string;
    startAt: string;
    endAt: string;
    reason: string;
    kind: 'proposed_focus' | 'break';
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/v1/calendar/events', { headers: { 'x-user-id': 'test-user-id' } })
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => {});

    fetch('/api/v1/calendar/freebusy', { headers: { 'x-user-id': 'test-user-id' } })
      .then((r) => r.json())
      .then((d) => setFreeSlots(d.freeSlots || []))
      .catch(() => {});
  }, []);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/planner/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'test-user-id' },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      });
      const data = await res.json();
      setPlanBlocks(data.plan?.blocks || []);
    } catch {
      alert('Failed to generate daily plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Today's Agenda & Free/Busy Schedule
            </h2>
            <Badge variant="success" dot className="text-[10px]">
              Google Read-Only
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Fixed Google Calendar events are strictly read-only. The deterministic planner calculates your available windows and fits your highest-priority tasks.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleGeneratePlan} disabled={loading}>
          <Sparkles size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Optimizing Day Plan...' : 'Generate Focused Day Plan'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        {/* Left Column: Fixed Google Events & Free Windows */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Calendar size={14} className="text-emerald-400" />
              Fixed Google Calendar Commitments
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              {events.length} events today
            </span>
          </div>

          <div className="space-y-2.5">
            {events.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs bg-white/[0.01] border border-white/[0.04] rounded-2xl p-6">
                No events found on Google Calendar for today.
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl bg-[#12131b] border border-emerald-500/20 border-l-4 border-l-emerald-500 flex items-start justify-between shadow-sm"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white tracking-tight">{ev.title}</h4>
                    <span className="text-[11px] text-emerald-400 font-mono block">
                      {ev.start} – {ev.end}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      Source: {ev.calendar}
                    </span>
                  </div>
                  <Badge variant="success" dot className="text-[10px]">
                    Google Event
                  </Badge>
                </div>
              ))
            )}
          </div>

          {/* Computed Free Slots Section */}
          <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
            <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <Clock size={13} className="text-indigo-400" />
              Calculated Free Time Intervals (Between Meetings):
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {freeSlots.map((slot, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-[#0f1016] border border-white/[0.05] flex items-center justify-between"
                >
                  <span className="text-xs font-mono text-zinc-200">
                    {slot.start} – {slot.end}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {slot.durationMinutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI & Deterministic Planner Blocks */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              Proposed Workspace Focus Blocks
            </h3>
            <Badge variant="purple" className="text-[10px]">
              Grounded Plan
            </Badge>
          </div>

          <div className="space-y-2.5">
            {planBlocks.length === 0 ? (
              <div className="text-center py-20 text-zinc-500 text-xs bg-white/[0.01] border border-dashed border-white/[0.08] rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5">
                <Sparkles size={24} className="text-indigo-500/60" />
                <p className="max-w-xs text-zinc-400">
                  Click <strong>"Generate Focused Day Plan"</strong> to automatically fit your active tasks into available free windows.
                </p>
              </div>
            ) : (
              planBlocks.map((b, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border transition-all ${
                    b.kind === 'break'
                      ? 'bg-white/[0.02] border-white/[0.06] border-l-4 border-l-zinc-600'
                      : 'bg-gradient-to-r from-indigo-950/20 to-[#12131b] border-indigo-500/20 border-l-4 border-l-indigo-500 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {b.kind === 'break' && <Coffee size={13} className="text-zinc-400" />}
                        <h4 className="text-xs font-semibold text-white tracking-tight">
                          {b.title}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-300 block">
                        {b.startAt} – {b.endAt}
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-snug italic pt-0.5">
                        {b.reason}
                      </p>
                    </div>

                    <Badge
                      variant={b.kind === 'break' ? 'default' : 'purple'}
                      className="text-[10px] shrink-0"
                    >
                      {b.kind === 'break' ? 'Buffer / Break' : 'Focus Slot'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

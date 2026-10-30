import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calendar, Clock, Sparkles, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

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
    start: string;
    end: string;
    reason: string;
    kind: 'proposed_focus' | 'break';
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch calendar events
    fetch('/api/v1/calendar/events', { headers: { 'x-user-id': 'test-user-id' } })
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => {});

    // Fetch freebusy
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-workspace-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100">Today's Agenda & Free/Busy Schedule</h2>
            <Badge variant="info" className="text-[10px]">Google Read-Only</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real Google Calendar commitments are strictly read-only and never modified. Proposed focus blocks fit around your existing commitments.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleGeneratePlan} disabled={loading}>
          <Sparkles size={14} /> Generate Focused Day Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Google Calendar Commitments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-emerald-400" />
              Fixed Google Events (Read-Only)
            </h3>
            <span className="text-[11px] text-zinc-500">{events.length} events today</span>
          </div>

          <div className="space-y-2.5">
            {events.length === 0 ? (
              <Card className="p-6 text-center text-xs text-zinc-500">
                No events found on Google Calendar for today.
              </Card>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-lg bg-zinc-900/80 border border-emerald-900/40 border-l-4 border-l-emerald-500 flex items-start justify-between"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">{ev.title}</h4>
                    <span className="text-[11px] text-emerald-400/90 font-mono mt-0.5 block">
                      {ev.start} - {ev.end}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Calendar: {ev.calendar}
                    </span>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    Google Event
                  </Badge>
                </div>
              ))
            )}
          </div>

          {/* Computed Free Intervals */}
          <div className="mt-6 pt-4 border-t border-workspace-border">
            <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-indigo-400" />
              Calculated Free Time Intervals:
            </h4>
            <div className="flex flex-wrap gap-2">
              {freeSlots.map((slot, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono"
                >
                  {slot.start} – {slot.end} ({slot.durationMinutes}m available)
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI & Planner Proposed Focus Blocks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" />
              Proposed Workspace Focus Blocks
            </h3>
            <Badge variant="warning" className="text-[10px]">Distinct from Google</Badge>
          </div>

          <div className="space-y-2.5">
            {planBlocks.length === 0 ? (
              <Card className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2 border-dashed">
                <Sparkles size={24} className="text-zinc-600" />
                <p>Click "Generate Focused Day Plan" to allocate your highest-priority tasks into available free intervals.</p>
              </Card>
            ) : (
              planBlocks.map((b, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-lg border flex items-start justify-between ${
                    b.kind === 'break'
                      ? 'bg-zinc-900/40 border-zinc-800 border-l-4 border-l-zinc-600'
                      : 'bg-indigo-950/20 border-indigo-900/40 border-l-4 border-l-indigo-500'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">{b.title}</h4>
                    <span className="text-[11px] text-indigo-300 font-mono mt-0.5 block">
                      {b.start} – {b.end}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1 italic">{b.reason}</p>
                  </div>
                  <Badge variant={b.kind === 'break' ? 'default' : 'info'} className="text-[10px]">
                    {b.kind === 'break' ? 'Planned Break' : 'Proposed Work'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

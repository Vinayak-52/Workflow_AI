import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Search, Calendar as CalendarIcon,
  Clock, MapPin, Tag, Check, X, Trash2, Sun, Cloud, CloudRain,
  CheckSquare, Sparkles, Users, UploadCloud, GraduationCap, Presentation, BookOpen, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { CalendarEvent, CalendarEventType } from '../../types/index.ts';

export const EVENT_TYPE_CONFIG: Record<CalendarEventType, {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultColor: string;
  badgeClass: string;
}> = {
  meeting: {
    label: 'Meeting',
    shortLabel: 'MEET',
    icon: Users,
    defaultColor: '#007aff',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
  },
  submission: {
    label: 'Submission',
    shortLabel: 'SUBMISSION',
    icon: UploadCloud,
    defaultColor: '#f97316',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  },
  test: {
    label: 'Test',
    shortLabel: 'TEST',
    icon: CheckSquare,
    defaultColor: '#a855f7',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
  },
  exam: {
    label: 'Exam',
    shortLabel: 'EXAM',
    icon: GraduationCap,
    defaultColor: '#eb4d3d',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  },
  presentation: {
    label: 'Presentation',
    shortLabel: 'PRESENTATION',
    icon: Presentation,
    defaultColor: '#22c55e',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  class: {
    label: 'Class / Lecture',
    shortLabel: 'CLASS',
    icon: BookOpen,
    defaultColor: '#06b6d4',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
  },
  other: {
    label: 'General Event',
    shortLabel: 'EVENT',
    icon: CalendarIcon,
    defaultColor: '#64748b',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
  }
};

type ViewMode = 'Day' | 'Week' | 'Month' | 'Year';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const COLOR_PRESETS = [
  { label: 'Green', value: '#22c55e', bg: 'bg-emerald-500' },
  { label: 'Blue', value: '#007aff', bg: 'bg-blue-500' },
  { label: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500' },
  { label: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
  { label: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
  { label: 'Red', value: '#eb4d3d', bg: 'bg-rose-500' },
];

export const CalendarView: React.FC = () => {
  // Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarFilter, setSelectedCalendarFilter] = useState<string>('all');
  const [selectedEventTypeFilter, setSelectedEventTypeFilter] = useState<string>('all');
  const [showCalendarFilterDropdown, setShowCalendarFilterDropdown] = useState(false);

  // Events & Loading State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Add Event Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formEventType, setFormEventType] = useState<CalendarEventType>('meeting');
  const [formCategory, setFormCategory] = useState('Personal');
  const [formColor, setFormColor] = useState('#007aff');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load events from backend
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getCalendarEvents();
      setEvents(res.events || []);
    } catch (e) {
      console.error('Failed to load calendar events:', e);
    } finally {
      setLoading(false);
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const toDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isToday = (d: Date) => isSameDay(d, new Date());

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedCalendarFilter !== 'all' && e.calendarName !== selectedCalendarFilter) {
        return false;
      }
      if (selectedEventTypeFilter !== 'all') {
        const evType = e.eventType || 'meeting';
        if (evType !== selectedEventTypeFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchLoc = (e.location || '').toLowerCase().includes(q);
        const matchDesc = (e.description || '').toLowerCase().includes(q);
        return matchTitle || matchLoc || matchDesc;
      }
      return true;
    });
  }, [events, selectedCalendarFilter, searchQuery]);

  // Unique Calendars List
  const calendarCategories = useMemo(() => {
    const set = new Set<string>(['Personal', 'Work', 'Academic']);
    events.forEach(e => {
      if (e.calendarName) set.add(e.calendarName);
    });
    return Array.from(set);
  }, [events]);

  // Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const handlePrevPeriod = () => {
    if (viewMode === 'Month') handlePrevMonth();
    else if (viewMode === 'Day') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d);
      setCurrentDate(d);
    } else if (viewMode === 'Week') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d);
      setCurrentDate(d);
    } else if (viewMode === 'Year') {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'Month') handleNextMonth();
    else if (viewMode === 'Day') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d);
      setCurrentDate(d);
    } else if (viewMode === 'Week') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d);
      setCurrentDate(d);
    } else if (viewMode === 'Year') {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
    }
  };

  // Open Add Modal
  const openAddModal = (date?: Date) => {
    const target = date || selectedDate || new Date();
    setFormTitle('');
    setFormDate(toDateString(target));
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormIsAllDay(false);
    setFormEventType('meeting');
    setFormCategory('Personal');
    setFormColor('#007aff');
    setFormLocation('');
    setFormDescription('');
    setIsAddModalOpen(true);
  };

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setSubmitting(true);
    try {
      const startAt = formIsAllDay
        ? new Date(`${formDate}T00:00:00`).toISOString()
        : new Date(`${formDate}T${formStartTime}:00`).toISOString();

      const endAt = formIsAllDay
        ? new Date(`${formDate}T23:59:59`).toISOString()
        : new Date(`${formDate}T${formEndTime}:00`).toISOString();

      const res = await api.createCalendarEvent({
        title: formTitle.trim(),
        startAt,
        endAt,
        isAllDay: formIsAllDay,
        calendarName: formCategory,
        eventType: formEventType,
        color: formColor,
        location: formLocation.trim(),
        description: formDescription.trim()
      });

      setEvents(prev => [...prev, res.event]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert(`Failed to create event: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.deleteCalendarEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      setSelectedEvent(null);
    } catch (err: any) {
      alert(`Failed to delete event: ${err.message}`);
    }
  };

  // Get Calendar Week Number
  const getCalendarWeek = (d: Date): number => {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  };

  // Build Month Grid Data (7 columns x 5-6 weeks)
  const monthWeeks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      events: CalendarEvent[];
      cw: number;
    }> = [];

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dStr = toDateString(d);
      const dayEvts = filteredEvents.filter(e => e.startAt.startsWith(dStr));
      days.push({
        date: d,
        isCurrentMonth: false,
        events: dayEvts,
        cw: getCalendarWeek(d)
      });
    }

    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = toDateString(d);
      const dayEvts = filteredEvents.filter(e => e.startAt.startsWith(dStr));
      days.push({
        date: d,
        isCurrentMonth: true,
        events: dayEvts,
        cw: getCalendarWeek(d)
      });
    }

    // Days in next month to fill grid
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const dStr = toDateString(d);
      const dayEvts = filteredEvents.filter(e => e.startAt.startsWith(dStr));
      days.push({
        date: d,
        isCurrentMonth: false,
        events: dayEvts,
        cw: getCalendarWeek(d)
      });
    }

    // Group into weeks
    const weeks: Array<typeof days> = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [currentDate, filteredEvents]);

  // Agenda Days for Sidebar
  const upcomingAgendaDays = useMemo(() => {
    const list: Array<{
      label: string;
      date: Date;
      weather: { temp: string; icon: string };
      events: CalendarEvent[];
    }> = [];

    const base = new Date(selectedDate);
    const weathers = [
      { temp: '36°/33°', icon: '🌧️' },
      { temp: '36°/31°', icon: '🌧️' },
      { temp: '37°/28°', icon: '⛅' },
      { temp: '34°/26°', icon: '🌤️' },
      { temp: '38°/30°', icon: '☀️' },
    ];

    for (let i = 0; i < 5; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dStr = toDateString(d);
      const dayEvts = filteredEvents.filter(e => e.startAt.startsWith(dStr));

      let label = `${WEEKDAY_NAMES[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
      if (isToday(d)) {
        label = `TODAY ${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
      } else if (i === 1 && isToday(base)) {
        label = `TOMORROW ${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
      }

      list.push({
        label,
        date: d,
        weather: weathers[i % weathers.length],
        events: dayEvts
      });
    }

    return list;
  }, [selectedDate, filteredEvents]);

  // Format Event Time
  const formatEventTime = (e: CalendarEvent) => {
    if (e.isAllDay) return 'All Day';
    try {
      const s = new Date(e.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const end = new Date(e.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${s} - ${end}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-charcoal-800 bg-white dark:bg-charcoal-950 font-sans transition-all flex flex-col md:flex-row min-h-[780px]">
      {/* ========================================================================= */}
      {/* LEFT SIDEBAR (Dark macOS / Fantastical Style)                              */}
      {/* ========================================================================= */}
      <aside className="w-full md:w-80 lg:w-[340px] shrink-0 bg-[#1c1d22] text-white flex flex-col border-r border-charcoal-800 select-none">
        {/* Top Control Bar */}
        <div className="p-4 pb-2 flex items-center justify-between">
          {/* macOS Window Controls */}
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm"></span>
          </div>

          {/* Quick Add Event (+) Button */}
          <button
            onClick={() => openAddModal()}
            title="Add Event"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Month Header with < > Nav */}
        <div className="px-5 py-2 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {MONTH_NAMES[currentDate.getMonth()]} <span className="text-gray-400 font-normal">{currentDate.getFullYear()}</span>
          </h2>
          <div className="flex items-center space-x-1 text-gray-400">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1 hover:text-white hover:bg-white/10 rounded transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1 hover:text-white hover:bg-white/10 rounded transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mini Month Calendar */}
        <div className="px-4 py-2 border-b border-white/10">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="text-[10px] text-gray-400 font-semibold tracking-wider">
                <th className="py-1 text-gray-500 font-normal w-7">CW</th>
                {WEEKDAY_NAMES.map(day => (
                  <th key={day} className="py-1 w-8">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthWeeks.map((week, wIdx) => (
                <tr key={wIdx} className="text-xs">
                  {/* Calendar Week number */}
                  <td className="py-1 text-[10px] text-gray-600 font-medium">
                    {week[0].cw}
                  </td>
                  {week.map((cell, cIdx) => {
                    const isCellToday = isToday(cell.date);
                    const isCellSelected = isSameDay(cell.date, selectedDate);
                    const hasEvents = cell.events.length > 0;

                    return (
                      <td key={cIdx} className="py-1">
                        <button
                          onClick={() => {
                            setSelectedDate(cell.date);
                            setCurrentDate(cell.date);
                          }}
                          className={`w-7 h-7 mx-auto rounded-full flex flex-col items-center justify-center relative transition ${
                            isCellSelected
                              ? 'bg-[#007aff] text-white font-bold shadow-md'
                              : isCellToday
                              ? 'border border-[#007aff] text-blue-400 font-bold'
                              : cell.isCurrentMonth
                              ? 'text-gray-200 hover:bg-white/10'
                              : 'text-gray-600 hover:bg-white/5'
                          }`}
                        >
                          <span className="leading-none text-[11px]">{cell.date.getDate()}</span>
                          {hasEvents && (
                            <span className="flex items-center gap-0.5 absolute -bottom-0.5">
                              {cell.events.slice(0, 3).map((ev, evIdx) => (
                                <span
                                  key={evIdx}
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: ev.color || '#22c55e' }}
                                />
                              ))}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Agenda / Upcoming Events List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {upcomingAgendaDays.map((dayItem, dIdx) => (
            <div key={dIdx} className="space-y-1.5">
              {/* Day Header with Weather */}
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-gray-300">
                <span className={dayItem.label.startsWith('TODAY') ? 'text-[#007aff]' : ''}>
                  {dayItem.label}
                </span>
                <span className="text-gray-400 font-normal flex items-center gap-1 text-[10px]">
                  {dayItem.weather.temp} {dayItem.weather.icon}
                </span>
              </div>

              {/* Events for this day */}
              {dayItem.events.length === 0 ? (
                <div className="text-[11px] text-gray-600 italic py-0.5 pl-2">
                  No events
                </div>
              ) : (
                <div className="space-y-1.5 pl-1">
                  {dayItem.events.map(ev => {
                    const isAllDay = ev.isAllDay;
                    return isAllDay ? (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer truncate transition hover:brightness-110"
                        style={{
                          backgroundColor: `${ev.color || '#007aff'}25`,
                          color: ev.color || '#60a5fa',
                          border: `1px solid ${ev.color || '#007aff'}40`
                        }}
                      >
                        {ev.title}
                      </div>
                    ) : (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition flex items-start space-x-2 group"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: ev.color || '#22c55e' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-400 font-mono">
                            {formatEventTime(ev)}
                          </div>
                          <div className="text-xs font-medium text-gray-100 group-hover:text-blue-300 truncate flex items-center gap-1.5">
                            {ev.eventType && ev.eventType !== 'other' && (
                              <span
                                className={`text-[8px] font-bold px-1 rounded uppercase tracking-tighter shrink-0 border ${
                                  EVENT_TYPE_CONFIG[ev.eventType]?.badgeClass || 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {EVENT_TYPE_CONFIG[ev.eventType]?.shortLabel || ev.eventType}
                              </span>
                            )}
                            <span className="truncate">{ev.title}</span>
                          </div>
                          {ev.location && (
                            <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" /> {ev.location}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Empty state hint */}
          {events.length === 0 && !loading && (
            <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-gray-400 text-xs">
              <Sparkles className="w-6 h-6 text-gray-500 mx-auto mb-1.5 opacity-60" />
              <p className="font-medium text-gray-300">Your calendar is clear.</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Click <span className="text-white font-bold">+</span> or click any day to add an event.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Sidebar Footer: "My Calendars" */}
        <div className="p-3 border-t border-white/10 bg-[#16171b] relative">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <button
              onClick={() => setShowCalendarFilterDropdown(prev => !prev)}
              className="flex items-center space-x-2 hover:text-white transition"
            >
              <CheckSquare className="w-4 h-4 text-[#007aff]" />
              <span className="font-medium">
                {selectedCalendarFilter === 'all' ? 'My Calendars' : selectedCalendarFilter}
              </span>
              <ChevronRight
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                  showCalendarFilterDropdown ? 'rotate-90' : ''
                }`}
              />
            </button>
            <span className="text-[10px] text-gray-500 font-mono">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Calendar Category Filter Dropdown */}
          {showCalendarFilterDropdown && (
            <div className="absolute bottom-12 left-3 right-3 bg-[#24252b] border border-white/10 rounded-xl shadow-xl p-2 z-20 space-y-1 text-xs">
              <button
                onClick={() => {
                  setSelectedCalendarFilter('all');
                  setShowCalendarFilterDropdown(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                  selectedCalendarFilter === 'all' ? 'bg-[#007aff] text-white' : 'hover:bg-white/10 text-gray-300'
                }`}
              >
                <span>All Calendars</span>
                {selectedCalendarFilter === 'all' && <Check className="w-3.5 h-3.5" />}
              </button>
              {calendarCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCalendarFilter(cat);
                    setShowCalendarFilterDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                    selectedCalendarFilter === cat ? 'bg-[#007aff] text-white' : 'hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCalendarFilter === cat && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* RIGHT MAIN CALENDAR AREA                                                  */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col bg-white dark:bg-charcoal-900 overflow-hidden">
        {/* Top Control Bar */}
        <header className="px-5 py-3 border-b border-slate-200 dark:border-charcoal-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-charcoal-950/40">
          {/* Navigation Controls: < Today > */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrevPeriod}
              title="Previous"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-600 dark:text-charcoal-300 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-700 dark:text-charcoal-200 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition shadow-xs"
            >
              Today
            </button>
            <button
              onClick={handleNextPeriod}
              title="Next"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-600 dark:text-charcoal-300 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Current Period Label */}
            <span className="ml-3 text-sm font-bold text-slate-800 dark:text-charcoal-100">
              {viewMode === 'Day'
                ? selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                : viewMode === 'Year'
                ? currentDate.getFullYear()
                : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </span>
          </div>

          {/* Center: View Switcher (Day | Week | Month | Year) */}
          <div className="flex items-center bg-slate-200/70 dark:bg-charcoal-800 rounded-lg p-0.5 text-xs font-medium">
            {(['Day', 'Week', 'Month', 'Year'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md transition ${
                  viewMode === mode
                    ? 'bg-[#eb4d3d] text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-charcoal-400 hover:text-slate-900 dark:hover:text-charcoal-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Right: Search Box */}
          <div className="relative w-48 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-charcoal-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </header>

        {/* Event Type Filter Sub-Bar */}
        <div className="px-5 py-2.5 border-b border-slate-200/80 dark:border-charcoal-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white/70 dark:bg-charcoal-900/70 backdrop-blur-xs text-xs">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-charcoal-500 uppercase tracking-wider mr-1 shrink-0">
            Event Types:
          </span>
          <button
            onClick={() => setSelectedEventTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
              selectedEventTypeFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-charcoal-100 dark:text-charcoal-900 font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-charcoal-800 text-slate-600 dark:text-charcoal-400 hover:bg-slate-200/70 dark:hover:bg-charcoal-700'
            }`}
          >
            All Types
          </button>
          {(Object.keys(EVENT_TYPE_CONFIG) as CalendarEventType[]).map(typeKey => {
            const cfg = EVENT_TYPE_CONFIG[typeKey];
            const Icon = cfg.icon;
            const isSelected = selectedEventTypeFilter === typeKey;
            return (
              <button
                key={typeKey}
                onClick={() => setSelectedEventTypeFilter(isSelected ? 'all' : typeKey)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 border ${
                  isSelected
                    ? `${cfg.badgeClass} ring-1 ring-current font-bold shadow-xs`
                    : 'border-slate-200/80 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-800 text-slate-600 dark:text-charcoal-400 hover:bg-slate-100 dark:hover:bg-charcoal-750'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Calendar View Area */}
        <div className="flex-1 flex flex-col overflow-auto bg-slate-50/30 dark:bg-charcoal-950">
          {/* =================================================================== */}
          {/* 1. MONTH VIEW (Matching Screenshot)                                  */}
          {/* =================================================================== */}
          {viewMode === 'Month' && (
            <div className="flex-1 flex flex-col min-w-[700px]">
              {/* Day of week headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-charcoal-800 bg-slate-100/60 dark:bg-charcoal-900 text-center py-2 text-[11px] font-semibold text-slate-500 dark:text-charcoal-400 tracking-wider">
                {WEEKDAY_NAMES.map(name => (
                  <div key={name}>{name}</div>
                ))}
              </div>

              {/* Month Weeks Grid */}
              <div className="flex-1 grid grid-rows-5 sm:grid-rows-6">
                {monthWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 border-b border-slate-200/80 dark:border-charcoal-800">
                    {week.map((cell, cIdx) => {
                      const isCellToday = isToday(cell.date);
                      const isFirstOfMonth = cell.date.getDate() === 1;
                      const dayLabel = isFirstOfMonth
                        ? `${MONTH_NAMES[cell.date.getMonth()].slice(0, 3)} 1`
                        : cell.date.getDate();

                      return (
                        <div
                          key={cIdx}
                          onClick={() => openAddModal(cell.date)}
                          className={`min-h-[105px] p-1.5 border-r border-slate-200/80 dark:border-charcoal-800 flex flex-col justify-between transition group hover:bg-blue-50/30 dark:hover:bg-charcoal-900/40 cursor-pointer ${
                            cell.isCurrentMonth
                              ? 'bg-white dark:bg-charcoal-900'
                              : 'bg-slate-50/70 dark:bg-charcoal-950/70 text-slate-400 dark:text-charcoal-600'
                          }`}
                        >
                          {/* Cell Header: Date Number & Weather Icon */}
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isCellToday
                                  ? 'bg-[#007aff] text-white font-bold shadow-xs'
                                  : cell.isCurrentMonth
                                  ? 'text-slate-700 dark:text-charcoal-200 font-semibold'
                                  : 'text-slate-400 dark:text-charcoal-600'
                              }`}
                            >
                              {dayLabel}
                            </span>

                            {/* Weather Icon decoration */}
                            {isCellToday ? (
                              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                            ) : cell.date.getDate() % 4 === 0 ? (
                              <Sun className="w-3 h-3 text-amber-400 opacity-60" />
                            ) : cell.date.getDate() % 7 === 0 ? (
                              <Cloud className="w-3 h-3 text-slate-400 opacity-60" />
                            ) : null}
                          </div>

                          {/* Events inside this cell */}
                          <div
                            className="flex-1 my-1 space-y-1 overflow-y-auto max-h-20 scrollbar-none"
                            onClick={e => e.stopPropagation()}
                          >
                            {cell.events.map(ev => {
                              const isAllDay = ev.isAllDay;
                              return isAllDay ? (
                                <div
                                  key={ev.id}
                                  onClick={() => setSelectedEvent(ev)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate transition hover:brightness-105"
                                  style={{
                                    backgroundColor: `${ev.color || '#22c55e'}30`,
                                    color: ev.color || '#15803d',
                                    border: `1px solid ${ev.color || '#22c55e'}50`
                                  }}
                                >
                                  {ev.title}
                                </div>
                              ) : (
                                <div
                                  key={ev.id}
                                  onClick={() => setSelectedEvent(ev)}
                                  className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-charcoal-200 hover:text-blue-600 dark:hover:text-blue-400 truncate px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-charcoal-800 transition"
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: ev.color || '#007aff' }}
                                  />
                                  {ev.eventType && ev.eventType !== 'other' && (
                                    <span
                                      className={`text-[8px] font-bold px-1 rounded uppercase tracking-tighter shrink-0 border ${
                                        EVENT_TYPE_CONFIG[ev.eventType]?.badgeClass || 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {EVENT_TYPE_CONFIG[ev.eventType]?.shortLabel || ev.eventType}
                                    </span>
                                  )}
                                  <span className="truncate font-medium">{ev.title}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Hover indicator to add event */}
                          <div className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 text-right font-medium">
                            + Add
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* 2. DAY VIEW                                                         */}
          {/* =================================================================== */}
          {viewMode === 'Day' && (
            <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-charcoal-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-charcoal-100">
                    {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-charcoal-400">
                    {filteredEvents.filter(e => e.startAt.startsWith(toDateString(selectedDate))).length} scheduled commitments
                  </p>
                </div>
                <button
                  onClick={() => openAddModal(selectedDate)}
                  className="px-3 py-1.5 bg-[#007aff] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Event
                </button>
              </div>

              {/* Hourly Time Slots */}
              <div className="space-y-2">
                {Array.from({ length: 14 }).map((_, idx) => {
                  const hour = idx + 8; // 8:00 AM to 9:00 PM
                  const timeLabel = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
                  const slotEvents = filteredEvents.filter(e => {
                    if (!e.startAt.startsWith(toDateString(selectedDate))) return false;
                    const d = new Date(e.startAt);
                    return d.getHours() === hour;
                  });

                  return (
                    <div
                      key={hour}
                      onClick={() => {
                        setFormStartTime(`${pad(hour)}:00`);
                        setFormEndTime(`${pad(hour + 1)}:00`);
                        openAddModal(selectedDate);
                      }}
                      className="flex items-start gap-4 p-2.5 rounded-xl border border-slate-200/80 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 hover:border-blue-400 transition cursor-pointer"
                    >
                      <span className="w-20 text-xs font-mono text-slate-400 dark:text-charcoal-400 shrink-0">
                        {timeLabel}
                      </span>
                      <div className="flex-1 space-y-1">
                        {slotEvents.length === 0 ? (
                          <span className="text-xs text-slate-300 dark:text-charcoal-600 italic">Available</span>
                        ) : (
                          slotEvents.map(ev => (
                            <div
                              key={ev.id}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedEvent(ev);
                              }}
                              className="p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition hover:shadow-xs"
                              style={{
                                backgroundColor: `${ev.color || '#007aff'}20`,
                                color: ev.color || '#007aff',
                                borderLeft: `4px solid ${ev.color || '#007aff'}`
                              }}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {ev.eventType && ev.eventType !== 'other' && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border shrink-0 ${
                                      EVENT_TYPE_CONFIG[ev.eventType]?.badgeClass || 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {EVENT_TYPE_CONFIG[ev.eventType]?.label || ev.eventType}
                                  </span>
                                )}
                                <span className="truncate">{ev.title}</span>
                              </div>
                              <span className="text-[10px] font-mono shrink-0 ml-2">{formatEventTime(ev)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* 3. WEEK VIEW                                                        */}
          {/* =================================================================== */}
          {viewMode === 'Week' && (
            <div className="flex-1 flex flex-col min-w-[700px] p-4">
              <div className="grid grid-cols-7 gap-2 flex-1">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const d = new Date(selectedDate);
                  const startOfWeek = d.getDate() - d.getDay();
                  d.setDate(startOfWeek + idx);
                  const dStr = toDateString(d);
                  const dayEvts = filteredEvents.filter(e => e.startAt.startsWith(dStr));

                  return (
                    <div
                      key={idx}
                      onClick={() => openAddModal(d)}
                      className="border border-slate-200 dark:border-charcoal-800 rounded-xl p-2 bg-white dark:bg-charcoal-900 flex flex-col justify-between hover:border-blue-400 transition cursor-pointer"
                    >
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 dark:text-charcoal-400 uppercase">
                          {WEEKDAY_NAMES[d.getDay()]}
                        </div>
                        <div
                          className={`text-lg font-bold my-1 ${
                            isToday(d) ? 'text-[#007aff]' : 'text-slate-800 dark:text-charcoal-100'
                          }`}
                        >
                          {d.getDate()}
                        </div>
                        <div className="space-y-1 mt-2">
                          {dayEvts.map(ev => (
                            <div
                              key={ev.id}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedEvent(ev);
                              }}
                              className="p-1.5 rounded-lg text-[10px] font-medium truncate flex items-center gap-1"
                              style={{
                                backgroundColor: `${ev.color || '#007aff'}25`,
                                color: ev.color || '#007aff'
                              }}
                            >
                              {ev.eventType && ev.eventType !== 'other' && (
                                <span className="text-[7px] font-bold px-1 rounded uppercase tracking-tighter shrink-0 border border-current opacity-80">
                                  {EVENT_TYPE_CONFIG[ev.eventType]?.shortLabel || ev.eventType}
                                </span>
                              )}
                              <span className="truncate font-semibold">{ev.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-blue-500 font-semibold mt-2">+ Add</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* 4. YEAR VIEW                                                        */}
          {/* =================================================================== */}
          {viewMode === 'Year' && (
            <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
              {MONTH_NAMES.map((name, mIdx) => {
                const year = currentDate.getFullYear();
                const daysInM = new Date(year, mIdx + 1, 0).getDate();
                const mEvts = filteredEvents.filter(e => {
                  const d = new Date(e.startAt);
                  return d.getFullYear() === year && d.getMonth() === mIdx;
                });

                return (
                  <div
                    key={name}
                    onClick={() => {
                      setCurrentDate(new Date(year, mIdx, 1));
                      setViewMode('Month');
                    }}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 hover:border-blue-500 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-charcoal-100">{name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-slate-500 dark:text-charcoal-400 font-mono">
                        {mEvts.length}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-charcoal-500">
                      {daysInM} days • {mEvts.length} events
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* ADD EVENT MODAL                                                           */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-charcoal-700 w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between bg-slate-50 dark:bg-charcoal-950">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-charcoal-100">
                  Add New Event
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-charcoal-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEvent} className="p-5 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-charcoal-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seminar 3 Presentation / Machine Learning Quiz"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Event Type Selector */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-charcoal-300 mb-1.5">
                  Event Type
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {(Object.keys(EVENT_TYPE_CONFIG) as CalendarEventType[]).map(typeKey => {
                    const cfg = EVENT_TYPE_CONFIG[typeKey];
                    const Icon = cfg.icon;
                    const isSelected = formEventType === typeKey;

                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => {
                          setFormEventType(typeKey);
                          setFormColor(cfg.defaultColor);
                          if (['exam', 'test', 'submission', 'class'].includes(typeKey)) {
                            setFormCategory('Academic');
                          } else if (typeKey === 'presentation') {
                            setFormCategory('Project');
                          }
                        }}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-brand-500/15 border-blue-500 dark:border-brand-500 text-blue-600 dark:text-brand-400 shadow-xs'
                            : 'bg-slate-50 dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-700 text-slate-700 dark:text-charcoal-300 hover:bg-slate-100 dark:hover:bg-charcoal-750'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & All Day */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-charcoal-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 dark:text-charcoal-300">
                    <input
                      type="checkbox"
                      checked={formIsAllDay}
                      onChange={e => setFormIsAllDay(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>All Day Event</span>
                  </label>
                </div>
              </div>

              {/* Start & End Times (if not all day) */}
              {!formIsAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-charcoal-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={e => setFormStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-charcoal-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={e => setFormEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Category & Color Picker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-charcoal-300 mb-1">
                    Calendar Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                    <option value="Academic">Academic</option>
                    <option value="Project">Project</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-charcoal-300 mb-1">
                    Color Tag
                  </label>
                  <div className="flex items-center space-x-1.5 pt-1">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => setFormColor(preset.value)}
                        className={`w-6 h-6 rounded-full transition flex items-center justify-center ${preset.bg} ${
                          formColor === preset.value ? 'ring-2 ring-offset-2 ring-blue-500' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {formColor === preset.value && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-charcoal-300 mb-1">
                  Location (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 304 or Zoom link"
                  value={formLocation}
                  onChange={e => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-charcoal-300 mb-1">
                  Notes / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional details..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-200 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-charcoal-700 hover:bg-slate-100 dark:hover:bg-charcoal-800 text-slate-700 dark:text-charcoal-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#007aff] hover:bg-blue-600 text-white rounded-xl font-semibold shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EVENT DETAILS / DELETE MODAL                                              */}
      {/* ========================================================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-charcoal-700 w-full max-w-sm overflow-hidden">
            <div
              className="p-4 flex items-center justify-between text-white"
              style={{ backgroundColor: selectedEvent.color || '#007aff' }}
            >
              <h3 className="font-bold text-sm truncate">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="hover:bg-black/20 p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {selectedEvent.eventType && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      EVENT_TYPE_CONFIG[selectedEvent.eventType]?.badgeClass || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {EVENT_TYPE_CONFIG[selectedEvent.eventType]?.label || selectedEvent.eventType}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-charcoal-500 font-medium">
                    Calendar: {selectedEvent.calendarName}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600 dark:text-charcoal-300">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {new Date(selectedEvent.startAt).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                  {' • '}
                  {formatEventTime(selectedEvent)}
                </span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-charcoal-300">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-600 dark:text-charcoal-300">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{selectedEvent.calendarName || 'Personal'}</span>
              </div>

              {selectedEvent.description && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-800 text-slate-700 dark:text-charcoal-300 text-[11px] leading-relaxed">
                  {selectedEvent.description}
                </div>
              )}

              <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-charcoal-800">
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-slate-700 dark:text-charcoal-200 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

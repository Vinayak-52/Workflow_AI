import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, ShieldCheck, Search, Command } from 'lucide-react';
import { api, ClockInfo, GoogleIntegrationStatus } from '../../lib/api';

interface TopBarProps {
  title: string;
  assistantOpen: boolean;
  onToggleAssistant: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  assistantOpen,
  onToggleAssistant,
}) => {
  const [clock, setClock] = useState<ClockInfo>({
    now: new Date().toISOString(),
    timezone: 'Asia/Kolkata',
    utcOffset: '+05:30',
  });
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);

  useEffect(() => {
    api.getClock().then(setClock).catch(() => {});
    api.getIntegrationStatus().then(setStatus).catch(() => {});

    const timer = setInterval(() => {
      setClock((prev) => ({
        ...prev,
        now: new Date().toISOString(),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatLocalTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return '--:--:--';
    }
  };

  const formatLocalDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <header className="h-16 border-b border-white/[0.07] bg-[#090a0f]/80 backdrop-blur-xl px-6 flex items-center justify-between select-none relative z-20 gap-4 w-full">
      {/* 1. Left: Clean Breadcrumb & Title */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <span className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider">
          Workspace
        </span>
        <span className="text-zinc-600">/</span>
        <h1 className="text-sm font-bold text-white tracking-tight capitalize truncate">
          {title}
        </h1>
      </div>

      {/* 2. Center: Sleek Command Palette Capsule (Never overlaps) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-auto">
        <div className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-400 hover:border-white/[0.18] hover:bg-white/[0.05] transition-all cursor-text shadow-inner">
          <Search size={13} className="text-zinc-400 shrink-0" />
          <span className="text-zinc-400 text-[11px] flex-1">
            Search tasks, notes, or ask assistant...
          </span>
          <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.08] text-zinc-300 border border-white/[0.1] shrink-0">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 3. Right Controls: Time, Google Status, Assistant */}
      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
        {/* Live IANA Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs font-mono text-zinc-300 shrink-0">
          <Clock size={13} className="text-indigo-400 shrink-0" />
          <span className="font-semibold text-white">{formatLocalTime(clock.now)}</span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span className="text-zinc-400 hidden sm:inline">{formatLocalDate(clock.now)}</span>
          <span className="text-[9px] text-indigo-300 bg-indigo-500/15 px-1.5 py-0.2 rounded border border-indigo-500/30">
            IST
          </span>
        </div>

        {/* Google Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] text-xs shrink-0">
          {status?.connected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-zinc-300 text-[11px]">Read-Only</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span className="text-zinc-400 text-[11px]">Disconnected</span>
            </>
          )}
        </div>

        {/* AI Assistant Button */}
        <button
          onClick={onToggleAssistant}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border shrink-0 ${
            assistantOpen
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
              : 'bg-[#151622] text-zinc-200 border-white/[0.1] hover:border-white/[0.2] hover:bg-[#1c1e2d] hover:text-white shadow-sm'
          }`}
        >
          <Sparkles size={13} className={assistantOpen ? 'text-white' : 'text-indigo-400'} />
          <span>AI Assistant</span>
        </button>
      </div>
    </header>
  );
};

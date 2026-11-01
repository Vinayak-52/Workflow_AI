import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, ShieldCheck, AlertCircle, Command, Search } from 'lucide-react';
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
    <header className="h-16 border-b border-white/[0.06] bg-[#0c0d12]/80 backdrop-blur-xl px-6 flex items-center justify-between select-none relative z-20">
      {/* Module Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider">
            Workspace
          </span>
          <span className="text-zinc-600">/</span>
          <h1 className="text-sm font-semibold text-white tracking-tight capitalize">
            {title}
          </h1>
        </div>
      </div>

      {/* Global Actions, Live Clock, and Assistant Toggle */}
      <div className="flex items-center gap-3.5">
        {/* Quick Search Bar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400 w-52 hover:border-white/[0.12] transition-colors cursor-text">
          <Search size={13} className="text-zinc-500" />
          <span className="text-zinc-500 text-[11px]">Quick search...</span>
          <kbd className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
            ⌘K
          </kbd>
        </div>

        {/* Live IANA Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-zinc-300">
          <Clock size={13} className="text-indigo-400" />
          <span className="font-semibold text-zinc-200">{formatLocalTime(clock.now)}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 hidden sm:inline">{formatLocalDate(clock.now)}</span>
          <span className="text-[9px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            IST
          </span>
        </div>

        {/* Google Connection Status Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs">
          {status?.connected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-zinc-300 text-[11px]">Google Read-Only</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span className="text-zinc-400 text-[11px]">Disconnected</span>
            </>
          )}
        </div>

        {/* Contextual Assistant Trigger */}
        <button
          onClick={onToggleAssistant}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
            assistantOpen
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
              : 'bg-[#151620] text-zinc-200 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#1a1c29]'
          }`}
        >
          <Sparkles size={13} className={assistantOpen ? 'text-white' : 'text-indigo-400'} />
          <span>AI Assistant</span>
        </button>
      </div>
    </header>
  );
};

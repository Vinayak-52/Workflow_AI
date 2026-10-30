import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
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
    // Fetch clock from backend
    api.getClock().then(setClock).catch(() => {});
    api.getIntegrationStatus().then(setStatus).catch(() => {});

    // Update local seconds ticker every 1s
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
    <header className="h-14 border-b border-workspace-border bg-workspace-sidebar/80 backdrop-blur px-6 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-zinc-100 capitalize">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Clock Component */}
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-md text-xs font-mono text-zinc-300">
          <Clock size={14} className="text-indigo-400" />
          <span>{formatLocalTime(clock.now)}</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">{formatLocalDate(clock.now)}</span>
          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded">
            {clock.timezone}
          </span>
        </div>

        {/* Google Connection Status Pill */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50">
          {status?.connected ? (
            <>
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-zinc-300">Google: Read-Only</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} className="text-zinc-500" />
              <span className="text-zinc-400">Google: Disconnected</span>
            </>
          )}
        </div>

        {/* Contextual Assistant Drawer Toggle */}
        <button
          onClick={onToggleAssistant}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
            assistantOpen
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'bg-workspace-card text-zinc-300 border-workspace-border hover:bg-workspace-cardHover hover:text-white'
          }`}
        >
          <Sparkles size={14} />
          <span>AI Assistant</span>
        </button>
      </div>
    </header>
  );
};

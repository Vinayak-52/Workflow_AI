import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const LiveClock: React.FC<{ timezone?: string }> = ({ timezone = 'Asia/Kolkata' }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
      setDateStr(
        now.toLocaleDateString('en-IN', {
          timeZone: timezone,
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-800 text-xs">
      <Clock className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
      <span className="font-mono font-medium text-charcoal-100">{timeStr}</span>
      <span className="text-charcoal-500">|</span>
      <span className="text-charcoal-400">{dateStr}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-charcoal-800 text-charcoal-400 font-mono">IST</span>
    </div>
  );
};

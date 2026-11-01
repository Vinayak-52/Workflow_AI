import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  dot = false,
  className,
}) => {
  const base = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-tight';

  const variants = {
    default: 'bg-white/[0.05] text-zinc-300 border border-white/[0.08]',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    purple: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/25',
  };

  const dotColors = {
    default: 'bg-zinc-400',
    success: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]',
    warning: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]',
    danger: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.6)]',
    info: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]',
    purple: 'bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], className))}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

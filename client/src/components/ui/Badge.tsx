import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide';

  const variants = {
    default: 'bg-zinc-800 text-zinc-300 border border-zinc-700/60',
    success: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50',
    warning: 'bg-amber-950/60 text-amber-400 border border-amber-800/50',
    danger: 'bg-rose-950/60 text-rose-400 border border-rose-800/50',
    info: 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/50',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], className))}>
      {children}
    </span>
  );
};

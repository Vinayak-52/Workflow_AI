import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-workspace-canvas disabled:opacity-40 disabled:pointer-events-none rounded-lg select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_1px_2px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.15)_inset] border border-indigo-400/30',
    secondary:
      'bg-[#14151e] hover:bg-[#1b1c28] text-zinc-200 border border-white/[0.08] hover:border-white/[0.18] shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
    subtle:
      'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.05]',
    ghost:
      'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]',
    danger:
      'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 hover:border-rose-700/60 shadow-sm',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[11px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2.5',
  };

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

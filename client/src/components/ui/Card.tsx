import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-[#12131b] border border-white/[0.07] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.4)] relative overflow-hidden transition-all duration-200',
          interactive &&
            'hover:border-white/[0.16] hover:bg-[#161723] hover:shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {/* Top micro-highlight edge for premium depth */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

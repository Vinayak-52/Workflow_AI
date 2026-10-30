import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-workspace-card border border-workspace-border rounded-lg shadow-sm overflow-hidden',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

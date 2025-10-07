import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className }) => {
  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700', className)}>
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      ></div>
    </div>
  );
};

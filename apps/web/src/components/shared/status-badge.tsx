import React from 'react';
import { cn } from '../../lib/utils.js';

const STATUS_STYLES: Record<string, string> = {
  // Agent
  active: 'bg-green-100 text-green-800',
  running: 'bg-blue-100 text-blue-800',
  idle: 'bg-gray-100 text-gray-700',
  paused: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  terminated: 'bg-gray-200 text-gray-500',
  // Issue
  backlog: 'bg-gray-100 text-gray-600',
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  in_review: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
  // Run
  queued: 'bg-gray-100 text-gray-600',
  succeeded: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  timed_out: 'bg-orange-100 text-orange-700',
  // VM
  stopped: 'bg-gray-100 text-gray-600',
  starting: 'bg-yellow-100 text-yellow-700',
  hibernating: 'bg-indigo-100 text-indigo-700',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps): React.ReactElement {
  const styles = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600';
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}

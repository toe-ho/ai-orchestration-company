import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../shared/status-badge.js';
import { cn } from '../../lib/utils.js';
import type { Issue } from '../../lib/api/issues-api.js';

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-400',
};

interface IssueCardProps {
  issue: Issue;
  className?: string;
}

export function IssueCard({ issue, className }: IssueCardProps): React.ReactElement {
  return (
    <Link
      to={`/issues/${issue.id}`}
      className={cn(
        'block rounded-md border border-border bg-card p-3 transition-shadow hover:shadow-sm',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[issue.priority] ?? 'bg-gray-400')}
          title={issue.priority}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{issue.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{issue.identifier}</span>
            <StatusBadge status={issue.priority} className="text-xs" />
          </div>
        </div>
      </div>
    </Link>
  );
}

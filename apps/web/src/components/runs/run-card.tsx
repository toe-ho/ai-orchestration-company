import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../shared/status-badge.js';
import { cn } from '../../lib/utils.js';
import type { HeartbeatRun } from '../../lib/api/heartbeat-runs-api.js';

interface RunCardProps {
  run: HeartbeatRun;
  className?: string;
}

function formatDate(ts?: string): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

export function RunCard({ run, className }: RunCardProps): React.ReactElement {
  return (
    <Link
      to={`/runs/${run.id}`}
      className={cn(
        'flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 transition-shadow hover:shadow-sm',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground font-mono">{run.id.slice(0, 8)}</p>
        <p className="text-xs text-muted-foreground">Started: {formatDate(run.startedAt)}</p>
      </div>
      <StatusBadge status={run.status} />
    </Link>
  );
}

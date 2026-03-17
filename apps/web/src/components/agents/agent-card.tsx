import React from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { AgentStatusBadge } from './agent-status-badge.js';
import { cn } from '../../lib/utils.js';
import type { Agent } from '../../lib/api/agents-api.js';

interface AgentCardProps {
  agent: Agent;
  companyId: string;
  className?: string;
}

function formatLastHeartbeat(ts?: string): string {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AgentCard({ agent, companyId, className }: AgentCardProps): React.ReactElement {
  return (
    <Link
      to={`/agents/${agent.id}`}
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{agent.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{agent.role}</p>
          </div>
        </div>
        <AgentStatusBadge status={agent.status} />
      </div>
      <p className="text-xs text-muted-foreground">
        Last heartbeat: {formatLastHeartbeat(agent.lastHeartbeat)}
      </p>
    </Link>
  );
}

import React from 'react';
import { StatusBadge } from '../shared/status-badge.js';
import type { AgentStatus } from '@aicompany/shared';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  className?: string;
}

export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps): React.ReactElement {
  return <StatusBadge status={status} className={className} />;
}

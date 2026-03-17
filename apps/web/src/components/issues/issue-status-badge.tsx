import React from 'react';
import { StatusBadge } from '../shared/status-badge.js';
import type { IssueStatus } from '@aicompany/shared';

interface IssueStatusBadgeProps {
  status: IssueStatus;
  className?: string;
}

export function IssueStatusBadge({
  status,
  className,
}: IssueStatusBadgeProps): React.ReactElement {
  return <StatusBadge status={status} className={className} />;
}

import React from 'react';
import { IssueCard } from './issue-card.js';
import { IssueStatusBadge } from './issue-status-badge.js';
import type { Issue } from '../../lib/api/issues-api.js';
import type { IssueStatus } from '@aicompany/shared';

interface KanbanColumnProps {
  status: IssueStatus;
  issues: Issue[];
}

export function KanbanColumn({ status, issues }: KanbanColumnProps): React.ReactElement {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <IssueStatusBadge status={status} />
        <span className="text-xs text-muted-foreground">{issues.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
        {issues.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            No issues
          </p>
        )}
      </div>
    </div>
  );
}

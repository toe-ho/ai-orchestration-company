import React from 'react';
import { IssueStatus } from '@aicompany/shared';
import { KanbanColumn } from './kanban-column.js';
import type { Issue } from '../../lib/api/issues-api.js';

const COLUMNS: IssueStatus[] = [
  IssueStatus.Backlog,
  IssueStatus.Todo,
  IssueStatus.InProgress,
  IssueStatus.InReview,
  IssueStatus.Done,
  IssueStatus.Blocked,
];

interface KanbanBoardProps {
  issues: Issue[];
}

export function KanbanBoard({ issues }: KanbanBoardProps): React.ReactElement {
  const byStatus = Object.fromEntries(
    COLUMNS.map((s) => [s, issues.filter((i) => i.status === s)]),
  ) as Record<IssueStatus, Issue[]>;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((status) => (
        <KanbanColumn key={status} status={status} issues={byStatus[status] ?? []} />
      ))}
    </div>
  );
}

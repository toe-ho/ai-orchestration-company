import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '../../hooks/use-company.js';
import { issuesApi } from '../../lib/api/issues-api.js';
import { queryKeys } from '../../lib/query-keys.js';
import { KanbanBoard } from '../../components/issues/kanban-board.js';
import { EmptyState } from '../../components/shared/empty-state.js';

export function IssuesListPage(): React.ReactElement {
  const { companyId } = useCompany();

  const { data: issues = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.issues.list(companyId ?? ''),
    queryFn: () => issuesApi.list(companyId!),
    enabled: !!companyId,
  });

  if (!companyId) {
    return <EmptyState title="No company selected" description="Select a company to view issues." />;
  }

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 w-72 shrink-0 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load issues.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Issues</h1>
      {issues.length === 0 ? (
        <EmptyState title="No issues yet" description="Issues created by agents will appear here." />
      ) : (
        <KanbanBoard issues={issues} />
      )}
    </div>
  );
}

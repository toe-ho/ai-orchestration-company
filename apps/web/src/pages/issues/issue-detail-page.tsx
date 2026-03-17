import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '../../hooks/use-company.js';
import { issuesApi } from '../../lib/api/issues-api.js';
import { queryKeys } from '../../lib/query-keys.js';
import { IssueStatusBadge } from '../../components/issues/issue-status-badge.js';
import { StatusBadge } from '../../components/shared/status-badge.js';

export function IssueDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useCompany();

  const { data: issue, isLoading } = useQuery({
    queryKey: queryKeys.issues.detail(companyId ?? '', id ?? ''),
    queryFn: () => issuesApi.get(companyId!, id!),
    enabled: !!companyId && !!id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: queryKeys.issues.comments(companyId ?? '', id ?? ''),
    queryFn: () => issuesApi.listComments(companyId!, id!),
    enabled: !!companyId && !!id,
  });

  if (isLoading) return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  if (!issue) return <p className="text-sm text-destructive">Issue not found.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{issue.identifier}</span>
          <IssueStatusBadge status={issue.status} />
          <StatusBadge status={issue.priority} />
        </div>
        <h1 className="text-xl font-bold text-foreground">{issue.title}</h1>
      </div>

      {issue.description && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{issue.description}</p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Comments ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-md bg-muted px-3 py-2">
                <p className="text-sm text-foreground">{c.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

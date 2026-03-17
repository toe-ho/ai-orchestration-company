import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '../../hooks/use-company.js';
import { heartbeatRunsApi } from '../../lib/api/heartbeat-runs-api.js';
import { queryKeys } from '../../lib/query-keys.js';
import { StatusBadge } from '../../components/shared/status-badge.js';
import { RunEventStream } from '../../components/runs/run-event-stream.js';

export function RunDetailPage(): React.ReactElement {
  const { rid } = useParams<{ rid: string }>();
  const { companyId } = useCompany();
  const qc = useQueryClient();

  const { data: run, isLoading } = useQuery({
    queryKey: queryKeys.runs.detail(companyId ?? '', rid ?? ''),
    queryFn: () => heartbeatRunsApi.get(companyId!, rid!),
    enabled: !!companyId && !!rid,
  });

  const cancelMutation = useMutation({
    mutationFn: () => heartbeatRunsApi.cancel(companyId!, rid!),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.runs.detail(companyId!, rid!) }),
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-lg bg-muted" />;
  if (!run) return <p className="text-sm text-destructive">Run not found.</p>;

  const canCancel = run.status === 'queued' || run.status === 'running';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-lg font-bold text-foreground">Run {run.id.slice(0, 8)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Agent: {run.agentId}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={run.status} />
          {canCancel && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90 disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Started</dt>
          <dd>{run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Finished</dt>
          <dd>{run.finishedAt ? new Date(run.finishedAt).toLocaleString() : '—'}</dd>
        </div>
      </dl>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Events</h2>
        {companyId && rid && <RunEventStream companyId={companyId} runId={rid} />}
      </div>
    </div>
  );
}

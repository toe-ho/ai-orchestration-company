import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { useCompany } from '../../hooks/use-company.js';
import { agentsApi } from '../../lib/api/agents-api.js';
import { heartbeatRunsApi } from '../../lib/api/heartbeat-runs-api.js';
import { queryKeys } from '../../lib/query-keys.js';
import { AgentStatusBadge } from '../../components/agents/agent-status-badge.js';
import { RunCard } from '../../components/runs/run-card.js';
import { ConfirmDialog } from '../../components/shared/confirm-dialog.js';
import { EmptyState } from '../../components/shared/empty-state.js';

export function AgentDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useCompany();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [terminateOpen, setTerminateOpen] = useState(false);

  const { data: agent, isLoading } = useQuery({
    queryKey: queryKeys.agents.detail(companyId ?? '', id ?? ''),
    queryFn: () => agentsApi.get(companyId!, id!),
    enabled: !!companyId && !!id,
  });

  const { data: runs = [] } = useQuery({
    queryKey: queryKeys.runs.list(companyId ?? '', { agentId: id }),
    queryFn: () => heartbeatRunsApi.list(companyId!, { agentId: id, limit: 20 }),
    enabled: !!companyId && !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.agents.detail(companyId!, id!) });

  const pauseMutation = useMutation({ mutationFn: () => agentsApi.pause(companyId!, id!), onSuccess: invalidate });
  const resumeMutation = useMutation({ mutationFn: () => agentsApi.resume(companyId!, id!), onSuccess: invalidate });
  const terminateMutation = useMutation({
    mutationFn: () => agentsApi.terminate(companyId!, id!),
    onSuccess: () => navigate('/agents'),
  });

  if (isLoading) return <div className="h-32 animate-pulse rounded-lg bg-muted" />;
  if (!agent) return <p className="text-sm text-destructive">Agent not found.</p>;

  const isActive = agent.status === 'active' || agent.status === 'running';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{agent.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <AgentStatusBadge status={agent.status} />
          {agent.status === 'paused' ? (
            <button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              Resume
            </button>
          ) : isActive ? (
            <button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              Pause
            </button>
          ) : null}
          <button
            onClick={() => setTerminateOpen(true)}
            className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90"
          >
            Terminate
          </button>
        </div>
      </div>

      <Tabs.Root defaultValue="overview">
        <Tabs.List className="flex gap-1 border-b border-border">
          {['overview', 'runs', 'config'].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="rounded-t-md px-4 py-2 text-sm font-medium capitalize text-muted-foreground hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="pt-4 space-y-3">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">ID</dt><dd className="font-mono text-xs">{agent.id}</dd></div>
            <div><dt className="text-muted-foreground">Last heartbeat</dt><dd>{agent.lastHeartbeat ? new Date(agent.lastHeartbeat).toLocaleString() : '—'}</dd></div>
            <div><dt className="text-muted-foreground">Created</dt><dd>{new Date(agent.createdAt).toLocaleDateString()}</dd></div>
          </dl>
        </Tabs.Content>

        <Tabs.Content value="runs" className="pt-4 space-y-2">
          {runs.length === 0 ? <EmptyState title="No runs yet" /> : runs.map((r) => <RunCard key={r.id} run={r} />)}
        </Tabs.Content>

        <Tabs.Content value="config" className="pt-4">
          <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(agent.config ?? {}, null, 2)}
          </pre>
        </Tabs.Content>
      </Tabs.Root>

      <ConfirmDialog
        open={terminateOpen}
        onOpenChange={setTerminateOpen}
        title="Terminate agent?"
        description="This will permanently stop the agent. This action cannot be undone."
        confirmLabel="Terminate"
        variant="destructive"
        onConfirm={() => terminateMutation.mutate()}
      />
    </div>
  );
}

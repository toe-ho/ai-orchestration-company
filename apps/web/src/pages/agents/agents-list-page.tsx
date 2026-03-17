import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '../../hooks/use-company.js';
import { agentsApi } from '../../lib/api/agents-api.js';
import { queryKeys } from '../../lib/query-keys.js';
import { AgentCard } from '../../components/agents/agent-card.js';
import { EmptyState } from '../../components/shared/empty-state.js';

export function AgentsListPage(): React.ReactElement {
  const { companyId } = useCompany();

  const { data: agents = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.agents.list(companyId ?? ''),
    queryFn: () => agentsApi.list(companyId!),
    enabled: !!companyId,
  });

  if (!companyId) {
    return <EmptyState title="No company selected" description="Select a company to view agents." />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load agents.</p>;
  }

  if (agents.length === 0) {
    return <EmptyState title="No agents yet" description="Agents will appear here once created." />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Agents</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} companyId={companyId} />
        ))}
      </div>
    </div>
  );
}

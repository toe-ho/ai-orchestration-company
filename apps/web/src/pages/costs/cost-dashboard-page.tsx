import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Cpu, Calendar } from 'lucide-react';
import { useCompany } from '../../hooks/use-company.js';
import { costsApi } from '../../lib/api/costs-api.js';
import { queryKeys } from '../../lib/query-keys.js';
import { EmptyState } from '../../components/shared/empty-state.js';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = now.toISOString();
  return { from, to };
}

export function CostDashboardPage(): React.ReactElement {
  const { companyId } = useCompany();
  const { from, to } = getMonthRange();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.costs.summary(companyId ?? '', from, to),
    queryFn: () => costsApi.getSummary(companyId!, from, to),
    enabled: !!companyId,
  });

  if (!companyId) {
    return <EmptyState title="No company selected" description="Select a company to view costs." />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Failed to load cost data.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Cost Dashboard</h1>

      {/* Total spend card */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total this month</p>
          <p className="text-2xl font-bold text-foreground">{formatCents(data.totalCents)}</p>
        </div>
      </div>

      {/* By agent */}
      {data.byAgent.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Spend by Agent</h2>
          </div>
          <div className="space-y-2">
            {data.byAgent
              .sort((a, b) => b.totalCents - a.totalCents)
              .map((row) => (
                <div key={row.agentId} className="flex items-center justify-between">
                  <span className="truncate text-xs text-muted-foreground font-mono">
                    {row.agentId.slice(0, 8)}…
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCents(row.totalCents)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* By provider */}
      {data.byProvider.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Spend by Provider</h2>
          <div className="space-y-2">
            {data.byProvider
              .sort((a, b) => b.totalCents - a.totalCents)
              .map((row) => (
                <div key={row.provider} className="flex items-center justify-between">
                  <span className="text-xs capitalize text-muted-foreground">{row.provider}</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCents(row.totalCents)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* By day */}
      {data.byDay.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Daily Spend</h2>
          </div>
          <div className="space-y-1">
            {data.byDay.map((row) => (
              <div key={row.date} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{row.date}</span>
                <span className="text-sm font-medium text-foreground">
                  {formatCents(row.totalCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totalCents === 0 && (
        <EmptyState
          title="No cost data yet"
          description="Cost events will appear here once agents start running."
        />
      )}
    </div>
  );
}

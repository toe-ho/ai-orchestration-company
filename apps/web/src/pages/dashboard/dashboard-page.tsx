import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Activity, CircleDot, DollarSign } from 'lucide-react';
import { useCompany } from '../../hooks/use-company.js';
import { dashboardApi } from '../../lib/api/dashboard-api.js';
import { queryKeys } from '../../lib/query-keys.js';
import { EmptyState } from '../../components/shared/empty-state.js';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatCard({ icon, label, value }: StatCardProps): React.ReactElement {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function DashboardPage(): React.ReactElement {
  const { companyId } = useCompany();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.dashboard.summary(companyId ?? ''),
    queryFn: () => dashboardApi.getSummary(companyId!),
    enabled: !!companyId,
  });

  if (!companyId) {
    return (
      <EmptyState
        title="No company selected"
        description="Select or create a company from the top bar to get started."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Failed to load dashboard.</p>;
  }

  const totalIssues = Object.values(data.issueStats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Bot className="h-5 w-5" />} label="Agents" value={data.agentCount} />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Active runs" value={data.activeRuns} />
        <StatCard icon={<CircleDot className="h-5 w-5" />} label="Total issues" value={totalIssues} />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Monthly cost"
          value={`$${data.monthlyCost.toFixed(2)}`}
        />
      </div>

      {Object.keys(data.issueStats).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Issues by status</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(data.issueStats).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-xs capitalize text-muted-foreground">{status.replace(/_/g, ' ')}</span>
                <span className="text-sm font-semibold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

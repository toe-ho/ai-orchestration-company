import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useCompany } from '../../hooks/use-company.js';
import { useAuth } from '../../hooks/use-auth.js';
import { approvalsApi, type Approval } from '../../lib/api/approvals-api.js';
import { queryKeys } from '../../lib/query-keys.js';
import { EmptyState } from '../../components/shared/empty-state.js';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  revision_requested: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

interface ApprovalRowProps {
  approval: Approval;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRevision: (id: string) => void;
  isActing: boolean;
}

function ApprovalRow({ approval, onApprove, onReject, onRevision, isActing }: ApprovalRowProps): React.ReactElement {
  const isPending = approval.status === 'pending';
  const statusStyle = STATUS_STYLES[approval.status] ?? 'bg-muted text-muted-foreground';

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground truncate">{approval.title}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
              {approval.status.replace(/_/g, ' ')}
            </span>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {approval.type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{approval.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(approval.createdAt).toLocaleString()}
        </span>

        {isPending && (
          <div className="flex items-center gap-2">
            <button
              disabled={isActing}
              onClick={() => onApprove(approval.id)}
              className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              disabled={isActing}
              onClick={() => onRevision(approval.id)}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Revise
            </button>
            <button
              disabled={isActing}
              onClick={() => onReject(approval.id)}
              className="flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        )}

        {!isPending && approval.resolvedAt && (
          <span className="text-xs text-muted-foreground">
            Resolved {new Date(approval.resolvedAt).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

export function ApprovalsPage(): React.ReactElement {
  const { companyId } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: approvals = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.approvals.list(companyId ?? ''),
    queryFn: () => approvalsApi.list(companyId!),
    enabled: !!companyId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.approvals.list(companyId ?? '') });

  const resolverId = user?.id ?? 'unknown';

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: (id: string) => approvalsApi.approve(companyId!, id, resolverId),
    onSuccess: invalidate,
  });

  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: (id: string) => approvalsApi.reject(companyId!, id, resolverId),
    onSuccess: invalidate,
  });

  const { mutate: requestRevision, isPending: isRevising } = useMutation({
    mutationFn: (id: string) => approvalsApi.requestRevision(companyId!, id, resolverId),
    onSuccess: invalidate,
  });

  const isActing = isApproving || isRejecting || isRevising;

  if (!companyId) {
    return <EmptyState title="No company selected" description="Select a company to view approvals." />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load approvals.</p>;
  }

  const pending = approvals.filter((a) => a.status === 'pending');
  const resolved = approvals.filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Approvals</h1>
        {pending.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3.5 w-3.5" />
            {pending.length} pending
          </div>
        )}
      </div>

      {approvals.length === 0 ? (
        <EmptyState
          title="No approvals yet"
          description="Approval requests from agents will appear here."
        />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Pending
              </h2>
              {pending.map((a) => (
                <ApprovalRow
                  key={a.id}
                  approval={a}
                  onApprove={approve}
                  onReject={reject}
                  onRevision={requestRevision}
                  isActing={isActing}
                />
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Resolved
              </h2>
              {resolved.map((a) => (
                <ApprovalRow
                  key={a.id}
                  approval={a}
                  onApprove={approve}
                  onReject={reject}
                  onRevision={requestRevision}
                  isActing={isActing}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

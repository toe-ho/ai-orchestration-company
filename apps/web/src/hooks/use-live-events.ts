import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompany } from './use-company.js';
import { useWebSocket } from './use-websocket.js';
import { getSocket } from '../lib/websocket-client.js';
import { queryKeys } from '../lib/query-keys.js';
import type { CompanySocketEvent } from './use-websocket.js';

interface UseLiveEventsResult {
  connected: boolean;
}

/**
 * Subscribes to company-level real-time events via WebSocket and
 * invalidates/updates React Query caches accordingly.
 * Intended to be called once in AppShell so it's always active.
 */
export function useLiveEvents(): UseLiveEventsResult {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const { connected } = useWebSocket(companyId ?? undefined);

  useEffect(() => {
    if (!companyId) return;
    const cid: string = companyId;

    const socket = getSocket(cid);

    function handleAgentStatusChanged(_event: CompanySocketEvent): void {
      void queryClient.invalidateQueries({ queryKey: ['companies', cid, 'agents'] });
    }

    function handleIssueUpdated(_event: CompanySocketEvent): void {
      void queryClient.invalidateQueries({ queryKey: ['companies', cid, 'issues'] });
    }

    function handleIssueCheckedOut(_event: CompanySocketEvent): void {
      void queryClient.invalidateQueries({ queryKey: ['companies', cid, 'issues'] });
    }

    function handleRunCompleted(_event: CompanySocketEvent): void {
      void queryClient.invalidateQueries({ queryKey: ['companies', cid, 'runs'] });
      void queryClient.invalidateQueries({ queryKey: ['companies', cid, 'agents'] });
    }

    function handleRunEvent(payload: unknown): void {
      const evt = payload as { runId?: string; id?: string };
      const runId = evt?.runId;
      if (!runId) return;
      const cacheKey = queryKeys.runs.events(cid, runId);
      const existing = queryClient.getQueryData<unknown[]>(cacheKey) ?? [];
      queryClient.setQueryData(cacheKey, [...existing, evt]);
    }

    socket.on('agent.status_changed', handleAgentStatusChanged);
    socket.on('issue.updated', handleIssueUpdated);
    socket.on('issue.checked_out', handleIssueCheckedOut);
    socket.on('heartbeat.run.completed', handleRunCompleted);
    socket.on('heartbeat.run.event', handleRunEvent);

    return () => {
      socket.off('agent.status_changed', handleAgentStatusChanged);
      socket.off('issue.updated', handleIssueUpdated);
      socket.off('issue.checked_out', handleIssueCheckedOut);
      socket.off('heartbeat.run.completed', handleRunCompleted);
      socket.off('heartbeat.run.event', handleRunEvent);
    };
  }, [companyId, queryClient]);

  return { connected };
}

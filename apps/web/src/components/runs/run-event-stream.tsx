import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { heartbeatRunsApi } from '../../lib/api/heartbeat-runs-api.js';
import { queryKeys } from '../../lib/query-keys.js';

interface RunEventStreamProps {
  companyId: string;
  runId: string;
}

export function RunEventStream({ companyId, runId }: RunEventStreamProps): React.ReactElement {
  // No refetchInterval — live updates are pushed via WebSocket (useLiveEvents in AppShell)
  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.runs.events(companyId, runId),
    queryFn: () => heartbeatRunsApi.listEvents(companyId, runId),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading events…</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load events.</p>;
  }

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No events yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs"
        >
          <span className="text-muted-foreground">{new Date(event.createdAt).toLocaleTimeString()}</span>
          {' '}
          <span className="font-semibold text-foreground">{event.type}</span>
          {Object.keys(event.payload).length > 0 && (
            <pre className="mt-1 overflow-x-auto text-muted-foreground">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          )}
        </li>
      ))}
    </ol>
  );
}

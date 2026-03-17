import type { IExecutionEvent } from '@aicompany/shared';

/**
 * Format an IExecutionEvent as a Server-Sent Events (SSE) text frame.
 * Output format: `event: {eventType}\ndata: {JSON}\n\n`
 */
export function formatSSE(event: IExecutionEvent): string {
  const data = JSON.stringify(event);
  return `event: ${event.eventType}\ndata: ${data}\n\n`;
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { IExecutionRequest } from '@aicompany/shared';
import { ClaudeAdapter } from '@aicompany/adapters';
import { formatSSE } from '@aicompany/adapter-utils';
import { validateAgentJwt, extractBearerToken } from '../services/auth-validator.js';
import { executionManager } from '../services/execution-manager.js';

/** POST /execute — receive IExecutionRequest, run adapter, stream SSE response */
export async function executeRoute(app: FastifyInstance): Promise<void> {
  app.post('/execute', async (req: FastifyRequest, reply: FastifyReply) => {
    // Authenticate
    let agentId: string;
    try {
      const token = extractBearerToken(req.headers.authorization);
      const payload = validateAgentJwt(token);
      agentId = payload.agentId;
    } catch (err) {
      return reply.status(401).send({ error: (err as Error).message });
    }

    // Parse body
    const request = req.body as IExecutionRequest;
    if (!request?.runId || !request?.adapterType) {
      return reply.status(400).send({ error: 'Invalid request body' });
    }

    // Enforce per-agent concurrency limit (max 1)
    const existing = executionManager.getByAgent(agentId);
    if (existing) {
      return reply.status(429).send({
        error: 'Agent already has an active run',
        activeRunId: existing.runId,
      });
    }

    // Set SSE headers — bypass Fastify serialization
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    });

    const adapter = new ClaudeAdapter();

    executionManager.add({
      runId: request.runId,
      agentId,
      cancel: () => adapter.cancel(request.runId),
      startedAt: new Date(),
    });

    try {
      for await (const event of adapter.execute(request)) {
        reply.raw.write(formatSSE(event));
      }
    } catch (err) {
      const errorEvent = {
        runId: request.runId,
        seq: -1,
        eventType: 'error',
        stream: 'system' as const,
        message: (err as Error).message,
        payload: null,
        timestamp: new Date(),
      };
      try { reply.raw.write(formatSSE(errorEvent)); } catch { /* stream already closed */ }
    } finally {
      executionManager.remove(request.runId);
      reply.raw.end();
    }
  });
}

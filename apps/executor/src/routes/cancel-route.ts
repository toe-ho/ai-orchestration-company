import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { validateAgentJwt, extractBearerToken } from '../services/auth-validator.js';
import { executionManager } from '../services/execution-manager.js';

interface CancelBody {
  runId: string;
}

/** POST /cancel — abort a running execution by runId */
export async function cancelRoute(app: FastifyInstance): Promise<void> {
  app.post('/cancel', async (req: FastifyRequest, reply: FastifyReply) => {
    // Authenticate
    let payload: ReturnType<typeof validateAgentJwt>;
    try {
      const token = extractBearerToken(req.headers.authorization);
      payload = validateAgentJwt(token);
    } catch (err) {
      return reply.status(401).send({ error: (err as Error).message });
    }

    const body = req.body as CancelBody;
    if (!body?.runId) {
      return reply.status(400).send({ error: 'Missing runId in request body' });
    }

    const run = executionManager.get(body.runId);
    if (!run) {
      return reply.status(404).send({ error: 'Run not found', runId: body.runId });
    }

    // Ownership check — agents can only cancel their own runs
    if (run.agentId !== payload.agentId) {
      return reply.status(403).send({ error: 'Forbidden: run belongs to a different agent' });
    }

    try {
      run.cancel();
    } catch { /* ignore cancel errors */ }

    executionManager.remove(body.runId);

    return reply.status(200).send({ cancelled: true, runId: body.runId });
  });
}

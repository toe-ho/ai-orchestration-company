import type { FastifyInstance } from 'fastify';

/** POST /execute — stub (full implementation in Phase 5) */
export async function executeRoute(app: FastifyInstance): Promise<void> {
  app.post('/execute', async (_req, reply) => {
    return reply.status(501).send({ error: 'Not implemented', phase: 'Phase 5' });
  });
}

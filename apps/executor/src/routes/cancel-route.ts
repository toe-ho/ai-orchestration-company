import type { FastifyInstance } from 'fastify';

/** POST /cancel — stub (full implementation in Phase 5) */
export async function cancelRoute(app: FastifyInstance): Promise<void> {
  app.post('/cancel', async (_req, reply) => {
    return reply.status(501).send({ error: 'Not implemented', phase: 'Phase 5' });
  });
}

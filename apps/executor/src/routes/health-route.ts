import type { FastifyInstance } from 'fastify';

/** GET /health — liveness probe */
export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

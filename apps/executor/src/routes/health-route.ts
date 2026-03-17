import type { FastifyInstance } from 'fastify';
import { executionManager } from '../services/execution-manager.js';

/** GET /health — liveness probe with active run count */
export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    return {
      status: 'ok',
      activeRuns: executionManager.activeCount(),
      adapter: 'claude',
      timestamp: new Date().toISOString(),
    };
  });
}

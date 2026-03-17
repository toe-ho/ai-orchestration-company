import Fastify from 'fastify';
import { healthRoute } from './routes/health-route.js';
import { executeRoute } from './routes/execute-route.js';
import { cancelRoute } from './routes/cancel-route.js';
import { executionManager } from './services/execution-manager.js';

const PORT = parseInt(process.env.PORT ?? '3200', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function bootstrap(): Promise<void> {
  const app = Fastify({ logger: true });

  await app.register(healthRoute);
  await app.register(executeRoute);
  await app.register(cancelRoute);

  // Graceful shutdown — cancel active runs before exiting
  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'Shutting down executor');
    executionManager.cancelAll();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => { shutdown('SIGTERM').catch(console.error); });
  process.on('SIGINT', () => { shutdown('SIGINT').catch(console.error); });

  await app.listen({ port: PORT, host: HOST });
}

bootstrap().catch((err) => {
  console.error('Executor failed to start', err);
  process.exit(1);
});

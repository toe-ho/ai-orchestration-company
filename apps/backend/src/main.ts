import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3100;
  const host = config.get<string>('app.host') ?? '0.0.0.0';

  await app.listen(port, host);
}

bootstrap().catch((err) => {
  console.error('Backend failed to start', err);
  process.exit(1);
});

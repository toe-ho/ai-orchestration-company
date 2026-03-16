import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { appConfig } from './config/app-config.js';
import { databaseConfig } from './config/database-config.js';
import { authConfig } from './config/auth-config.js';
import { redisConfig } from './config/redis-config.js';
import { flyioConfig } from './config/flyio-config.js';
import { DatabaseModule } from './infrastructure/persistence/database-module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, redisConfig, flyioConfig],
    }),
    CqrsModule.forRoot(),
    ScheduleModule.forRoot(),
    DatabaseModule,
  ],
})
export class AppModule {}

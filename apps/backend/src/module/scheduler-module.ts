import { Module } from '@nestjs/common';
import { SchedulerService } from '../infrastructure/scheduler/scheduler-service.js';

/** Registers cron jobs: heartbeat tick (every 30s) + orphan reaper (every 30s) */
@Module({
  providers: [SchedulerService],
})
export class SchedulerModule {}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InvokeHeartbeatCommand } from '../../application/commands/heartbeat/invoke-heartbeat-command.js';
import { ReapOrphanedRunsCommand } from '../../application/commands/heartbeat/reap-orphaned-runs-command.js';
import { ReconcileBudgetsCommand } from '../../application/commands/cost/reconcile-budgets-command.js';
import { AgentModel } from '../persistence/models/agent-model.js';

const TICK_LOCK_KEY = 'heartbeat-tick';
const REAPER_LOCK_KEY = 'heartbeat-reaper';
const RECONCILE_LOCK_KEY = 'reconcile-budgets';

/** Cron-driven scheduler: heartbeat tick + orphan reaper, guarded by pg advisory locks */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly commandBus: CommandBus,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async tick(): Promise<void> {
    const locked = await this.tryAdvisoryLock(TICK_LOCK_KEY);
    if (!locked) return;

    try {
      const agents = await this.findAgentsDueForHeartbeat();
      for (const agent of agents) {
        this.commandBus
          .execute(new InvokeHeartbeatCommand(agent.id, agent.companyId, 'timer'))
          .catch((err: unknown) => this.logger.error(`Heartbeat failed for agent ${agent.id}: ${err}`));
      }
    } finally {
      await this.releaseAdvisoryLock(TICK_LOCK_KEY);
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async reapOrphanedRuns(): Promise<void> {
    const locked = await this.tryAdvisoryLock(REAPER_LOCK_KEY);
    if (!locked) return;

    try {
      await this.commandBus.execute(new ReapOrphanedRunsCommand());
    } catch (err) {
      this.logger.error(`Orphan reaper failed: ${err}`);
    } finally {
      await this.releaseAdvisoryLock(REAPER_LOCK_KEY);
    }
  }

  @Cron('0 2 * * *')
  async reconcileBudgets(): Promise<void> {
    const locked = await this.tryAdvisoryLock(RECONCILE_LOCK_KEY);
    if (!locked) return;

    try {
      await this.commandBus.execute(new ReconcileBudgetsCommand());
    } catch (err) {
      this.logger.error(`Budget reconciliation failed: ${err}`);
    } finally {
      await this.releaseAdvisoryLock(RECONCILE_LOCK_KEY);
    }
  }

  private async findAgentsDueForHeartbeat(): Promise<AgentModel[]> {
    // Find active agents where heartbeat is enabled and interval has elapsed
    return this.dataSource
      .getRepository(AgentModel)
      .createQueryBuilder('a')
      .where(`a.status = 'active'`)
      .andWhere(`(a.adapter_config->>'heartbeatEnabled')::boolean = true`)
      .andWhere(
        `(a.last_heartbeat_at IS NULL OR a.last_heartbeat_at < NOW() - make_interval(secs => (a.adapter_config->>'heartbeatIntervalSec')::int))`,
      )
      .getMany();
  }

  private async tryAdvisoryLock(key: string): Promise<boolean> {
    const result = await this.dataSource.query<[{ pg_try_advisory_lock: boolean }]>(
      `SELECT pg_try_advisory_lock(hashtext($1))`,
      [key],
    );
    return result[0]?.pg_try_advisory_lock ?? false;
  }

  private async releaseAdvisoryLock(key: string): Promise<void> {
    await this.dataSource.query(`SELECT pg_advisory_unlock(hashtext($1))`, [key]);
  }
}

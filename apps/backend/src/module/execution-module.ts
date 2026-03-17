import { Module } from '@nestjs/common';

// External client
import { FlyioClient } from '../infrastructure/external/flyio/flyio-client.js';

// Services
import { ExecutionEngineService } from '../application/services/impl/execution-engine-service.js';
import { FlyioProvisionerService } from '../application/services/impl/flyio-provisioner-service.js';
import { RedisLiveEventPublisher } from '../application/services/impl/redis-live-event-publisher.js';
import { AgentJwtService } from '../application/services/impl/agent-jwt-service.js';
import { EXECUTION_RUNNER } from '../application/services/interface/i-execution-runner.js';
import { PROVISIONER_SERVICE } from '../application/services/interface/i-provisioner-service.js';
import { LIVE_EVENT_PUBLISHER } from '../application/services/interface/i-live-event-publisher.js';

// Command handlers
import { InvokeHeartbeatHandler } from '../application/commands/heartbeat/invoke-heartbeat-handler.js';
import { WakeupAgentHandler } from '../application/commands/heartbeat/wakeup-agent-command.js';
import { CancelRunHandler } from '../application/commands/heartbeat/cancel-run-command.js';
import { ReapOrphanedRunsHandler } from '../application/commands/heartbeat/reap-orphaned-runs-command.js';
import { EnsureVmHandler } from '../application/commands/provisioner/ensure-vm-command.js';
import { HibernateVmHandler } from '../application/commands/provisioner/hibernate-vm-command.js';
import { DestroyVmHandler } from '../application/commands/provisioner/destroy-vm-command.js';

// Query handlers
import { ListRunsHandler } from '../application/queries/heartbeat/list-runs-query.js';
import { GetRunHandler } from '../application/queries/heartbeat/get-run-query.js';
import { ListRunEventsHandler } from '../application/queries/heartbeat/list-run-events-query.js';
import { GetLiveRunsHandler } from '../application/queries/heartbeat/get-live-runs-query.js';
import { GetHeartbeatContextHandler } from '../application/queries/heartbeat/get-heartbeat-context-query.js';

// Event handlers
import { OnHeartbeatCompletedHandler } from '../application/events/handlers/on-heartbeat-completed.js';
import { OnBudgetExceededHandler } from '../application/events/handlers/on-budget-exceeded.js';

const SERVICE_PROVIDERS = [
  FlyioClient,
  AgentJwtService,
  { provide: EXECUTION_RUNNER, useClass: ExecutionEngineService },
  { provide: PROVISIONER_SERVICE, useClass: FlyioProvisionerService },
  { provide: LIVE_EVENT_PUBLISHER, useClass: RedisLiveEventPublisher },
];

const COMMAND_HANDLERS = [
  InvokeHeartbeatHandler, WakeupAgentHandler, CancelRunHandler, ReapOrphanedRunsHandler,
  EnsureVmHandler, HibernateVmHandler, DestroyVmHandler,
];

const QUERY_HANDLERS = [
  ListRunsHandler, GetRunHandler, ListRunEventsHandler, GetLiveRunsHandler,
  GetHeartbeatContextHandler,
];

const EVENT_HANDLERS = [OnHeartbeatCompletedHandler, OnBudgetExceededHandler];

@Module({
  providers: [...SERVICE_PROVIDERS, ...COMMAND_HANDLERS, ...QUERY_HANDLERS, ...EVENT_HANDLERS],
  exports: [...SERVICE_PROVIDERS],
})
export class ExecutionModule {}

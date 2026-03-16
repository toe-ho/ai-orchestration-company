import { CommandBus, CommandHandler, EventBus, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IAgent, ICompanyVm, IExecutionRequest, IHeartbeatRun } from '@aicompany/shared';
import { InvokeHeartbeatCommand } from './invoke-heartbeat-command.js';
import { EnsureVmCommand } from '../provisioner/ensure-vm-command.js';
import { HibernateVmCommand } from '../provisioner/hibernate-vm-command.js';
import { GetHeartbeatContextQuery } from '../../queries/heartbeat/get-heartbeat-context-query.js';
import { HeartbeatRunCompletedEvent } from '../../events/heartbeat-run-completed-event.js';
import { BudgetExceededEvent } from '../../events/budget-exceeded-event.js';
import type { IAgentRepository } from '../../../domain/repositories/i-agent-repository.js';
import { AGENT_REPOSITORY } from '../../../domain/repositories/i-agent-repository.js';
import type { IHeartbeatRunRepository } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import { HEARTBEAT_RUN_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-repository.js';
import type { IHeartbeatRunEventRepository } from '../../../domain/repositories/i-heartbeat-run-event-repository.js';
import { HEARTBEAT_RUN_EVENT_REPOSITORY } from '../../../domain/repositories/i-heartbeat-run-event-repository.js';
import { AgentJwtService } from '../../../application/services/impl/agent-jwt-service.js';
import type { IApiKeyVaultService } from '../../services/interface/i-api-key-vault-service.js';
import { API_KEY_VAULT_SERVICE } from '../../services/interface/i-api-key-vault-service.js';
import type { IExecutionRunner } from '../../services/interface/i-execution-runner.js';
import { EXECUTION_RUNNER } from '../../services/interface/i-execution-runner.js';
import type { ILiveEventPublisher } from '../../services/interface/i-live-event-publisher.js';
import { LIVE_EVENT_PUBLISHER } from '../../services/interface/i-live-event-publisher.js';
import type { AppConfig } from '../../../config/app-config.js';
import type { FlyioConfig } from '../../../config/flyio-config.js';

interface CostAccumulator { inputTokens: number; outputTokens: number; totalCostCents: number }

@CommandHandler(InvokeHeartbeatCommand)
export class InvokeHeartbeatHandler implements ICommandHandler<InvokeHeartbeatCommand, IHeartbeatRun> {
  private readonly logger = new Logger(InvokeHeartbeatHandler.name);
  private readonly controlPlaneUrl: string;
  private readonly idleTimeoutMin: number;

  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agentRepo: IAgentRepository,
    @Inject(HEARTBEAT_RUN_REPOSITORY) private readonly runRepo: IHeartbeatRunRepository,
    @Inject(HEARTBEAT_RUN_EVENT_REPOSITORY) private readonly eventRepo: IHeartbeatRunEventRepository,
    @Inject(API_KEY_VAULT_SERVICE) private readonly vault: IApiKeyVaultService,
    @Inject(EXECUTION_RUNNER) private readonly runner: IExecutionRunner,
    @Inject(LIVE_EVENT_PUBLISHER) private readonly publisher: ILiveEventPublisher,
    private readonly jwtService: AgentJwtService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    config: ConfigService,
  ) {
    this.controlPlaneUrl = config.get<AppConfig>('app')!.controlPlaneUrl;
    this.idleTimeoutMin = config.get<FlyioConfig>('flyio')!.idleTimeoutMin;
  }

  async execute(cmd: InvokeHeartbeatCommand): Promise<IHeartbeatRun> {
    // Step 1: validate agent
    const agent = await this.loadAndValidate(cmd.agentId, cmd.companyId);
    // Step 2: retrieve API key
    const apiKey = await this.vault.retrieve(cmd.companyId, agent.adapterType);
    // Step 3: ensure VM is running
    const vm: ICompanyVm = await this.commandBus.execute(new EnsureVmCommand(cmd.companyId));
    // Step 4: create queued run record
    const run = await this.runRepo.create({
      companyId: cmd.companyId,
      agentId: cmd.agentId,
      vmMachineId: vm.machineId,
      invocationSource: cmd.invocationSource,
      status: 'queued',
    });
    try {
      // Step 5: sign agent JWT
      const agentJwt = this.jwtService.sign(cmd.agentId, cmd.companyId, run.id);
      // Step 6: assemble execution context
      const contextJson = await this.queryBus.execute<GetHeartbeatContextQuery, Record<string, unknown>>(
        new GetHeartbeatContextQuery(cmd.agentId, cmd.companyId),
      );
      // Steps 7–9: stream execution, persist events, record cost
      return await this.streamAndFinalize(run, agent, agentJwt, apiKey, contextJson, vm);
    } catch (err) {
      this.logger.error(`Heartbeat run ${run.id} failed: ${err}`);
      return (await this.runRepo.update(run.id, { status: 'failed', finishedAt: new Date() }))!;
    }
  }

  private async loadAndValidate(agentId: string, companyId: string): Promise<IAgent> {
    const agent = await this.agentRepo.findByIdAndCompany(agentId, companyId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    if (agent.status !== 'active' && agent.status !== 'idle')
      throw new Error(`Agent ${agentId} is not active (status: ${agent.status})`);
    if (agent.budgetMonthlyCents > 0 && agent.spentMonthlyCents >= agent.budgetMonthlyCents) {
      this.eventBus.publish(new BudgetExceededEvent(agentId, companyId, agent.budgetMonthlyCents, agent.spentMonthlyCents));
      throw new Error(`Agent ${agentId} has exceeded monthly budget`);
    }
    return agent;
  }

  private async streamAndFinalize(
    run: IHeartbeatRun, agent: IAgent, agentJwt: string,
    apiKey: string | null, contextJson: Record<string, unknown>, vm: ICompanyVm,
  ): Promise<IHeartbeatRun> {
    const request: IExecutionRequest = {
      runId: run.id, companyId: run.companyId, agentId: run.agentId,
      agentJwt, controlPlaneUrl: this.controlPlaneUrl,
      adapterType: agent.adapterType, adapterConfig: agent.adapterConfig,
      sessionData: null, contextJson,
      envVars: apiKey ? { ADAPTER_API_KEY: apiKey } : {},
      timeoutSec: (agent.adapterConfig['timeoutSec'] as number) ?? 600,
    };
    await this.runRepo.update(run.id, { status: 'running', startedAt: new Date() });
    const cost: CostAccumulator = { inputTokens: 0, outputTokens: 0, totalCostCents: 0 };
    let seq = 0;
    for await (const event of this.runner.execute(request)) {
      await this.eventRepo.insertEvent({ runId: run.id, seq: seq++, eventType: event.eventType, stream: event.stream, message: event.message, payload: event.payload });
      await this.publisher.publish(run.companyId, run.id, event);
      if (event.eventType === 'cost' && event.payload) {
        cost.inputTokens += (event.payload['inputTokens'] as number) ?? 0;
        cost.outputTokens += (event.payload['outputTokens'] as number) ?? 0;
        cost.totalCostCents += (event.payload['costCents'] as number) ?? 0;
      }
    }
    const finalized = (await this.runRepo.update(run.id, { status: 'succeeded', finishedAt: new Date(), ...cost }))!;
    this.eventBus.publish(new HeartbeatRunCompletedEvent(run.id, run.agentId, run.companyId, 'succeeded', cost.inputTokens, cost.outputTokens, cost.totalCostCents));
    // Step 10: schedule VM hibernation after idle timeout
    setTimeout(() => this.commandBus.execute(new HibernateVmCommand(run.companyId)), this.idleTimeoutMin * 60_000);
    return finalized;
  }
}

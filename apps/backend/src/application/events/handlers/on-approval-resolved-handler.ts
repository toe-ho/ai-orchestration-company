import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ApprovalResolvedEvent } from '../approval-resolved-event.js';
import { CreateAgentCommand } from '../../commands/agent/create-agent-command.js';

/** When a hire_agent approval is approved, auto-create the agent from approval.details */
@EventsHandler(ApprovalResolvedEvent)
export class OnApprovalResolvedHandler implements IEventHandler<ApprovalResolvedEvent> {
  private readonly logger = new Logger(OnApprovalResolvedHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: ApprovalResolvedEvent): Promise<void> {
    this.logger.log(
      `Approval resolved: ${event.approvalId} type=${event.type} status=${event.status}`,
    );

    if (event.type === 'hire_agent' && event.status === 'approved' && event.details) {
      try {
        const d = event.details as Record<string, unknown>;
        await this.commandBus.execute(
          new CreateAgentCommand(
            event.companyId,
            String(d['name'] ?? 'New Agent'),
            String(d['role'] ?? 'assistant'),
            String(d['adapterType'] ?? 'anthropic'),
            d['title'] ? String(d['title']) : undefined,
            d['reportsTo'] ? String(d['reportsTo']) : undefined,
            d['adapterConfig'] as Record<string, unknown> | undefined,
            d['runtimeConfig'] as Record<string, unknown> | undefined,
            d['budgetMonthlyCents'] ? Number(d['budgetMonthlyCents']) : undefined,
          ),
        );
        this.logger.log(`Auto-created agent for hire_agent approval ${event.approvalId}`);
      } catch (err) {
        this.logger.error(`Failed to auto-create agent for approval ${event.approvalId}: ${err}`);
      }
    }
  }
}

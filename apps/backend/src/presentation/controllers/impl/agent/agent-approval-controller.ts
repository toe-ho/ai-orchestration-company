import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AgentAuthGuard } from '../../../../guard/agent-auth-guard.js';
import { CurrentActor } from '../../../../decorator/current-actor.js';
import { ZodValidationPipe } from '../../../../pipe/zod-validation-pipe.js';
import { CreateApprovalDto, type CreateApprovalDtoType } from '../../dto/approval/create-approval-dto.js';
import { CreateApprovalCommand } from '../../../../application/commands/approval/create-approval-command.js';
import type { IActor } from '../../../../domain/interfaces/i-actor.js';

/** Allows agents to submit approval requests (e.g. hire_agent) */
@Controller('agent-approvals')
@UseGuards(AgentAuthGuard)
export class AgentApprovalController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  create(
    @CurrentActor() actor: IActor,
    @Body(new ZodValidationPipe(CreateApprovalDto)) body: CreateApprovalDtoType,
  ) {
    return this.commandBus.execute(
      new CreateApprovalCommand(
        actor.companyId!,
        body.type,
        body.title,
        body.description,
        body.details,
        actor.agentId ?? undefined,
      ),
    );
  }
}

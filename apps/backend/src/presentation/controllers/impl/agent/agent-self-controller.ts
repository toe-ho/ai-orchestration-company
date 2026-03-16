import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AgentAuthGuard } from '../../../../guard/agent-auth-guard.js';
import { CurrentActor } from '../../../../decorator/current-actor.js';
import { GetAgentQuery } from '../../../../application/queries/agent/get-agent-query.js';
import type { IActor } from '../../../../domain/interfaces/i-actor.js';

@Controller('agents')
@UseGuards(AgentAuthGuard)
export class AgentSelfController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  me(@CurrentActor() actor: IActor) {
    return this.queryBus.execute(new GetAgentQuery(actor.agentId!, actor.companyId!));
  }
}

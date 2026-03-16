import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { ZodValidationPipe } from '../../../../pipe/zod-validation-pipe.js';
import { CreateAgentDto, type CreateAgentDtoType } from '../../dto/agent/create-agent-dto.js';
import { UpdateAgentDto, type UpdateAgentDtoType } from '../../dto/agent/update-agent-dto.js';
import { CreateAgentCommand } from '../../../../application/commands/agent/create-agent-command.js';
import { UpdateAgentCommand } from '../../../../application/commands/agent/update-agent-command.js';
import { PauseAgentCommand } from '../../../../application/commands/agent/pause-agent-command.js';
import { ResumeAgentCommand } from '../../../../application/commands/agent/resume-agent-command.js';
import { TerminateAgentCommand } from '../../../../application/commands/agent/terminate-agent-command.js';
import { GetAgentQuery } from '../../../../application/queries/agent/get-agent-query.js';
import { ListAgentsQuery } from '../../../../application/queries/agent/list-agents-query.js';
import { GetOrgTreeQuery } from '../../../../application/queries/agent/get-org-tree-query.js';

@Controller('companies/:cid/agents')
@UseGuards(CompanyAccessGuard)
export class BoardAgentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  list(@Param('cid') cid: string, @Query('status') status?: string) {
    return this.queryBus.execute(new ListAgentsQuery(cid, status));
  }

  @Get('org-tree')
  orgTree(@Param('cid') cid: string) {
    return this.queryBus.execute(new GetOrgTreeQuery(cid));
  }

  @Get(':id')
  get(@Param('cid') cid: string, @Param('id') id: string) {
    return this.queryBus.execute(new GetAgentQuery(id, cid));
  }

  @Post()
  create(
    @Param('cid') cid: string,
    @Body(new ZodValidationPipe(CreateAgentDto)) body: CreateAgentDtoType,
  ) {
    return this.commandBus.execute(
      new CreateAgentCommand(
        cid,
        body.name,
        body.role,
        body.adapterType,
        body.title,
        body.reportsTo,
        body.adapterConfig,
        body.runtimeConfig,
        body.budgetMonthlyCents,
        body.permissions,
      ),
    );
  }

  @Patch(':id')
  update(
    @Param('cid') cid: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAgentDto)) body: UpdateAgentDtoType,
  ) {
    return this.commandBus.execute(new UpdateAgentCommand(id, cid, body));
  }

  @Post(':id/pause')
  pause(@Param('cid') cid: string, @Param('id') id: string) {
    return this.commandBus.execute(new PauseAgentCommand(id, cid));
  }

  @Post(':id/resume')
  resume(@Param('cid') cid: string, @Param('id') id: string) {
    return this.commandBus.execute(new ResumeAgentCommand(id, cid));
  }

  @Post(':id/terminate')
  terminate(@Param('cid') cid: string, @Param('id') id: string) {
    return this.commandBus.execute(new TerminateAgentCommand(id, cid));
  }
}

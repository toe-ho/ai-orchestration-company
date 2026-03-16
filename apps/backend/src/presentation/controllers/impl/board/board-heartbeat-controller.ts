import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { CancelRunCommand } from '../../../../application/commands/heartbeat/cancel-run-command.js';
import { ListRunsQuery } from '../../../../application/queries/heartbeat/list-runs-query.js';
import { GetRunQuery } from '../../../../application/queries/heartbeat/get-run-query.js';
import { ListRunEventsQuery } from '../../../../application/queries/heartbeat/list-run-events-query.js';

@Controller('companies/:cid/runs')
@UseGuards(CompanyAccessGuard)
export class BoardHeartbeatController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  list(
    @Param('cid') cid: string,
    @Query('agentId') agentId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.queryBus.execute(new ListRunsQuery(cid, agentId, limit ? Number(limit) : undefined));
  }

  @Get(':rid')
  get(@Param('cid') cid: string, @Param('rid') rid: string) {
    return this.queryBus.execute(new GetRunQuery(rid, cid));
  }

  @Get(':rid/events')
  events(@Param('rid') rid: string) {
    return this.queryBus.execute(new ListRunEventsQuery(rid));
  }

  @Delete(':rid')
  cancel(@Param('cid') cid: string, @Param('rid') rid: string) {
    return this.commandBus.execute(new CancelRunCommand(rid, cid));
  }
}

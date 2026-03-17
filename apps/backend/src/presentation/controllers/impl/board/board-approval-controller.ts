import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { CurrentActor } from '../../../../decorator/current-actor.js';
import { ZodValidationPipe } from '../../../../pipe/zod-validation-pipe.js';
import { CreateApprovalDto, type CreateApprovalDtoType } from '../../dto/approval/create-approval-dto.js';
import { CreateApprovalCommand } from '../../../../application/commands/approval/create-approval-command.js';
import { ApproveCommand } from '../../../../application/commands/approval/approve-command.js';
import { RejectCommand } from '../../../../application/commands/approval/reject-command.js';
import { RequestRevisionCommand } from '../../../../application/commands/approval/request-revision-command.js';
import { ListApprovalsQuery } from '../../../../application/queries/approval/list-approvals-query.js';
import { GetApprovalQuery } from '../../../../application/queries/approval/get-approval-query.js';
import type { IActor } from '../../../../domain/interfaces/i-actor.js';

@Controller('companies/:cid/approvals')
@UseGuards(CompanyAccessGuard)
export class BoardApprovalController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  list(@Param('cid') cid: string, @Query('status') status?: string) {
    return this.queryBus.execute(new ListApprovalsQuery(cid, status));
  }

  @Get(':id')
  get(@Param('cid') cid: string, @Param('id') id: string) {
    return this.queryBus.execute(new GetApprovalQuery(cid, id));
  }

  @Post()
  create(
    @Param('cid') cid: string,
    @Body(new ZodValidationPipe(CreateApprovalDto)) body: CreateApprovalDtoType,
  ) {
    return this.commandBus.execute(
      new CreateApprovalCommand(cid, body.type, body.title, body.description, body.details),
    );
  }

  @Post(':id/approve')
  approve(
    @Param('cid') cid: string,
    @Param('id') id: string,
    @CurrentActor() actor: IActor,
  ) {
    return this.commandBus.execute(new ApproveCommand(id, cid, actor.userId!));
  }

  @Post(':id/reject')
  reject(
    @Param('cid') cid: string,
    @Param('id') id: string,
    @CurrentActor() actor: IActor,
  ) {
    return this.commandBus.execute(new RejectCommand(id, cid, actor.userId!));
  }

  @Post(':id/request-revision')
  requestRevision(
    @Param('cid') cid: string,
    @Param('id') id: string,
    @CurrentActor() actor: IActor,
  ) {
    return this.commandBus.execute(new RequestRevisionCommand(id, cid, actor.userId!));
  }
}

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
import { CreateIssueDto, type CreateIssueDtoType } from '../../dto/issue/create-issue-dto.js';
import { UpdateIssueDto, type UpdateIssueDtoType } from '../../dto/issue/update-issue-dto.js';
import { CreateIssueCommand } from '../../../../application/commands/issue/create-issue-command.js';
import { UpdateIssueCommand } from '../../../../application/commands/issue/update-issue-command.js';
import { GetIssueQuery } from '../../../../application/queries/issue/get-issue-query.js';
import { ListIssuesQuery } from '../../../../application/queries/issue/list-issues-query.js';
import { SearchIssuesQuery } from '../../../../application/queries/issue/search-issues-query.js';
import { ListCommentsQuery } from '../../../../application/queries/issue/list-comments-query.js';

@Controller('companies/:cid/issues')
@UseGuards(CompanyAccessGuard)
export class BoardIssueController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  list(
    @Param('cid') cid: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeAgentId') assigneeAgentId?: string,
    @Query('projectId') projectId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.queryBus.execute(
      new ListIssuesQuery(
        cid,
        status,
        priority,
        assigneeAgentId,
        projectId,
        limit ? parseInt(limit, 10) : undefined,
        offset ? parseInt(offset, 10) : undefined,
      ),
    );
  }

  @Get('search')
  search(@Param('cid') cid: string, @Query('q') q: string, @Query('limit') limit?: string) {
    return this.queryBus.execute(
      new SearchIssuesQuery(cid, q ?? '', limit ? parseInt(limit, 10) : undefined),
    );
  }

  @Get(':id')
  get(@Param('cid') cid: string, @Param('id') id: string) {
    return this.queryBus.execute(new GetIssueQuery(id, cid));
  }

  @Get(':id/comments')
  listComments(@Param('cid') cid: string, @Param('id') id: string) {
    return this.queryBus.execute(new ListCommentsQuery(id, cid));
  }

  @Post()
  create(
    @Param('cid') cid: string,
    @Body(new ZodValidationPipe(CreateIssueDto)) body: CreateIssueDtoType,
  ) {
    return this.commandBus.execute(
      new CreateIssueCommand(
        cid,
        body.title,
        body.projectId,
        body.goalId,
        body.parentId,
        body.description,
        body.priority,
        body.status,
        body.assigneeAgentId,
      ),
    );
  }

  @Patch(':id')
  update(
    @Param('cid') cid: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIssueDto)) body: UpdateIssueDtoType,
  ) {
    return this.commandBus.execute(new UpdateIssueCommand(id, cid, body));
  }
}

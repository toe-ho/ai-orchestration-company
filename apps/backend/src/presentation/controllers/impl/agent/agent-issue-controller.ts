import { Controller, Post, Patch, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AgentAuthGuard } from '../../../../guard/agent-auth-guard.js';
import { CurrentActor } from '../../../../decorator/current-actor.js';
import { RunId } from '../../../../decorator/run-id.js';
import { ZodValidationPipe } from '../../../../pipe/zod-validation-pipe.js';
import { UpdateIssueDto, type UpdateIssueDtoType } from '../../dto/issue/update-issue-dto.js';
import { AddCommentDto, type AddCommentDtoType } from '../../dto/issue/add-comment-dto.js';
import { CheckoutIssueCommand } from '../../../../application/commands/issue/checkout-issue-command.js';
import { ReleaseIssueCommand } from '../../../../application/commands/issue/release-issue-command.js';
import { UpdateIssueCommand } from '../../../../application/commands/issue/update-issue-command.js';
import { AddCommentCommand } from '../../../../application/commands/issue/comment/add-comment-command.js';
import type { IActor } from '../../../../domain/interfaces/i-actor.js';

@Controller('agent-issues')
@UseGuards(AgentAuthGuard)
export class AgentIssueController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/checkout')
  checkout(
    @Param('id') id: string,
    @CurrentActor() actor: IActor,
    @RunId() runId: string | undefined,
  ) {
    if (!runId) throw new BadRequestException('X-Run-Id header is required');
    return this.commandBus.execute(new CheckoutIssueCommand(id, actor.companyId!, runId));
  }

  @Post(':id/release')
  release(
    @Param('id') id: string,
    @CurrentActor() actor: IActor,
    @RunId() runId: string | undefined,
  ) {
    if (!runId) throw new BadRequestException('X-Run-Id header is required');
    return this.commandBus.execute(new ReleaseIssueCommand(id, actor.companyId!, runId));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentActor() actor: IActor,
    @Body(new ZodValidationPipe(UpdateIssueDto)) body: UpdateIssueDtoType,
  ) {
    return this.commandBus.execute(new UpdateIssueCommand(id, actor.companyId!, body));
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @CurrentActor() actor: IActor,
    @Body(new ZodValidationPipe(AddCommentDto)) body: AddCommentDtoType,
  ) {
    const authorId = actor.agentId ?? actor.userId ?? null;
    return this.commandBus.execute(
      new AddCommentCommand(id, actor.companyId!, authorId, actor.type, body.content),
    );
  }
}

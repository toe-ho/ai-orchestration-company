import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { ZodValidationPipe } from '../../../../pipe/zod-validation-pipe.js';
import { CreateGoalDto, type CreateGoalDtoType } from '../../dto/goal/create-goal-dto.js';
import { CreateGoalCommand } from '../../../../application/commands/goal/create-goal-command.js';
import { UpdateGoalCommand } from '../../../../application/commands/goal/update-goal-command.js';
import { ListGoalsQuery } from '../../../../application/queries/goal/list-goals-query.js';
import type { IGoal } from '@aicompany/shared';

const UpdateGoalDto = CreateGoalDto.partial();

@Controller('companies/:cid/goals')
@UseGuards(CompanyAccessGuard)
export class BoardGoalController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  list(@Param('cid') cid: string) {
    return this.queryBus.execute(new ListGoalsQuery(cid));
  }

  @Post()
  create(
    @Param('cid') cid: string,
    @Body(new ZodValidationPipe(CreateGoalDto)) body: CreateGoalDtoType,
  ) {
    return this.commandBus.execute(
      new CreateGoalCommand(cid, body.title, body.description, body.level, body.parentId),
    );
  }

  @Patch(':id')
  update(
    @Param('cid') cid: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateGoalDto)) body: Partial<IGoal>,
  ) {
    return this.commandBus.execute(new UpdateGoalCommand(id, cid, body));
  }
}

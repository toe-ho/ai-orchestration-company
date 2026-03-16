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
import { CreateProjectDto, type CreateProjectDtoType } from '../../dto/project/create-project-dto.js';
import { CreateProjectCommand } from '../../../../application/commands/project/create-project-command.js';
import { UpdateProjectCommand } from '../../../../application/commands/project/update-project-command.js';
import { ListProjectsQuery } from '../../../../application/queries/project/list-projects-query.js';
import { GetProjectQuery } from '../../../../application/queries/project/get-project-query.js';
import type { IProject } from '@aicompany/shared';

const UpdateProjectDto = CreateProjectDto.partial();

@Controller('companies/:cid/projects')
@UseGuards(CompanyAccessGuard)
export class BoardProjectController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  list(@Param('cid') cid: string) {
    return this.queryBus.execute(new ListProjectsQuery(cid));
  }

  @Get(':id')
  get(@Param('cid') cid: string, @Param('id') id: string) {
    return this.queryBus.execute(new GetProjectQuery(id, cid));
  }

  @Post()
  create(
    @Param('cid') cid: string,
    @Body(new ZodValidationPipe(CreateProjectDto)) body: CreateProjectDtoType,
  ) {
    return this.commandBus.execute(
      new CreateProjectCommand(cid, body.name, body.description, body.goalId),
    );
  }

  @Patch(':id')
  update(
    @Param('cid') cid: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProjectDto)) body: Partial<IProject>,
  ) {
    return this.commandBus.execute(new UpdateProjectCommand(id, cid, body));
  }
}

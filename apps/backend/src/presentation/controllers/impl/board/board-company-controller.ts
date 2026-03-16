import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { CurrentActor } from '../../../../decorator/current-actor.js';
import { ZodValidationPipe } from '../../../../pipe/zod-validation-pipe.js';
import { CreateCompanyDto, type CreateCompanyDtoType } from '../../dto/company/create-company-dto.js';
import { UpdateCompanyDto, type UpdateCompanyDtoType } from '../../dto/company/update-company-dto.js';
import { CreateCompanyCommand } from '../../../../application/commands/company/create-company-command.js';
import { UpdateCompanyCommand } from '../../../../application/commands/company/update-company-command.js';
import { DeleteCompanyCommand } from '../../../../application/commands/company/delete-company-command.js';
import { GetCompanyQuery } from '../../../../application/queries/company/get-company-query.js';
import { ListCompaniesQuery } from '../../../../application/queries/company/list-companies-query.js';
import type { IActor } from '../../../../domain/interfaces/i-actor.js';

@Controller('companies')
export class BoardCompanyController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateCompanyDto)) body: CreateCompanyDtoType,
    @CurrentActor() actor: IActor,
  ) {
    return this.commandBus.execute(
      new CreateCompanyCommand(body.name, body.issuePrefix, actor.userId!, body.description),
    );
  }

  @Get()
  list(@CurrentActor() actor: IActor) {
    return this.queryBus.execute(new ListCompaniesQuery(actor.userId!));
  }

  @Get(':cid')
  @UseGuards(CompanyAccessGuard)
  get(@Param('cid') cid: string, @CurrentActor() actor: IActor) {
    return this.queryBus.execute(new GetCompanyQuery(cid, actor.userId!));
  }

  @Patch(':cid')
  @UseGuards(CompanyAccessGuard)
  update(
    @Param('cid') cid: string,
    @Body(new ZodValidationPipe(UpdateCompanyDto)) body: UpdateCompanyDtoType,
  ) {
    return this.commandBus.execute(new UpdateCompanyCommand(cid, cid, body));
  }

  @Delete(':cid')
  @UseGuards(CompanyAccessGuard)
  remove(@Param('cid') cid: string) {
    return this.commandBus.execute(new DeleteCompanyCommand(cid, cid));
  }
}

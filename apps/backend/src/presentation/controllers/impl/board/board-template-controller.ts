import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentActor } from '../../../../decorator/current-actor.js';
import { ZodValidationPipe } from '../../../../pipe/zod-validation-pipe.js';
import {
  CreateCompanyFromTemplateDto,
  type CreateCompanyFromTemplateDtoType,
} from '../../dto/company/create-company-from-template-dto.js';
import { CreateCompanyFromTemplateCommand } from '../../../../application/commands/company/create-company-from-template-command.js';
import type { IActor } from '../../../../domain/interfaces/i-actor.js';

@Controller('companies')
export class BoardTemplateController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('from-template')
  createFromTemplate(
    @Body(new ZodValidationPipe(CreateCompanyFromTemplateDto)) body: CreateCompanyFromTemplateDtoType,
    @CurrentActor() actor: IActor,
  ) {
    return this.commandBus.execute(
      new CreateCompanyFromTemplateCommand(
        body.templateSlug,
        body.companyName,
        actor.userId!,
        body.description,
        body.goal,
      ),
    );
  }
}

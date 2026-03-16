import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { ICompanyRepository } from '../../../domain/repositories/i-company-repository.js';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/i-company-repository.js';
import type { ICompany } from '@aicompany/shared';

export class UpdateCompanyCommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly partial: Partial<ICompany>,
  ) {}
}

@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler implements ICommandHandler<UpdateCompanyCommand, ICompany> {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: ICompanyRepository,
  ) {}

  async execute(cmd: UpdateCompanyCommand): Promise<ICompany> {
    const updated = await this.companyRepo.update(cmd.id, cmd.partial);
    if (!updated) throw new NotFoundException(`Company ${cmd.id} not found`);
    return updated;
  }
}

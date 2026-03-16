import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { ICompanyRepository } from '../../../domain/repositories/i-company-repository.js';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/i-company-repository.js';

export class DeleteCompanyCommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

@CommandHandler(DeleteCompanyCommand)
export class DeleteCompanyHandler implements ICommandHandler<DeleteCompanyCommand, void> {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: ICompanyRepository,
  ) {}

  async execute(cmd: DeleteCompanyCommand): Promise<void> {
    const company = await this.companyRepo.findById(cmd.id);
    if (!company) throw new NotFoundException(`Company ${cmd.id} not found`);
    await this.companyRepo.softDelete(cmd.id);
  }
}

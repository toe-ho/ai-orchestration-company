import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { ICompanyRepository } from '../../../domain/repositories/i-company-repository.js';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/i-company-repository.js';
import type { IUserCompanyRepository } from '../../../domain/repositories/i-user-company-repository.js';
import { USER_COMPANY_REPOSITORY } from '../../../domain/repositories/i-user-company-repository.js';
import type { ICompany } from '@aicompany/shared';

export class CreateCompanyCommand {
  constructor(
    public readonly name: string,
    public readonly issuePrefix: string,
    public readonly ownerId: string,
    public readonly description?: string,
  ) {}
}

@CommandHandler(CreateCompanyCommand)
export class CreateCompanyHandler implements ICommandHandler<CreateCompanyCommand, ICompany> {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: ICompanyRepository,
    @Inject(USER_COMPANY_REPOSITORY) private readonly userCompanyRepo: IUserCompanyRepository,
  ) {}

  async execute(cmd: CreateCompanyCommand): Promise<ICompany> {
    const company = await this.companyRepo.create({
      name: cmd.name,
      issuePrefix: cmd.issuePrefix.toUpperCase(),
      ownerId: cmd.ownerId,
      description: cmd.description ?? null,
      status: 'active',
      issueCounter: 0,
    });
    await this.userCompanyRepo.addMember(cmd.ownerId, company.id, 'owner');
    return company;
  }
}

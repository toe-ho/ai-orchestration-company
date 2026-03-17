import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { ICompany, IAgent, IGoal } from '@aicompany/shared';
import type { ITemplateRepository } from '../../../domain/repositories/i-template-repository.js';
import { TEMPLATE_REPOSITORY } from '../../../domain/repositories/i-template-repository.js';
import { CompanyModel } from '../../../infrastructure/persistence/models/company-model.js';
import { UserCompanyModel } from '../../../infrastructure/persistence/models/user-company-model.js';
import { AgentModel } from '../../../infrastructure/persistence/models/agent-model.js';
import { GoalModel } from '../../../infrastructure/persistence/models/goal-model.js';
import type { AgentConfig } from '../../../infrastructure/persistence/seeds/template-seed.js';

export class CreateCompanyFromTemplateCommand {
  constructor(
    public readonly templateSlug: string,
    public readonly companyName: string,
    public readonly ownerId: string,
    public readonly description?: string,
    public readonly goal?: string,
  ) {}
}

export interface CreateCompanyFromTemplateResult {
  company: ICompany;
  agents: IAgent[];
  goal: IGoal;
}

@CommandHandler(CreateCompanyFromTemplateCommand)
export class CreateCompanyFromTemplateHandler
  implements ICommandHandler<CreateCompanyFromTemplateCommand, CreateCompanyFromTemplateResult>
{
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templateRepo: ITemplateRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute(cmd: CreateCompanyFromTemplateCommand): Promise<CreateCompanyFromTemplateResult> {
    const template = await this.templateRepo.findBySlug(cmd.templateSlug);
    if (!template) throw new NotFoundException(`Template '${cmd.templateSlug}' not found`);

    // Derive issuePrefix from company name + random suffix to avoid UNIQUE collisions
    const base = cmd.companyName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'CO';
    const suffix = Math.floor(Math.random() * 90 + 10).toString();
    const issuePrefix = `${base}${suffix}`;

    const agentConfigs = template.agentConfigs as unknown as AgentConfig[];
    const goalTitle = cmd.goal ?? template.goalTemplate ?? `${cmd.companyName} — primary goal`;

    /** All writes run in a single transaction — partial failures roll back cleanly */
    try {
      return await this.dataSource.transaction(async (em) => {
        // 1. Company
        const company = await em.save(
          em.create(CompanyModel, {
            name: cmd.companyName,
            description: cmd.description ?? null,
            issuePrefix,
            ownerId: cmd.ownerId,
            status: 'active',
            issueCounter: 0,
            templateId: template.id,
          }),
        ) as ICompany;

        // 2. Owner membership
        await em.save(em.create(UserCompanyModel, { userId: cmd.ownerId, companyId: company.id, role: 'owner' }));

        // 3. Agents with reportsTo wiring
        const createdAgents: IAgent[] = [];
        for (const config of agentConfigs) {
          const reportsTo =
            config.reportsToIndex != null ? (createdAgents[config.reportsToIndex]?.id ?? null) : null;
          const agent = await em.save(
            em.create(AgentModel, {
              companyId: company.id,
              name: config.name,
              role: config.role,
              title: config.title,
              adapterType: config.adapterType,
              adapterConfig: config.adapterConfig,
              runtimeConfig: config.runtimeConfig,
              reportsTo,
              status: 'idle',
              budgetMonthlyCents: 0,
              permissions: {},
            }),
          ) as IAgent;
          createdAgents.push(agent);
        }

        // 4. Default goal
        const goal = await em.save(
          em.create(GoalModel, {
            companyId: company.id,
            title: goalTitle,
            description: null,
            level: 'company',
            parentId: null,
            status: 'active',
          }),
        ) as IGoal;

        return { company, agents: createdAgents, goal };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('unique') || msg.includes('duplicate')) {
        throw new ConflictException('Company name generates a conflicting issue prefix. Please try a different name.');
      }
      throw err;
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostEventModel } from '../persistence/models/cost-event-model.js';
import type { ICostEventRepository, CostSummary } from '../../domain/repositories/i-cost-event-repository.js';

@Injectable()
export class CostEventRepository implements ICostEventRepository {
  constructor(
    @InjectRepository(CostEventModel)
    private readonly repo: Repository<CostEventModel>,
  ) {}

  async create(data: Partial<CostEventModel>): Promise<CostEventModel> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  findByCompany(companyId: string, from: Date, to: Date): Promise<CostEventModel[]> {
    return this.repo
      .createQueryBuilder('ce')
      .where('ce.companyId = :companyId', { companyId })
      .andWhere('ce.createdAt >= :from', { from })
      .andWhere('ce.createdAt <= :to', { to })
      .orderBy('ce.createdAt', 'DESC')
      .getMany();
  }

  async getSummary(companyId: string, from: Date, to: Date): Promise<CostSummary> {
    // getRawMany: use ORM property names in WHERE; raw column names only inside SQL functions
    const rows = await this.repo
      .createQueryBuilder('ce')
      .select('ce.agentId', 'agentId')
      .addSelect('ce.provider', 'provider')
      .addSelect(`TO_CHAR(ce.createdAt, 'YYYY-MM-DD')`, 'date')
      .addSelect('SUM(ce.costCents)', 'totalCents')
      .where('ce.companyId = :companyId', { companyId })
      .andWhere('ce.createdAt >= :from', { from })
      .andWhere('ce.createdAt <= :to', { to })
      .groupBy('ce.agentId')
      .addGroupBy('ce.provider')
      .addGroupBy(`TO_CHAR(ce.createdAt, 'YYYY-MM-DD')`)
      .getRawMany<{ agentId: string; provider: string; date: string; totalCents: string }>();

    let totalCents = 0;
    const agentMap = new Map<string, number>();
    const providerMap = new Map<string, number>();
    const dayMap = new Map<string, number>();

    for (const row of rows) {
      const cents = Number(row.totalCents);
      totalCents += cents;
      agentMap.set(row.agentId, (agentMap.get(row.agentId) ?? 0) + cents);
      providerMap.set(row.provider, (providerMap.get(row.provider) ?? 0) + cents);
      dayMap.set(row.date, (dayMap.get(row.date) ?? 0) + cents);
    }

    return {
      totalCents,
      byAgent: Array.from(agentMap.entries()).map(([agentId, c]) => ({ agentId, totalCents: c })),
      byProvider: Array.from(providerMap.entries()).map(([provider, c]) => ({ provider, totalCents: c })),
      byDay: Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, c]) => ({ date, totalCents: c })),
    };
  }

  async sumByCompanyMonth(companyId: string, year: number, month: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('ce')
      .select('SUM(ce.costCents)', 'total')
      .where('ce.companyId = :companyId', { companyId })
      .andWhere('EXTRACT(YEAR FROM ce.createdAt) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM ce.createdAt) = :month', { month })
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  async sumByAgentMonth(agentId: string, year: number, month: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('ce')
      .select('SUM(ce.costCents)', 'total')
      .where('ce.agentId = :agentId', { agentId })
      .andWhere('EXTRACT(YEAR FROM ce.createdAt) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM ce.createdAt) = :month', { month })
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { IIssue } from '@aicompany/shared';
import { IssueModel } from '../persistence/models/issue-model.js';
import type {
  IIssueRepository,
  IssueFilters,
} from '../../domain/repositories/i-issue-repository.js';
import { BaseRepository } from './base-repository.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@Injectable()
export class IssueRepository
  extends BaseRepository<IssueModel>
  implements IIssueRepository
{
  constructor(
    @InjectRepository(IssueModel)
    repo: Repository<IssueModel>,
    private readonly dataSource: DataSource,
  ) {
    super(repo);
  }

  findByIdAndCompany(id: string, companyId: string): Promise<IIssue | null> {
    return this.repo.findOneBy({ id, companyId });
  }

  findAllByCompany(companyId: string, filters?: IssueFilters): Promise<IIssue[]> {
    const qb = this.repo.createQueryBuilder('i').where('i.companyId = :companyId', { companyId });
    if (filters?.status) qb.andWhere('i.status = :status', { status: filters.status });
    if (filters?.priority) qb.andWhere('i.priority = :priority', { priority: filters.priority });
    if (filters?.assigneeAgentId)
      qb.andWhere('i.assigneeAgentId = :aid', { aid: filters.assigneeAgentId });
    if (filters?.projectId) qb.andWhere('i.projectId = :pid', { pid: filters.projectId });
    const limit = Math.min(filters?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = filters?.offset ?? 0;
    return qb.take(limit).skip(offset).orderBy('i.createdAt', 'DESC').getMany();
  }

  async atomicCheckout(issueId: string, runId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE issues SET checkout_run_id = $1, status = 'in_progress'
       WHERE id = $2 AND checkout_run_id IS NULL`,
      [runId, issueId],
    );
    return (result as { rowCount?: number })?.rowCount === 1;
  }

  async release(issueId: string, runId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE issues SET checkout_run_id = NULL, status = 'todo'
       WHERE id = $1 AND checkout_run_id = $2`,
      [issueId, runId],
    );
    return (result as { rowCount?: number })?.rowCount === 1;
  }

  searchByTitle(companyId: string, q: string, limit = DEFAULT_LIMIT): Promise<IIssue[]> {
    return this.repo
      .createQueryBuilder('i')
      .where('i.companyId = :companyId', { companyId })
      .andWhere('i.title ILIKE :q', { q: `%${q}%` })
      .take(Math.min(limit, MAX_LIMIT))
      .orderBy('i.createdAt', 'DESC')
      .getMany();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IActivityEntry } from '@aicompany/shared';
import { ActivityEntryModel } from '../persistence/models/activity-entry-model.js';
import type { IActivityRepository } from '../../domain/repositories/i-activity-repository.js';

const DEFAULT_LIMIT = 50;

@Injectable()
export class ActivityRepository implements IActivityRepository {
  constructor(
    @InjectRepository(ActivityEntryModel)
    private readonly repo: Repository<ActivityEntryModel>,
  ) {}

  async create(entry: Partial<IActivityEntry>): Promise<IActivityEntry> {
    const entity = this.repo.create(entry as ActivityEntryModel);
    return this.repo.save(entity);
  }

  findAllByEntity(
    companyId: string,
    entityType: string,
    entityId: string,
    limit = DEFAULT_LIMIT,
  ): Promise<IActivityEntry[]> {
    return this.repo
      .createQueryBuilder('a')
      .where('a.companyId = :companyId', { companyId })
      .andWhere('a.entityType = :entityType', { entityType })
      .andWhere('a.entityId = :entityId', { entityId })
      .orderBy('a.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  findAllByCompany(companyId: string, limit = DEFAULT_LIMIT): Promise<IActivityEntry[]> {
    return this.repo
      .createQueryBuilder('a')
      .where('a.companyId = :companyId', { companyId })
      .orderBy('a.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}

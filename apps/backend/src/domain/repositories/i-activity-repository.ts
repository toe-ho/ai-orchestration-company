import type { IActivityEntry } from '@aicompany/shared';

export interface IActivityRepository {
  create(entry: Partial<IActivityEntry>): Promise<IActivityEntry>;
  findAllByEntity(
    companyId: string,
    entityType: string,
    entityId: string,
    limit?: number,
  ): Promise<IActivityEntry[]>;
  findAllByCompany(companyId: string, limit?: number): Promise<IActivityEntry[]>;
}

export const ACTIVITY_REPOSITORY = Symbol('IActivityRepository');

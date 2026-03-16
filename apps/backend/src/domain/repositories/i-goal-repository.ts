import type { IGoal } from '@aicompany/shared';

export interface IGoalRepository {
  findById(id: string): Promise<IGoal | null>;
  findAllByCompany(companyId: string): Promise<IGoal[]>;
  create(data: Partial<IGoal>): Promise<IGoal>;
  update(id: string, partial: Partial<IGoal>): Promise<IGoal | null>;
}

export const GOAL_REPOSITORY = Symbol('IGoalRepository');

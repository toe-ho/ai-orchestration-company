import type { CostEventModel } from '../../infrastructure/persistence/models/cost-event-model.js';

export interface CostSummary {
  totalCents: number;
  byAgent: Array<{ agentId: string; totalCents: number }>;
  byProvider: Array<{ provider: string; totalCents: number }>;
  byDay: Array<{ date: string; totalCents: number }>;
}

export interface ICostEventRepository {
  create(data: Partial<CostEventModel>): Promise<CostEventModel>;
  findByCompany(companyId: string, from: Date, to: Date): Promise<CostEventModel[]>;
  getSummary(companyId: string, from: Date, to: Date): Promise<CostSummary>;
  sumByCompanyMonth(companyId: string, year: number, month: number): Promise<number>;
  sumByAgentMonth(agentId: string, year: number, month: number): Promise<number>;
}

export const COST_EVENT_REPOSITORY = Symbol('ICostEventRepository');

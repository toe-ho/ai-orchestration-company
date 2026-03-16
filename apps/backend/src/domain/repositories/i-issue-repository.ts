import type { IIssue } from '@aicompany/shared';

export interface IssueFilters {
  status?: string;
  priority?: string;
  assigneeAgentId?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export interface IIssueRepository {
  findById(id: string): Promise<IIssue | null>;
  findByIdAndCompany(id: string, companyId: string): Promise<IIssue | null>;
  findAllByCompany(companyId: string, filters?: IssueFilters): Promise<IIssue[]>;
  create(data: Partial<IIssue>): Promise<IIssue>;
  update(id: string, partial: Partial<IIssue>): Promise<IIssue | null>;
  /** Atomically assigns runId; returns true if checkout succeeded */
  atomicCheckout(issueId: string, runId: string): Promise<boolean>;
  /** Returns true if release succeeded (runId matched); false if runId mismatch */
  release(issueId: string, runId: string): Promise<boolean>;
  searchByTitle(companyId: string, q: string, limit?: number): Promise<IIssue[]>;
}

export const ISSUE_REPOSITORY = Symbol('IIssueRepository');

export interface IActor {
  type: 'board' | 'agent' | 'system';
  userId?: string;
  agentId?: string;
  companyId?: string;
  runId?: string;
}

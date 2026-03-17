export const queryKeys = {
  auth: {
    session: () => ['auth', 'session'] as const,
  },
  companies: {
    all: () => ['companies'] as const,
    detail: (cid: string) => ['companies', cid] as const,
  },
  agents: {
    list: (cid: string, status?: string) => ['companies', cid, 'agents', { status }] as const,
    orgTree: (cid: string) => ['companies', cid, 'agents', 'org-tree'] as const,
    detail: (cid: string, id: string) => ['companies', cid, 'agents', id] as const,
  },
  issues: {
    list: (cid: string, params?: Record<string, unknown>) =>
      ['companies', cid, 'issues', params] as const,
    detail: (cid: string, id: string) => ['companies', cid, 'issues', id] as const,
    comments: (cid: string, id: string) => ['companies', cid, 'issues', id, 'comments'] as const,
  },
  runs: {
    list: (cid: string, params?: Record<string, unknown>) =>
      ['companies', cid, 'runs', params] as const,
    detail: (cid: string, rid: string) => ['companies', cid, 'runs', rid] as const,
    events: (cid: string, rid: string) => ['companies', cid, 'runs', rid, 'events'] as const,
  },
  dashboard: {
    summary: (cid: string) => ['companies', cid, 'dashboard'] as const,
  },
  goals: {
    list: (cid: string) => ['companies', cid, 'goals'] as const,
  },
  projects: {
    list: (cid: string) => ['companies', cid, 'projects'] as const,
    detail: (cid: string, id: string) => ['companies', cid, 'projects', id] as const,
  },
};

export const API_PATHS = {
  COMPANIES: '/api/companies',
  COMPANY: (id: string) => `/api/companies/${id}`,
  COMPANY_AGENTS: (companyId: string) => `/api/companies/${companyId}/agents`,
  COMPANY_AGENT: (companyId: string, agentId: string) => `/api/companies/${companyId}/agents/${agentId}`,
  COMPANY_ISSUES: (companyId: string) => `/api/companies/${companyId}/issues`,
  COMPANY_ISSUE: (companyId: string, issueId: string) => `/api/companies/${companyId}/issues/${issueId}`,
  ISSUE_CHECKOUT: (issueId: string) => `/api/issues/${issueId}/checkout`,
  ISSUE_COMMENTS: (issueId: string) => `/api/issues/${issueId}/comments`,
  AGENT_ME: '/api/agents/me',
  AGENT_INBOX: '/api/agents/me/inbox-lite',
  HEALTH: '/health',
} as const;

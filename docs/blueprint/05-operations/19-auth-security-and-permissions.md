# 19 — Auth, Security & Permissions

## User Authentication

### Better Auth (Session-Based)
- `POST /api/auth/sign-up/email` — Create account
- `POST /api/auth/sign-in/email` — Login
- OAuth support: Google, GitHub
- Cookie-based sessions stored in `authSessions` table
- Session expiry + refresh

### User → Company Relationship
- Users can own/access multiple companies
- `userCompanies` junction table with role
- Roles: `owner`, `admin`, `viewer`
- Owner can manage billing, delete company
- Admin can manage agents, approve requests
- Viewer can only watch dashboard

## Agent Authentication

### Ephemeral JWT (Per Heartbeat)
Created by server during execution:
```
Claims: { sub: agentId, company_id, run_id, exp: +48h }
```
- Injected as `API_KEY` env var into the Fly.io VM
- Used by agent to call back to control plane API
- 48-hour TTL (configurable)

### Persistent Agent API Key
- Created via `POST /api/agents/:id/keys`
- Returns `pcp_<random>` (shown once)
- Stored as SHA-256 hash
- No expiry, revocable
- For agents that need long-lived access

### X-Run-Id Header (Audit Trail)
All agent mutations must include:
```
X-Run-Id: <heartbeat-run-uuid>
```
Links every API call to a specific execution for traceability.

## LLM API Key Security (Critical)

Users enter their LLM API keys (Anthropic, OpenAI, Google) in the dashboard. These keys are the most sensitive data in the system.

### Security Flow
```
1. User pastes key in UI
2. Client sends to server via HTTPS
3. Server validates key (test API call)
4. Server encrypts with AES-256
5. Stored in companyApiKeys table (encrypted)
6. Raw key NEVER stored, NEVER logged
7. During heartbeat: decrypted in server memory only
8. Passed to Execution Engine as part of execution request
9. Agent Executor injects as env var to agent process on VM
10. After heartbeat: key reference discarded from memory
```

### What We NEVER Do
- Store raw API keys anywhere
- Log API keys in activity log or events
- Write keys to VM filesystem
- Include keys in run events or transcripts
- Send keys to browser after initial entry
- Store keys in Redis or cache

### Key Validation
On entry, we make a test API call:
```
Anthropic: GET /v1/models (with key)
  → 200: Valid ✅
  → 401: Invalid key → show error with guidance
  → 429: Rate limited → valid but throttled ⚠️
```

## Actor Model

Every request resolves to one of three actor types:

```typescript
req.actor = {
  type: "user" | "agent" | "none",

  // User
  userId?: string,
  companyIds?: string[],
  companyRoles?: Map<string, string>,

  // Agent
  agentId?: string,
  companyId?: string,  // Agents are single-company
  runId?: string,

  source: "session" | "agent_jwt" | "agent_key" | "none"
}
```

### Authorization Checks
- **Company access:** User must be member. Agent must be in same company.
- **Role-based:** Owner/admin can mutate. Viewer is read-only.
- **Agent scope:** Agents can only access their own company.

## Governance Controls

### Board Approval Gates
- Agent hiring requires approval (configurable)
- CEO strategy requires approval (configurable)
- Budget increases require approval

### Budget Enforcement
- Per-agent monthly budget (hard cap)
- Per-company monthly budget (hard cap)
- Auto-pause at 100%
- Warning alerts at 50%, 80%
- Kill switch: pause all agents instantly

### Agent Permissions
```json
{
  "agents:create": false,
  "tasks:assign": true,
  "tasks:assign_scope": "own_team",
  "approvals:create": true
}
```

### Self-Hiring Limits
- Max agents per company (default: 20)
- Max hire depth (default: 3 levels)
- Budget required on every hire
- Board approval required (default)

## Multi-Tenant Data Isolation

- Every table has `companyId`
- Every query filters by `companyId`
- Compound indexes for performance
- Users only see companies they belong to
- Agents only access their own company
- Fly.io VMs are per-company (hardware isolation via Firecracker)

## Input Validation

- Zod schemas validate all request bodies
- Invalid input → 400 with field-level errors
- Prevents injection, malformed data, type confusion

## Log Redaction

- API keys scrubbed from all logs
- Email addresses redacted in activity details
- Home paths replaced with `[redacted]` in agent output
- Adapter configs sanitized before logging

## Infrastructure Security

| Layer | Protection |
|-------|-----------|
| HTTPS | All traffic encrypted in transit |
| Fly.io VMs | Firecracker hardware isolation per company |
| Database | Managed PostgreSQL with encryption at rest |
| API Keys | AES-256 encryption at rest |
| Redis | TLS connection, no persistent storage |
| S3 | Server-side encryption |
| Secrets | Never in git, env vars for server config |

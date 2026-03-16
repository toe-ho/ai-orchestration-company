# Phase 8: Cost Tracking + Approvals + Governance

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 3 (approval CRUD stubs), Phase 4 (cost events from heartbeat runs)
- Docs: [12-api-architecture](../../docs/blueprint/03-architecture/12-api-architecture-nestjs.md), [15-database-design](../../docs/blueprint/04-data-and-api/15-database-design.md), [17-api-design](../../docs/blueprint/04-data-and-api/17-api-design.md)

## Overview
- **Date:** 2026-03-16
- **Priority:** P2
- **Status:** pending
- **Review:** pending
- **Description:** Implement cost event recording, budget reconciliation, cost dashboard widget, approval workflow (create/approve/reject/request-revision), hire approval → auto-create agent, API key vault (AES-256 encrypt/decrypt), and agent persistent API keys (pcp_ prefix).

## Key Insights
- CostEvent records per-run: provider, model, tokens, costCents, computeCostCents
- Budget reconciliation nightly: sum costEvents, update company/agent spentMonthlyCents
- Approval types: hire_agent, approve_strategy — resolved triggers domain event
- OnApprovalResolved → if type=hire_agent + approved → CreateAgentCommand
- API key vault: AES-256-GCM, key from ENCRYPTION_KEY env var, IV stored with ciphertext
- Agent API keys: `pcp_` prefix + 32 random bytes, only SHA-256 hash stored

## Requirements

### Functional
- **Cost tracking:**
  - RecordCostEventCommand: persist costEvent per heartbeat run
  - ReconcileBudgetsCommand: nightly cron, sum costs, update spend counters
  - GetCostSummaryQuery: by company, date range, agent, provider
  - Cost dashboard widget in frontend
- **Approvals:**
  - CreateApprovalCommand: type, title, description, requestedBy (agent or user)
  - ApproveCommand: resolve as approved
  - RejectCommand: resolve as rejected
  - RequestRevisionCommand: ask for changes
  - ApprovalComment: threaded discussion on approvals
  - OnApprovalResolved event handler: hire_agent → CreateAgent
- **API Key Vault (user's LLM keys):**
  - StoreApiKeyCommand: encrypt with AES-256-GCM, store
  - ValidateApiKeyCommand: decrypt, call provider health endpoint
  - RevokeApiKeyCommand: soft delete
  - List keys (masked — first 4 + last 4 chars only)
- **Agent API Keys (persistent internal auth):**
  - CreateAgentApiKeyCommand: generate `pcp_` + 32 random bytes, store SHA-256 hash
  - RevokeAgentApiKeyCommand: set revokedAt
  - Used by AgentAuthGuard (Phase 2) as alternative to JWT

### Non-Functional
- AES-256-GCM with random IV per encryption
- ENCRYPTION_KEY: 32 bytes, from env var
- Budget check in heartbeat handler (Phase 4) uses cached spend value
- Nightly reconciliation corrects any drift

## Architecture

```
HeartbeatRun completion
        │
        ▼
RecordCostEvent → costEvents table
        │
        ▼ (nightly)
ReconcileBudgets → SUM(costEvents) → update company.spentMonthlyCents
                                    → update agent.spentMonthlyCents
                                    → if over budget → BudgetExceededEvent

Approval Flow:
Agent requests hire → CreateApproval(type: hire_agent)
                            │
Board user reviews    ──────┤
                            ▼
              ApproveCommand → ApprovalResolvedEvent
                                      │
                                      ▼
                          OnApprovalResolved
                          → if hire_agent + approved
                          → CreateAgentCommand (auto-create)
```

## Related Code Files

### Application — Commands
- `application/commands/cost/record-cost-event-command.ts` + handler
- `application/commands/cost/reconcile-budgets-command.ts` + handler
- `application/commands/approval/create-approval-command.ts` + handler
- `application/commands/approval/approve-command.ts` + handler
- `application/commands/approval/reject-command.ts` + handler
- `application/commands/approval/request-revision-command.ts` + handler
- `application/commands/api-key-vault/store-api-key-command.ts` + handler
- `application/commands/api-key-vault/validate-api-key-command.ts` + handler
- `application/commands/api-key-vault/revoke-api-key-command.ts` + handler
- `application/commands/agent/create-agent-api-key-command.ts` + handler
- `application/commands/agent/revoke-agent-api-key-command.ts` + handler

### Application — Queries
- `application/queries/cost/get-cost-summary-query.ts` + handler
- `application/queries/approval/list-approvals-query.ts` + handler
- `application/queries/approval/get-approval-query.ts` + handler

### Application — Services
- `application/services/interface/i-api-key-vault-service.ts`
- `application/services/interface/i-encryption-service.ts`
- `application/services/impl/api-key-vault-service.ts` — encrypt/decrypt/validate
- `application/services/impl/aes-encryption-service.ts` — AES-256-GCM

### Application — Events
- `application/events/approval-resolved-event.ts`
- `application/events/handlers/on-approval-resolved.ts` — auto-create agent on hire

### Infrastructure
- `infrastructure/repositories/cost-event-repository.ts`
- `infrastructure/repositories/approval-repository.ts`
- `infrastructure/repositories/company-api-key-repository.ts`
- `infrastructure/repositories/agent-api-key-repository.ts` (if not in agent repo)
- `infrastructure/workers/budget-reconciliation-worker.ts` — nightly cron

### Presentation
- `presentation/controllers/impl/board/board-approval-controller.ts`
- `presentation/controllers/impl/board/board-cost-controller.ts`
- `presentation/controllers/impl/board/board-api-key-vault-controller.ts`
- `presentation/controllers/impl/agent/agent-approval-controller.ts` — agent creates hire request
- `presentation/controllers/dto/approval/create-approval-dto.ts`
- `presentation/controllers/dto/approval/resolve-approval-dto.ts`
- `presentation/controllers/dto/api-key-vault/store-api-key-dto.ts`

### Utils
- `utils/encryption.ts` — AES-256-GCM encrypt/decrypt functions
- `utils/hash.ts` — SHA-256 (already from Phase 2)

## Implementation Steps

1. **AES encryption utility**
   - `encrypt(plaintext, key)`: generate random 16-byte IV, AES-256-GCM, return `iv:ciphertext:authTag` (base64)
   - `decrypt(encrypted, key)`: split, verify authTag, return plaintext
   - Key from ENCRYPTION_KEY env var (base64-decoded to 32 bytes)

2. **API Key Vault service**
   - `store(companyId, provider, rawKey, label)`: encrypt key, hash for dedup, insert
   - `retrieve(companyId, provider)`: find latest valid key, decrypt, return
   - `validate(companyId, keyId)`: decrypt, call provider health (Anthropic: GET /v1/models)
   - `revoke(keyId)`: set revokedAt
   - `listMasked(companyId)`: return keys with only first 4 + last 4 chars visible

3. **API Key Vault controller**
   - GET /api/companies/:id/api-keys — listMasked
   - POST /api/companies/:id/api-keys — store (body: { provider, key, label })
   - DELETE /api/companies/:id/api-keys/:kid — revoke
   - POST /api/companies/:id/api-keys/:kid/validate — test key

4. **Cost event recording**
   - RecordCostEventHandler: insert costEvent with agentId, provider, model, tokens, cents
   - Called by InvokeHeartbeatHandler on run completion (Phase 4)

5. **Budget reconciliation worker**
   - @Cron('0 2 * * *') — run at 2 AM daily
   - pg advisory lock for single instance
   - SUM costEvents for current month, group by companyId and agentId
   - UPDATE company.spentMonthlyCents, agent.spentMonthlyCents
   - If any exceed budget → publish BudgetExceededEvent
   - Reset counters on 1st of month

6. **Cost summary query**
   - Params: companyId, dateFrom, dateTo, agentId (optional), provider (optional)
   - Aggregate: total cost, by agent, by provider, by day
   - Return: { totalCents, byAgent: [...], byProvider: [...], byDay: [...] }

7. **Approval commands**
   - CreateApprovalHandler: insert approval (status: pending), log activity
   - ApproveHandler: set status=approved, set resolvedBy, resolvedAt, publish ApprovalResolvedEvent
   - RejectHandler: set status=rejected
   - RequestRevisionHandler: set status=revision_requested

8. **OnApprovalResolved event handler**
   - Listen for ApprovalResolvedEvent
   - If type=hire_agent AND status=approved:
     - Extract agent config from approval.details
     - Dispatch CreateAgentCommand
   - Log activity

9. **Agent API keys**
   - CreateAgentApiKeyHandler:
     - Generate: `pcp_` + crypto.randomBytes(32).toString('hex')
     - Hash: SHA-256(raw key)
     - Store hash + metadata in agentApiKeys table
     - Return raw key ONCE in response
   - RevokeAgentApiKeyHandler: set revokedAt

10. **Agent approval controller**
    - POST /api/companies/:cid/approvals — agent creates hire_agent approval
    - Uses AgentAuthGuard

11. **Frontend: cost dashboard widget**
    - useQuery with getCostSummary
    - Bar chart: daily spend for current month
    - Pie chart: spend by agent
    - Budget bar: spend vs limit

12. **Frontend: approvals page**
    - List pending approvals with approve/reject buttons
    - Approval detail: description, comments, resolution

## Todo List
- [ ] AES encryption utility (encrypt/decrypt)
- [ ] ApiKeyVaultService (store/retrieve/validate/revoke)
- [ ] API key vault controller + DTOs
- [ ] RecordCostEvent command + handler
- [ ] ReconcileBudgets command + handler + cron worker
- [ ] GetCostSummary query + handler
- [ ] Cost controller
- [ ] Approval commands (create/approve/reject/request-revision)
- [ ] Approval queries (list/get)
- [ ] Approval controller (board + agent)
- [ ] ApprovalResolvedEvent + OnApprovalResolved handler
- [ ] Agent API key commands (create/revoke)
- [ ] CostEvent repository
- [ ] Approval repository
- [ ] CompanyApiKey repository
- [ ] AgentApiKey repository
- [ ] Frontend: cost dashboard widget
- [ ] Frontend: approvals list + detail pages
- [ ] Test: encrypt → decrypt roundtrip
- [ ] Test: approval → auto-create agent flow
- [ ] Test: budget reconciliation accuracy

## Success Criteria
- API keys encrypted at rest, decrypted only when needed
- Cost summary matches sum of individual cost events
- Budget reconciliation updates spend counters accurately
- Approval approved → agent auto-created (hire flow)
- Agent API key: raw shown once, only hash in DB
- Cost widget renders in dashboard
- Approvals page shows pending items with action buttons

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Encryption key rotation | Low | High | Document rotation procedure, support key versioning (future) |
| Budget reconciliation drift | Medium | Medium | Nightly reconciliation corrects any per-run tracking errors |
| Approval race condition (double approve) | Low | Low | Check status before resolving, idempotent |

## Security Considerations
- AES-256-GCM with unique IV per encryption (not ECB)
- ENCRYPTION_KEY never logged, never in response
- Decrypted API keys held in memory briefly, not cached
- Agent API key raw value shown once, never retrievable
- Cost data scoped by companyId
- Approval resolution requires owner/admin role

## Next Steps
- Phase 9: templates use approval flow for guided setup
- Future: Stripe billing integration, credit purchase

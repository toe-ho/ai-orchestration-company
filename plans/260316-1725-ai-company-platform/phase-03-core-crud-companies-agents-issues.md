# Phase 3: Core CRUD — Companies, Agents, Issues

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 1 (entities + models), Phase 2 (auth guards + decorators)
- Docs: [12-api-architecture](../../docs/blueprint/03-architecture/12-api-architecture-nestjs.md), [17-api-design](../../docs/blueprint/04-data-and-api/17-api-design.md)

## Overview
- **Date:** 2026-03-16
- **Priority:** P1 — core domain operations
- **Status:** pending
- **Review:** pending
- **Description:** Implement CQRS command/query bus, all CRUD for companies/agents/issues/goals/projects, board controllers, DTOs, ZodValidationPipe, activity logging, company scope interceptor.

## Key Insights
- CQRS in NestJS: each command/query has exactly one handler; register via CqrsModule
- Commands mutate state (return void or result); Queries read only (no side effects)
- Atomic issue checkout: UPDATE WHERE checkout_run_id IS NULL (row-level lock)
- Activity log via interceptor — auto-logs all mutations
- CompanyScopeInterceptor auto-injects companyId into queries

## Requirements

### Functional
- CQRS bus setup with @nestjs/cqrs
- **Company:** create, update, delete, list (user's companies), get
- **Agent:** create, update, pause, resume, terminate, list, get, org tree
- **Issue:** create, update, list (filtered), get, search, atomic checkout/release, comments, attachments
- **Goal:** create, update, list (hierarchical), get
- **Project:** create, update, list, get, create workspace
- Board controllers (session auth) for all above
- Agent controllers (JWT auth) for self-access + issue mutations
- ZodValidationPipe using shared Zod schemas
- ActivityLogInterceptor — log mutations to activityLog
- CompanyScopeInterceptor — inject companyId
- HttpExceptionFilter — format errors as { error, details }
- HealthCheckController — GET /api/health

### Non-Functional
- All queries scoped by companyId (multi-tenant)
- Pagination: cursor-based or offset with limit (default 50, max 100)
- Files < 200 lines each

## Architecture

```
Controller → ZodValidationPipe → Guard → Interceptor → CommandBus/QueryBus → Handler → Repository

Board controllers:  /api/companies/:cid/agents, /api/companies/:cid/issues, etc.
Agent controllers:  /api/agents/me, /api/issues/:id/checkout, etc.
```

## Related Code Files

### Domain Layer (already from Phase 1, used here)
- `domain/entities/*` — interfaces
- `domain/repositories/*` — repository contracts
- `domain/enums/*`
- `domain/exceptions/*` — IssueAlreadyCheckedOutException

### Application — Commands
- `application/commands/company/create-company-command.ts` + handler
- `application/commands/company/update-company-command.ts` + handler
- `application/commands/company/delete-company-command.ts` + handler
- `application/commands/agent/create-agent-command.ts` + handler
- `application/commands/agent/update-agent-command.ts` + handler
- `application/commands/agent/pause-agent-command.ts` + handler
- `application/commands/agent/resume-agent-command.ts` + handler
- `application/commands/agent/terminate-agent-command.ts` + handler
- `application/commands/issue/create-issue-command.ts` + handler
- `application/commands/issue/update-issue-command.ts` + handler
- `application/commands/issue/checkout-issue-command.ts` + handler
- `application/commands/issue/release-issue-command.ts` + handler
- `application/commands/issue/add-comment-command.ts` + handler
- `application/commands/goal/create-goal-command.ts` + handler
- `application/commands/goal/update-goal-command.ts` + handler
- `application/commands/project/create-project-command.ts` + handler
- `application/commands/project/update-project-command.ts` + handler
- `application/commands/project/create-workspace-command.ts` + handler
- `application/commands/activity/log-activity-command.ts` + handler

### Application — Queries
- `application/queries/company/get-company-query.ts` + handler
- `application/queries/company/list-companies-query.ts` + handler
- `application/queries/agent/get-agent-query.ts` + handler
- `application/queries/agent/list-agents-query.ts` + handler
- `application/queries/agent/get-org-tree-query.ts` + handler
- `application/queries/issue/get-issue-query.ts` + handler
- `application/queries/issue/list-issues-query.ts` + handler
- `application/queries/issue/search-issues-query.ts` + handler
- `application/queries/issue/list-comments-query.ts` + handler
- `application/queries/goal/list-goals-query.ts` + handler
- `application/queries/project/list-projects-query.ts` + handler
- `application/queries/project/get-project-query.ts` + handler
- `application/queries/activity/list-activity-query.ts` + handler
- `application/queries/dashboard/get-dashboard-summary-query.ts` + handler

### Infrastructure — Repositories
- `infrastructure/repositories/base-repository.ts` — generic CRUD
- `infrastructure/repositories/company-repository.ts`
- `infrastructure/repositories/agent-repository.ts` — includes org tree query
- `infrastructure/repositories/issue-repository.ts` — includes atomicCheckout
- `infrastructure/repositories/goal-repository.ts`
- `infrastructure/repositories/project-repository.ts`
- `infrastructure/repositories/activity-repository.ts`

### Presentation — Controllers
- `presentation/controllers/dto/company/create-company-dto.ts`
- `presentation/controllers/dto/company/update-company-dto.ts`
- `presentation/controllers/dto/agent/create-agent-dto.ts`
- `presentation/controllers/dto/agent/update-agent-dto.ts`
- `presentation/controllers/dto/issue/create-issue-dto.ts`
- `presentation/controllers/dto/issue/update-issue-dto.ts`
- `presentation/controllers/dto/issue/checkout-issue-dto.ts`
- `presentation/controllers/dto/issue/add-comment-dto.ts`
- `presentation/controllers/impl/board/board-company-controller.ts`
- `presentation/controllers/impl/board/board-agent-controller.ts`
- `presentation/controllers/impl/board/board-issue-controller.ts`
- `presentation/controllers/impl/board/board-goal-controller.ts`
- `presentation/controllers/impl/board/board-project-controller.ts`
- `presentation/controllers/impl/board/board-activity-controller.ts`
- `presentation/controllers/impl/board/board-dashboard-controller.ts`
- `presentation/controllers/impl/agent/agent-self-controller.ts`
- `presentation/controllers/impl/agent/agent-issue-controller.ts`
- `presentation/controllers/impl/internal/health-check-controller.ts`

### Cross-cutting
- `pipe/zod-validation-pipe.ts`
- `interceptor/activity-log-interceptor.ts`
- `interceptor/company-scope-interceptor.ts`
- `interceptor/http-logger-interceptor.ts`
- `filter/http-exception-filter.ts`
- `module/api-module.ts` — register all controllers
- `module/shared-module.ts` — register repos, services, handlers

## Implementation Steps

1. **CQRS setup**
   - Import CqrsModule in shared-module.ts
   - Create command/query barrel exports for handler registration
   - Pattern: each command file exports class, each handler file exports @CommandHandler class

2. **Base repository**
   - Generic TypeORM CRUD: findById, findByIdAndCompany, findAll, create, update, delete
   - Always filter by companyId (except user-level queries)

3. **Company domain**
   - CreateCompanyHandler: insert company + create userCompanies entry (owner role)
   - UpdateCompanyHandler: partial update
   - DeleteCompanyHandler: soft delete (set status: archived)
   - ListCompaniesHandler: via userCompanies junction for current user
   - GetCompanyHandler: by id + access check

4. **Agent domain**
   - CreateAgentHandler: validate reportsTo exists, set status=idle
   - UpdateAgentHandler: partial update, create config revision snapshot
   - PauseAgentHandler: set status=paused, publish AgentStatusChangedEvent
   - ResumeAgentHandler: set status=active
   - TerminateAgentHandler: set status=terminated (irreversible)
   - ListAgentsHandler: by companyId with status filter
   - GetOrgTreeHandler: recursive query on reportsTo

5. **Issue domain**
   - CreateIssueHandler: auto-generate identifier (prefix-counter), increment company.issueCounter
   - UpdateIssueHandler: status transitions, assignee changes
   - CheckoutIssueHandler: `UPDATE issues SET checkout_run_id = ?, status = 'in_progress' WHERE id = ? AND checkout_run_id IS NULL` — returns affected rows
   - ReleaseIssueHandler: clear checkout_run_id
   - AddCommentHandler: insert issueComment with actor info
   - ListIssuesHandler: filter by status, priority, assignee, project
   - SearchIssuesHandler: ILIKE on title + description

6. **Goal + Project domains**
   - Standard CRUD, hierarchical goals via parentId
   - CreateWorkspaceHandler: link git repo URL to project

7. **Activity logging**
   - LogActivityCommand: insert into activityLog with actor, action, entity, details
   - ActivityLogInterceptor: after successful mutations, auto-dispatch LogActivityCommand

8. **ZodValidationPipe**
   - Accept Zod schema in constructor
   - transform() validates body, throws BadRequestException with formatted errors
   - Use @UsePipes(new ZodValidationPipe(schema)) on controller methods

9. **Company scope interceptor**
   - Extract companyId from route params (:cid)
   - Attach to request for downstream handlers
   - Validate against actor's companies

10. **Controllers**
    - Board controllers: @UseGuards(BoardAuthGuard, CompanyAccessGuard)
    - Agent controllers: @UseGuards(AgentAuthGuard, CompanyAccessGuard)
    - Health: @AllowAnonymous()
    - All mutations dispatch commands; all reads dispatch queries

11. **Module registration**
    - shared-module.ts: all repos + services + handlers (global)
    - api-module.ts: all controllers

## Todo List
- [ ] CQRS module setup + barrel exports
- [ ] Base repository (generic TypeORM CRUD)
- [ ] Company: 3 commands + 2 queries + repository + controller + DTOs
- [ ] Agent: 5 commands + 3 queries + repository + controller + DTOs
- [ ] Issue: 4 commands + 4 queries + repository + controller + DTOs
- [ ] Goal: 2 commands + 1 query + repository + controller
- [ ] Project: 3 commands + 2 queries + repository + controller
- [ ] Activity: 1 command + 1 query + repository
- [ ] Dashboard summary query
- [ ] ZodValidationPipe
- [ ] ActivityLogInterceptor
- [ ] CompanyScopeInterceptor
- [ ] HttpExceptionFilter
- [ ] HttpLoggerInterceptor
- [ ] HealthCheckController
- [ ] Agent self controller (GET /agents/me)
- [ ] Agent issue controller (checkout, update, comment)
- [ ] Module registration (shared-module + api-module)
- [ ] Integration test: company CRUD flow
- [ ] Integration test: issue checkout atomicity

## Success Criteria
- All CRUD endpoints return correct data with proper status codes
- Atomic checkout: two concurrent requests → one gets 200, other gets 409
- Activity log populated after every mutation
- CompanyScopeInterceptor prevents cross-tenant access
- ZodValidationPipe rejects invalid payloads with descriptive errors
- Dashboard summary returns agent/issue/run counts
- Org tree query returns hierarchical agent structure

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Atomic checkout race condition | Medium | Critical | Use UPDATE WHERE + row count check, add integration test |
| N+1 queries in list endpoints | Medium | Medium | Use QueryBuilder with joins, add indexes |
| CQRS boilerplate overhead | High | Low | Accept it — structure pays off for testability |

## Security Considerations
- All board endpoints require authenticated session
- All agent endpoints require valid JWT or API key
- companyId always validated against actor's access
- Issue checkout requires X-Run-Id header (agent only)
- Soft deletes prevent data loss on company/agent deletion
- Input validation via Zod on all write endpoints

## Next Steps
- Phase 4: heartbeat commands use agent + issue repos
- Phase 6: frontend consumes these CRUD endpoints

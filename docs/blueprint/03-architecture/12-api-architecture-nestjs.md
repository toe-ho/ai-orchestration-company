# 12 — API Architecture (NestJS + TypeORM + CQRS)

Full backend architecture using NestJS with Clean Architecture, TypeORM for persistence, and CQRS for command/query separation.

## Monorepo Structure

```
your-product/
├── apps/
│   ├── backend/                    ← NestJS API + Scheduler (@nestjs/schedule)
│   ├── web/                        ← React frontend (Vite)
│   └── executor/                   ← Agent Executor (Fly.io VM)
├── packages/
│   ├── shared/                     ← Types, constants, validators (Zod)
│   ├── adapters/                   ← Agent runtime integrations
│   └── adapter-utils/              ← Shared adapter utilities
├── config/
│   ├── skills/                     ← Agent instruction files
│   └── templates/                  ← Company templates
├── turbo.json
└── package.json
```

## API Directory Structure

```
apps/backend/src/
├── main.ts                                    # Bootstrap + entry point
├── app.module.ts                              # Root module
│
├── config/
│   ├── app.config.ts                          # Env parsing + validation
│   ├── database.config.ts                     # TypeORM connection config
│   ├── redis.config.ts                        # Upstash Redis config
│   ├── flyio.config.ts                        # Fly.io API config
│   └── auth.config.ts                         # JWT + session secrets
│
│ ─────────────────────────────────────────────
│  DOMAIN LAYER (zero framework imports)
│ ─────────────────────────────────────────────
│
├── domain/
│   ├── entities/
│   │   ├── Company.ts                         # Company entity interface
│   │   ├── Agent.ts                           # Agent entity interface
│   │   ├── Issue.ts                           # Issue/task entity interface
│   │   ├── HeartbeatRun.ts                    # Run entity interface
│   │   ├── HeartbeatRunEvent.ts               # Run event interface
│   │   ├── Goal.ts
│   │   ├── Project.ts
│   │   ├── ProjectWorkspace.ts
│   │   ├── Approval.ts
│   │   ├── CostEvent.ts
│   │   ├── ActivityEntry.ts
│   │   ├── CompanyApiKey.ts                   # User's LLM API key
│   │   ├── CompanyVm.ts                       # Fly.io VM state
│   │   ├── AgentApiKey.ts                     # Internal agent auth key
│   │   ├── AgentRuntimeState.ts
│   │   ├── AgentTaskSession.ts
│   │   ├── AgentWakeupRequest.ts
│   │   ├── AgentConfigRevision.ts
│   │   ├── IssueComment.ts
│   │   ├── IssueAttachment.ts
│   │   ├── Label.ts
│   │   ├── ApprovalComment.ts
│   │   ├── CompanyTemplate.ts
│   │   ├── Asset.ts
│   │   └── UserCompany.ts
│   │
│   ├── repositories/                          # Repository contracts (interfaces)
│   │   ├── ICompanyRepository.ts
│   │   ├── IAgentRepository.ts
│   │   ├── IIssueRepository.ts
│   │   ├── IHeartbeatRunRepository.ts
│   │   ├── IHeartbeatRunEventRepository.ts
│   │   ├── IGoalRepository.ts
│   │   ├── IProjectRepository.ts
│   │   ├── IApprovalRepository.ts
│   │   ├── ICostEventRepository.ts
│   │   ├── IActivityRepository.ts
│   │   ├── ICompanyApiKeyRepository.ts
│   │   ├── ICompanyVmRepository.ts
│   │   ├── IAgentWakeupRepository.ts
│   │   ├── IAgentTaskSessionRepository.ts
│   │   ├── IAgentConfigRevisionRepository.ts
│   │   ├── ITemplateRepository.ts
│   │   └── IBaseRepository.ts                 # Generic CRUD contract
│   │
│   ├── enums/
│   │   ├── AgentStatus.ts                     # active/paused/idle/running/error/terminated
│   │   ├── IssueStatus.ts                     # backlog/todo/in_progress/in_review/done/blocked/cancelled
│   │   ├── IssuePriority.ts                   # critical/high/medium/low
│   │   ├── RunStatus.ts                       # queued/running/succeeded/failed/cancelled/timed_out
│   │   ├── ApprovalStatus.ts                  # pending/approved/rejected/revision_requested/cancelled
│   │   ├── ActorType.ts                       # board/agent/system
│   │   ├── WakeupSource.ts                    # timer/assignment/on_demand/automation
│   │   ├── AdapterType.ts                     # claude/codex/cursor/gemini/opencode/pi/openclaw/process/http
│   │   ├── AgentRole.ts                       # ceo/cto/engineer/designer/pm/qa/marketer/etc
│   │   ├── GoalLevel.ts                       # company/team/agent/task
│   │   └── VmStatus.ts                        # stopped/starting/running/hibernating
│   │
│   ├── interfaces/
│   │   ├── IActor.ts                          # { type, userId?, agentId?, companyId?, runId? }
│   │   ├── IExecutionRequest.ts               # Payload sent to Agent Executor
│   │   ├── IExecutionResult.ts                # Result from Agent Executor
│   │   ├── IExecutionEvent.ts                 # SSE event from Agent Executor
│   │   └── ISessionCodec.ts                   # Serialize/deserialize agent session
│   │
│   └── exceptions/
│       ├── IssueAlreadyCheckedOutException.ts # 409
│       ├── AgentOverBudgetException.ts
│       ├── MissingApiKeyException.ts
│       └── VmBootFailedException.ts
│
│ ─────────────────────────────────────────────
│  APPLICATION LAYER (use cases + CQRS)
│ ─────────────────────────────────────────────
│
├── application/
│   │
│   ├── commands/                              # Write operations (mutate state)
│   │   │
│   │   ├── company/
│   │   │   ├── CreateCompanyCommand.ts
│   │   │   ├── CreateCompanyHandler.ts
│   │   │   ├── CreateCompanyFromTemplateCommand.ts
│   │   │   ├── CreateCompanyFromTemplateHandler.ts
│   │   │   ├── UpdateCompanyCommand.ts
│   │   │   ├── UpdateCompanyHandler.ts
│   │   │   ├── DeleteCompanyCommand.ts
│   │   │   └── DeleteCompanyHandler.ts
│   │   │
│   │   ├── agent/
│   │   │   ├── CreateAgentCommand.ts
│   │   │   ├── CreateAgentHandler.ts
│   │   │   ├── UpdateAgentCommand.ts
│   │   │   ├── UpdateAgentHandler.ts
│   │   │   ├── PauseAgentCommand.ts
│   │   │   ├── PauseAgentHandler.ts
│   │   │   ├── ResumeAgentCommand.ts
│   │   │   ├── ResumeAgentHandler.ts
│   │   │   ├── TerminateAgentCommand.ts
│   │   │   ├── TerminateAgentHandler.ts
│   │   │   ├── RollbackAgentConfigCommand.ts
│   │   │   ├── RollbackAgentConfigHandler.ts
│   │   │   ├── CreateAgentApiKeyCommand.ts
│   │   │   ├── CreateAgentApiKeyHandler.ts
│   │   │   ├── RevokeAgentApiKeyCommand.ts
│   │   │   └── RevokeAgentApiKeyHandler.ts
│   │   │
│   │   ├── issue/
│   │   │   ├── CreateIssueCommand.ts
│   │   │   ├── CreateIssueHandler.ts
│   │   │   ├── UpdateIssueCommand.ts
│   │   │   ├── UpdateIssueHandler.ts
│   │   │   ├── CheckoutIssueCommand.ts        # CRITICAL — atomic checkout
│   │   │   ├── CheckoutIssueHandler.ts
│   │   │   ├── ReleaseIssueCommand.ts
│   │   │   ├── ReleaseIssueHandler.ts
│   │   │   ├── AddCommentCommand.ts
│   │   │   ├── AddCommentHandler.ts
│   │   │   ├── UploadAttachmentCommand.ts
│   │   │   └── UploadAttachmentHandler.ts
│   │   │
│   │   ├── heartbeat/
│   │   │   ├── WakeupAgentCommand.ts          # Queue wakeup request
│   │   │   ├── WakeupAgentHandler.ts
│   │   │   ├── InvokeHeartbeatCommand.ts      # Execute heartbeat now
│   │   │   ├── InvokeHeartbeatHandler.ts      # THE big orchestrator
│   │   │   ├── CancelRunCommand.ts
│   │   │   ├── CancelRunHandler.ts
│   │   │   ├── ReapOrphanedRunsCommand.ts     # Cleanup stale runs
│   │   │   └── ReapOrphanedRunsHandler.ts
│   │   │
│   │   ├── approval/
│   │   │   ├── CreateApprovalCommand.ts
│   │   │   ├── CreateApprovalHandler.ts
│   │   │   ├── ApproveCommand.ts
│   │   │   ├── ApproveHandler.ts              # Triggers hire hook if hire_agent
│   │   │   ├── RejectCommand.ts
│   │   │   ├── RejectHandler.ts
│   │   │   ├── RequestRevisionCommand.ts
│   │   │   └── RequestRevisionHandler.ts
│   │   │
│   │   ├── goal/
│   │   │   ├── CreateGoalCommand.ts
│   │   │   ├── CreateGoalHandler.ts
│   │   │   ├── UpdateGoalCommand.ts
│   │   │   └── UpdateGoalHandler.ts
│   │   │
│   │   ├── project/
│   │   │   ├── CreateProjectCommand.ts
│   │   │   ├── CreateProjectHandler.ts
│   │   │   ├── UpdateProjectCommand.ts
│   │   │   ├── UpdateProjectHandler.ts
│   │   │   ├── CreateWorkspaceCommand.ts
│   │   │   └── CreateWorkspaceHandler.ts
│   │   │
│   │   ├── api-key-vault/
│   │   │   ├── StoreApiKeyCommand.ts          # Encrypt + save user's LLM key
│   │   │   ├── StoreApiKeyHandler.ts
│   │   │   ├── ValidateApiKeyCommand.ts       # Test key against provider
│   │   │   ├── ValidateApiKeyHandler.ts
│   │   │   ├── RevokeApiKeyCommand.ts
│   │   │   └── RevokeApiKeyHandler.ts
│   │   │
│   │   ├── provisioner/
│   │   │   ├── EnsureVmCommand.ts             # Boot or reuse Fly.io VM
│   │   │   ├── EnsureVmHandler.ts
│   │   │   ├── HibernateVmCommand.ts
│   │   │   ├── HibernateVmHandler.ts
│   │   │   ├── DestroyVmCommand.ts
│   │   │   └── DestroyVmHandler.ts
│   │   │
│   │   ├── cost/
│   │   │   ├── RecordCostEventCommand.ts
│   │   │   ├── RecordCostEventHandler.ts
│   │   │   ├── ReconcileBudgetsCommand.ts     # Nightly reconciliation
│   │   │   └── ReconcileBudgetsHandler.ts
│   │   │
│   │   └── activity/
│   │       ├── LogActivityCommand.ts
│   │       └── LogActivityHandler.ts
│   │
│   ├── queries/                               # Read operations (no side effects)
│   │   │
│   │   ├── company/
│   │   │   ├── GetCompanyQuery.ts
│   │   │   ├── GetCompanyHandler.ts
│   │   │   ├── ListCompaniesQuery.ts
│   │   │   └── ListCompaniesHandler.ts
│   │   │
│   │   ├── agent/
│   │   │   ├── GetAgentQuery.ts
│   │   │   ├── GetAgentHandler.ts
│   │   │   ├── ListAgentsQuery.ts
│   │   │   ├── ListAgentsHandler.ts
│   │   │   ├── GetAgentMeQuery.ts             # Agent self-identity
│   │   │   ├── GetAgentMeHandler.ts
│   │   │   ├── GetAgentInboxQuery.ts          # Agent compact inbox
│   │   │   ├── GetAgentInboxHandler.ts
│   │   │   ├── GetOrgTreeQuery.ts
│   │   │   ├── GetOrgTreeHandler.ts
│   │   │   ├── ListConfigRevisionsQuery.ts
│   │   │   ├── ListConfigRevisionsHandler.ts
│   │   │   ├── GetRuntimeStateQuery.ts
│   │   │   └── GetRuntimeStateHandler.ts
│   │   │
│   │   ├── issue/
│   │   │   ├── GetIssueQuery.ts
│   │   │   ├── GetIssueHandler.ts
│   │   │   ├── ListIssuesQuery.ts
│   │   │   ├── ListIssuesHandler.ts
│   │   │   ├── GetHeartbeatContextQuery.ts    # CRITICAL — agent execution context
│   │   │   ├── GetHeartbeatContextHandler.ts
│   │   │   ├── ListCommentsQuery.ts
│   │   │   ├── ListCommentsHandler.ts
│   │   │   └── SearchIssuesQuery.ts
│   │   │   └── SearchIssuesHandler.ts
│   │   │
│   │   ├── heartbeat/
│   │   │   ├── ListRunsQuery.ts
│   │   │   ├── ListRunsHandler.ts
│   │   │   ├── GetRunQuery.ts
│   │   │   ├── GetRunHandler.ts
│   │   │   ├── ListRunEventsQuery.ts
│   │   │   ├── ListRunEventsHandler.ts
│   │   │   ├── GetLiveRunsQuery.ts
│   │   │   └── GetLiveRunsHandler.ts
│   │   │
│   │   ├── approval/
│   │   │   ├── ListApprovalsQuery.ts
│   │   │   ├── ListApprovalsHandler.ts
│   │   │   ├── GetApprovalQuery.ts
│   │   │   └── GetApprovalHandler.ts
│   │   │
│   │   ├── goal/
│   │   │   └── (list, get)
│   │   ├── project/
│   │   │   └── (list, get)
│   │   ├── cost/
│   │   │   ├── GetCostSummaryQuery.ts
│   │   │   └── GetCostSummaryHandler.ts
│   │   ├── activity/
│   │   │   ├── ListActivityQuery.ts
│   │   │   └── ListActivityHandler.ts
│   │   ├── dashboard/
│   │   │   ├── GetDashboardSummaryQuery.ts
│   │   │   └── GetDashboardSummaryHandler.ts
│   │   └── template/
│   │       ├── ListTemplatesQuery.ts
│   │       ├── ListTemplatesHandler.ts
│   │       ├── GetTemplateQuery.ts
│   │       └── GetTemplateHandler.ts
│   │
│   ├── services/                              # Cross-cutting application services
│   │   ├── interface/
│   │   │   ├── IExecutionEngineService.ts     # Cloud runner interface
│   │   │   ├── IProvisionerService.ts         # Fly.io VM management interface
│   │   │   ├── IApiKeyVaultService.ts         # Encrypt/decrypt/validate keys
│   │   │   ├── ILiveEventsService.ts          # Pub/sub interface
│   │   │   ├── IStorageService.ts             # S3 file storage interface
│   │   │   └── IEncryptionService.ts          # AES-256 encrypt/decrypt
│   │   └── impl/
│   │       ├── ExecutionEngineService.ts       # HTTP POST to Fly.io VM + SSE parse
│   │       ├── FlyioProvisionerService.ts      # Fly.io Machines API
│   │       ├── ApiKeyVaultService.ts           # AES-256 encrypt + validate
│   │       ├── RedisLiveEventsService.ts       # Redis PUBLISH/SUBSCRIBE
│   │       ├── S3StorageService.ts             # S3 put/get/delete
│   │       └── AesEncryptionService.ts         # AES-256 implementation
│   │
│   ├── events/                                # Domain events (internal pub/sub)
│   │   ├── AgentStatusChangedEvent.ts
│   │   ├── IssueCheckedOutEvent.ts
│   │   ├── IssueStatusChangedEvent.ts
│   │   ├── HeartbeatRunCompletedEvent.ts
│   │   ├── ApprovalResolvedEvent.ts
│   │   ├── AgentHiredEvent.ts
│   │   ├── BudgetExceededEvent.ts
│   │   └── handlers/
│   │       ├── OnApprovalResolved.ts          # Auto-create agent if hire approved
│   │       ├── OnHeartbeatCompleted.ts        # Update runtime state + costs
│   │       ├── OnBudgetExceeded.ts            # Auto-pause agent
│   │       ├── OnIssueAssigned.ts             # Trigger agent wakeup
│   │       └── OnAgentMentioned.ts            # Trigger agent wakeup
│   │
│   └── contexts/
│       └── actor/
│           ├── IActor.ts
│           └── ActorContextService.ts         # Request-scoped actor resolution
│
│ ─────────────────────────────────────────────
│  INFRASTRUCTURE LAYER (implementations)
│ ─────────────────────────────────────────────
│
├── infrastructure/
│   ├── persistence/
│   │   ├── database.module.ts                 # TypeORM connection setup
│   │   ├── data-source.ts                     # TypeORM DataSource config
│   │   ├── models/                            # TypeORM entity models
│   │   │   ├── BaseModel.ts                   # id, companyId, createdAt, updatedAt
│   │   │   ├── CompanyModel.ts
│   │   │   ├── AgentModel.ts
│   │   │   ├── IssueModel.ts
│   │   │   ├── HeartbeatRunModel.ts
│   │   │   ├── HeartbeatRunEventModel.ts
│   │   │   ├── GoalModel.ts
│   │   │   ├── ProjectModel.ts
│   │   │   ├── ProjectWorkspaceModel.ts
│   │   │   ├── ApprovalModel.ts
│   │   │   ├── CostEventModel.ts
│   │   │   ├── ActivityModel.ts
│   │   │   ├── CompanyApiKeyModel.ts
│   │   │   ├── CompanyVmModel.ts
│   │   │   ├── AgentApiKeyModel.ts
│   │   │   ├── AgentRuntimeStateModel.ts
│   │   │   ├── AgentTaskSessionModel.ts
│   │   │   ├── AgentWakeupRequestModel.ts
│   │   │   ├── AgentConfigRevisionModel.ts
│   │   │   ├── IssueCommentModel.ts
│   │   │   ├── IssueAttachmentModel.ts
│   │   │   ├── IssueLabelModel.ts
│   │   │   ├── LabelModel.ts
│   │   │   ├── ApprovalCommentModel.ts
│   │   │   ├── CompanyTemplateModel.ts
│   │   │   ├── AssetModel.ts
│   │   │   ├── UserModel.ts
│   │   │   ├── SessionModel.ts
│   │   │   ├── UserCompanyModel.ts
│   │   │   └── BillingAccountModel.ts
│   │   └── migrations/
│   │       └── {timestamp}-{description}.ts
│   │
│   ├── repositories/                          # Concrete repository implementations
│   │   ├── BaseRepository.ts                  # Generic TypeORM CRUD
│   │   ├── CompanyRepository.ts
│   │   ├── AgentRepository.ts                 # Includes org tree queries
│   │   ├── IssueRepository.ts                 # Includes checkout lock query
│   │   ├── HeartbeatRunRepository.ts
│   │   ├── HeartbeatRunEventRepository.ts     # Partitioned table queries
│   │   ├── GoalRepository.ts
│   │   ├── ProjectRepository.ts
│   │   ├── ApprovalRepository.ts
│   │   ├── CostEventRepository.ts
│   │   ├── ActivityRepository.ts
│   │   ├── CompanyApiKeyRepository.ts
│   │   ├── CompanyVmRepository.ts
│   │   ├── AgentWakeupRepository.ts
│   │   ├── AgentTaskSessionRepository.ts
│   │   ├── AgentConfigRevisionRepository.ts
│   │   └── TemplateRepository.ts
│   │
│   ├── external/                              # External service clients
│   │   ├── flyio/
│   │   │   ├── FlyioClient.ts                 # Fly.io Machines REST API wrapper
│   │   │   └── flyio.types.ts
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── RedisClient.ts                 # Upstash Redis connection
│   │   ├── s3/
│   │   │   ├── S3Client.ts
│   │   │   └── s3.types.ts
│   │   └── stripe/                            # Future: billing
│   │       └── StripeClient.ts
│   │
│   └── workers/                               # Background job processors
│       ├── BudgetReconciliationWorker.ts       # Nightly budget recalc
│       └── PartitionManagerWorker.ts           # Monthly table partition creation
│
│ ─────────────────────────────────────────────
│  PRESENTATION LAYER (HTTP + WebSocket)
│ ─────────────────────────────────────────────
│
├── presentation/
│   ├── controllers/
│   │   ├── dto/                               # Request/response DTOs
│   │   │   ├── company/
│   │   │   │   ├── CreateCompanyDto.ts
│   │   │   │   ├── CreateCompanyFromTemplateDto.ts
│   │   │   │   └── UpdateCompanyDto.ts
│   │   │   ├── agent/
│   │   │   │   ├── CreateAgentDto.ts
│   │   │   │   ├── UpdateAgentDto.ts
│   │   │   │   └── WakeupAgentDto.ts
│   │   │   ├── issue/
│   │   │   │   ├── CreateIssueDto.ts
│   │   │   │   ├── UpdateIssueDto.ts
│   │   │   │   ├── CheckoutIssueDto.ts
│   │   │   │   └── AddCommentDto.ts
│   │   │   ├── approval/
│   │   │   │   ├── CreateApprovalDto.ts
│   │   │   │   └── ResolveApprovalDto.ts
│   │   │   ├── api-key-vault/
│   │   │   │   └── StoreApiKeyDto.ts
│   │   │   └── ...
│   │   │
│   │   └── impl/
│   │       ├── board/                         # Human user endpoints (session auth)
│   │       │   ├── BoardCompanyController.ts
│   │       │   ├── BoardAgentController.ts
│   │       │   ├── BoardIssueController.ts
│   │       │   ├── BoardGoalController.ts
│   │       │   ├── BoardProjectController.ts
│   │       │   ├── BoardApprovalController.ts
│   │       │   ├── BoardCostController.ts
│   │       │   ├── BoardActivityController.ts
│   │       │   ├── BoardDashboardController.ts
│   │       │   ├── BoardApiKeyVaultController.ts
│   │       │   ├── BoardVmController.ts
│   │       │   └── BoardTemplateController.ts
│   │       │
│   │       ├── agent/                         # Agent callback endpoints (JWT/API key)
│   │       │   ├── AgentSelfController.ts     # GET /agents/me, /agents/me/inbox-lite
│   │       │   ├── AgentIssueController.ts    # checkout, update, comment, create subtask
│   │       │   └── AgentApprovalController.ts # create approval (hire request)
│   │       │
│   │       ├── internal/                      # System endpoints
│   │       │   └── HealthCheckController.ts
│   │       │
│   │       └── public/                        # Unauthenticated endpoints
│   │           ├── AuthController.ts          # Login, signup, session
│   │           └── PublicTemplateController.ts # Browse templates (pre-login)
│   │
│   └── gateways/                              # WebSocket
│       └── RealtimeGateway.ts                 # @WebSocketGateway — live events
│
│ ─────────────────────────────────────────────
│  CROSS-CUTTING CONCERNS
│ ─────────────────────────────────────────────
│
├── module/                                    # NestJS module definitions
│   ├── api.module.ts                          # HTTP controllers
│   ├── scheduler.module.ts                    # Heartbeat timer + cron jobs (@nestjs/schedule)
│   ├── realtime.module.ts                     # WebSocket + Redis pub/sub
│   └── shared.module.ts                       # Shared providers (repos, services)
│
├── guard/
│   ├── BoardAuthGuard.ts                      # Session cookie auth
│   ├── AgentAuthGuard.ts                      # JWT or API key auth
│   ├── CompanyAccessGuard.ts                  # Verify actor has company access
│   └── CompanyRoleGuard.ts                    # owner/admin/viewer check
│
├── decorator/
│   ├── CurrentActor.ts                        # @CurrentActor() → IActor
│   ├── CompanyId.ts                           # @CompanyId() → UUID from route/actor
│   ├── RunId.ts                               # @RunId() → from X-Run-Id header
│   └── Roles.ts                               # @Roles('owner', 'admin')
│
├── interceptor/
│   ├── ActivityLogInterceptor.ts              # Auto-log mutations to activityLog
│   ├── CompanyScopeInterceptor.ts             # Auto-inject companyId into queries
│   └── HttpLoggerInterceptor.ts               # Request/response logging
│
├── filter/
│   └── HttpExceptionFilter.ts                 # Format errors: { error, details }
│
├── pipe/
│   └── ZodValidationPipe.ts                   # Validate DTOs with Zod schemas
│
└── utils/
    ├── hash.ts                                # SHA-256 hashing for API keys
    └── encryption.ts                          # AES-256 for LLM API keys
```

## Data Flow Through the Architecture

### Example: Agent Checks Out a Task

```
1. Agent sends:
   POST /api/issues/:id/checkout
   Headers: Authorization: Bearer <jwt>, X-Run-Id: <runId>
   Body: { agentId, expectedStatuses: ["todo"] }

2. PRESENTATION: AgentIssueController
   → Validates DTO (CheckoutIssueDto)
   → Extracts @CurrentActor(), @RunId()
   → Dispatches: commandBus.execute(new CheckoutIssueCommand(...))

3. APPLICATION: CheckoutIssueHandler
   → Calls issueRepository.findById(issueId) with company scope
   → Validates status is in expectedStatuses
   → Calls issueRepository.atomicCheckout(issueId, agentId, runId)
   → If 409: throws IssueAlreadyCheckedOutException
   → Publishes IssueCheckedOutEvent via eventBus
   → Calls activityLogCommand: LogActivityCommand

4. INFRASTRUCTURE: IssueRepository.atomicCheckout()
   → UPDATE issues SET checkout_run_id = ?, status = 'in_progress'
     WHERE id = ? AND checkout_run_id IS NULL
   → If rowsAffected === 0 → throw conflict

5. APPLICATION: OnIssueCheckedOut (event handler)
   → Publishes live event via ILiveEventsService
   → Redis PUBLISH → WebSocket → Dashboard updates

6. PRESENTATION: Response
   → 200: { success: true, issue: { ... } }
   → 409: { error: "Issue already checked out", details: { ... } }
```

### Example: Heartbeat Invocation (The Complex One)

```
1. Scheduler or Board triggers:
   commandBus.execute(new InvokeHeartbeatCommand(agentId, source, trigger))

2. APPLICATION: InvokeHeartbeatHandler
   a. Query agent via agentRepository (validate active, under budget)
   b. Query company API key via apiKeyVaultService.retrieve(companyId, provider)
   c. Command: EnsureVmCommand → provisioner boots/wakes Fly.io VM
   d. Build ExecutionRequest (context, session, API key, JWT)
   e. Call executionEngineService.execute(request) → SSE stream
   f. For each SSE event:
      - Insert HeartbeatRunEvent via repository
      - Publish live event via liveEventsService
   g. On completion:
      - Command: RecordCostEventCommand (tokens + compute)
      - Update AgentRuntimeState
      - Update Agent.spentMonthlyCents
      - If over budget → publish BudgetExceededEvent
      - Log activity
   h. Start VM idle timer → HibernateVmCommand after 10 min

3. INFRASTRUCTURE: ExecutionEngineService.execute()
   → POST to Fly.io VM Agent Executor
   → Parse SSE stream (AsyncIterable<ExecutionEvent>)
   → Yield events back to handler
```

## TypeORM Model Example

```typescript
// infrastructure/persistence/models/HeartbeatRunModel.ts
@Entity('heartbeat_runs')
@Index(['companyId', 'startedAt'])
@Index(['agentId', 'status', 'startedAt'])
export class HeartbeatRunModel extends BaseModel {
  @Column('uuid')
  companyId: string;

  @Column('uuid')
  agentId: string;

  @Column({ type: 'text', nullable: true })
  vmMachineId: string;

  @Column({ type: 'text', default: 'on_demand' })
  invocationSource: string;

  @Column({ type: 'text', default: 'queued' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date;

  @Column({ type: 'int', nullable: true })
  exitCode: number;

  // Extracted from usageJson for fast aggregation
  @Column({ type: 'int', default: 0 })
  inputTokens: number;

  @Column({ type: 'int', default: 0 })
  outputTokens: number;

  @Column({ type: 'int', default: 0 })
  totalCostCents: number;

  @Column({ type: 'text', nullable: true })
  model: string;

  @Column({ type: 'int', nullable: true })
  durationMs: number;

  // Raw dumps for debugging
  @Column({ type: 'jsonb', nullable: true })
  usageJson: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  resultJson: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  computeCostCents: number;

  @Column({ type: 'text', nullable: true })
  stdoutExcerpt: string;

  @ManyToOne(() => AgentModel)
  @JoinColumn({ name: 'agent_id' })
  agent: AgentModel;
}
```

## CQRS Command Example

```typescript
// application/commands/issue/CheckoutIssueCommand.ts
export class CheckoutIssueCommand {
  constructor(
    public readonly issueId: string,
    public readonly agentId: string,
    public readonly companyId: string,
    public readonly runId: string,
    public readonly expectedStatuses: string[],
  ) {}
}

// application/commands/issue/CheckoutIssueHandler.ts
@CommandHandler(CheckoutIssueCommand)
export class CheckoutIssueHandler implements ICommandHandler<CheckoutIssueCommand> {
  constructor(
    @Inject('IIssueRepository')
    private readonly issueRepo: IIssueRepository,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CheckoutIssueCommand) {
    const issue = await this.issueRepo.findByIdAndCompany(
      command.issueId, command.companyId
    );
    if (!issue) throw new NotFoundException('Issue not found');

    if (!command.expectedStatuses.includes(issue.status)) {
      throw new UnprocessableEntityException(
        `Cannot checkout issue in status: ${issue.status}`
      );
    }

    const locked = await this.issueRepo.atomicCheckout(
      command.issueId, command.agentId, command.runId
    );
    if (!locked) {
      throw new ConflictException('Issue already checked out');
    }

    // Log activity
    await this.commandBus.execute(new LogActivityCommand({
      companyId: command.companyId,
      actorType: 'agent',
      actorId: command.agentId,
      action: 'issue.checked_out',
      entityType: 'issue',
      entityId: command.issueId,
      runId: command.runId,
    }));

    // Publish live event
    this.eventBus.publish(new IssueCheckedOutEvent(
      command.companyId, command.issueId, command.agentId
    ));

    return { success: true, issue: { ...issue, status: 'in_progress' } };
  }
}
```

## Controller Example

```typescript
// presentation/controllers/impl/agent/AgentIssueController.ts
@UseGuards(AgentAuthGuard, CompanyAccessGuard)
@Controller('issues')
export class AgentIssueController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post(':id/checkout')
  async checkout(
    @Param('id') issueId: string,
    @CurrentActor() actor: IActor,
    @RunId() runId: string,
    @Body() dto: CheckoutIssueDto,
  ) {
    return this.commandBus.execute(
      new CheckoutIssueCommand(
        issueId, dto.agentId, actor.companyId, runId, dto.expectedStatuses
      )
    );
  }

  @Patch(':id')
  async update(
    @Param('id') issueId: string,
    @CurrentActor() actor: IActor,
    @RunId() runId: string,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.commandBus.execute(
      new UpdateIssueCommand(issueId, actor.companyId, actor.agentId, runId, dto)
    );
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') issueId: string,
    @CurrentActor() actor: IActor,
    @RunId() runId: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.commandBus.execute(
      new AddCommentCommand(issueId, actor.companyId, actor.agentId, runId, dto)
    );
  }
}
```

## Module Registration

```typescript
// module/shared.module.ts
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyModel, AgentModel, IssueModel, HeartbeatRunModel,
      HeartbeatRunEventModel, GoalModel, ProjectModel, ApprovalModel,
      CostEventModel, ActivityModel, CompanyApiKeyModel, CompanyVmModel,
      // ... all models
    ]),
    CqrsModule,
  ],
  providers: [
    // Repositories (bind interface → implementation)
    { provide: 'ICompanyRepository', useClass: CompanyRepository },
    { provide: 'IAgentRepository', useClass: AgentRepository },
    { provide: 'IIssueRepository', useClass: IssueRepository },
    { provide: 'IHeartbeatRunRepository', useClass: HeartbeatRunRepository },
    // ... all repositories

    // Application services
    { provide: 'IExecutionEngineService', useClass: ExecutionEngineService },
    { provide: 'IProvisionerService', useClass: FlyioProvisionerService },
    { provide: 'IApiKeyVaultService', useClass: ApiKeyVaultService },
    { provide: 'ILiveEventsService', useClass: RedisLiveEventsService },
    { provide: 'IStorageService', useClass: S3StorageService },
    { provide: 'IEncryptionService', useClass: AesEncryptionService },

    // All command handlers
    ...CommandHandlers,
    // All query handlers
    ...QueryHandlers,
    // All event handlers
    ...EventHandlers,
  ],
  exports: ['ICompanyRepository', 'IAgentRepository', /* ... */],
})
export class SharedModule {}
```

## File Count Summary

| Layer | Files | Purpose |
|-------|-------|---------|
| Domain | ~40 | Entities, interfaces, enums, exceptions |
| Application Commands | ~50 | Write operations (create, update, delete, checkout) |
| Application Queries | ~30 | Read operations (list, get, search) |
| Application Services | ~12 | Cross-cutting (execution engine, provisioner, vault) |
| Application Events | ~12 | Domain events + handlers |
| Infrastructure Models | ~28 | TypeORM entity definitions |
| Infrastructure Repos | ~18 | Concrete repository implementations |
| Infrastructure External | ~8 | Fly.io, Redis, S3, Stripe clients |
| Presentation Controllers | ~18 | HTTP endpoints (board, agent, internal, public) |
| Presentation DTOs | ~25 | Request/response validation |
| Cross-cutting | ~15 | Guards, decorators, interceptors, filters, pipes |
| **TOTAL** | **~256** | |

This is the cost of NestJS + TypeORM + CQRS. ~256 files vs ~30 files with Express. But the structure is clean, testable, and scales to a team of developers.

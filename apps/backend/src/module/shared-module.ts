import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { UserCompanyRepository } from '../infrastructure/repositories/user-company-repository.js';
import { USER_COMPANY_REPOSITORY } from '../domain/repositories/i-user-company-repository.js';

// Models
import { CompanyModel } from '../infrastructure/persistence/models/company-model.js';
import { AgentModel } from '../infrastructure/persistence/models/agent-model.js';
import { IssueModel } from '../infrastructure/persistence/models/issue-model.js';
import { GoalModel } from '../infrastructure/persistence/models/goal-model.js';
import { ProjectModel } from '../infrastructure/persistence/models/project-model.js';
import { UserCompanyModel } from '../infrastructure/persistence/models/user-company-model.js';
import { IssueCommentModel } from '../infrastructure/persistence/models/issue-comment-model.js';
import { ActivityEntryModel } from '../infrastructure/persistence/models/activity-entry-model.js';
// Phase 4 models
import { HeartbeatRunModel } from '../infrastructure/persistence/models/heartbeat-run-model.js';
import { HeartbeatRunEventModel } from '../infrastructure/persistence/models/heartbeat-run-event-model.js';
import { CompanyVmModel } from '../infrastructure/persistence/models/company-vm-model.js';
import { CompanyApiKeyModel } from '../infrastructure/persistence/models/company-api-key-model.js';
import { AgentRuntimeStateModel } from '../infrastructure/persistence/models/agent-runtime-state-model.js';
import { AgentTaskSessionModel } from '../infrastructure/persistence/models/agent-task-session-model.js';
import { AgentWakeupRequestModel } from '../infrastructure/persistence/models/agent-wakeup-request-model.js';
// Phase 8 models
import { CostEventModel } from '../infrastructure/persistence/models/cost-event-model.js';
import { ApprovalModel } from '../infrastructure/persistence/models/approval-model.js';
import { ApprovalCommentModel } from '../infrastructure/persistence/models/approval-comment-model.js';
import { AgentApiKeyModel } from '../infrastructure/persistence/models/agent-api-key-model.js';

// Repositories
import { CompanyRepository } from '../infrastructure/repositories/company-repository.js';
import { AgentRepository } from '../infrastructure/repositories/agent-repository.js';
import { IssueRepository } from '../infrastructure/repositories/issue-repository.js';
import { GoalRepository } from '../infrastructure/repositories/goal-repository.js';
import { ProjectRepository } from '../infrastructure/repositories/project-repository.js';
import { ActivityRepository } from '../infrastructure/repositories/activity-repository.js';
import { IssueCommentRepository } from '../infrastructure/repositories/issue-comment-repository.js';
// Phase 4 repositories
import { HeartbeatRunRepository } from '../infrastructure/repositories/heartbeat-run-repository.js';
import { HeartbeatRunEventRepository } from '../infrastructure/repositories/heartbeat-run-event-repository.js';
import { CompanyVmRepository } from '../infrastructure/repositories/company-vm-repository.js';
import { AgentWakeupRepository } from '../infrastructure/repositories/agent-wakeup-repository.js';
import { AgentRuntimeStateRepository } from '../infrastructure/repositories/agent-runtime-state-repository.js';
// Phase 8 repositories
import { CostEventRepository } from '../infrastructure/repositories/cost-event-repository.js';
import { ApprovalRepository } from '../infrastructure/repositories/approval-repository.js';
import { AgentApiKeyRepository } from '../infrastructure/repositories/agent-api-key-repository.js';

// Injection tokens
import { COMPANY_REPOSITORY } from '../domain/repositories/i-company-repository.js';
import { AGENT_REPOSITORY } from '../domain/repositories/i-agent-repository.js';
import { ISSUE_REPOSITORY } from '../domain/repositories/i-issue-repository.js';
import { GOAL_REPOSITORY } from '../domain/repositories/i-goal-repository.js';
import { PROJECT_REPOSITORY } from '../domain/repositories/i-project-repository.js';
import { ACTIVITY_REPOSITORY } from '../domain/repositories/i-activity-repository.js';
import { ISSUE_COMMENT_REPOSITORY } from '../domain/repositories/i-issue-comment-repository.js';
// Phase 4 tokens
import { HEARTBEAT_RUN_REPOSITORY } from '../domain/repositories/i-heartbeat-run-repository.js';
import { HEARTBEAT_RUN_EVENT_REPOSITORY } from '../domain/repositories/i-heartbeat-run-event-repository.js';
import { COMPANY_VM_REPOSITORY } from '../domain/repositories/i-company-vm-repository.js';
import { AGENT_WAKEUP_REPOSITORY } from '../domain/repositories/i-agent-wakeup-repository.js';
import { AGENT_RUNTIME_STATE_REPOSITORY } from '../domain/repositories/i-agent-runtime-state-repository.js';
// Phase 8 tokens
import { COST_EVENT_REPOSITORY } from '../domain/repositories/i-cost-event-repository.js';
import { APPROVAL_REPOSITORY } from '../domain/repositories/i-approval-repository.js';
import { AGENT_API_KEY_REPOSITORY } from '../infrastructure/repositories/agent-api-key-repository.js';

// Services
import { ApiKeyVaultService } from '../application/services/impl/api-key-vault-service.js';
import { API_KEY_VAULT_SERVICE } from '../application/services/interface/i-api-key-vault-service.js';

// Command handlers
import { CreateCompanyHandler } from '../application/commands/company/create-company-command.js';
import { UpdateCompanyHandler } from '../application/commands/company/update-company-command.js';
import { DeleteCompanyHandler } from '../application/commands/company/delete-company-command.js';
import { CreateAgentHandler } from '../application/commands/agent/create-agent-command.js';
import { UpdateAgentHandler } from '../application/commands/agent/update-agent-command.js';
import { PauseAgentHandler } from '../application/commands/agent/pause-agent-command.js';
import { ResumeAgentHandler } from '../application/commands/agent/resume-agent-command.js';
import { TerminateAgentHandler } from '../application/commands/agent/terminate-agent-command.js';
import { CreateIssueHandler } from '../application/commands/issue/create-issue-command.js';
import { UpdateIssueHandler } from '../application/commands/issue/update-issue-command.js';
import { CheckoutIssueHandler } from '../application/commands/issue/checkout-issue-command.js';
import { ReleaseIssueHandler } from '../application/commands/issue/release-issue-command.js';
import { AddCommentHandler } from '../application/commands/issue/comment/add-comment-command.js';
import { CreateGoalHandler } from '../application/commands/goal/create-goal-command.js';
import { UpdateGoalHandler } from '../application/commands/goal/update-goal-command.js';
import { CreateProjectHandler } from '../application/commands/project/create-project-command.js';
import { UpdateProjectHandler } from '../application/commands/project/update-project-command.js';
import { LogActivityHandler } from '../application/commands/activity/log-activity-command.js';
// Phase 8 command handlers
import { RecordCostEventHandler } from '../application/commands/cost/record-cost-event-command.js';
import { ReconcileBudgetsHandler } from '../application/commands/cost/reconcile-budgets-command.js';
import { CreateApprovalHandler } from '../application/commands/approval/create-approval-command.js';
import { ApproveHandler } from '../application/commands/approval/approve-command.js';
import { RejectHandler } from '../application/commands/approval/reject-command.js';
import { RequestRevisionHandler } from '../application/commands/approval/request-revision-command.js';
import { StoreApiKeyHandler } from '../application/commands/api-key-vault/store-api-key-command.js';
import { ValidateApiKeyHandler } from '../application/commands/api-key-vault/validate-api-key-command.js';
import { RevokeApiKeyHandler } from '../application/commands/api-key-vault/revoke-api-key-command.js';
import { CreateAgentApiKeyHandler } from '../application/commands/agent/create-agent-api-key-command.js';
import { RevokeAgentApiKeyHandler } from '../application/commands/agent/revoke-agent-api-key-command.js';

// Query handlers
import { GetCompanyHandler } from '../application/queries/company/get-company-query.js';
import { ListCompaniesHandler } from '../application/queries/company/list-companies-query.js';
import { GetAgentHandler } from '../application/queries/agent/get-agent-query.js';
import { ListAgentsHandler } from '../application/queries/agent/list-agents-query.js';
import { GetOrgTreeHandler } from '../application/queries/agent/get-org-tree-query.js';
import { GetIssueHandler } from '../application/queries/issue/get-issue-query.js';
import { ListIssuesHandler } from '../application/queries/issue/list-issues-query.js';
import { SearchIssuesHandler } from '../application/queries/issue/search-issues-query.js';
import { ListCommentsHandler } from '../application/queries/issue/list-comments-query.js';
import { ListGoalsHandler } from '../application/queries/goal/list-goals-query.js';
import { ListProjectsHandler } from '../application/queries/project/list-projects-query.js';
import { GetProjectHandler } from '../application/queries/project/get-project-query.js';
import { ListActivityHandler } from '../application/queries/activity/list-activity-query.js';
import { GetDashboardSummaryHandler } from '../application/queries/dashboard/get-dashboard-summary-query.js';
// Phase 8 query handlers
import { GetCostSummaryHandler } from '../application/queries/cost/get-cost-summary-query.js';
import { ListApprovalsHandler } from '../application/queries/approval/list-approvals-query.js';
import { GetApprovalHandler } from '../application/queries/approval/get-approval-query.js';

// Phase 8 event handlers
import { OnApprovalResolvedHandler } from '../application/events/handlers/on-approval-resolved-handler.js';

const MODELS = [
  CompanyModel, AgentModel, IssueModel, GoalModel, ProjectModel,
  UserCompanyModel, IssueCommentModel, ActivityEntryModel,
  // Phase 4
  HeartbeatRunModel, HeartbeatRunEventModel, CompanyVmModel, CompanyApiKeyModel,
  AgentRuntimeStateModel, AgentTaskSessionModel, AgentWakeupRequestModel,
  // Phase 8
  CostEventModel, ApprovalModel, ApprovalCommentModel, AgentApiKeyModel,
];

const REPOSITORY_PROVIDERS = [
  { provide: COMPANY_REPOSITORY, useClass: CompanyRepository },
  { provide: AGENT_REPOSITORY, useClass: AgentRepository },
  { provide: ISSUE_REPOSITORY, useClass: IssueRepository },
  { provide: GOAL_REPOSITORY, useClass: GoalRepository },
  { provide: PROJECT_REPOSITORY, useClass: ProjectRepository },
  { provide: ACTIVITY_REPOSITORY, useClass: ActivityRepository },
  { provide: ISSUE_COMMENT_REPOSITORY, useClass: IssueCommentRepository },
  { provide: USER_COMPANY_REPOSITORY, useClass: UserCompanyRepository },
  // Phase 4
  { provide: HEARTBEAT_RUN_REPOSITORY, useClass: HeartbeatRunRepository },
  { provide: HEARTBEAT_RUN_EVENT_REPOSITORY, useClass: HeartbeatRunEventRepository },
  { provide: COMPANY_VM_REPOSITORY, useClass: CompanyVmRepository },
  { provide: AGENT_WAKEUP_REPOSITORY, useClass: AgentWakeupRepository },
  { provide: AGENT_RUNTIME_STATE_REPOSITORY, useClass: AgentRuntimeStateRepository },
  // Phase 8
  { provide: COST_EVENT_REPOSITORY, useClass: CostEventRepository },
  { provide: APPROVAL_REPOSITORY, useClass: ApprovalRepository },
  { provide: AGENT_API_KEY_REPOSITORY, useClass: AgentApiKeyRepository },
];

const COMMAND_HANDLERS = [
  CreateCompanyHandler, UpdateCompanyHandler, DeleteCompanyHandler,
  CreateAgentHandler, UpdateAgentHandler, PauseAgentHandler, ResumeAgentHandler, TerminateAgentHandler,
  CreateIssueHandler, UpdateIssueHandler, CheckoutIssueHandler, ReleaseIssueHandler, AddCommentHandler,
  CreateGoalHandler, UpdateGoalHandler,
  CreateProjectHandler, UpdateProjectHandler,
  LogActivityHandler,
  // Phase 8
  RecordCostEventHandler, ReconcileBudgetsHandler,
  CreateApprovalHandler, ApproveHandler, RejectHandler, RequestRevisionHandler,
  StoreApiKeyHandler, ValidateApiKeyHandler, RevokeApiKeyHandler,
  CreateAgentApiKeyHandler, RevokeAgentApiKeyHandler,
];

const QUERY_HANDLERS = [
  GetCompanyHandler, ListCompaniesHandler,
  GetAgentHandler, ListAgentsHandler, GetOrgTreeHandler,
  GetIssueHandler, ListIssuesHandler, SearchIssuesHandler, ListCommentsHandler,
  ListGoalsHandler,
  ListProjectsHandler, GetProjectHandler,
  ListActivityHandler,
  GetDashboardSummaryHandler,
  // Phase 8
  GetCostSummaryHandler, ListApprovalsHandler, GetApprovalHandler,
];

const EVENT_HANDLERS = [
  // Phase 8
  OnApprovalResolvedHandler,
];

const SERVICE_PROVIDERS = [
  { provide: API_KEY_VAULT_SERVICE, useClass: ApiKeyVaultService },
];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(MODELS), CqrsModule],
  providers: [
    ...REPOSITORY_PROVIDERS,
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...EVENT_HANDLERS,
    ...SERVICE_PROVIDERS,
  ],
  exports: [
    ...REPOSITORY_PROVIDERS,
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...EVENT_HANDLERS,
    ...SERVICE_PROVIDERS,
    TypeOrmModule,
  ],
})
export class SharedModule {}

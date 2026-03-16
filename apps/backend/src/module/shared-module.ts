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

const MODELS = [
  CompanyModel, AgentModel, IssueModel, GoalModel, ProjectModel,
  UserCompanyModel, IssueCommentModel, ActivityEntryModel,
  // Phase 4
  HeartbeatRunModel, HeartbeatRunEventModel, CompanyVmModel, CompanyApiKeyModel,
  AgentRuntimeStateModel, AgentTaskSessionModel, AgentWakeupRequestModel,
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
];

const COMMAND_HANDLERS = [
  CreateCompanyHandler, UpdateCompanyHandler, DeleteCompanyHandler,
  CreateAgentHandler, UpdateAgentHandler, PauseAgentHandler, ResumeAgentHandler, TerminateAgentHandler,
  CreateIssueHandler, UpdateIssueHandler, CheckoutIssueHandler, ReleaseIssueHandler, AddCommentHandler,
  CreateGoalHandler, UpdateGoalHandler,
  CreateProjectHandler, UpdateProjectHandler,
  LogActivityHandler,
];

const QUERY_HANDLERS = [
  GetCompanyHandler, ListCompaniesHandler,
  GetAgentHandler, ListAgentsHandler, GetOrgTreeHandler,
  GetIssueHandler, ListIssuesHandler, SearchIssuesHandler, ListCommentsHandler,
  ListGoalsHandler,
  ListProjectsHandler, GetProjectHandler,
  ListActivityHandler,
  GetDashboardSummaryHandler,
];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(MODELS), CqrsModule],
  providers: [...REPOSITORY_PROVIDERS, ...COMMAND_HANDLERS, ...QUERY_HANDLERS],
  exports: [...REPOSITORY_PROVIDERS, ...COMMAND_HANDLERS, ...QUERY_HANDLERS, TypeOrmModule],
})
export class SharedModule {}

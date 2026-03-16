import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth-module.js';

// Board controllers
import { BoardCompanyController } from '../presentation/controllers/impl/board/board-company-controller.js';
import { BoardAgentController } from '../presentation/controllers/impl/board/board-agent-controller.js';
import { BoardIssueController } from '../presentation/controllers/impl/board/board-issue-controller.js';
import { BoardGoalController } from '../presentation/controllers/impl/board/board-goal-controller.js';
import { BoardProjectController } from '../presentation/controllers/impl/board/board-project-controller.js';
import { BoardActivityController } from '../presentation/controllers/impl/board/board-activity-controller.js';
import { BoardDashboardController } from '../presentation/controllers/impl/board/board-dashboard-controller.js';

// Agent controllers
import { AgentSelfController } from '../presentation/controllers/impl/agent/agent-self-controller.js';
import { AgentIssueController } from '../presentation/controllers/impl/agent/agent-issue-controller.js';

// Internal controllers
import { HealthCheckController } from '../presentation/controllers/impl/internal/health-check-controller.js';

@Module({
  imports: [AuthModule],
  controllers: [
    BoardCompanyController,
    BoardAgentController,
    BoardIssueController,
    BoardGoalController,
    BoardProjectController,
    BoardActivityController,
    BoardDashboardController,
    AgentSelfController,
    AgentIssueController,
    HealthCheckController,
  ],
})
export class ApiModule {}

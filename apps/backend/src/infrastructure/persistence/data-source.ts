import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CompanyModel } from './models/company-model.js';
import { AgentModel } from './models/agent-model.js';
import { IssueModel } from './models/issue-model.js';
import { HeartbeatRunModel } from './models/heartbeat-run-model.js';
import { GoalModel } from './models/goal-model.js';
import { ProjectModel } from './models/project-model.js';
import { CompanyApiKeyModel } from './models/company-api-key-model.js';
import { CompanyVmModel } from './models/company-vm-model.js';
import { UserCompanyModel } from './models/user-company-model.js';
import { CompanyTemplateModel } from './models/company-template-model.js';
import { UserModel } from './models/user-model.js';
import { SessionModel } from './models/session-model.js';

const DATABASE_URL = process.env['DATABASE_URL'] ?? '';

/** TypeORM DataSource for CLI migrations */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  entities: [
    CompanyModel,
    AgentModel,
    IssueModel,
    HeartbeatRunModel,
    GoalModel,
    ProjectModel,
    CompanyApiKeyModel,
    CompanyVmModel,
    UserCompanyModel,
    CompanyTemplateModel,
    UserModel,
    SessionModel,
  ],
  migrations: ['dist/infrastructure/persistence/migrations/*.js'],
  synchronize: false,
  logging: process.env['NODE_ENV'] === 'development',
});

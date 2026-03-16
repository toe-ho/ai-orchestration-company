import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
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
import { AgentApiKeyModel } from './models/agent-api-key-model.js';

const CORE_MODELS = [
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
  AgentApiKeyModel,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('database.url'),
        entities: CORE_MODELS,
        migrations: ['dist/infrastructure/persistence/migrations/*.js'],
        synchronize: false,
        logging: config.get<string>('app.nodeEnv') === 'development',
      }),
    }),
    TypeOrmModule.forFeature(CORE_MODELS),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

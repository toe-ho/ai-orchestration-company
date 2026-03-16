import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '../application/services/impl/auth-service.js';
import { AgentJwtService } from '../application/services/impl/agent-jwt-service.js';
import { UserCompanyRepository } from '../infrastructure/repositories/user-company-repository.js';
import { UserCompanyModel } from '../infrastructure/persistence/models/user-company-model.js';
import { AgentApiKeyModel } from '../infrastructure/persistence/models/agent-api-key-model.js';
import { BoardAuthGuard } from '../guard/board-auth-guard.js';
import { AgentAuthGuard } from '../guard/agent-auth-guard.js';
import { CompanyAccessGuard } from '../guard/company-access-guard.js';
import { CompanyRoleGuard } from '../guard/company-role-guard.js';
import { AuthController } from '../presentation/controllers/impl/public/auth-controller.js';
import { USER_COMPANY_REPOSITORY } from '../domain/repositories/i-user-company-repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserCompanyModel, AgentApiKeyModel])],
  controllers: [AuthController],
  providers: [
    AuthService,
    AgentJwtService,
    {
      provide: USER_COMPANY_REPOSITORY,
      useClass: UserCompanyRepository,
    },
    AgentAuthGuard,
    CompanyAccessGuard,
    CompanyRoleGuard,
    // BoardAuthGuard registered globally — protects all non-@AllowAnonymous routes
    {
      provide: APP_GUARD,
      useClass: BoardAuthGuard,
    },
  ],
  exports: [
    AuthService,
    AgentJwtService,
    AgentAuthGuard,
    CompanyAccessGuard,
    CompanyRoleGuard,
    USER_COMPANY_REPOSITORY,
  ],
})
export class AuthModule {}

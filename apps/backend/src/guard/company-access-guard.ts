import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ActorType } from '@aicompany/shared';
import type { IUserCompanyRepository } from '../domain/repositories/i-user-company-repository.js';
import { USER_COMPANY_REPOSITORY } from '../domain/repositories/i-user-company-repository.js';
import { Inject } from '@nestjs/common';
import type { IActor } from '../domain/interfaces/i-actor.js';

/** Verifies that the actor belongs to the company referenced in :cid or :id route param */
@Injectable()
export class CompanyAccessGuard implements CanActivate {
  constructor(
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepo: IUserCompanyRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<{
      params?: Record<string, string>;
      actor?: IActor;
    }>();

    const actor = request.actor;
    if (!actor) throw new UnauthorizedException('No actor on request');

    const companyId =
      request.params?.['cid'] ?? request.params?.['companyId'] ?? request.params?.['id'];
    if (!companyId) return true; // no company param — guard is a no-op

    if (actor.type === ActorType.Agent) {
      if (actor.companyId !== companyId) {
        throw new ForbiddenException('Agent does not belong to this company');
      }
      return true;
    }

    if (actor.type === ActorType.Board && actor.userId) {
      const membership = await this.userCompanyRepo.findByUserAndCompany(
        actor.userId,
        companyId,
      );
      if (!membership) {
        throw new ForbiddenException('User is not a member of this company');
      }
      // Store companyId on actor for downstream use
      actor.companyId = companyId;
      return true;
    }

    throw new ForbiddenException('Access denied');
  }
}

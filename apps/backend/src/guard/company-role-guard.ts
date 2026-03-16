import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { ActorType } from '@aicompany/shared';
import { ROLES_KEY } from '../decorator/roles.js';
import type { IUserCompanyRepository } from '../domain/repositories/i-user-company-repository.js';
import { USER_COMPANY_REPOSITORY } from '../domain/repositories/i-user-company-repository.js';
import type { IActor } from '../domain/interfaces/i-actor.js';

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/** Checks that the board user's company role meets the @Roles() requirement */
@Injectable()
export class CompanyRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepo: IUserCompanyRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const request = ctx.switchToHttp().getRequest<{
      params?: Record<string, string>;
      actor?: IActor;
    }>();

    const actor = request.actor;
    // Agents bypass role checks (role-based access is for board users only)
    if (!actor || actor.type !== ActorType.Board || !actor.userId) {
      throw new ForbiddenException('Role check requires a board user');
    }

    const companyId = actor.companyId ?? request.params?.['cid'] ?? request.params?.['id'];
    if (!companyId) return true;

    const membership = await this.userCompanyRepo.findByUserAndCompany(
      actor.userId,
      companyId,
    );

    if (!membership) {
      throw new ForbiddenException('User is not a member of this company');
    }

    const userLevel = ROLE_HIERARCHY[membership.role] ?? 0;
    const meetsRequirement = requiredRoles.some(
      (r) => userLevel >= (ROLE_HIERARCHY[r] ?? 0),
    );

    if (!meetsRequirement) {
      throw new ForbiddenException(
        `Requires one of roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

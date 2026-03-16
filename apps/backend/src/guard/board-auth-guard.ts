import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import { ActorType } from '@aicompany/shared';
import { AuthService } from '../application/services/impl/auth-service.js';
import { ALLOW_ANONYMOUS_KEY } from '../decorator/allow-anonymous.js';
import type { IActor } from '../domain/interfaces/i-actor.js';

/** Default guard for board (human) users — validates Better Auth session cookie */
@Injectable()
export class BoardAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isAnon = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ANONYMOUS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (isAnon) return true;

    const request = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      actor?: IActor;
    }>();

    const headers = fromNodeHeaders(request.headers);
    const session = await this.authService.auth.api
      .getSession({ headers })
      .catch(() => null);

    if (!session?.user?.id) {
      throw new UnauthorizedException('Valid session required');
    }

    request.actor = {
      type: ActorType.Board,
      userId: session.user.id,
    };

    return true;
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { IActor } from '../domain/interfaces/i-actor.js';

/** Extract the IActor set by BoardAuthGuard or AgentAuthGuard */
export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IActor | undefined => {
    const request = ctx.switchToHttp().getRequest<{ actor?: IActor }>();
    return request.actor;
  },
);

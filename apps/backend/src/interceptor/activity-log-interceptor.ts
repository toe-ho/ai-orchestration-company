import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { FastifyRequest } from 'fastify';
import type { IActor } from '../domain/interfaces/i-actor.js';
import { LogActivityCommand } from '../application/commands/activity/log-activity-command.js';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly commandBus: CommandBus) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<
      FastifyRequest & { actor?: IActor; params?: Record<string, string> }
    >();
    const { method } = req;
    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(() => {
        if (!isMutation) return;
        const actor = req.actor;
        const companyId = req.params?.['cid'] ?? actor?.companyId;
        if (!actor || !companyId) return;

        const actorId = actor.userId ?? actor.agentId ?? 'unknown';
        void this.commandBus.execute(
          new LogActivityCommand(
            companyId,
            actorId,
            actor.type,
            'mutation',
            'unknown',
            'unknown',
          ),
        );
      }),
    );
  }
}

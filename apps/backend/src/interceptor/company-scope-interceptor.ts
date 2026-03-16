import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { FastifyRequest } from 'fastify';
import type { IActor } from '../domain/interfaces/i-actor.js';

/** Extracts companyId from :cid param and attaches to request for downstream use */
@Injectable()
export class CompanyScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<
      FastifyRequest & { actor?: IActor; companyId?: string; params?: Record<string, string> }
    >();

    const companyId = req.params?.['cid'];
    if (companyId) {
      req.companyId = companyId;
      if (req.actor) {
        req.actor.companyId = companyId;
      }
    }

    return next.handle();
  }
}

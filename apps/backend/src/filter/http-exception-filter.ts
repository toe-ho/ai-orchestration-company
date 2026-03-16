import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    const error =
      typeof response === 'string'
        ? response
        : (response as { message?: string }).message ?? 'Error';

    const details =
      typeof response === 'object' && response !== null
        ? (response as Record<string, unknown>)
        : undefined;

    reply.status(statusCode).send({ statusCode, error, details });
  }
}

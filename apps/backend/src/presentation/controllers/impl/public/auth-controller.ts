import { All, Controller, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { AllowAnonymous } from '../../../../decorator/allow-anonymous.js';
import { AuthService } from '../../../../application/services/impl/auth-service.js';

/**
 * Proxies all /api/auth/* requests to the Better Auth handler.
 * Body is reconstructed from Fastify's parsed body so the raw stream is not
 * double-consumed (Fastify already read it before the controller runs).
 */
@Controller('auth')
@AllowAnonymous()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('*')
  async handleAuth(
    @Req() req: FastifyRequest,
    @Res({ passthrough: false }) reply: FastifyReply,
  ): Promise<void> {
    const protocol = req.protocol ?? 'http';
    const host = req.hostname ?? 'localhost';
    const url = new URL(req.url ?? '/', `${protocol}://${host}`);

    const headers = fromNodeHeaders(req.headers);

    const method = (req.method ?? 'GET').toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method) && req.body != null;

    if (hasBody) {
      headers.set('content-type', 'application/json');
    }

    const request = new Request(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(req.body as unknown) : undefined,
    });

    const response = await this.authService.auth.handler(request);

    reply.status(response.status);
    response.headers.forEach((value, key) => {
      void reply.header(key, value);
    });

    void reply.send(await response.text());
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Extract companyId from route param :cid/:id, or from the actor on the request */
export const CompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      params?: Record<string, string>;
      actor?: { companyId?: string };
    }>();
    return (
      request.params?.['cid'] ??
      request.params?.['id'] ??
      request.actor?.companyId
    );
  },
);

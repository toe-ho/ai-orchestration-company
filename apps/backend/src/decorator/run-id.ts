import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Extract the run ID from the X-Run-Id request header */
export const RunId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const value = request.headers['x-run-id'];
    return Array.isArray(value) ? value[0] : value;
  },
);

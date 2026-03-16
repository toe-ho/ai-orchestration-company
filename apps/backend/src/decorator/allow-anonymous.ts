import { SetMetadata } from '@nestjs/common';

export const ALLOW_ANONYMOUS_KEY = 'allowAnonymous';

/** Skip auth guards for a controller or route handler */
export const AllowAnonymous = () => SetMetadata(ALLOW_ANONYMOUS_KEY, true);

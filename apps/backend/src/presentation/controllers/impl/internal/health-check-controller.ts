import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '../../../../decorator/allow-anonymous.js';

@Controller('health')
export class HealthCheckController {
  @Get()
  @AllowAnonymous()
  check() {
    return { status: 'ok', timestamp: new Date() };
  }
}

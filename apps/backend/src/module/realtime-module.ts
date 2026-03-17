import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth-module.js';
import { LiveEventsGateway } from '../presentation/gateways/live-events-gateway.js';
import { RedisCompanyEventPublisher } from '../application/services/impl/redis-company-event-publisher.js';
import { COMPANY_EVENT_PUBLISHER } from '../application/services/interface/i-company-event-publisher.js';

@Global()
@Module({
  imports: [AuthModule],
  providers: [
    LiveEventsGateway,
    { provide: COMPANY_EVENT_PUBLISHER, useClass: RedisCompanyEventPublisher },
  ],
  exports: [COMPANY_EVENT_PUBLISHER],
})
export class RealtimeModule {}

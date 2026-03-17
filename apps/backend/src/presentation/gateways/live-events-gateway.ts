import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { fromNodeHeaders } from 'better-auth/node';
import type { RedisConfig } from '../../config/redis-config.js';
import type { AppConfig } from '../../config/app-config.js';
import { AuthService } from '../../application/services/impl/auth-service.js';
import type { IUserCompanyRepository } from '../../domain/repositories/i-user-company-repository.js';
import { USER_COMPANY_REPOSITORY } from '../../domain/repositories/i-user-company-repository.js';

/**
 * WebSocket gateway that bridges Redis pub/sub channels to Socket.io rooms.
 * - Run events:     Redis `live:{companyId}:*`  → emits `heartbeat.run.event`
 * - Company events: Redis `company:{companyId}` → emits event.type
 * Auth: validates Better Auth session cookie + company membership on handshake.
 */
@WebSocketGateway({
  cors: { origin: (origin: string, cb: (err: Error | null, allow?: boolean) => void) => cb(null, true) },
  namespace: '/events',
})
export class LiveEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(LiveEventsGateway.name);
  private readonly redisUrl: string;
  private readonly isDev: boolean;

  /** Map of companyId → Redis subscriber (lazy, created on first client) */
  private readonly subscriptions = new Map<string, Redis>();

  /** Keepalive interval handle */
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepo: IUserCompanyRepository,
  ) {
    this.redisUrl = config.get<RedisConfig>('redis')!.url;
    this.isDev = config.get<AppConfig>('app')!.nodeEnv !== 'production';
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  onModuleInit(): void {
    this.pingInterval = setInterval(() => {
      this.server?.emit('ping');
    }, 30_000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pingInterval) clearInterval(this.pingInterval);
    await Promise.all([...this.subscriptions.values()].map((sub) => sub.quit()));
    this.subscriptions.clear();
  }

  // ── Connection handling ───────────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    const companyId = client.handshake.auth['companyId'] as string | undefined;
    if (!companyId) {
      client.disconnect();
      return;
    }

    // Validate session via Better Auth cookie
    const headers = fromNodeHeaders(
      client.handshake.headers as Record<string, string | string[]>,
    );
    const session = await this.authService.auth.api
      .getSession({ headers })
      .catch(() => null);
    if (!session?.user?.id) {
      this.logger.warn(`WS rejected: no valid session (client ${client.id})`);
      client.disconnect();
      return;
    }

    // Verify user is a member of the requested company
    const membership = await this.userCompanyRepo
      .findByUserAndCompany(session.user.id, companyId)
      .catch(() => null);
    if (!membership) {
      this.logger.warn(`WS rejected: user ${session.user.id} not in company ${companyId}`);
      client.disconnect();
      return;
    }

    const roomId = `company:${companyId}`;
    await client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
    this.ensureSubscription(companyId);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const companyId = client.handshake.auth['companyId'] as string | undefined;
    if (!companyId) return;

    const roomId = `company:${companyId}`;
    const room = this.server.sockets.adapter.rooms.get(roomId);
    const remainingClients = room ? room.size : 0;

    this.logger.log(`Client ${client.id} left ${roomId}, remaining: ${remainingClients}`);

    if (remainingClients === 0) {
      await this.teardownSubscription(companyId);
    }
  }

  // ── Redis subscription management ────────────────────────────────────────

  private ensureSubscription(companyId: string): void {
    if (this.subscriptions.has(companyId)) return;

    const subscriber = new Redis(this.redisUrl);
    const roomId = `company:${companyId}`;

    // Pattern subscribe for run events: live:{companyId}:*
    subscriber.psubscribe(`live:${companyId}:*`, (err) => {
      if (err) this.logger.error(`psubscribe error for ${companyId}: ${err}`);
    });

    // Channel subscribe for company-level events
    subscriber.subscribe(`company:${companyId}`, (err) => {
      if (err) this.logger.error(`subscribe error for ${companyId}: ${err}`);
    });

    // Forward run events (pattern match)
    subscriber.on('pmessage', (_pattern: string, _channel: string, message: string) => {
      this.server.to(roomId).emit('heartbeat.run.event', safeParseJson(message));
    });

    // Forward company events (exact channel match)
    subscriber.on('message', (_channel: string, message: string) => {
      const parsed = safeParseJson(message) as { type?: string; data?: unknown } | null;
      if (parsed?.type) {
        this.server.to(roomId).emit(parsed.type, parsed);
      }
    });

    this.subscriptions.set(companyId, subscriber);
    this.logger.log(`Subscribed to Redis channels for company ${companyId}`);
  }

  private async teardownSubscription(companyId: string): Promise<void> {
    const sub = this.subscriptions.get(companyId);
    if (!sub) return;
    try {
      await sub.quit();
    } catch (err) {
      this.logger.warn(`Error quitting Redis subscriber for ${companyId}: ${err}`);
    }
    this.subscriptions.delete(companyId);
    this.logger.log(`Unsubscribed Redis channels for company ${companyId}`);
  }
}

/** Safely parse JSON, returning null on failure */
function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

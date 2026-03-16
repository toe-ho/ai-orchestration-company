import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActorType } from '@aicompany/shared';
import { AgentJwtService } from '../application/services/impl/agent-jwt-service.js';
import { AgentApiKeyModel } from '../infrastructure/persistence/models/agent-api-key-model.js';
import { hashApiKey } from '../utils/hash.js';
import type { IActor } from '../domain/interfaces/i-actor.js';

/** Validates agent requests — accepts Bearer JWT or pcp_-prefixed API key */
@Injectable()
export class AgentAuthGuard implements CanActivate {
  constructor(
    private readonly agentJwtService: AgentJwtService,
    @InjectRepository(AgentApiKeyModel)
    private readonly apiKeyRepo: Repository<AgentApiKeyModel>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      actor?: IActor;
    }>();

    const authHeader = request.headers['authorization'];
    const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    if (!raw) {
      throw new UnauthorizedException('Authorization header required');
    }

    if (raw.startsWith('Bearer ')) {
      return this.handleJwt(raw.slice(7), request);
    }

    if (raw.startsWith('pcp_')) {
      return this.handleApiKey(raw, request);
    }

    throw new UnauthorizedException('Invalid authorization scheme');
  }

  private handleJwt(
    token: string,
    request: { actor?: IActor },
  ): boolean {
    try {
      const payload = this.agentJwtService.verify(token);
      request.actor = {
        type: ActorType.Agent,
        agentId: payload.agentId,
        companyId: payload.companyId,
        runId: payload.runId,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired agent JWT');
    }
  }

  private async handleApiKey(
    rawKey: string,
    request: { actor?: IActor },
  ): Promise<boolean> {
    const keyHash = hashApiKey(rawKey);
    const apiKey = await this.apiKeyRepo.findOneBy({ keyHash });

    if (!apiKey || apiKey.revokedAt !== null) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    request.actor = {
      type: ActorType.Agent,
      agentId: apiKey.agentId,
      companyId: apiKey.companyId,
    };
    return true;
  }
}

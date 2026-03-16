import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

export interface AgentJwtPayload {
  agentId: string;
  companyId: string;
  runId: string;
}

/** Signs and verifies short-lived JWTs for agent-to-backend communication */
@Injectable()
export class AgentJwtService {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.secret = this.config.get<string>('auth.agentJwtSecret')!;
    this.ttlSeconds = this.config.get<number>('auth.agentJwtTtlSeconds')!;
  }

  sign(agentId: string, companyId: string, runId: string): string {
    return jwt.sign({ agentId, companyId, runId }, this.secret, {
      expiresIn: this.ttlSeconds,
    });
  }

  verify(token: string): AgentJwtPayload {
    return jwt.verify(token, this.secret) as AgentJwtPayload;
  }
}

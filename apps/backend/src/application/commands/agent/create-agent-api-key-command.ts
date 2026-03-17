import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { hashApiKey } from '../../../utils/hash.js';
import type { IAgentApiKeyRepository } from '../../../infrastructure/repositories/agent-api-key-repository.js';
import { AGENT_API_KEY_REPOSITORY } from '../../../infrastructure/repositories/agent-api-key-repository.js';

export interface CreatedAgentApiKey {
  id: string;
  rawKey: string;
  agentId: string;
  companyId: string;
  label: string | null;
}

export class CreateAgentApiKeyCommand {
  constructor(
    public readonly agentId: string,
    public readonly companyId: string,
    public readonly label?: string,
  ) {}
}

@CommandHandler(CreateAgentApiKeyCommand)
export class CreateAgentApiKeyHandler
  implements ICommandHandler<CreateAgentApiKeyCommand, CreatedAgentApiKey>
{
  constructor(
    @Inject(AGENT_API_KEY_REPOSITORY) private readonly repo: IAgentApiKeyRepository,
  ) {}

  async execute(cmd: CreateAgentApiKeyCommand): Promise<CreatedAgentApiKey> {
    const rawKey = `pcp_${randomBytes(32).toString('hex')}`;
    const keyHash = hashApiKey(rawKey);

    const record = await this.repo.create({
      agentId: cmd.agentId,
      companyId: cmd.companyId,
      keyHash,
      label: cmd.label ?? null,
    });

    return {
      id: record.id,
      rawKey,
      agentId: record.agentId,
      companyId: record.companyId,
      label: record.label,
    };
  }
}

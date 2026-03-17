import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IAgentApiKeyRepository } from '../../../infrastructure/repositories/agent-api-key-repository.js';
import { AGENT_API_KEY_REPOSITORY } from '../../../infrastructure/repositories/agent-api-key-repository.js';

export class RevokeAgentApiKeyCommand {
  constructor(
    public readonly keyId: string,
  ) {}
}

@CommandHandler(RevokeAgentApiKeyCommand)
export class RevokeAgentApiKeyHandler implements ICommandHandler<RevokeAgentApiKeyCommand, void> {
  constructor(
    @Inject(AGENT_API_KEY_REPOSITORY) private readonly repo: IAgentApiKeyRepository,
  ) {}

  execute(cmd: RevokeAgentApiKeyCommand): Promise<void> {
    return this.repo.revoke(cmd.keyId);
  }
}

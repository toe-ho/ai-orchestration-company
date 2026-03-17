import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IApiKeyVaultService } from '../../services/interface/i-api-key-vault-service.js';
import { API_KEY_VAULT_SERVICE } from '../../services/interface/i-api-key-vault-service.js';

export class RevokeApiKeyCommand {
  constructor(
    public readonly keyId: string,
    public readonly companyId: string,
  ) {}
}

@CommandHandler(RevokeApiKeyCommand)
export class RevokeApiKeyHandler implements ICommandHandler<RevokeApiKeyCommand, void> {
  constructor(
    @Inject(API_KEY_VAULT_SERVICE) private readonly vault: IApiKeyVaultService,
  ) {}

  execute(cmd: RevokeApiKeyCommand): Promise<void> {
    return this.vault.revoke(cmd.keyId, cmd.companyId);
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IApiKeyVaultService } from '../../services/interface/i-api-key-vault-service.js';
import { API_KEY_VAULT_SERVICE } from '../../services/interface/i-api-key-vault-service.js';

export class StoreApiKeyCommand {
  constructor(
    public readonly companyId: string,
    public readonly provider: string,
    public readonly rawKey: string,
    public readonly label?: string,
  ) {}
}

@CommandHandler(StoreApiKeyCommand)
export class StoreApiKeyHandler implements ICommandHandler<StoreApiKeyCommand, string> {
  constructor(
    @Inject(API_KEY_VAULT_SERVICE) private readonly vault: IApiKeyVaultService,
  ) {}

  execute(cmd: StoreApiKeyCommand): Promise<string> {
    return this.vault.store(cmd.companyId, cmd.provider, cmd.rawKey, cmd.label);
  }
}

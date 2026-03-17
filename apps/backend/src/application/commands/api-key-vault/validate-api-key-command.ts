import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IApiKeyVaultService } from '../../services/interface/i-api-key-vault-service.js';
import { API_KEY_VAULT_SERVICE } from '../../services/interface/i-api-key-vault-service.js';

export class ValidateApiKeyCommand {
  constructor(
    public readonly companyId: string,
    public readonly keyId: string,
  ) {}
}

@CommandHandler(ValidateApiKeyCommand)
export class ValidateApiKeyHandler implements ICommandHandler<ValidateApiKeyCommand, boolean> {
  constructor(
    @Inject(API_KEY_VAULT_SERVICE) private readonly vault: IApiKeyVaultService,
  ) {}

  execute(cmd: ValidateApiKeyCommand): Promise<boolean> {
    return this.vault.validate(cmd.companyId, cmd.keyId);
  }
}

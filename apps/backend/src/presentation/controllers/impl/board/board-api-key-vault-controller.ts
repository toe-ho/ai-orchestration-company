import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
  HttpCode,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CompanyAccessGuard } from '../../../../guard/company-access-guard.js';
import { ZodValidationPipe } from '../../../../pipe/zod-validation-pipe.js';
import { StoreApiKeyDto, type StoreApiKeyDtoType } from '../../dto/api-key-vault/store-api-key-dto.js';
import { StoreApiKeyCommand } from '../../../../application/commands/api-key-vault/store-api-key-command.js';
import { ValidateApiKeyCommand } from '../../../../application/commands/api-key-vault/validate-api-key-command.js';
import { RevokeApiKeyCommand } from '../../../../application/commands/api-key-vault/revoke-api-key-command.js';
import type { IApiKeyVaultService } from '../../../../application/services/interface/i-api-key-vault-service.js';
import { API_KEY_VAULT_SERVICE } from '../../../../application/services/interface/i-api-key-vault-service.js';

@Controller('companies/:cid/api-keys')
@UseGuards(CompanyAccessGuard)
export class BoardApiKeyVaultController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(API_KEY_VAULT_SERVICE) private readonly vault: IApiKeyVaultService,
  ) {}

  @Get()
  list(@Param('cid') cid: string) {
    return this.vault.listMasked(cid);
  }

  @Post()
  store(
    @Param('cid') cid: string,
    @Body(new ZodValidationPipe(StoreApiKeyDto)) body: StoreApiKeyDtoType,
  ) {
    return this.commandBus.execute(
      new StoreApiKeyCommand(cid, body.provider, body.key, body.label),
    );
  }

  @Delete(':keyId')
  @HttpCode(204)
  revoke(@Param('cid') cid: string, @Param('keyId') keyId: string) {
    return this.commandBus.execute(new RevokeApiKeyCommand(keyId, cid));
  }

  @Post(':keyId/validate')
  validate(@Param('cid') cid: string, @Param('keyId') keyId: string) {
    return this.commandBus.execute(new ValidateApiKeyCommand(cid, keyId));
  }
}

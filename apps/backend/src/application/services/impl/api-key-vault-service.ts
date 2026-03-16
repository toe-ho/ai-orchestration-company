import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyApiKeyModel } from '../../../infrastructure/persistence/models/company-api-key-model.js';
import { encrypt, decrypt } from '../../../utils/crypto.js';
import { hashApiKey } from '../../../utils/hash.js';
import type { IApiKeyVaultService } from '../interface/i-api-key-vault-service.js';
import type { AppConfig } from '../../../config/app-config.js';

@Injectable()
export class ApiKeyVaultService implements IApiKeyVaultService {
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(CompanyApiKeyModel)
    private readonly repo: Repository<CompanyApiKeyModel>,
    config: ConfigService,
  ) {
    this.encryptionKey = config.get<AppConfig>('app')!.encryptionKey;
  }

  async retrieve(companyId: string, provider: string): Promise<string | null> {
    const record = await this.repo.findOneBy({ companyId, provider });
    if (!record) return null;
    return decrypt(record.encryptedKey, this.encryptionKey);
  }

  async store(companyId: string, provider: string, rawKey: string, label?: string): Promise<void> {
    const encryptedKey = encrypt(rawKey, this.encryptionKey);
    const keyHash = hashApiKey(rawKey);
    const existing = await this.repo.findOneBy({ companyId, provider });
    if (existing) {
      await this.repo.update(existing.id, { encryptedKey, keyHash, label: label ?? null });
    } else {
      const entity = this.repo.create({ companyId, provider, encryptedKey, keyHash, label: label ?? null });
      await this.repo.save(entity);
    }
  }
}

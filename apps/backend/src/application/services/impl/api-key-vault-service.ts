import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyApiKeyModel } from '../../../infrastructure/persistence/models/company-api-key-model.js';
import { encrypt, decrypt } from '../../../utils/crypto.js';
import { hashApiKey } from '../../../utils/hash.js';
import type { IApiKeyVaultService, MaskedApiKey } from '../interface/i-api-key-vault-service.js';
import type { AppConfig } from '../../../config/app-config.js';

@Injectable()
export class ApiKeyVaultService implements IApiKeyVaultService {
  private readonly encryptionKey: string;
  private readonly logger = new Logger(ApiKeyVaultService.name);

  constructor(
    @InjectRepository(CompanyApiKeyModel)
    private readonly repo: Repository<CompanyApiKeyModel>,
    config: ConfigService,
  ) {
    this.encryptionKey = config.get<AppConfig>('app')!.encryptionKey;
  }

  async retrieve(companyId: string, provider: string): Promise<string | null> {
    const record = await this.repo.findOneBy({ companyId, provider });
    if (!record || record.revokedAt) return null;
    return decrypt(record.encryptedKey, this.encryptionKey);
  }

  async store(companyId: string, provider: string, rawKey: string, label?: string): Promise<string> {
    const encryptedKey = encrypt(rawKey, this.encryptionKey);
    const keyHash = hashApiKey(rawKey);
    const maskedKey = rawKey.length > 8
      ? `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}`
      : '****';

    const existing = await this.repo.findOneBy({ companyId, provider });
    if (existing) {
      await this.repo.update(existing.id, {
        encryptedKey,
        keyHash,
        label: label ?? null,
        maskedKey,
        revokedAt: null,
      });
      return existing.id;
    }

    const entity = this.repo.create({
      companyId,
      provider,
      encryptedKey,
      keyHash,
      label: label ?? null,
      maskedKey,
    });
    const saved = await this.repo.save(entity);
    return saved.id;
  }

  async listMasked(companyId: string): Promise<MaskedApiKey[]> {
    const records = await this.repo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
    return records
      .filter((r) => !r.revokedAt)
      .map((r) => ({
        id: r.id,
        provider: r.provider,
        label: r.label,
        maskedKey: r.maskedKey,
        isValid: r.isValid,
        lastValidatedAt: r.lastValidatedAt,
        createdAt: r.createdAt,
      }));
  }

  async validate(companyId: string, keyId: string): Promise<boolean> {
    const record = await this.repo.findOneBy({ id: keyId, companyId });
    if (!record || record.revokedAt) return false;

    let valid = false;
    try {
      const rawKey = decrypt(record.encryptedKey, this.encryptionKey);
      if (record.provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': rawKey, 'anthropic-version': '2023-06-01' },
        });
        valid = res.ok;
      } else {
        // For unknown providers, treat successful decryption as valid
        valid = rawKey.length > 0;
      }
    } catch (err) {
      this.logger.warn(`Key validation failed for ${keyId}: ${err}`);
      valid = false;
    }

    await this.repo.update(keyId, { isValid: valid, lastValidatedAt: new Date() });
    return valid;
  }

  async revoke(keyId: string, companyId: string): Promise<void> {
    // Ownership check: only revoke if key belongs to the company
    const record = await this.repo.findOneBy({ id: keyId, companyId });
    if (!record) return;
    await this.repo.update(keyId, { revokedAt: new Date() });
  }
}

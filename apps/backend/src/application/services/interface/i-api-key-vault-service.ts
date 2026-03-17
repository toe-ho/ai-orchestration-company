export interface MaskedApiKey {
  id: string;
  provider: string;
  label: string | null;
  maskedKey: string | null;
  isValid: boolean;
  lastValidatedAt: Date | null;
  createdAt: Date;
}

/** Stores and retrieves encrypted company API keys */
export interface IApiKeyVaultService {
  /** Decrypt and return the raw API key for a provider */
  retrieve(companyId: string, provider: string): Promise<string | null>;
  /** Encrypt and persist an API key, returns the stored record id */
  store(companyId: string, provider: string, rawKey: string, label?: string): Promise<string>;
  /** List keys with first 4 + last 4 chars masked */
  listMasked(companyId: string): Promise<MaskedApiKey[]>;
  /** Validate a key by calling provider health endpoint */
  validate(companyId: string, keyId: string): Promise<boolean>;
  /** Soft-delete a key by setting revokedAt — companyId enforces ownership */
  revoke(keyId: string, companyId: string): Promise<void>;
}

export const API_KEY_VAULT_SERVICE = Symbol('IApiKeyVaultService');

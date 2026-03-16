/** Stores and retrieves encrypted company API keys */
export interface IApiKeyVaultService {
  /** Decrypt and return the raw API key for a provider */
  retrieve(companyId: string, provider: string): Promise<string | null>;
  /** Encrypt and persist an API key */
  store(companyId: string, provider: string, rawKey: string, label?: string): Promise<void>;
}

export const API_KEY_VAULT_SERVICE = Symbol('IApiKeyVaultService');

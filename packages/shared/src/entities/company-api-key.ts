export interface ICompanyApiKey {
  id: string;
  companyId: string;
  provider: string;
  encryptedKey: string;
  keyHash: string;
  label: string | null;
  isValid: boolean;
  lastValidatedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

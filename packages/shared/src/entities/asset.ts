export interface IAsset {
  id: string;
  companyId: string;
  s3Key: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdBy: string | null;
  createdAt: Date;
}

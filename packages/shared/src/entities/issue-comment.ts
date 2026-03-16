export interface IIssueComment {
  id: string;
  companyId: string;
  issueId: string;
  authorType: string;
  authorId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

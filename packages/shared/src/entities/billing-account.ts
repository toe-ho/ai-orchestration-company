export interface IBillingAccount {
  id: string;
  userId: string;
  plan: string;
  stripeCustomerId: string | null;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

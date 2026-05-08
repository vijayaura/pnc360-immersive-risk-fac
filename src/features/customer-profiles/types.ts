export type CustomerProfileKey = string;

export type CustomerActivityItem = {
  id: string;
  transactionId?: string | null;
  productId?: string | null;
  productName?: string | null;
  status?: string | null;
  stage?: string | null;
  transactionType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  premium?: number | string | null;
  currency?: string | null;
  policyId?: string | null;
  quoteNumber?: string | null;
  quoteId?: string | null;
  proposalId?: string | null;
  referralId?: string | null;
  reason?: string | null;
  kind: 'quote' | 'policy' | 'proposal' | 'endorsement' | 'referral';
};

export type CustomerProfileSummary = {
  customerId: string;
  key: CustomerProfileKey;
  displayName: string;
  customerRefId?: string | null;
  searchBlob: string;
  customerSince?: string | null;
  lastTransactionAt?: string | null;
  totals: {
    proposals: number;
    quotes: number;
    policies: number;
    referrals: number;
    endorsements: number;
    totalPremium: number;
  };
  products: Array<{
    productId: string;
    productName: string;
    totals: {
      proposals: number;
      quotes: number;
      policies: number;
      referrals: number;
      endorsements: number;
      totalPremium: number;
    };
  }>;
  activity: CustomerActivityItem[];
};

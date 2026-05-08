import { PremiumBreakdown, FeeType, QuotesComparisonInsurerConfig, RatingBreakdownItem } from '@/features/quotes/api/quotes';
import { ProposalBundleResponse, InsurerPricingConfigResponse } from '@/features/quotes/api/quotes';
import { BrokerInsurersResponse, BrokerInsurer } from '@/features/brokers/api/brokers';

export type { RatingBreakdownItem };



export type InsurerValidationResult = {
  overallDecision?: string;
  sumInsured?: number;
  basePremium?: number;
  premium?: PremiumBreakdown | null;
  feeTypes?: FeeType[];
  ratingBreakdown?: RatingBreakdownItem[];
  commissions?: Record<string, unknown>;
};

export type QuoteRow = Record<string, unknown> & {
  id: number;
  insurerId?: string | number;
  insurerName?: string;
  annualPremium?: number;
  coverageAmount?: number;
  currency?: string;
  premium?: PremiumBreakdown | null;
  feeTypes?: FeeType[];
  commissions?: Record<string, unknown>;
  validationResult?: InsurerValidationResult;
  pricingConfig?: QuotesComparisonInsurerConfig;
  quoteEvaluationId?: string | null;
  status?: string;
};

export interface QuotesComparisonProps {
  assignedInsurers?: BrokerInsurersResponse | null;
  currentProposal?: ProposalBundleResponse | null;
  isLoadingProposal?: boolean;
  insurerPricingConfigs?: Record<number, InsurerPricingConfigResponse>;
  isLoadingPricingConfigs?: boolean;
  onLoadPricingConfigs?: (eligibleInsurers: BrokerInsurer[]) => Promise<boolean>;
  onQuotesLoaded?: (hasQuotes: boolean) => void;
  productId?: number | string;
  responseId?: string;
  /** When set (endorsement flow), use endorsement calculate-premium and select-premium APIs instead of quote APIs */
  endorsementId?: string;
  onPlanConfirmed?: () => void;
  setSelectedQuoteId?: (quoteId: number | string | null) => void;
}

export interface QuotesComparisonRef {
  /** Call before moving to next step (e.g. endorsement) to sync selection with backend. */
  submitSelectionBeforeNext: () => Promise<void>;
  /** Endorsement: true when revised quote selection is already saved. */
  isSelectionSavedForEndorsement?: () => boolean;
}

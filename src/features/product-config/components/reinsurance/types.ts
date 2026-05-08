// ─────────────────────────────────────────────────────────────────────────────
// Shared reinsurance types
// Used by: CoverReinsuranceSetup, ReinsuranceSetup (and future pages)
// ─────────────────────────────────────────────────────────────────────────────

export type TreatyStructureType =
  | 'Quota Share (QS)'
  | 'Surplus'
  | 'Excess of Loss (XOL)'
  | 'Stop Loss'
  | 'Multi-layer';

export type ReinstatementPremiumType = 'Pro-rata' | 'Fixed' | 'Sliding';
export type PremiumBase = 'Net Earned Premium' | 'Gross Earned Premium';
export type XOLCoverBasis = 'Risk' | 'Event' | 'Cat';
export type XOLRateType = 'Per Occurrence' | 'Per Risk' | 'Per Policy' | 'Flat Rate';
export type PremiumBasisOgrOnr = 'OGR' | 'ONR';
export type RatingGrade =
  | 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D' | 'Unrated';

export interface TreatyTriggerCondition {
  id: string;
  parameterId: string;
  /** Must match backend RULE_OPERATOR enum */
  operator:
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterThanOrEqual'
    | 'lessThanOrEqual'
    | 'in'
    | 'contains';
  value: number | string;
}

export interface TreatyRule {
  id: string;
  conditions: TreatyTriggerCondition[];
}

export interface LossRatioBand {
  minLR: number;
  maxLR: number;
  commissionPercent: number;
}

export interface LossCorridor {
  minLR: number;
  maxLR: number;
  adjustmentPercent: number;
}

export interface ReinsurancePanel {
  id: string;
  /** Backend UUID — required when sending to API via panelParticipants */
  reinsurerId?: string;
  reinsurerName: string;
  brokerId?: string;
  reinsuranceBroker: string;
  rating: string;
  sharePercent: number;
  isLead: boolean;
}

export type TreatyStatus = 'Draft' | 'Active' | 'Inactive' | 'Expired' | 'Terminated';

export interface TreatyStructure {
  id: string;
  structureType: TreatyStructureType;
  // Basic details
  name: string;
  treatyCode: string;
  effectiveDate: Date | null;
  expiryDate: Date | null;
  treatyYear: string;
  cedant: string;
  lineOfBusiness: string;
  territory: string;
  currency: string;
  status: TreatyStatus | '';
  notes: string;
  premiumBasisOgrOnr: PremiumBasisOgrOnr | '';
  treatyTriggerConditions: TreatyTriggerCondition[];
  inclusionRules: TreatyRule[];
  exclusionRules: TreatyRule[];

  // Quota Share
  quotaSharePercent: number;
  seededPercent: number;
  retentionPercent: number;
  maxTreatyCapacity: number;
  treatyTriggerAmount: number;
  cedingCommissionType: 'Flat' | 'Sliding Scale' | '';
  cedingCommissionPercent: number;
  profitCommissionEnabled: boolean;
  profitCommissionMin: number;
  profitCommissionMax: number;
  lrTriggerLevels: string;
  slidingScaleMinCommission: number;
  slidingScaleMaxCommission: number;
  lossRatioBands: LossRatioBand[];
  bookingCommission: number;
  finalAdjustmentAtYearEnd: boolean;
  lossCorridors: LossCorridor[];
  // Profit Commission (QS only — spec-aligned fields)
  profitCommissionPercent: number;
  carryForwardLossPercent: number;
  expenseRatioPercent: number;
  deficitCarryForward: boolean;

  // Surplus
  surplusLines: number;
  surplusRetentionLimit: number;
  surplusRetentionPercent: number;
  surplusMaxCapacity: number;
  surplusSeededPercent: number;
  surplusMaxTreatyCapacity: number;
  surplusCommissionType: 'Flat' | 'Sliding Scale' | '';
  surplusCedingCommission: number;
  surplusProfitCommissionEnabled: boolean;
  surplusSlidingScaleMinCommission: number;
  surplusSlidingScaleMaxCommission: number;
  surplusLossRatioBands: LossRatioBand[];
  surplusBookingCommission: number;
  surplusFinalAdjustmentAtYearEnd: boolean;
  surplusLossCorridors: LossCorridor[];

  // XOL
  xolRate: number;
  xolRateType: XOLRateType | '';
  xolMinimumDepositPremium: number;
  xolLimitPerOccurrence: number;
  xolDeductible: number;
  xolAggregateLimit: number;
  xolReinstatements: number;
  xolReinstatementPremiumType: ReinstatementPremiumType | '';
  xolLossCorridors: LossCorridor[];
  xolCoverBasis: XOLCoverBasis | '';
  xolLayerPosition: number;

  // Stop Loss
  stopLossAttachment: number;
  stopLossDetachment: number;
  stopLossPremiumBase: PremiumBase | '';
  stopLossLimitOfLiability: number;
  stopLossAnnualAggregateLimit: number;

  // Panel & financials
  reinsurancePanel: ReinsurancePanel[];
  totalCessionPercent: number;
  brokeragePercent: number;
  overrideFrontingFeePercent: number;
  // Account & Settlement
  accountingFrequency: 'Monthly' | 'Quarterly' | '';
  bordereauxType: 'Premium' | 'Claims' | '';
  settlementCurrency: 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'Other' | '';
  statementDueDays: number;

  // Documentation
  treatyDocuments: string[];
  slipUrl: string;
  underwritingGuidelinesLink: string;

  // Claims & Recoveries (persisted)
  cashCallAllowed: boolean;
  claimNotificationThreshold: number;
  claimSettlementBasis: 'Follow the fortunes' | 'Follow the settlements' | '';
}

export interface FacultativePanelMember {
  reinsurerOrganizationId: string;
  sharePercent: number;
}

export interface CoverProgram {
  id: string;
  treatyName: string;
  treatyCode: string;
  programCode?: string;
  /** false = saved with "Save as Draft" (not used in quote evaluation). */
  active?: boolean;
  startDate: string | null;
  endDate: string | null;
  treatyStructures: TreatyStructure[];
  facultativeMandatory: boolean;
  facultativeConditionGroups: TreatyRule[];
  facultativeConditionGroupsLogic: 'OR' | 'AND';
  facultativeExclusionConditionGroups: TreatyRule[];
  facultativePanelReinsurers: FacultativePanelMember[];
  // Legacy — preserved for migration on load only
  facultativeSumInsuredAbove?: number;
  facultativePanelReinsurerIds?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory helpers — used wherever a blank structure/program is needed
// ─────────────────────────────────────────────────────────────────────────────

export const genId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/** Auto-generate a treaty code: TRT-YYYYMMDD-XXXX */
const generateTreatyCode = (): string => {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TRT-${date}-${rand}`;
};

export const createNewTreatyStructure = (type: TreatyStructureType): TreatyStructure => ({
  id: genId('struct'),
  structureType: type,
  name: '',
  treatyCode: generateTreatyCode(),
  effectiveDate: null,
  expiryDate: null,
  treatyYear: String(new Date().getFullYear()),
  cedant: '',
  lineOfBusiness: '',
  territory: '',
  currency: 'AED',
  status: 'Draft',
  notes: '',
  premiumBasisOgrOnr: 'OGR',
  treatyTriggerConditions: [],
  inclusionRules: [],
  exclusionRules: [],
  quotaSharePercent: 0,
  seededPercent: 0,
  retentionPercent: 0,
  maxTreatyCapacity: 0,
  treatyTriggerAmount: 0,
  cedingCommissionType: '',
  cedingCommissionPercent: 0,
  profitCommissionEnabled: false,
  profitCommissionMin: 0,
  profitCommissionMax: 0,
  lrTriggerLevels: '',
  slidingScaleMinCommission: 0,
  slidingScaleMaxCommission: 0,
  lossRatioBands: [],
  bookingCommission: 0,
  finalAdjustmentAtYearEnd: false,
  lossCorridors: [],
  profitCommissionPercent: 0,
  carryForwardLossPercent: 0,
  expenseRatioPercent: 0,
  deficitCarryForward: false,
  surplusLines: 0,
  surplusRetentionLimit: 0,
  surplusRetentionPercent: 0,
  surplusMaxCapacity: 0,
  surplusSeededPercent: 0,
  surplusMaxTreatyCapacity: 0,
  surplusCommissionType: '',
  surplusCedingCommission: 0,
  surplusProfitCommissionEnabled: false,
  surplusSlidingScaleMinCommission: 0,
  surplusSlidingScaleMaxCommission: 0,
  surplusLossRatioBands: [],
  surplusBookingCommission: 0,
  surplusFinalAdjustmentAtYearEnd: false,
  surplusLossCorridors: [],
  xolRate: 0,
  xolRateType: '',
  xolMinimumDepositPremium: 0,
  xolLimitPerOccurrence: 0,
  xolDeductible: 0,
  xolAggregateLimit: 0,
  xolReinstatements: 0,
  xolReinstatementPremiumType: '',
  xolLossCorridors: [],
  xolCoverBasis: '',
  xolLayerPosition: 1,
  stopLossAttachment: 0,
  stopLossDetachment: 0,
  stopLossPremiumBase: '',
  stopLossLimitOfLiability: 0,
  stopLossAnnualAggregateLimit: 0,
  reinsurancePanel: [],
  totalCessionPercent: 0,
  brokeragePercent: 0,
  overrideFrontingFeePercent: 0,
  accountingFrequency: '',
  bordereauxType: '',
  settlementCurrency: 'AED',
  statementDueDays: 0,
  treatyDocuments: [],
  slipUrl: '',
  underwritingGuidelinesLink: '',
  cashCallAllowed: false,
  claimNotificationThreshold: 0,
  claimSettlementBasis: '',
});

export const createEmptyProgram = (): CoverProgram => {
  return {
    id: genId('prog'),
    treatyName: '',
    treatyCode: '',
    startDate: null,
    endDate: null,
    treatyStructures: [],
    facultativeMandatory: false,
    facultativeConditionGroups: [],
    facultativeConditionGroupsLogic: 'OR' as const,
    facultativeExclusionConditionGroups: [],
    facultativePanelReinsurers: [],
  };
};

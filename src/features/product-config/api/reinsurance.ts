import { format } from 'date-fns';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client';
import type {
  TreatyStructure,
  TreatyStructureType,
  TreatyRule,
  CoverProgram,
  ReinsurancePanel,
  TreatyTriggerCondition,
  FacultativePanelMember,
} from '@/features/product-config/components/reinsurance/types';
import { createNewTreatyStructure } from '@/features/product-config/components/reinsurance/types';

// ─────────────────────────────────────────────────────────────────────────────
// Backend enums
// ─────────────────────────────────────────────────────────────────────────────

export type BackendReinsuranceType =
  | 'Cover Reinsurance Program'
  | 'Treaty'
  | 'Facultative'
  | 'Both (Hybrid)'
  | 'None';

// Backend expects the same display strings as the frontend
export type BackendTreatyStructureType = TreatyStructureType;

export type BackendCedingCommissionType = 'Flat' | 'Sliding Scale';

export type BackendRuleOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'in'
  | 'contains';

export type BackendLogicalOp = 'AND' | 'OR';

export type BackendTreatyRuleType = 'Inclusion' | 'Exclusion';

// ─────────────────────────────────────────────────────────────────────────────
// Enum maps: frontend ↔ backend
// ─────────────────────────────────────────────────────────────────────────────

// Backend uses same display strings as frontend — no mapping needed
function deriveProgramType(_structures: TreatyStructure[]): BackendReinsuranceType {
  return 'Cover Reinsurance Program';
}

function mapCedingCommission(type: string): BackendCedingCommissionType | undefined {
  if (type === 'Flat') return 'Flat';
  if (type === 'Sliding Scale') return 'Sliding Scale';
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-object DTOs
// ─────────────────────────────────────────────────────────────────────────────

interface TreatyConditionDto {
  parameterId: string;
  operator: BackendRuleOperator;
  value: string;
  sequenceNo: number;
  logicalOp: BackendLogicalOp;
}

interface TreatyRuleConditionDto {
  parameterId: string;
  operator: BackendRuleOperator;
  value: string;
  sequenceNo: number;
}

interface TreatyRuleGroupDto {
  ruleType: BackendTreatyRuleType;
  sequenceNo: number;
  conditions: TreatyRuleConditionDto[];
}

interface FacultativeConditionDto {
  id?: string;
  parameterId: string;
  operator: BackendRuleOperator;
  value: string;
}

interface FacultativeConditionGroupDto {
  id?: string;
  conditions: FacultativeConditionDto[];
}

interface PanelParticipantDto {
  reinsurerOrganizationId: string;
  brokerOrganizationId?: string;
  sharePercent: number;
  isLead: boolean;
  rating: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request DTOs
// ─────────────────────────────────────────────────────────────────────────────

/** Embedded in program creation (no reinsuranceProgramId needed) */
interface ReinsuranceTreatyBaseDto {
  structureType: BackendTreatyStructureType;
  productId?: string;
  name?: string;
  notes?: string;
  treatyCode?: string;
  effectiveDate?: string;
  expiryDate?: string;
  treatyYear?: number;
  cedant?: string;
  lineOfBusiness?: string;
  territory?: string;
  currency?: string;
  status?: string;
  premiumBasisOgrOnr?: string;
  // Quota Share
  quotaSharePercent?: number;
  seededPercent?: number;
  retentionPercent?: number;
  maxTreatyCapacity?: number;
  treatyTriggerAmount?: number;
  cedingCommissionType?: BackendCedingCommissionType;
  cedingCommissionPercent?: number;
  profitCommissionEnabled?: boolean;
  profitCommissionPercent?: number;
  carryForwardLossPercent?: number;
  expenseRatioPercent?: number;
  deficitCarryForward?: boolean;
  lrTriggerLevels?: string;
  slidingScaleMinCommission?: number;
  slidingScaleMaxCommission?: number;
  lossRatioBands?: Array<{ minLR: number; maxLR: number; commissionPercent: number }>;
  bookingCommission?: number;
  finalAdjustmentAtYearEnd?: boolean;
  lossCorridors?: Array<{ minLR: number; maxLR: number; adjustmentPercent: number }>;
  // Surplus (surplusMaxCapacity intentionally omitted — server-computed)
  surplusLines?: number;
  surplusRetentionLimit?: number;
  surplusRetentionPercent?: number;
  surplusSeededPercent?: number;
  surplusMaxTreatyCapacity?: number;
  surplusCommissionType?: BackendCedingCommissionType;
  surplusCedingCommission?: number;
  surplusProfitCommissionEnabled?: boolean;
  surplusSlidingScaleMinCommission?: number;
  surplusSlidingScaleMaxCommission?: number;
  surplusLossRatioBands?: Array<{ minLR: number; maxLR: number; commissionPercent: number }>;
  surplusBookingCommission?: number;
  surplusFinalAdjustmentAtYearEnd?: boolean;
  surplusLossCorridors?: Array<{ minLR: number; maxLR: number; adjustmentPercent: number }>;
  // XOL
  xolRate?: number;
  xolRateType?: string;
  xolMinimumDepositPremium?: number;
  xolLimitPerOccurrence?: number;
  xolDeductible?: number;
  xolAggregateLimit?: number;
  xolReinstatements?: number;
  xolReinstatementPremiumType?: string;
  xolLossCorridors?: Array<{ minLR: number; maxLR: number; adjustmentPercent: number }>;
  xolCoverBasis?: string;
  xolLayerPosition?: number;
  // Stop Loss
  stopLossAttachment?: number;
  stopLossDetachment?: number;
  stopLossPremiumBase?: string;
  stopLossLimitOfLiability?: number;
  stopLossAnnualAggregateLimit?: number;
  // Treaty trigger
  treatyTriggerType?: string;
  treatyTriggerAutomatic?: boolean;
  totalCessionPercent?: number;
  // Financial
  brokeragePercent?: number;
  overrideFrontingFeePercent?: number;
  accountingFrequency?: string;
  bordereauxType?: string;
  settlementCurrency?: string;
  statementDueDays?: number;
  // Documentation
  slipUrl?: string;
  underwritingGuidelinesLink?: string;
  // Claims & Recoveries
  cashCallAllowed?: boolean;
  claimNotificationThreshold?: number;
  claimSettlementBasis?: string;
  // Panel & rule groups
  panelParticipants?: PanelParticipantDto[];
  treatyTriggerConditions?: TreatyConditionDto[];
  ruleGroups?: TreatyRuleGroupDto[];
}

/** Full treaty body for POST /reinsurance/treaties (requires programId) */
interface CreateReinsuranceTreatyDto extends ReinsuranceTreatyBaseDto {
  reinsuranceProgramId: string;
}

export interface CreateReinsuranceProgramDto {
  name: string;
  type: BackendReinsuranceType;
  productId: string;
  organizationId: string;
  coverId?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  treatyName?: string;
  treatyCode?: string;
  programCode?: string;
  facultativeMandatory?: boolean;
  facultativeSumInsuredAbove?: number;
  facultativePanelReinsurers?: Array<string | { reinsurerOrganizationId: string; sharePercent: number }>;
  facultativeConditionGroups?: FacultativeConditionGroupDto[];
  facultativeConditionGroupsLogic?: BackendLogicalOp;
  facultativeExclusionConditionGroups?: FacultativeConditionGroupDto[];
  treaties?: ReinsuranceTreatyBaseDto[];
}

export interface UpdateReinsuranceProgramDto {
  type: BackendReinsuranceType;
  organizationId: string;
  productId?: string;
  coverId?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  treatyName?: string;
  treatyCode?: string;
  programCode?: string;
  facultativeMandatory?: boolean;
  facultativeSumInsuredAbove?: number;
  facultativePanelReinsurers?: Array<string | { reinsurerOrganizationId: string; sharePercent: number }>;
  facultativeConditionGroups?: FacultativeConditionGroupDto[];
  facultativeConditionGroupsLogic?: BackendLogicalOp;
  facultativeExclusionConditionGroups?: FacultativeConditionGroupDto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Response types (backend → frontend)
// ─────────────────────────────────────────────────────────────────────────────

interface TreatyRuleConditionResponse {
  parameterId: string;
  operator: BackendRuleOperator;
  value: string;
  sequenceNo: number;
}

interface TreatyRuleGroupResponse {
  ruleType: BackendTreatyRuleType;
  sequenceNo: number;
  conditions: TreatyRuleConditionResponse[];
}

interface FacultativeConditionResponse {
  id: string;
  parameterId: string;
  operator: BackendRuleOperator;
  value: string;
}

interface FacultativeConditionGroupResponse {
  id: string;
  conditions: FacultativeConditionResponse[];
}

export interface ReinsuranceProgramResponse {
  id: string;
  name: string;
  type: BackendReinsuranceType;
  organizationId: string;
  coverId: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  treatyName?: string;
  treatyCode?: string;
  programCode?: string;
  facultativeMandatory?: boolean;
  facultativeSumInsuredAbove?: number;
  /** Correct field name from spec — may be string[] (legacy) or FacultativePanelMember[] */
  facultativePanelReinsurers?: (string | FacultativePanelMember)[];
  facultativeConditionGroups?: FacultativeConditionGroupResponse[];
  facultativeConditionGroupsLogic?: BackendLogicalOp;
  facultativeExclusionConditionGroups?: FacultativeConditionGroupResponse[];
  createdAt?: string;
  updatedAt?: string;
}

interface TreatyParticipantResponse {
  id: string;
  reinsurerOrganizationId: string;
  brokerOrganizationId?: string;
  sharePercent: number;
  isLead: boolean;
  rating: string;
}

interface TreatyConditionResponse {
  id: string;
  parameterId: string;
  operator: BackendRuleOperator;
  value: string;
  sequenceNo: number;
  logicalOp: BackendLogicalOp;
}

export interface ReinsuranceTreatyResponse {
  id: string;
  reinsuranceProgramId: string;
  structureType: BackendTreatyStructureType;
  name?: string;
  notes?: string;
  treatyCode?: string;
  effectiveDate?: string;
  expiryDate?: string;
  treatyYear?: number;
  cedant?: string;
  lineOfBusiness?: string;
  territory?: string;
  currency?: string;
  status?: string;
  premiumBasisOgrOnr?: string;
  quotaSharePercent?: number;
  seededPercent?: number;
  retentionPercent?: number;
  maxTreatyCapacity?: number;
  treatyTriggerAmount?: number;
  cedingCommissionType?: BackendCedingCommissionType;
  cedingCommissionPercent?: number;
  profitCommissionEnabled?: boolean;
  profitCommissionPercent?: number;
  carryForwardLossPercent?: number;
  expenseRatioPercent?: number;
  deficitCarryForward?: boolean;
  lrTriggerLevels?: string;
  slidingScaleMinCommission?: number;
  slidingScaleMaxCommission?: number;
  lossRatioBands?: Array<{ minLR: number; maxLR: number; commissionPercent: number }>;
  bookingCommission?: number;
  finalAdjustmentAtYearEnd?: boolean;
  lossCorridors?: Array<{ minLR: number; maxLR: number; adjustmentPercent: number }>;
  surplusLines?: number;
  surplusRetentionLimit?: number;
  surplusRetentionPercent?: number;
  surplusMaxCapacity?: number; // server-computed, read-only
  surplusSeededPercent?: number;
  surplusMaxTreatyCapacity?: number;
  surplusCommissionType?: BackendCedingCommissionType;
  surplusCedingCommission?: number;
  surplusProfitCommissionEnabled?: boolean;
  surplusSlidingScaleMinCommission?: number;
  surplusSlidingScaleMaxCommission?: number;
  surplusLossRatioBands?: Array<{ minLR: number; maxLR: number; commissionPercent: number }>;
  surplusBookingCommission?: number;
  surplusFinalAdjustmentAtYearEnd?: boolean;
  surplusLossCorridors?: Array<{ minLR: number; maxLR: number; adjustmentPercent: number }>;
  xolRate?: number;
  xolRateType?: string;
  xolMinimumDepositPremium?: number;
  xolLimitPerOccurrence?: number;
  xolDeductible?: number;
  xolAggregateLimit?: number;
  xolReinstatements?: number;
  xolReinstatementPremiumType?: string;
  xolLossCorridors?: Array<{ minLR: number; maxLR: number; adjustmentPercent: number }>;
  xolCoverBasis?: string;
  xolLayerPosition?: number;
  stopLossAttachment?: number;
  stopLossDetachment?: number;
  stopLossPremiumBase?: string;
  stopLossLimitOfLiability?: number;
  stopLossAnnualAggregateLimit?: number;
  totalCessionPercent?: number;
  treatyTriggerType?: string;
  treatyTriggerAutomatic?: boolean;
  brokeragePercent?: number;
  overrideFrontingFeePercent?: number;
  accountingFrequency?: string;
  bordereauxType?: string;
  settlementCurrency?: string;
  statementDueDays?: number;
  slipUrl?: string;
  underwritingGuidelinesLink?: string;
  cashCallAllowed?: boolean;
  claimNotificationThreshold?: number;
  claimSettlementBasis?: string;
  panelParticipants?: TreatyParticipantResponse[];
  treatyTriggerConditions?: TreatyConditionResponse[];
  ruleGroups?: TreatyRuleGroupResponse[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mappers: frontend → backend DTO
// ─────────────────────────────────────────────────────────────────────────────

function mapPanelParticipantToDto(p: ReinsurancePanel): PanelParticipantDto | null {
  // reinsurerId must be a real UUID to send to backend
  if (!p.reinsurerId) return null;
  return {
    reinsurerOrganizationId: p.reinsurerId,
    brokerOrganizationId: p.brokerId || undefined,
    sharePercent: p.sharePercent,
    isLead: p.isLead,
    rating: p.rating || 'Unrated',
  };
}

function mapTriggerConditionToDto(cond: TreatyTriggerCondition, idx: number): TreatyConditionDto {
  return {
    parameterId: cond.parameterId,
    operator: cond.operator as BackendRuleOperator,
    value: String(cond.value),
    sequenceNo: idx + 1,
    logicalOp: 'AND',
  };
}

function mapRuleToRuleGroupDto(rule: TreatyRule, ruleType: BackendTreatyRuleType, seqNo: number): TreatyRuleGroupDto {
  return {
    ruleType,
    sequenceNo: seqNo,
    conditions: (rule.conditions ?? []).map((c, idx) => ({
      parameterId: c.parameterId,
      operator: c.operator as BackendRuleOperator,
      value: String(c.value),
      sequenceNo: idx + 1,
    })),
  };
}

function mapRulesToRuleGroups(
  inclusionRules: TreatyRule[],
  exclusionRules: TreatyRule[],
): TreatyRuleGroupDto[] {
  const groups: TreatyRuleGroupDto[] = [];
  // Skip rules with no conditions — they are meaningless and should not be persisted
  const validInclusion = inclusionRules.filter((r) => r.conditions?.length > 0);
  const validExclusion = exclusionRules.filter((r) => r.conditions?.length > 0);
  validInclusion.forEach((rule, i) => groups.push(mapRuleToRuleGroupDto(rule, 'Inclusion', i + 1)));
  validExclusion.forEach((rule, i) =>
    groups.push(mapRuleToRuleGroupDto(rule, 'Exclusion', validInclusion.length + i + 1)),
  );
  // Return empty array (not undefined) so the backend clears existing rules
  return groups;
}

function isRealUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function mapFacultativeConditionGroups(
  rules: TreatyRule[],
): FacultativeConditionGroupDto[] | undefined {
  if (!rules.length) return undefined;
  return rules.map((rule) => ({
    id: isRealUUID(rule.id) ? rule.id : crypto.randomUUID(),
    conditions: (rule.conditions ?? []).map((c) => ({
      id: isRealUUID(c.id) ? c.id : crypto.randomUUID(),
      parameterId: c.parameterId,
      operator: c.operator as BackendRuleOperator,
      value: String(c.value),
    })),
  }));
}

function mapTreatyStructureToDto(s: TreatyStructure): ReinsuranceTreatyBaseDto {
  const panelParticipants = (s.reinsurancePanel ?? [])
    .map(mapPanelParticipantToDto)
    .filter((p): p is PanelParticipantDto => p !== null);

  const treatyTriggerConditions = (s.treatyTriggerConditions ?? []).map(
    mapTriggerConditionToDto,
  );

  const ruleGroups = mapRulesToRuleGroups(s.inclusionRules ?? [], s.exclusionRules ?? []);

  return {
    structureType: s.structureType,
    name: s.name || undefined,
    notes: s.notes || undefined,
    treatyCode: s.treatyCode || undefined,
    effectiveDate: s.effectiveDate ? format(new Date(s.effectiveDate), 'yyyy-MM-dd') : undefined,
    expiryDate: s.expiryDate ? format(new Date(s.expiryDate), 'yyyy-MM-dd') : undefined,
    treatyYear: s.treatyYear ? Number(s.treatyYear) || undefined : undefined,
    cedant: s.cedant || undefined,
    lineOfBusiness: s.lineOfBusiness || undefined,
    territory: s.territory || undefined,
    currency: s.currency || undefined,
    status: s.status || undefined,
    premiumBasisOgrOnr: s.premiumBasisOgrOnr || undefined,
    // Quota Share
    quotaSharePercent: s.quotaSharePercent || undefined,
    seededPercent: s.seededPercent || undefined,
    retentionPercent: s.retentionPercent || undefined,
    maxTreatyCapacity: s.maxTreatyCapacity || undefined,
    treatyTriggerAmount: s.treatyTriggerAmount || undefined,
    cedingCommissionType: mapCedingCommission(s.cedingCommissionType),
    cedingCommissionPercent: s.cedingCommissionPercent || undefined,
    profitCommissionEnabled: s.profitCommissionEnabled || undefined,
    profitCommissionPercent: s.profitCommissionPercent || undefined,
    carryForwardLossPercent: s.carryForwardLossPercent || undefined,
    expenseRatioPercent: s.expenseRatioPercent || undefined,
    deficitCarryForward: s.deficitCarryForward || undefined,
    lrTriggerLevels: s.lrTriggerLevels || undefined,
    slidingScaleMinCommission: s.slidingScaleMinCommission || undefined,
    slidingScaleMaxCommission: s.slidingScaleMaxCommission || undefined,
    lossRatioBands: s.lossRatioBands?.length ? s.lossRatioBands : undefined,
    bookingCommission: s.bookingCommission || undefined,
    finalAdjustmentAtYearEnd: s.finalAdjustmentAtYearEnd || undefined,
    lossCorridors: s.lossCorridors?.length ? s.lossCorridors : undefined,
    // Surplus (surplusMaxCapacity omitted — server-computed)
    surplusLines: s.surplusLines || undefined,
    surplusRetentionLimit: s.surplusRetentionLimit || undefined,
    surplusRetentionPercent: s.surplusRetentionPercent || undefined,
    surplusSeededPercent: s.surplusSeededPercent || undefined,
    surplusMaxTreatyCapacity: s.surplusMaxTreatyCapacity || undefined,
    surplusCommissionType: mapCedingCommission(s.surplusCommissionType),
    surplusCedingCommission: s.surplusCedingCommission || undefined,
    surplusProfitCommissionEnabled: s.surplusProfitCommissionEnabled || undefined,
    surplusSlidingScaleMinCommission: s.surplusSlidingScaleMinCommission || undefined,
    surplusSlidingScaleMaxCommission: s.surplusSlidingScaleMaxCommission || undefined,
    surplusLossRatioBands: s.surplusLossRatioBands?.length ? s.surplusLossRatioBands : undefined,
    surplusBookingCommission: s.surplusBookingCommission || undefined,
    surplusFinalAdjustmentAtYearEnd: s.surplusFinalAdjustmentAtYearEnd || undefined,
    surplusLossCorridors: s.surplusLossCorridors?.length ? s.surplusLossCorridors : undefined,
    // XOL
    xolRate: s.xolRate || undefined,
    xolRateType: s.xolRateType || undefined,
    xolMinimumDepositPremium: s.xolMinimumDepositPremium || undefined,
    xolLimitPerOccurrence: s.xolLimitPerOccurrence || undefined,
    xolDeductible: s.xolDeductible || undefined,
    xolAggregateLimit: s.xolAggregateLimit || undefined,
    xolReinstatements: s.xolReinstatements || undefined,
    xolReinstatementPremiumType: s.xolReinstatementPremiumType || undefined,
    xolLossCorridors: s.xolLossCorridors?.length ? s.xolLossCorridors : undefined,
    xolCoverBasis: s.xolCoverBasis || undefined,
    xolLayerPosition: s.xolLayerPosition || undefined,
    // Stop Loss
    stopLossAttachment: s.stopLossAttachment || undefined,
    stopLossDetachment: s.stopLossDetachment || undefined,
    stopLossPremiumBase: s.stopLossPremiumBase || undefined,
    stopLossLimitOfLiability: s.stopLossLimitOfLiability || undefined,
    stopLossAnnualAggregateLimit: s.stopLossAnnualAggregateLimit || undefined,
    // Financial
    totalCessionPercent: s.totalCessionPercent || undefined,
    brokeragePercent: s.brokeragePercent || undefined,
    overrideFrontingFeePercent: s.overrideFrontingFeePercent || undefined,
    accountingFrequency: s.accountingFrequency || undefined,
    bordereauxType: s.bordereauxType || undefined,
    settlementCurrency: s.settlementCurrency || undefined,
    statementDueDays: s.statementDueDays || undefined,
    // Documentation
    slipUrl: s.slipUrl || undefined,
    underwritingGuidelinesLink: s.underwritingGuidelinesLink || undefined,
    // Claims & Recoveries
    cashCallAllowed: s.cashCallAllowed || undefined,
    claimNotificationThreshold: s.claimNotificationThreshold || undefined,
    claimSettlementBasis: s.claimSettlementBasis || undefined,
    // Relations
    panelParticipants: panelParticipants.length ? panelParticipants : undefined,
    treatyTriggerConditions: treatyTriggerConditions.length ? treatyTriggerConditions : undefined,
    ruleGroups,
  };
}

/** Build the full POST payload from draft state */
export function buildCreateProgramPayload(
  draft: CoverProgram,
  coverId: string | undefined,
  organizationId: string,
  productId: string,
  options?: { programActive?: boolean },
): CreateReinsuranceProgramDto {
  return {
    name: draft.treatyName || draft.treatyCode || 'Reinsurance Program',
    type: deriveProgramType(draft.treatyStructures),
    productId,
    organizationId,
    coverId: coverId && isRealUUID(coverId) ? coverId : undefined,
    startDate: toDateOnly(draft.startDate),
    endDate: toDateOnly(draft.endDate),
    active: options?.programActive ?? true,
    treatyName: draft.treatyName || undefined,
    treatyCode: draft.treatyCode || undefined,
    facultativeMandatory: draft.facultativeMandatory ?? undefined,
    facultativeSumInsuredAbove: draft.facultativeSumInsuredAbove || undefined,
    facultativePanelReinsurers: draft.facultativePanelReinsurers?.length
      ? draft.facultativePanelReinsurers.map((m) => ({
          reinsurerOrganizationId: m.reinsurerOrganizationId,
          sharePercent: m.sharePercent ?? 0,
        }))
      : undefined,
    facultativeConditionGroups: mapFacultativeConditionGroups(
      draft.facultativeConditionGroups ?? [],
    ),
    facultativeConditionGroupsLogic: draft.facultativeConditionGroupsLogic ?? 'OR',
    facultativeExclusionConditionGroups: mapFacultativeConditionGroups(
      draft.facultativeExclusionConditionGroups ?? [],
    ),
    treaties: draft.treatyStructures.length
      ? draft.treatyStructures.map(mapTreatyStructureToDto)
      : undefined,
  };
}

function toDateOnly(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  // Strip time component if present (e.g. "2026-01-01T00:00:00.000Z" → "2026-01-01")
  return value.split('T')[0];
}

/** Parse "YYYY-MM-DD" as local midnight (avoids UTC midnight shift from new Date(string)) */
function parseLocalDateString(iso: string): Date {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Build the PATCH payload from draft state (no treaties — use treaty endpoints instead) */
export function buildUpdateProgramPayload(
  draft: CoverProgram,
  coverId: string | undefined,
  organizationId: string,
  productId: string,
  options?: { programActive?: boolean },
): UpdateReinsuranceProgramDto {
  return {
    type: 'Cover Reinsurance Program',
    organizationId,
    productId,
    coverId: coverId && isRealUUID(coverId) ? coverId : undefined,
    name: draft.treatyName || draft.treatyCode || 'Reinsurance Program',
    startDate: toDateOnly(draft.startDate),
    endDate: toDateOnly(draft.endDate),
    active: options?.programActive ?? true,
    treatyName: draft.treatyName || undefined,
    treatyCode: draft.treatyCode || undefined,
    facultativeMandatory: draft.facultativeMandatory ?? undefined,
    facultativeSumInsuredAbove: draft.facultativeSumInsuredAbove || undefined,
    facultativePanelReinsurers: draft.facultativePanelReinsurers?.length
      ? draft.facultativePanelReinsurers.map((m) => ({
          reinsurerOrganizationId: m.reinsurerOrganizationId,
          sharePercent: m.sharePercent ?? 0,
        }))
      : undefined,
    facultativeConditionGroups: mapFacultativeConditionGroups(
      draft.facultativeConditionGroups ?? [],
    ),
    facultativeConditionGroupsLogic: draft.facultativeConditionGroupsLogic ?? 'OR',
    facultativeExclusionConditionGroups: mapFacultativeConditionGroups(
      draft.facultativeExclusionConditionGroups ?? [],
    ),
  };
}

/** Build a single treaty PATCH payload */
export function buildTreatyPayload(s: TreatyStructure): ReinsuranceTreatyBaseDto {
  return mapTreatyStructureToDto(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mappers: backend response → frontend types
// ─────────────────────────────────────────────────────────────────────────────

function mapRuleGroupsToFrontend(
  ruleGroups: TreatyRuleGroupResponse[] | undefined,
): { inclusionRules: TreatyRule[]; exclusionRules: TreatyRule[] } {
  const inclusionRules: TreatyRule[] = [];
  const exclusionRules: TreatyRule[] = [];

  (ruleGroups ?? [])
    .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
    .forEach((group, idx) => {
      const rule: TreatyRule = {
        id: `rule_${idx}_${Date.now()}`,
        conditions: (group.conditions ?? [])
          .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
          .map((c, ci) => ({
            id: `cond_${idx}_${ci}_${Date.now()}`,
            parameterId: c.parameterId,
            operator: c.operator as TreatyTriggerCondition['operator'],
            value: isNaN(Number(c.value)) ? c.value : Number(c.value),
          })),
      };
      if (group.ruleType === 'Inclusion') {
        inclusionRules.push(rule);
      } else {
        exclusionRules.push(rule);
      }
    });

  return { inclusionRules, exclusionRules };
}

function mapFacultativeConditionGroupsResponse(
  groups: FacultativeConditionGroupResponse[] | undefined,
): TreatyRule[] {
  if (!groups?.length) return [];
  return groups.map((g) => ({
    id: g.id,
    conditions: (g.conditions ?? []).map((c) => ({
      id: c.id,
      parameterId: c.parameterId,
      operator: c.operator as TreatyTriggerCondition['operator'],
      value: c.value,
    })),
  }));
}

export function mapProgramResponse(res: ReinsuranceProgramResponse): CoverProgram {
  return {
    id: res.id,
    treatyName: res.treatyName ?? res.name ?? '',
    treatyCode: res.treatyCode ?? '',
    programCode: res.programCode ?? '',
    active: res.active ?? true,
    startDate: res.startDate ?? null,
    endDate: res.endDate ?? null,
    treatyStructures: [], // loaded separately via treaties endpoint
    facultativeMandatory: res.facultativeMandatory ?? false,
    facultativeConditionGroups: mapFacultativeConditionGroupsResponse(
      res.facultativeConditionGroups,
    ),
    facultativeConditionGroupsLogic: res.facultativeConditionGroupsLogic ?? 'OR',
    facultativeExclusionConditionGroups: mapFacultativeConditionGroupsResponse(
      res.facultativeExclusionConditionGroups,
    ),
    facultativePanelReinsurers: (res.facultativePanelReinsurers ?? []).map((entry) =>
      typeof entry === 'string'
        ? { reinsurerOrganizationId: entry, sharePercent: 0 }
        : entry,
    ),
    // Legacy
    facultativeSumInsuredAbove: res.facultativeSumInsuredAbove,
  };
}

export function mapTreatyResponse(res: ReinsuranceTreatyResponse): TreatyStructure {
  const structureType: TreatyStructureType =
    (res.structureType as TreatyStructureType) ?? 'Quota Share (QS)';

  const base = createNewTreatyStructure(structureType);

  const reinsurancePanel: ReinsurancePanel[] = (res.panelParticipants ?? []).map((p) => ({
    id: p.id,
    reinsurerId: p.reinsurerOrganizationId,
    reinsurerName: p.reinsurerOrganizationId, // display name resolved by page from onboardedReinsurers
    brokerId: p.brokerOrganizationId || undefined,
    reinsuranceBroker: p.brokerOrganizationId || '', // display name resolved by page from onboardedBrokers
    rating: p.rating ?? '',
    sharePercent: Number(p.sharePercent ?? 0),
    isLead: p.isLead ?? false,
  }));

  const treatyTriggerConditions: TreatyTriggerCondition[] = (
    res.treatyTriggerConditions ?? []
  )
    .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
    .map((c) => ({
      id: c.id,
      parameterId: c.parameterId,
      operator: c.operator as TreatyTriggerCondition['operator'],
      value: isNaN(Number(c.value)) ? c.value : Number(c.value),
    }));

  const { inclusionRules, exclusionRules } = mapRuleGroupsToFrontend(res.ruleGroups);

  return {
    ...base,
    id: res.id,
    structureType,
    name: res.name ?? '',
    notes: res.notes ?? '',
    treatyCode: res.treatyCode ?? '',
    effectiveDate: res.effectiveDate ? parseLocalDateString(res.effectiveDate) : null,
    expiryDate: res.expiryDate ? parseLocalDateString(res.expiryDate) : null,
    treatyYear: res.treatyYear != null ? String(res.treatyYear) : String(new Date().getFullYear()),
    cedant: res.cedant ?? '',
    lineOfBusiness: res.lineOfBusiness ?? '',
    territory: res.territory ?? '',
    currency: res.currency ?? 'AED',
    status: (res.status as TreatyStructure['status']) ?? 'Draft',
    premiumBasisOgrOnr: (res.premiumBasisOgrOnr as 'OGR' | 'ONR') || '',
    treatyTriggerConditions,
    inclusionRules,
    exclusionRules,
    // Quota Share
    quotaSharePercent: Number(res.quotaSharePercent ?? 0),
    seededPercent: Number(res.seededPercent ?? 0),
    retentionPercent: Number(res.retentionPercent ?? 0),
    maxTreatyCapacity: Number(res.maxTreatyCapacity ?? 0),
    treatyTriggerAmount: Number(res.treatyTriggerAmount ?? 0),
    cedingCommissionType:
      (res.cedingCommissionType as 'Flat' | 'Sliding Scale' | '') ?? '',
    cedingCommissionPercent: Number(res.cedingCommissionPercent ?? 0),
    profitCommissionEnabled: res.profitCommissionEnabled ?? false,
    profitCommissionPercent: Number(res.profitCommissionPercent ?? 0),
    carryForwardLossPercent: Number(res.carryForwardLossPercent ?? 0),
    expenseRatioPercent: Number(res.expenseRatioPercent ?? 0),
    deficitCarryForward: res.deficitCarryForward ?? false,
    lrTriggerLevels: res.lrTriggerLevels ?? '',
    slidingScaleMinCommission: Number(res.slidingScaleMinCommission ?? 0),
    slidingScaleMaxCommission: Number(res.slidingScaleMaxCommission ?? 0),
    lossRatioBands: res.lossRatioBands ?? [],
    bookingCommission: Number(res.bookingCommission ?? 0),
    finalAdjustmentAtYearEnd: res.finalAdjustmentAtYearEnd ?? false,
    lossCorridors: res.lossCorridors ?? [],
    // Surplus
    surplusLines: Number(res.surplusLines ?? 0),
    surplusRetentionLimit: Number(res.surplusRetentionLimit ?? 0),
    surplusRetentionPercent: Number(res.surplusRetentionPercent ?? 0),
    surplusMaxCapacity: Number(res.surplusMaxCapacity ?? 0), // read-only from server
    surplusSeededPercent: Number(res.surplusSeededPercent ?? 0),
    surplusMaxTreatyCapacity: Number(res.surplusMaxTreatyCapacity ?? 0),
    surplusCommissionType:
      (res.surplusCommissionType as 'Flat' | 'Sliding Scale' | '') ?? '',
    surplusCedingCommission: Number(res.surplusCedingCommission ?? 0),
    surplusProfitCommissionEnabled: res.surplusProfitCommissionEnabled ?? false,
    surplusSlidingScaleMinCommission: Number(res.surplusSlidingScaleMinCommission ?? 0),
    surplusSlidingScaleMaxCommission: Number(res.surplusSlidingScaleMaxCommission ?? 0),
    surplusLossRatioBands: res.surplusLossRatioBands ?? [],
    surplusBookingCommission: Number(res.surplusBookingCommission ?? 0),
    surplusFinalAdjustmentAtYearEnd: res.surplusFinalAdjustmentAtYearEnd ?? false,
    surplusLossCorridors: res.surplusLossCorridors ?? [],
    // XOL
    xolRate: Number(res.xolRate ?? 0),
    xolRateType: (res.xolRateType as TreatyStructure['xolRateType']) || '',
    xolMinimumDepositPremium: Number(res.xolMinimumDepositPremium ?? 0),
    xolLimitPerOccurrence: Number(res.xolLimitPerOccurrence ?? 0),
    xolDeductible: Number(res.xolDeductible ?? 0),
    xolAggregateLimit: Number(res.xolAggregateLimit ?? 0),
    xolReinstatements: Number(res.xolReinstatements ?? 0),
    xolReinstatementPremiumType:
      (res.xolReinstatementPremiumType as TreatyStructure['xolReinstatementPremiumType']) || '',
    xolLossCorridors: res.xolLossCorridors ?? [],
    xolCoverBasis: (res.xolCoverBasis as TreatyStructure['xolCoverBasis']) || '',
    xolLayerPosition: Number(res.xolLayerPosition ?? 1),
    // Stop Loss
    stopLossAttachment: Number(res.stopLossAttachment ?? 0),
    stopLossDetachment: Number(res.stopLossDetachment ?? 0),
    stopLossPremiumBase: (res.stopLossPremiumBase as TreatyStructure['stopLossPremiumBase']) || '',
    stopLossLimitOfLiability: Number(res.stopLossLimitOfLiability ?? 0),
    stopLossAnnualAggregateLimit: Number(res.stopLossAnnualAggregateLimit ?? 0),
    // Financial
    reinsurancePanel,
    totalCessionPercent: Number(res.totalCessionPercent ?? reinsurancePanel.reduce((s, p) => s + p.sharePercent, 0)),
    brokeragePercent: Number(res.brokeragePercent ?? 0),
    overrideFrontingFeePercent: Number(res.overrideFrontingFeePercent ?? 0),
    accountingFrequency: (res.accountingFrequency as TreatyStructure['accountingFrequency']) ?? '',
    bordereauxType: (res.bordereauxType as TreatyStructure['bordereauxType']) ?? '',
    settlementCurrency: (res.settlementCurrency as TreatyStructure['settlementCurrency']) ?? 'AED',
    statementDueDays: Number(res.statementDueDays ?? 0),
    // Documentation
    treatyDocuments: [],
    slipUrl: res.slipUrl ?? '',
    underwritingGuidelinesLink: res.underwritingGuidelinesLink ?? '',
    // Claims & Recoveries
    cashCallAllowed: res.cashCallAllowed ?? false,
    claimNotificationThreshold: Number(res.claimNotificationThreshold ?? 0),
    claimSettlementBasis: (res.claimSettlementBasis as TreatyStructure['claimSettlementBasis']) || '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API functions
// ─────────────────────────────────────────────────────────────────────────────

export async function createReinsuranceProgram(
  payload: CreateReinsuranceProgramDto,
): Promise<ReinsuranceProgramResponse> {
  return apiPost<ReinsuranceProgramResponse>('/reinsurance/programs', payload);
}

export async function updateReinsuranceProgram(
  id: string,
  payload: UpdateReinsuranceProgramDto,
): Promise<ReinsuranceProgramResponse> {
  return apiPatch<ReinsuranceProgramResponse>(`/reinsurance/programs/${id}`, payload);
}

export async function deleteReinsuranceProgram(id: string): Promise<void> {
  return apiDelete<void>(`/reinsurance/programs/${id}`);
}

export async function listReinsuranceProgramsByCover(
  coverId: string | undefined,
  productId?: string,
): Promise<CoverProgram[]> {
  const params: Record<string, string> = {};
  if (coverId) params.coverId = coverId;
  if (productId) params.productId = productId;
  const res = await apiGet<ReinsuranceProgramResponse[]>('/reinsurance/programs', {
    params: Object.keys(params).length ? params : undefined,
  });
  return (res ?? []).filter(Boolean).map(mapProgramResponse);
}

export async function listReinsuranceTreatiesByProgram(
  programId: string,
): Promise<TreatyStructure[]> {
  const res = await apiGet<ReinsuranceTreatyResponse[]>(
    `/reinsurance/programs/${programId}/treaties`,
  );
  return (res ?? []).map(mapTreatyResponse);
}

export async function getReinsuranceTreaty(id: string): Promise<TreatyStructure> {
  const res = await apiGet<ReinsuranceTreatyResponse>(`/reinsurance/treaties/${id}`);
  return mapTreatyResponse(res);
}

export async function createReinsuranceTreaty(
  payload: CreateReinsuranceTreatyDto,
): Promise<TreatyStructure> {
  const res = await apiPost<ReinsuranceTreatyResponse>('/reinsurance/treaties', payload);
  return mapTreatyResponse(res);
}

export async function updateReinsuranceTreaty(
  id: string,
  payload: ReinsuranceTreatyBaseDto,
): Promise<TreatyStructure> {
  const res = await apiPatch<ReinsuranceTreatyResponse>(`/reinsurance/treaties/${id}`, payload);
  return mapTreatyResponse(res);
}

export async function deleteReinsuranceTreaty(id: string): Promise<void> {
  return apiDelete<void>(`/reinsurance/treaties/${id}`);
}

export async function searchReinsuranceTreaties(
  productId: string,
  query?: string,
): Promise<TreatyStructure[]> {
  const params: Record<string, string> = { productId };
  if (query) params.query = query;
  const res = await apiGet<ReinsuranceTreatyResponse[]>('/reinsurance/treaty-search', { params });
  return (res ?? []).map(mapTreatyResponse);
}

export async function cloneReinsuranceTreaty(
  treatyId: string,
  targetProgramId?: string,
): Promise<TreatyStructure> {
  const res = await apiPost<ReinsuranceTreatyResponse>(
    `/reinsurance/treaties/${treatyId}/clone`,
    { targetProgramId },
  );
  return mapTreatyResponse(res);
}

export interface ReinsuranceValidationResult {
  valid: boolean;
  errors: string[];
}

export async function validateReinsurance(
  productId: string,
  coverIds: string[],
  policyInceptionDate?: string,
): Promise<ReinsuranceValidationResult> {
  return apiPost<ReinsuranceValidationResult>('/reinsurance/validate', {
    productId,
    coverIds,
    policyInceptionDate,
  });
}

export async function linkCoverToProgram(
  programId: string,
  coverId: string,
  options?: { priority?: number; effectiveFrom?: string; effectiveTo?: string },
): Promise<unknown> {
  return apiPost(`/reinsurance/programs/${programId}/covers`, {
    coverId,
    ...options,
  });
}

export async function unlinkCoverFromProgram(
  programId: string,
  coverId: string,
): Promise<void> {
  return apiDelete<void>(`/reinsurance/programs/${programId}/covers/${coverId}`);
}

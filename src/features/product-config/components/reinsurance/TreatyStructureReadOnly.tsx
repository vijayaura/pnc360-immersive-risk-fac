import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
import { Badge } from '@/components/ui/badge';
import type { TreatyStructure, TreatyRule } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Label maps
// ─────────────────────────────────────────────────────────────────────────────

/** Human-readable parameter names (shared with Cover Reinsurance facultative view). */
export const PARAM_LABELS: Record<string, string> = {
  sumInsured: 'Sum Insured (AED)',
  premium: 'Premium Amount (AED)',
  projectValue: 'Project Value (AED)',
  contractWorks: 'Contract Works (AED)',
  plantEquipment: 'Plant & Equipment (AED)',
  temporaryWorks: 'Temporary Works (AED)',
  principalsProperty: "Principal's Property (AED)",
  projectDuration: 'Project Duration (months)',
  maintenancePeriod: 'Maintenance Period (months)',
  deductible: 'Deductible (AED)',
  contractorExperience: 'Contractor Experience (years)',
  claimFrequency: 'Claim Frequency (last 5 years)',
  lossRatio: 'Loss Ratio (%)',
  baseRate: 'Base Rate',
  projectType: 'Project Type',
  constructionType: 'Construction Type',
  locationHazard: 'Location Hazard Level',
  safetyRecord: 'Safety Record',
  subcontractorUsage: 'Subcontractor Usage',
  riskManagementQuality: 'Risk Management Quality',
};

/** Operator symbols for display (matches treaty trigger editor). */
export const OP_LABELS: Record<string, string> = {
  equals: '=',
  notEquals: '≠',
  greaterThan: '>',
  lessThan: '<',
  greaterThanOrEqual: '≥',
  lessThanOrEqual: '≤',
  contains: 'contains',
  in: 'in',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  try {
    return formatDateDDMMYYYY(d);
  } catch {
    return '—';
  }
}

function fmtNum(n: number | undefined): string {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString();
}

function pct(n: number | undefined): string {
  if (n === undefined || n === null) return '—';
  return `${n}%`;
}

function nonEmptyTrimmed(v?: string | null): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b bg-muted/30">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h5>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm font-medium">{value || '—'}</div>
    </div>
  );
}

function RulesSection({
  title,
  rules,
  variant,
}: {
  title: string;
  rules: TreatyRule[];
  variant: 'inclusion' | 'exclusion';
}) {
  // Filter out rules with no conditions — they are empty/meaningless
  const validRules = (rules ?? []).filter((r) => r.conditions?.length > 0);
  if (validRules.length === 0) return null;

  const isExclusion = variant === 'exclusion';

  return (
    <div>
      <p
        className={`text-xs font-semibold mb-2 ${
          isExclusion ? 'text-destructive' : 'text-muted-foreground'
        }`}
      >
        {title}
      </p>
      <div className="space-y-2">
        {validRules.map((rule, gi) => (
          <div
            key={rule.id}
            className={`border rounded-md p-2 text-sm ${
              isExclusion
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-border bg-muted/10'
            }`}
          >
            <span
              className={`text-xs font-medium ${
                isExclusion ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              Rule {gi + 1}
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {(rule.conditions || []).map((c, ci) => (
                <span
                  key={c.id}
                  className={`text-xs rounded px-1.5 py-0.5 ${
                    isExclusion
                      ? 'text-destructive bg-destructive/10'
                      : 'bg-muted'
                  }`}
                >
                  {ci === 0 ? 'IF' : 'AND'}{' '}
                  {PARAM_LABELS[c.parameterId] ?? c.parameterId}{' '}
                  {OP_LABELS[c.operator] ?? c.operator}{' '}
                  {isNaN(Number(c.value)) ? String(c.value) : Number(c.value).toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface TreatyStructureReadOnlyProps {
  structure: TreatyStructure;
}

export function TreatyStructureReadOnly({ structure: s }: TreatyStructureReadOnlyProps) {
  const isQS = s.structureType === 'Quota Share (QS)';
  const isSurplus = s.structureType === 'Surplus';
  const isXOL = s.structureType === 'Excess of Loss (XOL)';
  const isStopLoss = s.structureType === 'Stop Loss';

  const showPanel = isQS || isSurplus || isXOL;

  const showClaims =
    s.cashCallAllowed === true ||
    (s.claimNotificationThreshold ?? 0) > 0 ||
    (s.claimSettlementBasis ?? '') !== '';

  const showAccounts =
    !!(s.accountingFrequency) ||
    !!(s.bordereauxType) ||
    (s.statementDueDays ?? 0) > 0;

  const showDocs =
    (s.treatyDocuments ?? []).length > 0 ||
    !!(s.slipUrl) ||
    !!(s.underwritingGuidelinesLink);

  const lossRatioBands = isQS ? (s.lossRatioBands ?? []) : (s.surplusLossRatioBands ?? []);
  const lossCorridors = isQS ? (s.lossCorridors ?? []) : (s.surplusLossCorridors ?? []);
  const showLossParticipation = (isQS || isSurplus) && (lossRatioBands.length > 0 || lossCorridors.length > 0);

  const totalCession = s.totalCessionPercent ?? (s.reinsurancePanel ?? []).reduce((sum, p) => sum + (p.sharePercent ?? 0), 0);

  /** Not collected in the create form; only show when API has values (avoids empty "—" rows). */
  const showCedantMeta =
    nonEmptyTrimmed(s.cedant) ||
    nonEmptyTrimmed(s.lineOfBusiness) ||
    nonEmptyTrimmed(s.territory);

  /** Hide when both default to 0 (matches unused Commission Types accordion on create). */
  const showCommissionFinancial =
    (s.brokeragePercent ?? 0) !== 0 || (s.overrideFrontingFeePercent ?? 0) !== 0;

  return (
    <div className="space-y-3">
      {/* 2.1 — Treaty Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline">{s.structureType}</Badge>
        {s.name && <span className="text-sm font-semibold">{s.name}</span>}
        {s.premiumBasisOgrOnr && (
          <span className="text-xs text-muted-foreground">
            Premium: {s.premiumBasisOgrOnr}
          </span>
        )}
      </div>

      {/* 2.2 — Treaty Basic Details */}
      <SectionBox title="Treaty Basic Details">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
          <Field label="Treaty Code" value={s.treatyCode || '—'} />
          <Field label="Effective Date" value={fmtDate(s.effectiveDate)} />
          <Field label="Expiry Date" value={fmtDate(s.expiryDate)} />
          <Field label="Treaty Year" value={s.treatyYear || '—'} />
          {showCedantMeta && (
            <>
              {nonEmptyTrimmed(s.cedant) && <Field label="Cedant" value={s.cedant} />}
              {nonEmptyTrimmed(s.lineOfBusiness) && (
                <Field label="Line of Business" value={s.lineOfBusiness} />
              )}
              {nonEmptyTrimmed(s.territory) && <Field label="Territory" value={s.territory} />}
            </>
          )}
          <Field label="Currency" value={s.currency || '—'} />
          <Field label="Status" value={s.status || '—'} />
        </div>
        {s.notes && (
          <p className="mt-3 text-sm text-muted-foreground border-t pt-3">{s.notes}</p>
        )}
      </SectionBox>

      {/* 2.3 — Trigger Conditions */}
      {((s.inclusionRules ?? []).length > 0 || (s.exclusionRules ?? []).length > 0) && (
        <SectionBox title="Trigger Conditions">
          <div className="space-y-4">
            <RulesSection title="Inclusion Rules" rules={s.inclusionRules ?? []} variant="inclusion" />
            <RulesSection title="Exclusion Rules" rules={s.exclusionRules ?? []} variant="exclusion" />
          </div>
        </SectionBox>
      )}

      {/* 2.4 — Structure Type Settings */}
      {isQS && (
        <SectionBox title="Quota Share Settings">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Field label="Cedant Retention %" value={pct(s.retentionPercent)} />
            <Field label="Cession %" value={pct(s.quotaSharePercent)} />
            <Field label="Ceding Commission Type" value={s.cedingCommissionType || '—'} />
            <Field label="Ceding Commission %" value={pct(s.cedingCommissionPercent)} />
            <Field label="Max Treaty Capacity" value={s.maxTreatyCapacity ? fmtNum(s.maxTreatyCapacity) : '—'} />
            <Field label="Booking Commission" value={pct(s.bookingCommission)} />
            <Field label="Final Adjustment at Year End" value={s.finalAdjustmentAtYearEnd ? 'Yes' : 'No'} />
            {s.cedingCommissionType === 'Sliding Scale' && (
              <>
                <Field label="Sliding Scale Min Commission" value={pct(s.slidingScaleMinCommission)} />
                <Field label="Sliding Scale Max Commission" value={pct(s.slidingScaleMaxCommission)} />
              </>
            )}
          </div>
          {s.profitCommissionEnabled && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-muted-foreground font-semibold mb-3">Profit Commission</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                <Field label="Profit Commission %" value={pct(s.profitCommissionPercent)} />
                <Field label="Carry Forward Loss %" value={pct(s.carryForwardLossPercent)} />
                <Field label="Expense Ratio %" value={pct(s.expenseRatioPercent)} />
                <Field label="Deficit Carry Forward" value={s.deficitCarryForward ? 'Yes' : 'No'} />
              </div>
            </div>
          )}
        </SectionBox>
      )}

      {isSurplus && (
        <SectionBox title="Surplus Settings">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Field label="Commission Type" value={s.surplusCommissionType || '—'} />
            <Field label="Ceding Commission" value={pct(s.surplusCedingCommission)} />
            <Field label="Booking Commission" value={pct(s.surplusBookingCommission)} />
            {s.surplusCommissionType === 'Sliding Scale' && (
              <>
                <Field label="Sliding Scale Min" value={pct(s.surplusSlidingScaleMinCommission)} />
                <Field label="Sliding Scale Max" value={pct(s.surplusSlidingScaleMaxCommission)} />
              </>
            )}
            <Field label="Treaty Trigger Amount" value={s.treatyTriggerAmount ? fmtNum(s.treatyTriggerAmount) : '0'} />
            <Field label="Max Treaty Capacity" value={s.surplusMaxTreatyCapacity ? fmtNum(s.surplusMaxTreatyCapacity) : '—'} />
            <Field label="Final Adjustment at Year End" value={s.surplusFinalAdjustmentAtYearEnd ? 'Yes' : 'No'} />
          </div>
        </SectionBox>
      )}

      {isXOL && (
        <SectionBox title="Excess of Loss Settings">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Field label="Cover Basis" value={s.xolCoverBasis || '—'} />
            <Field label="Layer Position" value={fmtNum(s.xolLayerPosition)} />
            <Field label="Rate" value={pct(s.xolRate)} />
            <Field label="Rate Type" value={s.xolRateType || '—'} />
            <Field label="Min Deposit Premium" value={fmtNum(s.xolMinimumDepositPremium)} />
            <Field label="Limit per Occurrence" value={fmtNum(s.xolLimitPerOccurrence)} />
            <Field label="Deductible" value={fmtNum(s.xolDeductible)} />
            <Field label="Aggregate Limit" value={fmtNum(s.xolAggregateLimit)} />
            <Field label="Reinstatements" value={fmtNum(s.xolReinstatements)} />
            <Field label="Reinstatement Premium Type" value={s.xolReinstatementPremiumType || '—'} />
          </div>
        </SectionBox>
      )}

      {isStopLoss && (
        <SectionBox title="Stop Loss Settings">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Field label="Attachment Point" value={pct(s.stopLossAttachment)} />
            <Field label="Detachment Point" value={pct(s.stopLossDetachment)} />
            <Field label="Premium Base" value={s.stopLossPremiumBase || '—'} />
            <Field label="Limit of Liability" value={fmtNum(s.stopLossLimitOfLiability)} />
            <Field label="Annual Aggregate Limit" value={fmtNum(s.stopLossAnnualAggregateLimit)} />
          </div>
        </SectionBox>
      )}

      {/* 2.5 — Loss Participation / Corridors (QS + Surplus only) */}
      {showLossParticipation && (
        <SectionBox title="Loss Participation">
          {lossRatioBands.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground font-semibold mb-2">Loss Ratio Bands</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-1 font-medium">Loss Ratio Range</th>
                    <th className="text-left pb-1 font-medium">Cedant Participation %</th>
                  </tr>
                </thead>
                <tbody>
                  {lossRatioBands.map((band, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5">{band.minLR}–{band.maxLR}%</td>
                      <td className="py-1.5">{band.commissionPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {lossCorridors.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-2">Loss Corridors</p>
              <div className="flex flex-wrap gap-1.5">
                {lossCorridors.map((c, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-muted">
                    {c.minLR}–{c.maxLR}% adj {c.adjustmentPercent}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </SectionBox>
      )}

      {/* 2.6 — Panel Setup */}
      {showPanel && (
        <SectionBox title={isQS || isSurplus ? 'Capacity & Panel Setup' : 'Panel Setup'}>
          {(s.reinsurancePanel ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No panel members</p>
          ) : (
            <>
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-1 font-medium">Reinsurer</th>
                    <th className="text-left pb-1 font-medium">Broker</th>
                    <th className="text-left pb-1 font-medium">Rating</th>
                    <th className="text-left pb-1 font-medium">Share %</th>
                    <th className="text-left pb-1 font-medium">Lead</th>
                  </tr>
                </thead>
                <tbody>
                  {s.reinsurancePanel.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-1.5">{p.reinsurerName || '—'}</td>
                      <td className="py-1.5">{p.reinsuranceBroker || '—'}</td>
                      <td className="py-1.5">{p.rating || '—'}</td>
                      <td className="py-1.5">{p.sharePercent}%</td>
                      <td className="py-1.5">{p.isLead ? 'Yes' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Badge variant={totalCession === 100 ? 'default' : 'secondary'} className="text-xs">
                Total Cession: {totalCession}%
              </Badge>
            </>
          )}
        </SectionBox>
      )}

      {/* 2.7 — Claims & Recoveries */}
      {showClaims && (
        <SectionBox title="Claims & Recoveries">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
            <Field label="Cash Call Allowed" value={s.cashCallAllowed ? 'Yes' : 'No'} />
            {(s.claimNotificationThreshold ?? 0) > 0 && (
              <Field label="Claim Notification Threshold" value={fmtNum(s.claimNotificationThreshold)} />
            )}
            {(s.claimSettlementBasis ?? '') !== '' && (
              <Field label="Claim Settlement Basis" value={s.claimSettlementBasis} />
            )}
          </div>
        </SectionBox>
      )}

      {/* 2.8 — Accounts & Settlement */}
      {showAccounts && (
        <SectionBox title="Accounts & Settlement">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            {s.accountingFrequency && <Field label="Accounting Frequency" value={s.accountingFrequency} />}
            {s.bordereauxType && <Field label="Bordereau Type" value={s.bordereauxType} />}
            {s.settlementCurrency && <Field label="Settlement Currency" value={s.settlementCurrency} />}
            {(s.statementDueDays ?? 0) > 0 && (
              <Field label="Statement Due Days" value={fmtNum(s.statementDueDays)} />
            )}
          </div>
        </SectionBox>
      )}

      {/* 2.9 — Commission & Financial (only when set; not shown on create when both are 0) */}
      {showCommissionFinancial && (
        <SectionBox title="Commission & Financial">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <Field label="Brokerage %" value={pct(s.brokeragePercent)} />
            <Field label="Override Fronting Fee %" value={pct(s.overrideFrontingFeePercent)} />
          </div>
        </SectionBox>
      )}

      {/* 2.10 — Documentation */}
      {showDocs && (
        <SectionBox title="Documentation">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
            {(s.treatyDocuments ?? []).length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Treaty Documents</div>
                <div className="space-y-1">
                  {s.treatyDocuments.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary underline truncate max-w-[200px]"
                      title={url}
                    >
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {s.slipUrl && (
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Slip URL</div>
                <a
                  href={s.slipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  {s.slipUrl}
                </a>
              </div>
            )}
            {s.underwritingGuidelinesLink && (
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Underwriting Guidelines</div>
                <a
                  href={s.underwritingGuidelinesLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  {s.underwritingGuidelinesLink}
                </a>
              </div>
            )}
          </div>
        </SectionBox>
      )}
    </div>
  );
}

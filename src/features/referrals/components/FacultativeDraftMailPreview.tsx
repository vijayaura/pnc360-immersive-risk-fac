import type { FormResponseValue, ReferralDetailResponse } from '@/features/proposals/api/referrals';

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(n) +
  ' ' +
  currency;

type DraftKv = { label: string; value: string };
export type ProposalGroup = { heading: string; rows: DraftKv[] };

/** How one proposal form field is shown in the mail preview / plain-text draft. */
export type ProposalFieldDisplay =
  | { kind: 'plain'; fieldLabel: string; text: string }
  | { kind: 'flat-table'; fieldLabel: string; rows: DraftKv[] }
  | { kind: 'grouped'; fieldLabel: string; groups: ProposalGroup[] };

function rowLabelFromRecord(o: Record<string, unknown>): string | null {
  if (o.label != null && String(o.label).trim() !== '') return String(o.label);
  if (o.name != null && String(o.name).trim() !== '') return String(o.name);
  if (o.rowLabel != null && String(o.rowLabel).trim() !== '') return String(o.rowLabel);
  if (o.id != null && String(o.id).trim() !== '') return String(o.id);
  return null;
}

function jsonValueToDisplayCell(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (Array.isArray(val)) {
    const nested = tryExtractLabelValueRows(val);
    if (nested) return nested.map((r) => `${r.label}: ${r.value}`).join('\n');
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  if (typeof val === 'object') {
    const o = val as Record<string, unknown>;
    if (rowLabelFromRecord(o) != null && 'value' in o) {
      return jsonValueToDisplayCell(o.value);
    }
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function tryExtractLabelValueRows(arr: unknown[]): DraftKv[] | null {
  const rows: DraftKv[] = [];
  for (const item of arr) {
    if (typeof item !== 'object' || item === null) return null;
    const o = item as Record<string, unknown>;
    const lab = rowLabelFromRecord(o);
    if (lab == null) return null;
    if (!('value' in o)) return null;
    rows.push({ label: lab, value: jsonValueToDisplayCell(o.value) });
  }
  return rows.length > 0 ? rows : null;
}

function tryParseRepeaterGroups(j: unknown): ProposalGroup[] | null {
  if (!Array.isArray(j) || j.length === 0) return null;
  const groups: ProposalGroup[] = [];
  for (const item of j) {
    if (typeof item !== 'object' || item === null) return null;
    const o = item as Record<string, unknown>;
    const heading =
      o.label != null
        ? String(o.label)
        : o.rowLabel != null
          ? String(o.rowLabel)
          : null;
    if (heading == null || !Array.isArray(o.value)) return null;
    const inner = tryExtractLabelValueRows(o.value);
    if (!inner) return null;
    groups.push({ heading, rows: inner });
  }
  return groups.length > 0 ? groups : null;
}

/** API often stores repeater JSON in `valueText`; only attempt parse for obvious JSON. */
function parseJsonIfStructured(raw: string): unknown | null {
  const t = raw.trim();
  if (t.length < 2) return null;
  const c = t[0];
  if (c !== '[' && c !== '{') return null;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return null;
  }
}

/**
 * Prefer structured `valueJson` (object / parsed JSON string); else parse `valueText` when it is JSON.
 */
function coalesceStructuredPayload(v: FormResponseValue): unknown | null {
  const j = v.valueJson;
  if (j !== null && j !== undefined) {
    if (typeof j === 'object') return j;
    if (typeof j === 'string') {
      const parsed = parseJsonIfStructured(j);
      if (parsed !== null) return parsed;
    }
  }
  const t = v.valueText != null ? String(v.valueText).trim() : '';
  if (t) {
    const parsed = parseJsonIfStructured(t);
    if (parsed !== null) return parsed;
  }
  return null;
}

function structureProposalFieldDisplay(v: FormResponseValue, stableKey: string): ProposalFieldDisplay {
  const fieldLabel = (v.fieldName || v.fieldId || stableKey).trim() || stableKey;
  const textTrim = v.valueText != null ? String(v.valueText).trim() : '';

  const payload = coalesceStructuredPayload(v);
  if (payload !== null && typeof payload === 'object') {
    const grouped = tryParseRepeaterGroups(payload);
    if (grouped) return { kind: 'grouped', fieldLabel, groups: grouped };
    if (Array.isArray(payload)) {
      const flat = tryExtractLabelValueRows(payload);
      if (flat) return { kind: 'flat-table', fieldLabel, rows: flat };
    }
  }

  if (textTrim !== '') {
    return { kind: 'plain', fieldLabel, text: textTrim };
  }
  const j = v.valueJson;
  if (j !== null && j !== undefined) {
    if (typeof j === 'string' || typeof j === 'number' || typeof j === 'boolean') {
      return { kind: 'plain', fieldLabel, text: String(j) };
    }
    try {
      return { kind: 'plain', fieldLabel, text: JSON.stringify(j) };
    } catch {
      return { kind: 'plain', fieldLabel, text: String(j) };
    }
  }
  return { kind: 'plain', fieldLabel, text: '—' };
}

function appendProposalFieldPlain(lines: string[], f: ProposalFieldDisplay) {
  lines.push(f.fieldLabel);
  if (f.kind === 'plain') {
    lines.push(f.text);
  } else if (f.kind === 'flat-table') {
    for (const r of f.rows) {
      lines.push(`  ${r.label}: ${r.value}`);
    }
  } else {
    for (const g of f.groups) {
      lines.push(`  ${g.heading}`);
      for (const r of g.rows) {
        lines.push(`    ${r.label}: ${r.value}`);
      }
    }
  }
  lines.push('');
}

function numOrUndef(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.replace(/,/g, ''));
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

export interface FacultativeDraftMailPreviewProps {
  referral: ReferralDetailResponse | null | undefined;
  referralLoading?: boolean;
  /** Query / URL fallbacks when API not loaded */
  productName: string;
  coverTitle?: string;
  sumInsured: number;
  grossPremium: number;
  currency: string;
  referralId: string;
  quoteId?: string;
  cededSumInsured?: number;
  cededPremium?: number;
  ratePerMille?: number;
  commissionPercent?: number;
  deductibles?: { allOtherPerils: string; naturalPerils: string };
  includedCews?: { type: string; name: string; detail: string }[];
}

type DraftCoverRow = { cover: string; sumInsured: string; premium: string };
type DraftProjectRow = { path: string; sumInsured: string; premium: string };

export type FacultativeDraftMailModel = {
  displayProduct: string;
  displayCurrency: string;
  metaLine: string;
  insuredRows: DraftKv[];
  proposalFields: ProposalFieldDisplay[];
  coverageType: string;
  capitalFromSlip: string;
  coverPricingRows: DraftCoverRow[];
  projectRows: DraftProjectRow[];
  pb: ReferralDetailResponse['pricingBreakdown'] | undefined;
};

export function computeFacultativeDraftMailModel({
  referral,
  productName,
  coverTitle,
  sumInsured,
  grossPremium,
  currency,
  referralId,
  quoteId,
}: Omit<FacultativeDraftMailPreviewProps, 'referralLoading'>): FacultativeDraftMailModel {
  const displayProduct = referral?.productName?.trim() || productName;
  const displayCurrency = referral?.currency?.trim() || currency;
  const totalSi = numOrUndef(referral?.totalSumInsured) ?? sumInsured;
  const finalPrem = numOrUndef(referral?.finalPremium);

  const metaLine =
    `Referral: ${referral?.referralId ?? referralId}${quoteId ? ` · Quote: ${quoteId}` : ''}` +
    (referral?.quoteNumber ? ` · Quote #: ${referral.quoteNumber}` : '') +
    (grossPremium > 0 ? ` · Gross premium (context): ${fmtMoney(grossPremium, currency)}` : '') +
    (finalPrem !== undefined ? ` · Final premium: ${fmtMoney(finalPrem, displayCurrency)}` : '');

  const insuredRows: DraftKv[] = [];
  if (referral?.companyName) insuredRows.push({ label: 'Company Name', value: referral.companyName });
  if (referral?.customerName) insuredRows.push({ label: 'Customer Name', value: referral.customerName });
  if (referral?.brokerName) insuredRows.push({ label: 'Broker', value: referral.brokerName });
  if (referral?.insurerName) insuredRows.push({ label: 'Insurer', value: referral.insurerName });

  if (referral?.customerDetails?.customerIdentifier) {
    insuredRows.push({ label: 'Customer identifier', value: referral.customerDetails.customerIdentifier });
  }
  if (referral?.customerDetails?.lockedFields?.length) {
    for (const lf of referral.customerDetails.lockedFields) {
      if (lf.keyName && lf.value) insuredRows.push({ label: lf.keyName, value: lf.value });
    }
  }

  const formValues = referral?.formResponseData?.values ?? [];
  const proposalFields: ProposalFieldDisplay[] = formValues.map((v, i) =>
    structureProposalFieldDisplay(v, v.fieldId || `idx-${i}`),
  );

  const coverageType = coverTitle?.trim() || displayProduct;
  const capitalFromSlip = totalSi > 0 ? fmtMoney(totalSi, displayCurrency) : '—';

  const coverPricingRows: DraftCoverRow[] = [];
  const pb = referral?.pricingBreakdown;
  if (pb?.covers?.length) {
    for (const c of pb.covers) {
      coverPricingRows.push({
        cover: c.name || c.code || c.coverId,
        sumInsured: fmtMoney(c.sumInsured ?? 0, displayCurrency),
        premium: fmtMoney(c.premium ?? c.netPremium ?? 0, displayCurrency),
      });
    }
  }

  const projectRows: DraftProjectRow[] = [];
  if (referral?.projectBreakdown?.length) {
    for (const sec of referral.projectBreakdown) {
      for (const cov of sec.covers ?? []) {
        for (const u of cov.units ?? []) {
          const path = `${sec.title} · ${cov.title} · ${u.label}`;
          projectRows.push({
            path,
            sumInsured: u.sumInsured != null ? fmtMoney(Number(u.sumInsured), displayCurrency) : '—',
            premium: u.premium != null ? fmtMoney(Number(u.premium), displayCurrency) : '—',
          });
        }
      }
    }
  }

  return {
    displayProduct,
    displayCurrency,
    metaLine,
    insuredRows,
    proposalFields,
    coverageType,
    capitalFromSlip,
    coverPricingRows,
    projectRows,
    pb,
  };
}

function riskHighlightFields(fields: ProposalFieldDisplay[], max = 8): ProposalFieldDisplay[] {
  const riskPattern =
    /occupation|specialt|specialty|practice|procedure|territor|jurisdict|limit|deduct|excess|retro|claim|loss|experience|turnover|revenue|bed|patient|hospital|facility|location|address|country|emirate|activity|description|nature|scope|period|inception|expir/i;
  const matched = fields.filter((f) => riskPattern.test(f.fieldLabel));
  const pool = matched.length > 0 ? matched : fields;
  return pool.slice(0, max);
}

function formatReferralDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Professional facultative placement body — dynamic risk data from referral. */
export function buildFacultativeDraftPlainText(props: FacultativeDraftMailPreviewProps): string {
  if (props.referralLoading) {
    return [
      'Dear {Recipient name},',
      '',
      'We are preparing your facultative placement note from the referral record. Risk particulars will populate automatically once loading completes.',
    ].join('\n');
  }

  const m = computeFacultativeDraftMailModel(props);
  const {
    referral,
    grossPremium,
    currency,
    cededSumInsured = 0,
    cededPremium = 0,
  } = props;

  const insuredName =
    referral?.companyName?.trim() ||
    referral?.customerName?.trim() ||
    m.insuredRows.find((r) => /company|customer|insured|name/i.test(r.label))?.value ||
    'the insured named in the attached slip';

  const cedent = referral?.insurerName?.trim() || 'the ceding company';
  const broker = referral?.brokerName?.trim();
  const referralRef = referral?.referralId ?? props.referralId;
  const quoteRef =
    referral?.quoteNumber?.trim() ||
    (props.quoteId ? props.quoteId : undefined) ||
    referral?.quoteId?.trim() ||
    undefined;

  const displayPremium =
    numOrUndef(referral?.finalPremium) ??
    (grossPremium > 0 ? grossPremium : undefined) ??
    (m.pb?.total != null ? m.pb.total : undefined);

  const riskFields = riskHighlightFields(m.proposalFields);
  const referredDate = formatReferralDate(referral?.referredAt);

  const lines: string[] = [];

  lines.push('Dear {Recipient name},', '');
  lines.push(
    `We write on behalf of ${cedent} to invite your facultative support on the risk summarised below. This placement note is issued under referral ${referralRef}${quoteRef ? ` (quote ${quoteRef})` : ''}.`,
  );
  lines.push(
    'We should be grateful for your indication of capacity, share, rate, and commission at your earliest convenience. Please advise if further information is required to complete your assessment.',
    '',
  );

  lines.push('PLACEMENT SUMMARY', '────────────────');
  lines.push(`Insured: ${insuredName}`);
  lines.push(`Cedent: ${cedent}`);
  if (broker) lines.push(`Introducing broker: ${broker}`);
  lines.push(`Class of business: ${m.displayProduct}`);
  lines.push(`Coverage / section: ${m.coverageType}`);
  if (referredDate) lines.push(`Referral date: ${referredDate}`);
  lines.push('');

  lines.push('FINANCIAL TERMS', '────────────────');
  lines.push(`Currency: ${m.displayCurrency}`);
  lines.push(`Total sum insured: ${m.capitalFromSlip}`);
  if (displayPremium != null && displayPremium > 0) {
    lines.push(`Gross / quoted premium: ${fmtMoney(displayPremium, m.displayCurrency)}`);
  }
  const { ratePerMille, commissionPercent, deductibles, includedCews } = props;

  if (cededSumInsured > 0) {
    lines.push(`Facultative ceded sum insured: ${fmtMoney(cededSumInsured, m.displayCurrency)}`);
    if (cededPremium > 0) {
      lines.push(`Facultative ceded premium: ${fmtMoney(cededPremium, m.displayCurrency)}`);
    }
    if (ratePerMille != null && ratePerMille > 0) {
      lines.push(`Technical rate: ${ratePerMille.toFixed(2)}‰`);
    }
    if (commissionPercent != null && commissionPercent > 0) {
      lines.push(`Commission: ${commissionPercent}%`);
    }
  }
  if (deductibles?.allOtherPerils?.trim()) {
    lines.push(`Deductible — ${deductibles.allOtherPerils.trim()}`);
  }
  if (deductibles?.naturalPerils?.trim()) {
    lines.push(`Deductible — ${deductibles.naturalPerils.trim()}`);
  }
  if (includedCews?.length) {
    lines.push('');
    lines.push('CLAUSES / CEWs', '────────────────');
    includedCews.forEach((c, i) => {
      lines.push(`${i + 1}. [${c.type}] ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
    });
  }
  lines.push('Basis of cover and period: as per attached quote / proposal and reinsurance slip.');
  lines.push('');

  if (m.insuredRows.length > 0) {
    lines.push('INSURED & ACCOUNT DETAILS', '────────────────');
    for (const r of m.insuredRows) {
      lines.push(`${r.label}: ${r.value}`);
    }
    lines.push('');
  }

  if (riskFields.length > 0) {
    lines.push('RISK INFORMATION', '────────────────');
    lines.push('The following particulars are extracted from the underwriting file for your review:');
    lines.push('');
    for (const f of riskFields) {
      appendProposalFieldPlain(lines, f);
    }
  } else if (m.proposalFields.length > 0) {
    lines.push('RISK INFORMATION', '────────────────');
    for (const f of m.proposalFields.slice(0, 6)) {
      appendProposalFieldPlain(lines, f);
    }
  }

  if (m.coverPricingRows.length > 0) {
    lines.push('PREMIUM & SUM INSURED BY COVER', '────────────────');
    for (const r of m.coverPricingRows) {
      lines.push(`${r.cover} — SI ${r.sumInsured} · Premium ${r.premium}`);
    }
    lines.push('');
  }

  if (m.projectRows.length > 0) {
    lines.push('UNIT / PROJECT BREAKDOWN', '────────────────');
    for (const r of m.projectRows.slice(0, 12)) {
      lines.push(`${r.path} — SI ${r.sumInsured} · Premium ${r.premium}`);
    }
    if (m.projectRows.length > 12) {
      lines.push(`… and ${m.projectRows.length - 12} further unit(s) — see attachments.`);
    }
    lines.push('');
  }

  lines.push('ATTACHMENTS', '────────────────');
  lines.push('• Facultative reinsurance request slip (Word)');
  lines.push('• Quote / proposal form (PDF)');
  lines.push('• Underwriting documentation pack (PDF)');
  lines.push('');

  lines.push(
    'Please confirm your line, signed share, and any subjectivities or declinature reasons in writing. We will revert with final placement instructions upon receipt of your indication.',
    '',
    'Kind regards,',
    '',
    cedent,
    'Facultative Reinsurance / Reinsurance Operations',
  );

  return lines.join('\n');
}

export function FacultativeDraftMailPreview({
  referral,
  referralLoading,
  productName,
  coverTitle,
  sumInsured,
  grossPremium,
  currency,
  referralId,
  quoteId,
  cededSumInsured,
  cededPremium,
}: FacultativeDraftMailPreviewProps) {
  if (referralLoading) {
    return (
      <div className="space-y-4 bg-white p-1 text-sm text-black">
        <p className="text-black">Dear {'{Recipient name}'},</p>
        <p className="text-xs text-black">
          Preparing facultative placement note from referral — risk particulars will populate automatically.
        </p>
      </div>
    );
  }

  const plain = buildFacultativeDraftPlainText({
    referral,
    productName,
    coverTitle,
    sumInsured,
    grossPremium,
    currency,
    referralId,
    quoteId,
    cededSumInsured,
    cededPremium,
  });

  return (
    <div className="space-y-3 bg-white p-1 text-sm text-black">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-black">{plain}</pre>
    </div>
  );
}

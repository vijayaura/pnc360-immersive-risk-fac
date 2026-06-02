import {
  AlignmentType,
  Document,
  LineRuleType,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
  UnderlineType,
} from 'docx';
import { format, parseISO } from 'date-fns';

import type { ReferralDetailResponse } from '@/features/proposals/api/referrals';

export type FacultativeSlipParty = {
  kind: 'reinsurer' | 'reinsurance_broker' | 'insurer';
  id: string;
  name: string;
  email?: string;
};

export type FacultativeReinsuranceSlipDocContext = {
  referral: ReferralDetailResponse | undefined;
  referralId: string;
  productName: string;
  coverTitle?: string;
  sumInsured: number;
  cededSumInsured: number;
  grossPremium: number;
  currency: string;
  selectedParties: FacultativeSlipParty[];
  /** When `referral` is not loaded — e.g. broker outward demo — populate insured / location lines. */
  insuredDisplayName?: string;
  locationDisplayName?: string;
  /** ISO-ish date string for period start (e.g. referral submission). */
  periodStartIso?: string;
};

const ADDITIONAL_CLAUSES = [
  'Escalation Clause',
  "Architects' & Surveyors' Fees",
  'Removal of Debris',
  'Capital Addition',
  'Public Authorities',
  'Temporary Removal',
  'Fire Extinguishing',
  'Payment on account clause',
  'Sprinkler Leakage',
  'Alterations & Repairs',
  'Minor Alterations',
  'Automatic Reinstatement of the Sum Insured',
];

const EXCLUSIONS = [
  'Terrorism Exclusion Clause',
  'War and Civil War Exclusion Clause',
  'Nuclear and Biological Exclusion Clause',
];

function safeFormatPeriodStart(iso: string | undefined): string {
  if (!iso) return format(new Date(), 'dd MMMM yyyy');
  try {
    return format(parseISO(iso), 'dd MMMM yyyy');
  } catch {
    return format(new Date(), 'dd MMMM yyyy');
  }
}

function formatAmount(n: number, currency: string): string {
  if (!Number.isFinite(n) || n < 0) return '_______';
  const rounded = Math.round(n);
  const num = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(rounded);
  if (currency === 'USD') return `US$ ${num}`;
  return `${currency} ${num}`;
}

function splitMaterialAndBiSi(
  detail: ReferralDetailResponse | undefined,
  fallbackTotal: number,
): { md: number; bi: number } {
  const covers = detail?.pricingBreakdown?.covers;
  if (!covers?.length) {
    const t = Math.max(0, fallbackTotal);
    return { md: Math.round(t * 0.85), bi: Math.max(0, Math.round(t * 0.15)) };
  }
  let bi = 0;
  let md = 0;
  for (const c of covers) {
    const n = (c.name || '').toLowerCase();
    const si = Number(c.sumInsured) || 0;
    if (n.includes('business') || n.includes('interruption') || n.includes('b.i') || n.includes('bi')) {
      bi += si;
    } else {
      md += si;
    }
  }
  const sum = md + bi;
  const t = Math.max(0, fallbackTotal);
  if (sum <= 0) {
    return { md: Math.round(t * 0.85), bi: Math.max(0, Math.round(t * 0.15)) };
  }
  return { md, bi };
}

function insuredLegalName(detail: ReferralDetailResponse | undefined, insuredOverride?: string): string {
  const base =
    insuredOverride?.trim() ||
    detail?.companyName?.trim() ||
    detail?.customerName?.trim() ||
    detail?.customerDetails?.customerName?.trim() ||
    '';
  if (base) {
    return `${base} (Pvt) Ltd and/or its Subsidiaries and/or its Associate Companies as their respective rights and interests may appear`;
  }
  return '________________ (Pvt) Ltd and/or its Subsidiaries and/or its Associate Companies as their respective rights and interests may appear';
}

function locationLine(detail: ReferralDetailResponse | undefined, locationOverride?: string): string {
  if (locationOverride?.trim()) return locationOverride.trim();
  const parts = [
    detail?.companyName,
    detail?.customerName,
    detail?.brokerName,
  ].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  return '_______________________________';
}

function classOfInsurance(productName: string, coverTitle?: string): string {
  const base = (productName || 'Property All Risks').trim();
  const hasPar = /property/i.test(base) && /all risks/i.test(base);
  if (hasPar && /business interruption/i.test(base)) return base;
  const ct = coverTitle?.trim();
  if (ct) {
    return `${base} including ${ct}`;
  }
  return `${base} including Business Interruption`;
}

function leadReinsurerName(parties: FacultativeSlipParty[]): string {
  const r = parties.find((p) => p.kind === 'reinsurer');
  if (r?.name) return r.name;
  const any = parties[0];
  return any?.name ? `${any.name}` : '_______________________________';
}

/** Spacing values are in twips (1/20 pt). ~240 twips ≈ 12 pt line gap. */
const SP = {
  tight: 100,
  afterLabel: 140,
  afterBlockLine: 160,
  subsection: 200,
  sectionBreak: 360,
  majorSection: 520,
  titleBelow: 640,
} as const;

const listLineSpacing = {
  line: 276,
  lineRule: LineRuleType.AUTO,
} as const;

function gap(after: number, before = 0): Pick<Paragraph, 'spacing'> {
  return { spacing: { before, after, ...listLineSpacing } };
}

function gapSimple(after: number, before = 0): Pick<Paragraph, 'spacing'> {
  return { spacing: { before, after } };
}

function categoryHeadingSpacing(): Pick<Paragraph, 'spacing'> {
  return {
    spacing: {
      before: SP.majorSection,
      after: SP.subsection,
      ...listLineSpacing,
    },
  };
}

export async function buildFacultativeReinsuranceSlipDocxBlob(
  ctx: FacultativeReinsuranceSlipDocContext,
): Promise<Blob> {
  const {
    referral,
    referralId,
    productName,
    coverTitle,
    sumInsured,
    cededSumInsured,
    grossPremium,
    currency,
    selectedParties,
    insuredDisplayName,
    locationDisplayName,
    periodStartIso,
  } = ctx;

  const totalSiNum = Number(
    sumInsured > 0
      ? sumInsured
      : (referral?.totalSumInsured != null ? Number(referral.totalSumInsured) : 0) || cededSumInsured,
  );
  const baseSplit = splitMaterialAndBiSi(referral, totalSiNum || cededSumInsured);
  const cessionRatio = totalSiNum > 0 ? Math.min(1, Math.max(0, cededSumInsured / totalSiNum)) : 1;
  const mdCeded = Math.round(baseSplit.md * cessionRatio);
  const biCeded = Math.round(baseSplit.bi * cessionRatio);

  const periodStart = safeFormatPeriodStart(periodStartIso ?? referral?.referredAt);
  const ratePct =
    totalSiNum > 0 && grossPremium > 0
      ? ((grossPremium / totalSiNum) * 100).toFixed(4)
      : '_______';
  const sharePct =
    totalSiNum > 0 && cededSumInsured > 0
      ? ((cededSumInsured / totalSiNum) * 100).toFixed(2)
      : '_______';

  const deductibleMinOther = formatAmount(
    Math.max(250_000, Math.min(mdCeded * 0.1, mdCeded * 0.25) || 250_000),
    currency,
  );
  const deductibleMinNat = formatAmount(
    Math.max(250_000, Math.min(mdCeded * 0.1, mdCeded * 0.3) || 250_000),
    currency,
  );

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: SP.titleBelow },
      children: [
        new TextRun({
          text: 'FACULTATIVE REINSURANCE SLIP',
          bold: true,
          size: 32,
        }),
      ],
    }),

    // ─── Policy particulars (grouped) ─────────────────────────────────────
    new Paragraph({
      ...gapSimple(SP.afterBlockLine),
      children: [
        new TextRun({ text: 'INSURED: ', bold: true }),
        new TextRun({ text: insuredLegalName(referral, insuredDisplayName) }),
      ],
    }),
    new Paragraph({
      ...gapSimple(SP.afterBlockLine),
      children: [
        new TextRun({ text: 'CLASS: ', bold: true }),
        new TextRun({ text: classOfInsurance(productName, coverTitle) }),
      ],
    }),
    new Paragraph({
      ...gapSimple(SP.afterBlockLine),
      children: [
        new TextRun({ text: 'PERIOD: ', bold: true }),
        new TextRun({ text: `12 months from ${periodStart}` }),
      ],
    }),
    new Paragraph({
      ...gapSimple(SP.sectionBreak),
      children: [
        new TextRun({ text: 'LOCATION: ', bold: true }),
        new TextRun({ text: locationLine(referral, locationDisplayName) }),
      ],
    }),

    // ─── Sum insured ──────────────────────────────────────────────────────
    new Paragraph({
      ...categoryHeadingSpacing(),
      children: [new TextRun({ text: 'SUM INSURED:', bold: true })],
    }),
    new Paragraph({
      ...gap(SP.afterLabel, 0),
      indent: { left: 360 },
      children: [
        new TextRun({ text: 'Section A – Material Damage: ', bold: true }),
        new TextRun({ text: formatAmount(mdCeded, currency) }),
      ],
    }),
    new Paragraph({
      ...gap(SP.afterLabel, 0),
      indent: { left: 360 },
      children: [
        new TextRun({ text: 'Section B – Business Interruption: ', bold: true }),
        new TextRun({ text: formatAmount(biCeded, currency) }),
      ],
    }),
    new Paragraph({
      ...gap(SP.majorSection, 0),
      indent: { left: 120 },
      children: [
        new TextRun({
          text: 'Detailed break-up of sum insured are as per attachment.',
          italics: true,
        }),
      ],
    }),

    // ─── Deductibles ──────────────────────────────────────────────────────
    new Paragraph({
      spacing: {
        before: SP.subsection,
        after: SP.subsection,
        ...listLineSpacing,
      },
      children: [
        new TextRun({
          text: 'DEDUCTIBLES (on each & every claim):',
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      ...gap(SP.afterLabel, 0),
      children: [
        new TextRun({
          text: 'Section A – Material Damage',
          bold: true,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
    new Paragraph({
      ...gap(SP.tight, 0),
      indent: { left: 360 },
      children: [
        new TextRun({
          text: `All other perils: 10% with a minimum of ${deductibleMinOther}`,
        }),
      ],
    }),
    new Paragraph({
      ...gap(SP.afterBlockLine, 0),
      indent: { left: 360 },
      children: [
        new TextRun({
          text: `Natural perils: 10% with a minimum of ${deductibleMinNat}`,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: SP.sectionBreak, after: SP.afterLabel, ...listLineSpacing },
      children: [
        new TextRun({
          text: 'Section B – Business Interruption',
          bold: true,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
    new Paragraph({
      ...gap(SP.majorSection, 0),
      indent: { left: 360 },
      children: [new TextRun({ text: '30 days' })],
    }),

    // ─── Additional clauses ─────────────────────────────────────────────────
    new Paragraph({
      spacing: { before: SP.subsection, after: SP.subsection, ...listLineSpacing },
      children: [
        new TextRun({
          text: 'ADDITIONAL CLAUSES',
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      ...gap(SP.afterLabel, 0),
      children: [
        new TextRun({
          text: 'Section A – Material Damage',
          bold: true,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
    ...ADDITIONAL_CLAUSES.map(
      (clause, i) =>
        new Paragraph({
          spacing: { after: SP.tight, line: listLineSpacing.line, lineRule: listLineSpacing.lineRule },
          indent: { left: 360 },
          children: [new TextRun({ text: `${i + 1}. ${clause}` })],
        }),
    ),

    new Paragraph({
      children: [new PageBreak()],
    }),

    // ─── Page 2 — Conditions & placement terms ───────────────────────────
    new Paragraph({
      spacing: { before: SP.sectionBreak, after: SP.subsection, ...listLineSpacing },
      children: [new TextRun({ text: 'CONDITIONS:', bold: true })],
    }),
    new Paragraph({
      ...gap(SP.majorSection, 0),
      children: [new TextRun({ text: '_______________________________' })],
    }),
    new Paragraph({
      spacing: { before: SP.sectionBreak, after: SP.afterLabel, ...listLineSpacing },
      children: [new TextRun({ text: 'EXCLUSIONS:', bold: true })],
    }),
    ...EXCLUSIONS.map(
      (ex) =>
        new Paragraph({
          spacing: { after: SP.tight, line: listLineSpacing.line, lineRule: listLineSpacing.lineRule },
          indent: { left: 360 },
          children: [new TextRun({ text: `• ${ex}` })],
        }),
    ),
    new Paragraph({
      spacing: { before: SP.majorSection, after: SP.afterLabel, ...listLineSpacing },
      children: [new TextRun({ text: 'LOSS EXPERIENCE:', bold: true })],
    }),
    new Paragraph({
      ...gap(SP.sectionBreak, 0),
      children: [new TextRun({ text: '_______________________________' })],
    }),
    new Paragraph({
      ...gap(SP.afterBlockLine, 0),
      children: [
        new TextRun({ text: 'RATE: ', bold: true }),
        new TextRun({ text: `${ratePct} %` }),
      ],
    }),
    new Paragraph({
      ...gap(SP.afterBlockLine, 0),
      children: [
        new TextRun({ text: 'RI COMMISSION: ', bold: true }),
        new TextRun({ text: '_______ %', color: '666666' }),
      ],
    }),
    new Paragraph({
      ...gap(SP.afterBlockLine, 0),
      children: [
        new TextRun({ text: 'LEAD REINSURER: ', bold: true }),
        new TextRun({ text: leadReinsurerName(selectedParties) }),
      ],
    }),
    new Paragraph({
      ...gap(SP.sectionBreak, 0),
      children: [
        new TextRun({ text: 'SHARE OFFERED: ', bold: true }),
        new TextRun({ text: `${sharePct} % of 100%` }),
      ],
    }),

    new Paragraph({
      spacing: { before: SP.majorSection, after: SP.afterLabel, ...listLineSpacing },
      children: [
        new TextRun({
          text: `Referral reference (system): ${referral?.referralId ?? referralId} `,
          size: 18,
          color: '666666',
        }),
      ],
    }),
    new Paragraph({
      spacing: { line: listLineSpacing.line, lineRule: listLineSpacing.lineRule },
      children: [
        new TextRun({
          text: `Ceded sum insured (facultative outreach): ${formatAmount(Math.round(cededSumInsured), currency)} · Total sum insured (context): ${formatAmount(Math.round(totalSiNum), currency)}`,
          size: 18,
          color: '666666',
        }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}

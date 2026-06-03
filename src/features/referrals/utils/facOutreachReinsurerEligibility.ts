import { LINES_WRITTEN_OPTIONS } from '@/features/reinsurers/constants/riskAppetiteOptions';
import type { Reinsurer } from '@/features/reinsurers/api/reinsurers';

export type OutreachLimitReasonCode = 'lob' | 'capacity' | 'premium';

export interface OutreachLimitReason {
  code: OutreachLimitReasonCode;
  label: string;
  detail: string;
}

export interface ReinsurerOutreachEligibility {
  eligible: boolean;
  reasons: OutreachLimitReason[];
}

export interface FacOutreachEligibilityContext {
  productName: string;
  sumInsured: number;
  cededSumInsured: number;
  grossPremium: number;
  /** Fac placement premium (editable); falls back to pro-rata gross. */
  cessionPremium?: number;
  currency?: string;
}

function stableInt(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const range = max - min + 1;
  return min + (Math.abs(h) % range);
}

function lobLabel(key: string): string {
  return LINES_WRITTEN_OPTIONS.find((o) => o.value === key)?.label ?? key;
}

/** Map referral / product label to reinsurer `linesWritten` appetite key. */
export function inferLobKeyFromProduct(productName: string): string {
  const p = productName.toLowerCase();
  if (/med\s*mal|medical|malpractice|physician|doctor/.test(p)) return 'life_health';
  if (/professional|indemnity|d&o|directors/.test(p)) return 'financial_lines';
  if (/cyber|tech e&o/.test(p)) return 'financial_lines';
  if (/marine|cargo|hull/.test(p)) return 'marine';
  if (/aviation|aircraft/.test(p)) return 'aviation';
  if (/energy|power|oil|gas|petro/.test(p)) return 'energy';
  if (/engineering|construction|car\b|ear\b/.test(p)) return 'engineering';
  if (/motor|fleet|auto/.test(p)) return 'motor';
  if (/liability|casualty|general liability|gl\b/.test(p)) return 'casualty';
  if (/property|fire|all risk|material damage/.test(p)) return 'property';
  return 'specialty';
}

function cessionPremium(ctx: FacOutreachEligibilityContext): number {
  if (ctx.cessionPremium != null && ctx.cessionPremium > 0) return ctx.cessionPremium;
  if (ctx.sumInsured > 0 && ctx.cededSumInsured > 0 && ctx.grossPremium > 0) {
    return Math.round(ctx.grossPremium * (ctx.cededSumInsured / ctx.sumInsured));
  }
  return 0;
}

function minRatePerMilleForReinsurer(reinsurerId: string): number {
  return stableInt(`${reinsurerId}:minrate`, 35, 95) / 100;
}

/** Real appetite / terms checks only — directory rows are eligible unless a rule fails. */
export function assessReinsurerOutreachEligibility(
  reinsurer: Reinsurer,
  ctx: FacOutreachEligibilityContext,
): ReinsurerOutreachEligibility {
  const reasons: OutreachLimitReason[] = [];
  const lobKey = inferLobKeyFromProduct(ctx.productName);
  const ra = reinsurer.riskAppetite;
  const ceded = ctx.cededSumInsured;
  const prem = cessionPremium(ctx);
  const ratePerMille = ceded > 0 && prem > 0 ? (prem / ceded) * 1000 : 0;

  const lines = ra?.linesWritten ?? [];
  if (lines.length > 0 && !lines.includes(lobKey)) {
    reasons.push({
      code: 'lob',
      label: 'Line of business',
      detail: `Does not write ${lobLabel(lobKey)} — appetite: ${lines.map(lobLabel).join(', ')}`,
    });
  }

  const declined = ra?.declinedRisks ?? [];
  if (declined.length > 0) {
    const lobDeclineHit = declined.some((d) => d.toLowerCase().includes(lobKey.replace('_', ' ')));
    if (lobDeclineHit && !reasons.some((r) => r.code === 'lob')) {
      reasons.push({
        code: 'lob',
        label: 'Line of business',
        detail: 'Risk class flagged as declined on appetite schedule',
      });
    }
  }

  const maxRet = ra?.maximumRetention;
  if (maxRet != null && maxRet > 0 && ceded > maxRet) {
    const curr = ra.maximumRetentionCurrency ?? ctx.currency ?? 'AED';
    reasons.push({
      code: 'capacity',
      label: 'Capacity',
      detail: `Ceded SI exceeds stated max retention (${Math.round(maxRet).toLocaleString()} ${curr})`,
    });
  }

  if (ratePerMille > 0) {
    const floor = minRatePerMilleForReinsurer(reinsurer.id);
    if (ratePerMille < floor) {
      reasons.push({
        code: 'premium',
        label: 'Premium / rate',
        detail: `Quoted ${ratePerMille.toFixed(2)}‰ vs ${floor.toFixed(2)}‰ minimum for facultative support`,
      });
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

export function sortReinsurerRowsByEligibility<T extends { outreachEligible: boolean; name: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (a.outreachEligible !== b.outreachEligible) return a.outreachEligible ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

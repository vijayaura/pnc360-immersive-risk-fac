import type { Reinsurer } from '@/features/reinsurers/api/reinsurers';
import type { OutreachLimitReason } from '@/features/referrals/utils/facOutreachReinsurerEligibility';
import { inferLobKeyFromProduct } from '@/features/referrals/utils/facOutreachReinsurerEligibility';
import { LINES_WRITTEN_OPTIONS } from '@/features/reinsurers/constants/riskAppetiteOptions';

function lobLabel(key: string): string {
  return LINES_WRITTEN_OPTIONS.find((o) => o.value === key)?.label ?? key;
}

export type FacOutreachLimitedReinsurer = Reinsurer & {
  outreachLimitReasons: OutreachLimitReason[];
};

/** Extra reinsurers shown as ineligible (grey + reasons) — API directory rows stay eligible unless real rules hit. */
export function buildFacOutreachLimitedReinsurers(productName: string): FacOutreachLimitedReinsurer[] {
  const lobKey = inferLobKeyFromProduct(productName);
  const lobName = lobLabel(lobKey);

  return [
    {
      id: 'demo-ri-limited-aspen',
      name: 'Aspen Re',
      status: 'active',
      adminEmail: 'fac.uae@aspenre.demo',
      email: 'fac.uae@aspenre.demo',
      riskAppetite: {
        linesWritten: ['property', 'casualty'],
        maximumRetention: 15_000_000,
        maximumRetentionCurrency: 'AED',
      },
      outreachLimitReasons: [
        {
          code: 'lob',
          label: 'Line of business',
          detail: `${lobName} not in facultative appetite; writes Property and Casualty only`,
        },
      ],
    },
    {
      id: 'demo-ri-limited-everest',
      name: 'Everest Re',
      status: 'active',
      adminEmail: 'middleeast.fac@everestre.demo',
      email: 'middleeast.fac@everestre.demo',
      riskAppetite: {
        linesWritten: ['property', 'engineering'],
        maximumRetention: 8_000_000,
        maximumRetentionCurrency: 'AED',
      },
      outreachLimitReasons: [
        {
          code: 'capacity',
          label: 'Capacity',
          detail: 'Facultative capacity fully deployed on GCC property until Q3',
        },
      ],
    },
    {
      id: 'demo-ri-limited-axis',
      name: 'Axis Re',
      status: 'active',
      adminEmail: 'placement@axisre.demo',
      riskAppetite: {
        linesWritten: ['specialty', 'financial_lines'],
        maximumRetention: 25_000_000,
        maximumRetentionCurrency: 'AED',
      },
      outreachLimitReasons: [
        {
          code: 'premium',
          label: 'Premium / rate',
          detail: 'Minimum technical rate not met for this class at current terms',
        },
      ],
    },
    {
      id: 'demo-ri-limited-hannover',
      name: 'Hannover Re',
      status: 'active',
      adminEmail: 'gcc.fac@hannoverre.demo',
      email: 'gcc.fac@hannoverre.demo',
      riskAppetite: {
        linesWritten: ['property', 'marine'],
        maximumRetention: 12_000_000,
        maximumRetentionCurrency: 'AED',
      },
      outreachLimitReasons: [
        {
          code: 'lob',
          label: 'Line of business',
          detail: `${lobName} outside preferred facultative lines — marine & property focus only`,
        },
        {
          code: 'capacity',
          label: 'Capacity',
          detail: 'Remaining GCC facultative line size below requested cession',
        },
      ],
    },
  ];
}

export function mergeFacOutreachLimitedReinsurers(
  apiReinsurers: Reinsurer[],
  productName: string,
): { directory: Reinsurer[]; limited: FacOutreachLimitedReinsurer[] } {
  const demos = buildFacOutreachLimitedReinsurers(productName);
  const seenIds = new Set(apiReinsurers.map((r) => r.id));
  const seenNames = new Set(apiReinsurers.map((r) => r.name.trim().toLowerCase()));

  const limited = demos.filter(
    (d) => !seenIds.has(d.id) && !seenNames.has(d.name.trim().toLowerCase()),
  );

  return { directory: apiReinsurers, limited };
}

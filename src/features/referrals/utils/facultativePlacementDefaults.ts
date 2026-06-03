export const FAC_CEW_TYPES = ['Clause', 'Extension', 'Warranty'] as const;

export type FacPlacementCewItem = {
  id: string;
  type: (typeof FAC_CEW_TYPES)[number] | string;
  name: string;
  detail: string;
};

export const DEFAULT_FAC_PLACEMENT_CEWS: FacPlacementCewItem[] = [
  {
    id: 'cew-72h-clause',
    type: 'Clause',
    name: '72 Hours Clause',
    detail: 'Applies to catastrophe aggregation and loss occurrence definition.',
  },
  {
    id: 'cew-debris-ext',
    type: 'Extension',
    name: 'Debris Removal Extension',
    detail: 'Included within overall property damage limit.',
  },
  {
    id: 'cew-hot-work-war',
    type: 'Warranty',
    name: 'Hot Work Permit Warranty',
    detail: 'Formal permit system required for all hot work activity.',
  },
];

export const DEFAULT_FAC_DEDUCTIBLES = {
  allOtherPerils: 'All other perils: 10% of loss with a minimum of AED 250,000 each & every claim',
  naturalPerils: 'Natural perils: 10% of loss with a minimum of AED 250,000 each & every claim',
};

export function defaultFacRatePerMille(sumInsured: number, grossPremium: number): number {
  if (sumInsured <= 0 || grossPremium <= 0) return 0;
  return Math.round((grossPremium / sumInsured) * 1000 * 100) / 100;
}

export function premiumFromRate(cededSumInsured: number, ratePerMille: number): number {
  if (cededSumInsured <= 0 || ratePerMille <= 0) return 0;
  return Math.round((cededSumInsured * ratePerMille) / 1000);
}

export function rateFromPremium(cededSumInsured: number, premium: number): number {
  if (cededSumInsured <= 0 || premium <= 0) return 0;
  return Math.round((premium / cededSumInsured) * 1000 * 100) / 100;
}

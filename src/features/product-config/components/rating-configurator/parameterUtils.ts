import type { RatingParameter } from './types';

export function isCombinationField(type: string, parameterType?: string): boolean {
  const t = String(type || '').toLowerCase();
  const pt = String(parameterType || '').toLowerCase();
  return t === 'combination' || pt === 'combination';
}

export function flattenRatingParameters(parameters: RatingParameter[]): RatingParameter[] {
  return parameters.flatMap((p) => {
    if (isCombinationField(p.type, p.parameterType)) {
      const items: RatingParameter[] = [p];

      if (p.isRatingParameter) {
        const derivedId = `derived|${p.id}|COUNT`;
        items.push({
          ...p,
          id: derivedId,
          name: derivedId,
          label: `${p.label} - Total Count`,
          formFieldId: undefined,
          parentFieldId: p.id,
          type: 'number',
          parameterType: 'DERIVED',
          derivedType: 'COUNT',
          derivedSubfieldId: null,
        });
      }

      if (p.childFields) {
        p.childFields.forEach((child) => {
          const t = child.type?.toLowerCase();
          if ((t === 'number' || t === 'currency') && child.isRatingParameter) {
            const derivedId = `derived|${p.id}|SUM|${child.id}`;
            items.push({
              ...child,
              id: derivedId,
              name: derivedId,
              label: `${p.label} - Sum of ${child.label}`,
              formFieldId: undefined,
              parentFieldId: p.id,
              parameterType: 'DERIVED',
              derivedType: 'SUM',
              derivedSubfieldId: child.id,
            } as RatingParameter);
          }
        });
      }
      return items;
    }
    return [p];
  });
}

import { addDays, subDays, format } from 'date-fns';
import type { TreatyStructure, TreatyStructureType } from './types';

interface DateOverlapConflict {
  message: string;
}

/**
 * Checks whether a candidate treaty structure has overlapping dates with
 * any existing structure of the same type.
 *
 * Returns a conflict object with a message if overlap is found, or null if OK.
 * Skips validation when either treaty has incomplete dates (null effectiveDate/expiryDate).
 */
export function findSameTypeDateOverlap(
  candidate: TreatyStructure,
  existingList: TreatyStructure[],
  excludeId?: string | null,
): DateOverlapConflict | null {
  // Surplus treaties are allowed to overlap dates — validated by trigger range instead
  if (candidate.structureType === 'Surplus') return null;

  if (!candidate.effectiveDate || !candidate.expiryDate) {
    return null;
  }

  const candidateStart = format(new Date(candidate.effectiveDate), 'yyyy-MM-dd');
  const candidateEnd = format(new Date(candidate.expiryDate), 'yyyy-MM-dd');

  const sameTypeTreaties = existingList.filter(
    (s) => s.structureType === candidate.structureType && s.id !== excludeId,
  );

  for (const existing of sameTypeTreaties) {
    if (!existing.effectiveDate || !existing.expiryDate) {
      continue;
    }

    const existingStart = format(new Date(existing.effectiveDate), 'yyyy-MM-dd');
    const existingEnd = format(new Date(existing.expiryDate), 'yyyy-MM-dd');

    // Overlap: startA <= endB && startB <= endA (string comparison works for YYYY-MM-DD)
    if (candidateStart <= existingEnd && existingStart <= candidateEnd) {
      const name = existing.name || existing.treatyCode || 'Untitled';
      return {
        message: `Date range overlaps with "${name}" (${existing.structureType}). Two treaties of the same type cannot have overlapping periods within the same program.`,
      };
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart date constraints for same-type treaties
// ─────────────────────────────────────────────────────────────────────────────

export interface SameTypeDateConstraints {
  /** Date ranges occupied by existing same-type treaties (for disabledRanges) */
  occupiedRanges: Array<{ start: string; end: string }>;
  /** Computed min for the effective date picker */
  effectiveDateMin?: string;
  /** Computed max for the effective date picker */
  effectiveDateMax?: string;
  /** Computed min for the expiry date picker */
  expiryDateMin?: string;
  /** Computed max for the expiry date picker */
  expiryDateMax?: string;
}

function toIso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Computes dynamic date constraints for treaty date pickers based on
 * existing same-type treaties within the program period.
 *
 * This prevents users from selecting dates that would overlap with
 * existing treaties of the same type.
 */
export function computeSameTypeDateConstraints(
  structureType: TreatyStructureType | null,
  existingStructures: TreatyStructure[],
  excludeId: string | null | undefined,
  programStart: string | null | undefined,
  programEnd: string | null | undefined,
  currentEffectiveDate: string | null | undefined,
  currentExpiryDate: string | null | undefined,
): SameTypeDateConstraints {
  const empty: SameTypeDateConstraints = { occupiedRanges: [] };
  // Surplus treaties are allowed to overlap dates — no date constraints needed
  if (structureType === 'Surplus') return empty;

  if (!structureType || !programStart || !programEnd) return empty;

  // Filter same-type treaties (exclude self when editing)
  const sameType = existingStructures
    .filter(
      (s) =>
        s.structureType === structureType &&
        s.id !== excludeId &&
        s.effectiveDate &&
        s.expiryDate,
    )
    .map((s) => ({
      start: new Date(s.effectiveDate!),
      end: new Date(s.expiryDate!),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (sameType.length === 0) return empty;

  const pStart = new Date(programStart);
  const pEnd = new Date(programEnd);

  // Build occupied ranges as ISO strings
  const occupiedRanges = sameType.map(({ start, end }) => ({
    start: toIso(start),
    end: toIso(end),
  }));

  let effectiveDateMin: string | undefined = toIso(pStart);
  let effectiveDateMax: string | undefined = toIso(pEnd);
  let expiryDateMin: string | undefined = toIso(pStart);
  let expiryDateMax: string | undefined = toIso(pEnd);

  // When effective date is already picked, constrain expiry max
  // to the day before the next same-type treaty that starts after the effective date
  if (currentEffectiveDate) {
    const effDate = new Date(currentEffectiveDate);
    expiryDateMin = toIso(effDate);

    const nextTreaty = sameType.find((t) => t.start > effDate);
    if (nextTreaty) {
      const dayBefore = subDays(nextTreaty.start, 1);
      if (dayBefore <= pEnd) {
        expiryDateMax = toIso(dayBefore);
      }
    }
  }

  // When expiry date is already picked, constrain effective min
  // to the day after the previous same-type treaty that ends before the expiry date
  if (currentExpiryDate) {
    const expDate = new Date(currentExpiryDate);
    effectiveDateMax = toIso(expDate);

    const prevTreaties = sameType.filter((t) => t.end < expDate);
    if (prevTreaties.length > 0) {
      const lastPrev = prevTreaties[prevTreaties.length - 1];
      const dayAfter = addDays(lastPrev.end, 1);
      if (dayAfter >= pStart) {
        effectiveDateMin = toIso(dayAfter);
      }
    }
  }

  return {
    occupiedRanges,
    effectiveDateMin,
    effectiveDateMax,
    expiryDateMin,
    expiryDateMax,
  };
}

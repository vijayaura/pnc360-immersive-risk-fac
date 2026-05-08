import type { TreatyStructure } from './types';

interface SurplusTriggerConflict {
  message: string;
}

const fmt = (n: number) => n.toLocaleString();

/**
 * Validates that all surplus treaties form a valid non-overlapping chain.
 * Sorts by trigger, checks each surplus's trigger >= previous surplus's ceiling.
 *
 * Use for **edit** scenarios and program-level "Update Program" validation.
 */
export function findSurplusChainError(
  treatyStructures: TreatyStructure[],
): SurplusTriggerConflict | null {
  const surpluses = treatyStructures
    .filter((s) => s.structureType === 'Surplus')
    .map((s) => ({
      name: s.name || s.treatyCode || 'Untitled',
      trigger: Number(s.treatyTriggerAmount) || 0,
      cap: Number(s.surplusMaxTreatyCapacity) || 0,
    }))
    .sort((a, b) => a.trigger - b.trigger);

  if (surpluses.length < 2) return null;

  for (let i = 1; i < surpluses.length; i++) {
    const prev = surpluses[i - 1];
    const curr = surpluses[i];
    const prevCeiling = prev.trigger + prev.cap;

    if (curr.trigger < prevCeiling) {
      return {
        message:
          `"${curr.name}" trigger (${fmt(curr.trigger)}) must be >= ${fmt(prevCeiling)}. ` +
          `"${prev.name}" covers up to ${fmt(prevCeiling)}.`,
      };
    }
  }

  return null;
}

/**
 * Validates that a **new** surplus treaty starts at or above the highest
 * existing ceiling (trigger + capacity). Prevents inserting below or in
 * gaps — new surpluses must extend the waterfall upward.
 *
 * Use for **create** scenarios only (single-treaty "Save & Add").
 */
export function findNewSurplusTriggerError(
  candidate: TreatyStructure,
  existingStructures: TreatyStructure[],
): SurplusTriggerConflict | null {
  if (candidate.structureType !== 'Surplus') return null;

  const candidateTrigger = Number(candidate.treatyTriggerAmount) || 0;

  const otherSurpluses = existingStructures.filter(
    (s) => s.structureType === 'Surplus',
  );
  if (otherSurpluses.length === 0) return null;

  let maxCeiling = 0;
  let ceilingOwnerName = '';
  for (const s of otherSurpluses) {
    const trigger = Number(s.treatyTriggerAmount) || 0;
    const cap = Number(s.surplusMaxTreatyCapacity) || 0;
    const ceiling = trigger + cap;
    if (ceiling > maxCeiling) {
      maxCeiling = ceiling;
      ceilingOwnerName = s.name || s.treatyCode || 'Untitled';
    }
  }

  if (candidateTrigger < maxCeiling) {
    return {
      message:
        `Trigger must be >= ${fmt(maxCeiling)}. ` +
        `"${ceilingOwnerName}" covers up to ${fmt(maxCeiling)}.`,
    };
  }

  return null;
}

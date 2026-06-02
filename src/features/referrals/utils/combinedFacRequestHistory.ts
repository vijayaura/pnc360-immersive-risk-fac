/** Client-side history for insurer "combined" facultative bundles (multi-select → reinsurance → mail send). */

export const COMBINED_FAC_HISTORY_CHANGED = 'aura:combined-fac-history-changed';

const STORAGE_KEY = 'aura_insurer_combined_fac_history_v1';

export type CombinedFacHistoryStatus = 'pending' | 'submitted';

export interface CombinedFacRequestRecord {
  bundleId: string;
  referralId: string;
  quoteId: string | null;
  coverIds: string[];
  coverTitle: string;
  sectionNames: string[];
  coverLines: string[];
  unitLines: string[];
  sumInsured: number;
  grossPremium: number;
  currency: string;
  createdAt: string;
  status: CombinedFacHistoryStatus;
  submittedAt?: string;
  recipientCount?: number;
  recipientNames?: string[];
}

function readAll(): CombinedFacRequestRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CombinedFacRequestRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: CombinedFacRequestRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function emitChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(COMBINED_FAC_HISTORY_CHANGED));
}

export function registerCombinedFacDraft(entry: Omit<CombinedFacRequestRecord, 'status' | 'submittedAt' | 'recipientCount' | 'recipientNames'>): void {
  const rows = readAll().filter((r) => r.bundleId !== entry.bundleId);
  rows.push({
    ...entry,
    status: 'pending',
  });
  writeAll(rows);
  emitChanged();
}

export function completeCombinedFacBundle(
  bundleId: string,
  meta: { recipientCount: number; recipientNames: string[] },
): void {
  const rows = readAll();
  const idx = rows.findIndex((r) => r.bundleId === bundleId);
  if (idx < 0) return;
  rows[idx] = {
    ...rows[idx],
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    recipientCount: meta.recipientCount,
    recipientNames: meta.recipientNames,
  };
  writeAll(rows);
  emitChanged();
}

export function getCombinedFacHistoryForReferral(
  referralId: string,
  quoteIdFilter?: string | null,
): CombinedFacRequestRecord[] {
  let rows = readAll()
    .filter((r) => r.referralId === referralId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (quoteIdFilter != null && quoteIdFilter !== '') {
    rows = rows.filter((r) => r.quoteId === quoteIdFilter);
  }
  return rows;
}

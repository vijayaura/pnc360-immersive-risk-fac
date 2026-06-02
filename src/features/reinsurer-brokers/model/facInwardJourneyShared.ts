/** Steps shown in the facultative inward journey stepper and slip document list (kept in sync). */
export const FAC_INWARD_JOURNEY_STEPS = [
  { label: 'Fac Request Slip', fileSlug: 'fac-request-slip' },
  { label: 'Quote Slip', fileSlug: 'quote-slip' },
  { label: 'Placement slip', fileSlug: 'placement-slip' },
  { label: 'Signed placement Slip', fileSlug: 'signed-placement-slip' },
] as const;

/** Workflow order for “next action” (upload target); matches slip document list order. */
export const FAC_INWARD_SLIP_PROCESS_ORDER = [
  'fac-request-slip',
  'quote-slip',
  'placement-slip',
  'signed-placement-slip',
] as const;

export function computeFacInwardJourneyCompleted(
  recordStatus: string,
  placementFinalised: boolean,
  signedFacSlipName: string | null,
): boolean[] {
  const status = recordStatus.trim();
  const hasSignedEvidence = placementFinalised || Boolean(signedFacSlipName);
  const pastDraft = status !== 'Broker Draft';
  const slipSharedOrSigned = status === 'Slip Shared' || hasSignedEvidence;

  const raw = FAC_INWARD_JOURNEY_STEPS.map((step) => {
    if (step.fileSlug === 'fac-request-slip') return true;
    /** Quote precedes placement in journey order — completes when the case has left broker draft. */
    if (step.fileSlug === 'quote-slip') return pastDraft;
    /** Placement follows quote — needs slip shared or signed evidence (was the stricter gate). */
    if (step.fileSlug === 'placement-slip') return pastDraft && slipSharedOrSigned;
    if (step.fileSlug === 'signed-placement-slip') return hasSignedEvidence;
    return false;
  });

  return enforceMonotonicJourneySteps(raw);
}

/** Ensure no step shows complete while an earlier step in the journey is incomplete (avoids “skipped” milestones). */
function enforceMonotonicJourneySteps(completed: readonly boolean[]): boolean[] {
  let prefixOk = true;
  return completed.map((done) => {
    const show = Boolean(done) && prefixOk;
    if (!done) prefixOk = false;
    return show;
  });
}

/** First incomplete step in process order, as an index into `FAC_INWARD_JOURNEY_STEPS`; `-1` if all complete. */
export function getFirstIncompleteSlipStepIndex(completed: readonly boolean[]): number {
  for (const slug of FAC_INWARD_SLIP_PROCESS_ORDER) {
    const idx = FAC_INWARD_JOURNEY_STEPS.findIndex((s) => s.fileSlug === slug);
    if (idx !== -1 && !completed[idx]) return idx;
  }
  return -1;
}

/** Demo timestamp per milestone on the inward calendar day (completed steps only). */
export function facInwardStepTimestamp(submittedIsoDate: string, stepIndex: number): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(submittedIsoDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const clock: readonly [number, number, number][] = [
    [8, 10, 12],
    [13, 14, 37],
    [10, 25, 48],
    [16, 45, 52],
  ];
  const row = clock[Math.min(stepIndex, clock.length - 1)];
  if (!row) return null;
  return new Date(y, mo, d, row[0], row[1], row[2]);
}

export function formatFacInwardBritishDateTime(d: Date): string {
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

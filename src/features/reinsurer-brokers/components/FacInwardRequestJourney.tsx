import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/lib-utils';
import {
  computeFacInwardJourneyCompleted,
  FAC_INWARD_JOURNEY_STEPS,
  facInwardStepTimestamp,
  formatFacInwardBritishDateTime,
} from '@/features/reinsurer-brokers/model/facInwardJourneyShared';

export type FacInwardRequestJourneyProps = {
  /** Referral lifecycle status label from mock/API. */
  recordStatus: string;
  placementFinalised: boolean;
  signedFacSlipName: string | null;
  requestId: string;
  submittedDate: string;
  /** e.g. broker facultative outward detail uses "Facultative Outwards journey". */
  title?: string;
};

function splitBritishDateAndTime(localeString: string) {
  const i = localeString.indexOf(',');
  if (i === -1) return { datePart: localeString, timePart: '' };
  return {
    datePart: localeString.slice(0, i).trim(),
    timePart: localeString.slice(i + 1).trim(),
  };
}

export function FacInwardRequestJourney({
  recordStatus,
  placementFinalised,
  signedFacSlipName,
  requestId,
  submittedDate,
  title = 'Facultative request journey',
}: FacInwardRequestJourneyProps) {
  const { toast } = useToast();

  const completed = useMemo(
    () => computeFacInwardJourneyCompleted(recordStatus, placementFinalised, signedFacSlipName),
    [recordStatus, placementFinalised, signedFacSlipName],
  );

  const stepDates = useMemo(() => {
    return FAC_INWARD_JOURNEY_STEPS.map((_, idx) => (completed[idx] ? facInwardStepTimestamp(submittedDate, idx) : null));
  }, [completed, submittedDate]);

  let lastCompletedIndex = -1;
  completed.forEach((done, idx) => {
    if (done) lastCompletedIndex = idx;
  });

  const progressPercentage =
    FAC_INWARD_JOURNEY_STEPS.length > 1
      ? (Math.max(0, lastCompletedIndex) / (FAC_INWARD_JOURNEY_STEPS.length - 1)) * 100
      : 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftScroll(scrollLeft > 5);
    setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleStepDownload = (stepIndex: number) => {
    const step = FAC_INWARD_JOURNEY_STEPS[stepIndex];
    const safeReq = requestId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const slip = [
      step.label.toUpperCase(),
      `Request ID: ${requestId}`,
      '',
      `(Demo artefact generated for underwriting workflow preview.)`,
    ].join('\n');
    const blob = new Blob([slip], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${step.fileSlug}-${safeReq}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Download started',
      description: `${step.label} — ${anchor.download} (demo)`,
    });
  };

  return (
    <Card className="mb-8 w-full border border-blue-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative pt-0">
        <div className="relative w-full">
          <div
            className={`pointer-events-none absolute bottom-0 left-0 top-0 z-20 w-16 bg-gradient-to-r from-white to-transparent transition-opacity duration-300 ${
              showLeftScroll ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-16 bg-gradient-to-l from-white to-transparent transition-opacity duration-300 ${
              showRightScroll ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="relative w-full overflow-x-auto overflow-y-hidden py-[2px] scrollbar-hide"
          >
            <div className="relative min-w-max w-full">
              <div className="absolute left-[3.5rem] right-[3.5rem] top-6 h-0.5 bg-gray-200" />
              <div
                className="absolute left-[3.5rem] top-6 h-0.5 bg-green-500 transition-all duration-500 ease-in-out"
                style={{ width: `calc((100% - 7rem) * ${progressPercentage / 100})` }}
              />

              <div className="relative z-10 flex w-full items-start justify-between px-[1rem]">
                {FAC_INWARD_JOURNEY_STEPS.map((step, index) => {
                  const isCompleted = completed[index];
                  const at = stepDates[index];

                  return (
                    <div
                      key={step.label}
                      className="flex w-[7rem] shrink-0 flex-col items-center text-center sm:w-[8rem]"
                    >
                      {isCompleted ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className={cn(
                            'mb-2 h-12 w-12 rounded-full border-0 shadow-sm transition-all hover:scale-105',
                            'bg-green-500 text-white hover:bg-green-600 hover:text-white',
                          )}
                          aria-label={`Download ${step.label}`}
                          onClick={() => handleStepDownload(index)}
                        >
                          <Download className="h-5 w-5 shrink-0" />
                        </Button>
                      ) : (
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                          <Circle className="h-5 w-5" aria-hidden />
                        </div>
                      )}
                      <div
                        className={cn(
                          'px-0.5 text-[11px] font-medium leading-tight sm:text-xs',
                          isCompleted ? 'font-bold text-gray-900' : 'text-gray-500',
                        )}
                      >
                        {step.label}
                      </div>
                      {at ? (
                        (() => {
                          const line = formatFacInwardBritishDateTime(at);
                          const { datePart, timePart } = splitBritishDateAndTime(line);
                          return (
                            <time
                              className="mt-1 flex flex-col gap-px text-[10px] tabular-nums leading-tight text-gray-400"
                              dateTime={at.toISOString()}
                              title={line}
                            >
                              <span className="font-medium text-gray-500">{datePart}</span>
                              {timePart ? <span>{timePart}</span> : null}
                            </time>
                          );
                        })()
                      ) : (
                        <span className="mt-1 text-[10px] leading-tight text-gray-400">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

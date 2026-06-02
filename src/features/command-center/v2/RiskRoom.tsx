import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { cn } from '@/shared/utils/lib-utils';

import { CommandCenterProvider } from '../context/CommandCenterContext';

import { ActionRail } from './components/ActionRail';
import { ContextDrawer, EvidenceInsightsStrip, InsightRail } from './components/InsightRail';
import { PersistentMapCanvas } from './components/PersistentMapCanvas';
import { ScenarioStressStrip } from './components/ScenarioStressStrip';
import { UnderwritingProximityStrip } from './components/UnderwritingProximityStrip';
import { RiskLayerBar, RiskRoomHeader, TimelineScrubber } from './components/RiskRoomHeader';
import { UwNotepadDrawer } from './components/UwNotepadDrawer';
import { RiskRoomIntro } from './RiskRoomIntro';
import { RiskRoomProvider } from './RiskRoomContext';
import { rr } from './risk-room-theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

function MapStage({ mapReady }: { mapReady: boolean }) {
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <h2 className={rr.sectionTitle}>Experiential underwriting</h2>
        <p className={cn('mt-1', rr.subtext)}>
          Spatial canvas, proximity intelligence, and risk dimensions at the property
        </p>
      </div>

      <div className="relative h-[min(54.6vh,546px)] min-h-[364px] shrink-0 lg:h-[min(62.4vh,624px)]">
        <PersistentMapCanvas mapReady={mapReady} />
      </div>

      <UnderwritingProximityStrip />

      <RiskLayerBar />

      <ContextDrawer />
    </div>
  );
}

function RiskRoomShell({ onClose, mapReady }: { onClose: () => void; mapReady: boolean }) {
  const [briefOpen, setBriefOpen] = useState(true);

  return (
    <div className={`flex h-dvh min-h-0 flex-col overflow-hidden ${rr.page}`}>
      <RiskRoomHeader onBack={onClose} briefOpen={briefOpen} onBriefToggle={() => setBriefOpen((o) => !o)} />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="flex flex-col lg:flex-row">
          <div className="min-w-0 flex-1 p-3 md:p-4 lg:pr-2">
            <MapStage mapReady={mapReady} />
          </div>

          <div className="w-full shrink-0 border-t border-border p-3 md:p-4 lg:w-[min(420px,38%)] lg:border-l lg:border-t-0 lg:pl-2">
            <InsightRail />
          </div>
        </div>

        <ScenarioStressStrip />
        <EvidenceInsightsStrip />

        <footer className="shrink-0">
          <TimelineScrubber />
          <ActionRail />
        </footer>
      </div>
    </div>
  );
}

interface RiskRoomProps {
  onClose?: () => void;
}

function RiskRoomInner({ onClose }: RiskRoomProps) {
  const navigate = useNavigate();
  const [introDone, setIntroDone] = useState(false);
  const handleIntroComplete = useCallback(() => setIntroDone(true), []);

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate(-1);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <CommandCenterProvider>
        <RiskRoomProvider>
          {!introDone && <RiskRoomIntro onComplete={handleIntroComplete} />}
          <div
            className={
              introDone
                ? 'fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden'
                : 'pointer-events-none fixed inset-0 z-40 opacity-0'
            }
          >
            <RiskRoomShell onClose={handleClose} mapReady={introDone} />
            <UwNotepadDrawer />
          </div>
        </RiskRoomProvider>
      </CommandCenterProvider>
    </QueryClientProvider>
  );
}

export default function RiskRoom(props: RiskRoomProps) {
  return <RiskRoomInner {...props} />;
}

export { RiskRoomInner };

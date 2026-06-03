import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

function ExperientialMapColumn({ mapReady }: { mapReady: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div>
        <h2 className={rr.sectionTitle}>Experiential underwriting</h2>
      </div>

      <div className="relative h-[min(54.6vh,546px)] min-h-[364px] shrink-0 lg:h-[min(62.4vh,624px)]">
        <PersistentMapCanvas mapReady={mapReady} />
      </div>

      <UnderwritingProximityStrip />
    </div>
  );
}

function RiskDimensionsPanel() {
  return (
    <div className="flex w-full flex-col gap-3">
      <RiskLayerBar />
      <ContextDrawer />
    </div>
  );
}

function RiskRoomShell({ onClose, mapReady }: { onClose: () => void; mapReady: boolean }) {
  return (
    <div className={`flex h-dvh min-h-0 flex-col overflow-hidden ${rr.page}`}>
      <RiskRoomHeader onBack={onClose} />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="px-3 py-3 md:px-4 md:py-4">
          <div className="relative">
            <div className="flex flex-col lg:min-w-0 lg:pr-[calc(min(420px,38%)+0.75rem)]">
              <ExperientialMapColumn mapReady={mapReady} />
            </div>

            <div className="mt-3 flex min-h-0 flex-col border-t border-border pt-3 lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:w-[min(420px,38%)] lg:overflow-hidden lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
              <InsightRail />
            </div>
          </div>

          <div className="mt-3">
            <RiskDimensionsPanel />
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

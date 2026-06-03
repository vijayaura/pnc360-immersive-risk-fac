import React from 'react';

import { cn } from '@/shared/utils/lib-utils';

import { rr } from '../risk-room-theme';
import { useRiskRoom } from '../RiskRoomContext';

export function SiteOverviewPanel() {
  const { property } = useRiskRoom();

  return (
    <div className="bg-white p-2 pb-0">
      <p className={rr.labelCaps}>Vertical footprint</p>
      <div className="mt-2 space-y-2">
        {property.floorZones.map((z) => (
          <div key={z.id} className={cn('p-3', rr.mutedPanel)}>
            <div className="flex justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">{z.label}</p>
              <span className="text-[10px] text-foreground">{z.floors}</span>
            </div>
            <p className="text-[11px] text-foreground">
              {z.occupancy} · {z.riskNote}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-sky-500" style={{ width: `${z.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

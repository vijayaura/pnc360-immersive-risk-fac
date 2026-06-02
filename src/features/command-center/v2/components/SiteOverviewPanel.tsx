import React, { useState } from 'react';

import { cn } from '@/shared/utils/lib-utils';

import { rr } from '../risk-room-theme';
import { useRiskRoom } from '../RiskRoomContext';

export function SiteOverviewPanel() {
  const { property, addAnnotation } = useRiskRoom();
  const [note, setNote] = useState('');

  return (
    <div className="grid gap-4 bg-white p-2 pb-0 lg:grid-cols-2">
      <div>
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
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className={rr.labelCaps}>UW annotation</p>
        <p className="mt-1 text-[11px] text-foreground">Drop a pin on the spatial canvas with your field notes.</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Broker confirmed sprinkler retrofit 2023…"
          className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
          rows={3}
        />
        <button
          type="button"
          disabled={!note.trim()}
          onClick={() => {
            addAnnotation({
              lat: property.lat + 0.0004,
              lng: property.lng + 0.0003,
              text: note.trim(),
            });
            setNote('');
          }}
          className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-40"
        >
          Drop pin on map
        </button>
      </div>
    </div>
  );
}

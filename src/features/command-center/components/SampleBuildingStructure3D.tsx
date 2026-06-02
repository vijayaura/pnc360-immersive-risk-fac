import React, { useCallback, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/utils/lib-utils';

import type { Property } from '../data/mock-data';

type BuildingZone = {
  id: string;
  label: string;
  floors: string;
  riskNote: string;
  score: number;
  danger: boolean;
};

function buildZones(property: Property): BuildingZone[] {
  const highFromAi = property.aiInsights.some((i) => i.severity === 'high');
  const fireRisk = property.aiInsights.some((i) => i.category === 'fire' && i.severity !== 'low');

  if (property.floors > 20) {
    return [
      {
        id: 'z1',
        label: 'Spire & ME levels',
        floors: `${property.floors - 20}–${property.floors}`,
        riskNote: 'Wind & access stress',
        score: Math.min(100, property.riskScore + 12),
        danger: highFromAi,
      },
      {
        id: 'z2',
        label: 'Office stack',
        floors: '20–120',
        riskNote: 'Standard high-rise profile',
        score: property.riskScore,
        danger: false,
      },
      {
        id: 'z3',
        label: 'Podium & retail',
        floors: '1–19',
        riskNote: 'Fire & BI concentration',
        score: Math.min(100, property.riskScore + 6),
        danger: fireRisk,
      },
      {
        id: 'z4',
        label: 'Basement plant',
        floors: 'B3–B1',
        riskNote: property.floodZone ? 'Flood & water damage' : 'MEP / parking',
        score: Math.min(100, property.riskScore + (property.floodZone ? 14 : 8)),
        danger: property.floodZone || property.riskScore + 8 >= 55,
      },
    ];
  }

  return [
    {
      id: 'z1',
      label: 'Main occupancy',
      floors: `1–${property.floors}`,
      riskNote: 'Primary exposure',
      score: property.riskScore,
      danger: property.riskScore >= 55,
    },
  ];
}

function zoneTone(score: number, danger: boolean, immersive: boolean) {
  if (danger || score >= 60) {
    return immersive
      ? 'from-red-500/35 to-red-900/50 border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
      : 'from-red-400/50 to-red-600/40 border-red-500/60 shadow-[0_0_16px_rgba(220,38,38,0.25)]';
  }
  if (score >= 45) {
    return immersive
      ? 'from-amber-500/25 to-amber-900/40 border-amber-400/40'
      : 'from-amber-300/45 to-amber-500/35 border-amber-500/50';
  }
  return immersive
    ? 'from-sky-500/20 to-slate-800/60 border-sky-400/30'
    : 'from-sky-200/60 to-sky-400/30 border-sky-400/40';
}

type SampleBuildingStructure3DProps = {
  property: Property;
  immersive?: boolean;
  className?: string;
};

export function SampleBuildingStructure3D({
  property,
  immersive = false,
  className,
}: SampleBuildingStructure3DProps) {
  const zones = useMemo(() => buildZones(property), [property]);
  const [rotateY, setRotateY] = useState(-28);
  const [rotateX, setRotateX] = useState(14);
  const [selectedId, setSelectedId] = useState<string | null>(zones.find((z) => z.danger)?.id ?? zones[0]?.id ?? null);
  const dragRef = useRef<{ x: number; y: number; ry: number; rx: number } | null>(null);

  const selected = zones.find((z) => z.id === selectedId) ?? zones[0];

  const towerHeight = Math.min(340, 120 + zones.length * 52);
  const towerWidth = property.floors > 80 ? 88 : property.floors > 30 ? 72 : 58;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = { x: e.clientX, y: e.clientY, ry: rotateY, rx: rotateX };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [rotateX, rotateY],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setRotateY(dragRef.current.ry + dx * 0.35);
    setRotateX(Math.max(4, Math.min(28, dragRef.current.rx - dy * 0.2)));
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const panel = immersive
    ? 'border-white/10 bg-slate-900/90 text-slate-100'
    : 'border-border bg-card/95 text-foreground';

  return (
    <div
      className={cn(
        'relative flex h-full min-h-[520px] w-full flex-col overflow-hidden',
        immersive ? 'bg-[#0a101c]' : 'bg-gradient-to-b from-slate-100 to-slate-200/80',
        className,
      )}
    >
      <div
        className="relative min-h-0 flex-1 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(100,116,139,0.25) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,116,139,0.25) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: `perspective(800px) rotateX(60deg) scale(2.2)`,
            transformOrigin: 'center 80%',
          }}
        />

        <div className="absolute inset-0 flex items-end justify-center pb-[14%] [perspective:1100px]">
          <div
            className="relative [transform-style:preserve-3d] transition-transform duration-75"
            style={{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
          >
            {/* Ground plate */}
            <div
              className={cn(
                'absolute left-1/2 top-full h-4 w-[280px] -translate-x-1/2 rounded-sm border opacity-80',
                immersive ? 'border-slate-600 bg-slate-800/80' : 'border-slate-300 bg-slate-400/30',
              )}
              style={{ transform: 'rotateX(90deg) translateZ(-2px)' }}
            />

            {/* Adjacent at-risk building */}
            <div
              className="absolute [transform-style:preserve-3d]"
              style={{ transform: 'translateX(95px) translateZ(20px)' }}
            >
              <div
                className={cn(
                  'relative border bg-gradient-to-b',
                  immersive
                    ? 'from-orange-500/40 to-orange-950/60 border-orange-400/50 shadow-[0_0_24px_rgba(249,115,22,0.35)]'
                    : 'from-orange-400/55 to-orange-600/45 border-orange-500/60 shadow-[0_0_18px_rgba(234,88,12,0.3)]',
                )}
                style={{ width: 44, height: 110, transform: 'translateZ(12px)' }}
              >
                <div
                  className="absolute inset-y-0 right-0 w-3 origin-left bg-black/25"
                  style={{ transform: 'rotateY(90deg) translateZ(22px)' }}
                />
                <div
                  className="absolute left-0 top-0 h-3 w-full origin-bottom bg-white/15"
                  style={{ transform: 'rotateX(90deg) translateZ(-1px)' }}
                />
              </div>
              <span
                className={cn(
                  'absolute -right-2 top-2 whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide',
                  immersive ? 'bg-orange-500/30 text-orange-200' : 'bg-orange-100 text-orange-800',
                )}
              >
                At risk
              </span>
            </div>

            {/* Secondary block */}
            <div
              className={cn(
                'absolute border bg-gradient-to-b',
                immersive ? 'from-slate-600/50 to-slate-900/70 border-slate-500/40' : 'from-slate-300/70 to-slate-400/50 border-slate-400/50',
              )}
              style={{
                width: 36,
                height: 72,
                transform: 'translateX(-88px) translateZ(8px)',
              }}
            />

            {/* Main tower */}
            <div
              className="relative [transform-style:preserve-3d]"
              style={{ width: towerWidth, height: towerHeight, transform: 'translateZ(0)' }}
            >
              {zones.map((zone, index) => {
                const segmentH = towerHeight / zones.length;
                const bottom = index * segmentH;
                const isSelected = zone.id === selectedId;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(zone.id);
                    }}
                    className={cn(
                      'absolute left-0 right-0 border bg-gradient-to-r transition-all',
                      zoneTone(zone.score, zone.danger, immersive),
                      isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-transparent',
                      zone.danger && 'animate-pulse',
                    )}
                    style={{
                      height: segmentH,
                      bottom,
                      transform: `translateZ(0)`,
                    }}
                  >
                    <div
                      className="absolute inset-y-0 right-0 w-[14px] origin-left bg-black/20"
                      style={{ transform: 'rotateY(90deg) translateZ(0)', width: Math.max(10, towerWidth * 0.18) }}
                    />
                    {zone.danger && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.8)]" />
                    )}
                  </button>
                );
              })}

              {/* Roof cap */}
              <div
                className={cn(
                  'absolute left-0 top-0 border',
                  immersive ? 'border-sky-400/40 bg-sky-500/25' : 'border-sky-400/50 bg-sky-300/40',
                )}
                style={{
                  width: towerWidth,
                  height: 10,
                  transform: `translateY(-10px) rotateX(90deg)`,
                  transformOrigin: 'bottom center',
                }}
              />
            </div>
          </div>
        </div>

        <p
          className={cn(
            'pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px]',
            immersive ? 'text-slate-500' : 'text-foreground',
          )}
        >
          Drag to rotate · click a zone to inspect
        </p>
      </div>

      <div className="shrink-0 border-t border-border/60 p-3 md:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className={cn('rounded-xl border px-3 py-2.5', panel)}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-primary">Sample 3D structure</p>
            <p className="mt-0.5 text-sm font-bold">{property.name}</p>
            <p className="mt-1 text-[11px]">
              {property.floors} floors · {property.type} · score {property.riskScore}
            </p>
          </div>

          {selected && (
            <div className={cn('min-w-[200px] flex-1 rounded-xl border px-3 py-2.5', panel)}>
              <p className="text-[9px] font-bold uppercase tracking-widest">
                {selected.danger ? (
                  <span className="text-red-600">Danger zone</span>
                ) : (
                  <span className="text-foreground">Zone</span>
                )}
              </p>
              <p className="mt-0.5 text-sm font-semibold">{selected.label}</p>
              <p className="text-[11px]">
                Floors {selected.floors} · risk score {selected.score}
              </p>
              <p className="mt-1 text-[11px]">{selected.riskNote}</p>
            </div>
          )}

          <div className={cn('rounded-xl border px-3 py-2.5 text-[10px]', panel)}>
            <p className="font-bold uppercase tracking-wider">Legend</p>
            <ul className="mt-1.5 space-y-1">
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-4 rounded-sm bg-red-500/70" /> High / danger
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-4 rounded-sm bg-amber-400/70" /> Elevated
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-4 rounded-sm bg-sky-400/60" /> Standard
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

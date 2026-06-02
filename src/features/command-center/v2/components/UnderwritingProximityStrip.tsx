import React from 'react';

import {
  Building2,
  Construction,
  Droplets,
  Flame,
  Hospital,
  Loader2,
  MapPinned,
  Plane,
  Radiation,
  Skull,
} from 'lucide-react';

import { cn } from '@/shared/utils/lib-utils';

import { RiskRoomChip } from './risk-room-chip';
import { rr } from '../risk-room-theme';

import {
  RISK_INFRASTRUCTURE_LAYERS,
  type RiskInfrastructureKey,
  type SpatialPoi,
} from '../api/spatialUnderwriting';
import { useSpatialUnderwritingPois } from '../hooks/useSpatialUnderwritingPois';
import { useRiskRoom } from '../RiskRoomContext';

function formatDistance(m?: number) {
  if (m == null) return '—';
  return `${Math.round(m)} m`;
}

function formatDistanceLong(m?: number) {
  if (m == null) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

const RISK_ICONS: Record<RiskInfrastructureKey, React.ComponentType<{ className?: string }>> = {
  industrial: Building2,
  construction: Construction,
  nuclear: Radiation,
  firezone: Flame,
  chemical: Skull,
  airport: Plane,
};

function ProximityCard({
  title,
  icon: Icon,
  items,
  metric,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SpatialPoi[];
  metric: 'drive' | 'distance';
}) {
  const nearest = items[0];

  return (
    <article className="flex w-[min(240px,78vw)] shrink-0 snap-start flex-col rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-foreground" />
        <p className="text-[11px] font-bold text-foreground">{title}</p>
        <span className="ml-auto text-[10px] tabular-nums text-foreground">{items.length} found</span>
      </div>

      {nearest ? (
        <>
          <div className="mt-2.5 rounded-lg border border-border bg-card px-2.5 py-2">
            <p className="truncate text-[11px] font-semibold text-foreground">{nearest.name}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {metric === 'drive' && nearest.driveMin != null ? (
                <>
                  <span className="text-lg font-bold tabular-nums text-foreground">{nearest.driveMin} min</span>
                  <span className="text-[10px] text-foreground">
                    drive · {nearest.driveKm ?? '—'} km · {formatDistanceLong(nearest.distanceM)} straight
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold tabular-nums text-foreground">{formatDistance(nearest.distanceM)}</span>
                  <span className="text-[10px] text-foreground">from property boundary</span>
                </>
              )}
            </div>
          </div>

          {items.length > 1 && (
            <ul className="mt-2 space-y-1 border-t border-border pt-2">
              {items.slice(1, 3).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="truncate text-foreground">{p.name}</span>
                  <span className="shrink-0 tabular-nums text-foreground">
                    {metric === 'drive' && p.driveMin != null
                      ? `${p.driveMin} min`
                      : formatDistanceLong(p.distanceM)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-3 text-[10px] text-foreground">None within search radius</p>
      )}
    </article>
  );
}

export function UnderwritingProximityStrip() {
  const { property, mapLayers } = useRiskRoom();

  const showFire = mapLayers.has('firestations');
  const showWater = mapLayers.has('water');
  const showHospitals = mapLayers.has('hospitals');
  const activeRiskLayers = RISK_INFRASTRUCTURE_LAYERS.filter((l) => mapLayers.has(l.id));
  const hasUwLayers = showFire || showWater || showHospitals || activeRiskLayers.length > 0;

  const { data, isLoading } = useSpatialUnderwritingPois(property.lat, property.lng, hasUwLayers);

  if (!hasUwLayers) return null;

  const nearestFire = data?.fireStations[0];
  const nearestWater = data?.waterBodies[0];

  return (
    <section className={cn('shrink-0', rr.panel)}>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5 md:px-4">
        <div className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-foreground" />
          <div>
            <p className="text-xs font-bold text-foreground">Underwriting proximity</p>
            <p className="text-[10px] text-foreground">
              Response time for services · distance in metres for hazards & risk infrastructure
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:ml-auto">
          {showFire && nearestFire?.driveMin != null && (
            <RiskRoomChip tone="red" size="md">
              Fire response {nearestFire.driveMin} min
            </RiskRoomChip>
          )}
          {showWater && nearestWater && (
            <RiskRoomChip tone="sky" size="md">
              Water {formatDistance(nearestWater.distanceM)} away
            </RiskRoomChip>
          )}
          {data?.source && !isLoading && (
            <RiskRoomChip tone="muted" size="md">
              {data.source}
            </RiskRoomChip>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 px-4 py-5 text-[11px] text-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-foreground" />
          Resolving OSM features & routes…
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto p-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] [scrollbar-color:rgba(99,102,241,0.25)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-indigo-400/30">
          {showFire && (
            <ProximityCard
              title="Fire stations"
              icon={Flame}
              items={data?.fireStations ?? []}
              metric="drive"
            />
          )}
          {showWater && (
            <ProximityCard
              title="Water bodies"
              icon={Droplets}
              items={data?.waterBodies ?? []}
              metric="distance"
            />
          )}
          {showHospitals && (
            <ProximityCard
              title="Hospitals"
              icon={Hospital}
              items={data?.hospitals ?? []}
              metric="drive"
            />
          )}
          {activeRiskLayers.map((layer) => {
            const Icon = RISK_ICONS[layer.id];
            const items = data?.riskInfrastructure[layer.id] ?? [];
            return (
              <ProximityCard
                key={layer.id}
                title={layer.label}
                icon={Icon}
                items={items}
                metric="distance"
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

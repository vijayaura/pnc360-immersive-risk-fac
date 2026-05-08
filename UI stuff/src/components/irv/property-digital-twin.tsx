import type { Property } from "@/data/mock-properties";
import { Building, Zap, Droplets, Flame, Shield, Wrench, Calendar, Users, Ruler } from "lucide-react";

interface PropertyDigitalTwinProps {
  property: Property;
}

export function PropertyDigitalTwin({ property }: PropertyDigitalTwinProps) {
  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Building className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Property Digital Twin</h2>
      </div>

      {/* Building Cross-Section */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Building Cross-Section</h3>
        <BuildingDiagram property={property} />
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailCard title="Structure" icon={Building}>
          <DetailRow label="Construction" value={property.constructionMaterial} />
          <DetailRow label="Building Type" value={property.type} />
          <DetailRow label="Floors" value={String(property.floors)} />
          <DetailRow label="Year Built" value={String(property.yearBuilt)} />
          <DetailRow label="Age" value={`${new Date().getFullYear() - property.yearBuilt} years`} />
        </DetailCard>

        <DetailCard title="Occupancy" icon={Users}>
          <DetailRow label="Usage" value={property.occupancy} />
          <DetailRow label="Capacity" value={`${property.occupancyCapacity} persons`} />
          <DetailRow label="Sum Insured" value={`AED ${(property.sumInsured / 1000000).toFixed(1)}M`} />
        </DetailCard>

        <DetailCard title="Fire Protection" icon={Flame}>
          <DetailRow label="Sprinklers" value={property.fireProtection.sprinklers ? "✅ Installed" : "❌ None"} />
          <DetailRow label="Alarms" value={property.fireProtection.alarms ? "✅ Active" : "❌ None"} />
          <DetailRow label="Extinguishers" value={property.fireProtection.extinguishers ? "✅ Available" : "❌ None"} />
          <DetailRow label="Hydrant Nearby" value={property.fireProtection.hydrantNearby ? "✅ Within 100m" : "❌ Not found"} />
        </DetailCard>

        <DetailCard title="Condition" icon={Wrench}>
          <DetailRow label="Electrical" value={property.electricalCondition} condition={property.electricalCondition} />
          <DetailRow label="Plumbing" value={property.plumbingCondition} condition={property.plumbingCondition} />
          <DetailRow label="Roof" value={property.roofCondition} condition={property.roofCondition} />
        </DetailCard>

        <DetailCard title="Environment" icon={Shield}>
          <DetailRow label="Flood Zone" value={property.floodZone ? "⚠️ Yes" : "✅ No"} />
          <DetailRow label="Near Coast" value={property.nearCoast ? "⚠️ Yes" : "✅ No"} />
          <DetailRow label="Near Industrial" value={property.nearIndustrial ? "⚠️ Yes" : "✅ No"} />
        </DetailCard>

        <DetailCard title="Location" icon={Ruler}>
          <DetailRow label="Address" value={property.address} />
          <DetailRow label="City" value={property.city} />
          <DetailRow label="Coordinates" value={`${property.lat.toFixed(4)}, ${property.lng.toFixed(4)}`} />
        </DetailCard>
      </div>
    </div>
  );
}

function BuildingDiagram({ property }: { property: Property }) {
  const floors = Math.min(property.floors, 10);
  const floorHeight = 40;
  const width = 240;
  const totalHeight = floors * floorHeight + 30;

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${width + 40} ${totalHeight + 20}`} className="w-full max-w-sm" style={{ maxHeight: 400 }}>
        {/* Building outline */}
        <rect x={20} y={10} width={width} height={floors * floorHeight} rx={4} fill="oklch(0.20 0.02 260)" stroke="oklch(0.35 0.03 260)" strokeWidth={2} />

        {/* Floors */}
        {Array.from({ length: floors }).map((_, i) => {
          const y = 10 + i * floorHeight;
          const isRoof = i === 0;
          const roofColor = property.roofCondition === "poor" ? "oklch(0.60 0.24 25)" : property.roofCondition === "fair" ? "oklch(0.75 0.18 75)" : "oklch(0.65 0.17 155)";

          return (
            <g key={i}>
              {/* Floor separator */}
              {i > 0 && <line x1={20} y1={y} x2={20 + width} y2={y} stroke="oklch(0.30 0.02 260)" strokeWidth={1} />}

              {/* Floor label */}
              <text x={width + 30} y={y + floorHeight / 2 + 4} fill="oklch(0.65 0.03 255)" fontSize={10} textAnchor="end">
                {isRoof ? "Roof" : `F${floors - i}`}
              </text>

              {/* Roof highlight */}
              {isRoof && (
                <rect x={21} y={11} width={width - 2} height={floorHeight - 2} rx={3} fill={roofColor} fillOpacity={0.2} />
              )}

              {/* Windows */}
              {Array.from({ length: 4 }).map((_, j) => (
                <rect
                  key={j}
                  x={40 + j * 55}
                  y={y + 10}
                  width={30}
                  height={20}
                  rx={2}
                  fill="oklch(0.62 0.19 250)"
                  fillOpacity={0.15}
                  stroke="oklch(0.62 0.19 250)"
                  strokeOpacity={0.3}
                  strokeWidth={1}
                />
              ))}

              {/* Fire protection indicator */}
              {property.fireProtection.sprinklers && (
                <circle cx={width + 5} cy={y + floorHeight / 2} r={3} fill="oklch(0.65 0.17 155)" />
              )}
            </g>
          );
        })}

        {/* Ground line */}
        <line x1={0} y1={10 + floors * floorHeight} x2={width + 40} y2={10 + floors * floorHeight} stroke="oklch(0.40 0.03 260)" strokeWidth={2} />

        {/* Legend */}
        {property.fireProtection.sprinklers && (
          <g>
            <circle cx={30} cy={totalHeight + 10} r={3} fill="oklch(0.65 0.17 155)" />
            <text x={38} y={totalHeight + 14} fill="oklch(0.65 0.03 255)" fontSize={9}>Sprinkler coverage</text>
          </g>
        )}
      </svg>
    </div>
  );
}

function DetailCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, condition }: { label: string; value: string; condition?: string }) {
  const conditionColor = condition === "good" ? "text-risk-low" : condition === "fair" ? "text-risk-medium" : condition === "poor" ? "text-risk-high" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium capitalize ${conditionColor}`}>{value}</span>
    </div>
  );
}

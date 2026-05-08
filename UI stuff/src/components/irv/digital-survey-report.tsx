import type { Property } from "@/data/mock-properties";
import { surveyHighlights, facilityZones, equipmentMarkers } from "@/data/viva-survey-data";
import { alFattanSurveyHighlights, alFattanFacilityZones, alFattanEquipmentMarkers } from "@/data/al-fattan-survey-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import {
  Building2, MapPin, Shield, Flame, Thermometer, AlertTriangle,
  ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock,
  Users, Zap, Droplets, Wind, Activity, Eye, FileText,
} from "lucide-react";

interface DigitalSurveyReportProps {
  property: Property;
}

/* ─── Generic section data derived from the viva-survey-data ─── */

interface SurveySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

/* ─── Small reusable pieces ─── */

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" }) {
  const styles: Record<string, string> = {
    default: "bg-primary/15 text-primary border-primary/25",
    success: "bg-status-approved/15 text-status-approved border-status-approved/25",
    warning: "bg-status-pending/15 text-status-pending border-status-pending/25",
    danger: "bg-status-rejected/15 text-status-rejected border-status-rejected/25",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${styles[variant]}`}>{children}</span>;
}

function KVRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right max-w-[55%]">{String(value)}</span>
    </div>
  );
}

function StatCard({ label, value, icon, color = "primary" }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className={`h-7 w-7 rounded-lg bg-${color}/10 flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-bold text-foreground">{String(value)}</span>
    </div>
  );
}

function RiskLevelIndicator({ level }: { level: "low" | "medium" | "high" }) {
  const c = level === "high" ? "bg-status-rejected" : level === "medium" ? "bg-status-pending" : "bg-status-approved";
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full ${c}`} />
      <span className="text-[10px] capitalize font-medium">{level}</span>
    </div>
  );
}

function ConditionDot({ condition }: { condition: "good" | "fair" | "poor" }) {
  const icon = condition === "good" ? <CheckCircle2 className="h-3 w-3 text-status-approved" /> : condition === "fair" ? <Clock className="h-3 w-3 text-status-pending" /> : <XCircle className="h-3 w-3 text-status-rejected" />;
  return <div className="flex items-center gap-1">{icon}<span className="text-[10px] capitalize">{condition}</span></div>;
}

/* ─── Zone card for facility layout section ─── */

function ZoneCard({ zone }: { zone: typeof facilityZones[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-accent/30 transition-colors cursor-pointer">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: zone.color }}>
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{zone.name}</p>
            <p className="text-[10px] text-muted-foreground">{zone.dimensions || zone.type}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RiskLevelIndicator level={zone.riskLevel} />
            <ConditionDot condition={zone.condition} />
            {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-11 mt-1 rounded-xl border border-border bg-card/50 p-3 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{zone.description}</p>
          {/* Details */}
          <div>
            <p className="text-[10px] font-semibold text-foreground mb-1.5 uppercase tracking-wider">Details</p>
            {Object.entries(zone.details).map(([k, v]) => <KVRow key={k} label={k} value={v} />)}
          </div>
          {/* Hazards */}
          {zone.hazards.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-status-pending" />Hazards</p>
              <div className="flex flex-wrap gap-1">
                {zone.hazards.map((h) => <Badge key={h} variant="warning">{h}</Badge>)}
              </div>
            </div>
          )}
          {/* Protection */}
          {zone.protectionSystems.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1"><Shield className="h-3 w-3 text-status-approved" />Protection Systems</p>
              <div className="flex flex-wrap gap-1">
                {zone.protectionSystems.map((p) => <Badge key={p} variant="success">{p}</Badge>)}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ─── Natural hazard gauge ─── */

function NaturalHazardBar({ label, level }: { label: string; level: string }) {
  const pct = level === "Low" ? 15 : level === "Medium" ? 55 : 85;
  const color = level === "Low" ? "bg-status-approved" : level === "Medium" ? "bg-status-pending" : "bg-status-rejected";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold w-14 text-right capitalize">{level}</span>
    </div>
  );
}

/* ─── Equipment summary table ─── */

function EquipmentSummary() {
  const typeCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = { operational: 0, maintenance: 0, "needs-attention": 0 };
  equipmentMarkers.forEach((e) => {
    const label = e.type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    typeCounts[label] = (typeCounts[label] || 0) + 1;
    statusCounts[e.status]++;
  });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-card p-2 text-center">
          <p className="text-lg font-bold text-foreground">{equipmentMarkers.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Items</p>
        </div>
        <div className="rounded-lg border border-status-approved/30 bg-status-approved/5 p-2 text-center">
          <p className="text-lg font-bold text-status-approved">{statusCounts.operational}</p>
          <p className="text-[10px] text-muted-foreground">Operational</p>
        </div>
        <div className="rounded-lg border border-status-pending/30 bg-status-pending/5 p-2 text-center">
          <p className="text-lg font-bold text-status-pending">{statusCounts.maintenance + statusCounts["needs-attention"]}</p>
          <p className="text-[10px] text-muted-foreground">Needs Review</p>
        </div>
      </div>
      <div className="space-y-1">
        {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
          <div key={type} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
            <span className="text-xs text-muted-foreground">{type}</span>
            <span className="text-xs font-semibold text-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export function DigitalSurveyReport({ property }: DigitalSurveyReportProps) {
  const isViva = property.id === "prop-007";
  const isAlFattan = property.id === "prop-008";
  const survey = isViva ? surveyHighlights : null;
  const afSurvey = isAlFattan ? alFattanSurveyHighlights : null;

  const sections: SurveySection[] = isViva
    ? buildVivaSections(property)
    : isAlFattan
    ? buildAlFattanSections(property)
    : buildGenericSections(property);

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(sections.map((s) => s.id)));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Report Header */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-accent/20 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Digital Survey Report</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{property.name}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                {afSurvey?.location || survey?.location || `${property.address}, ${property.city}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              {survey && (
                <>
                  <p className="text-[10px] text-muted-foreground">Report ID</p>
                  <p className="text-xs font-mono font-medium text-foreground">SRV-2025-1294</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Survey Date</p>
                  <p className="text-xs font-medium text-foreground">{survey.surveyDate}</p>
                </>
              )}
              {afSurvey && (
                <>
                  <p className="text-[10px] text-muted-foreground">File Number</p>
                  <p className="text-xs font-mono font-medium text-foreground">{afSurvey.surveyFileNumber}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Survey Date</p>
                  <p className="text-xs font-medium text-foreground">{afSurvey.surveyDate}</p>
                </>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard label="Sum Insured" value={`AED ${((afSurvey?.totalSumInsured || survey?.totalSumInsured || property.sumInsured) / 1_000_000).toFixed(0)}M`} icon={<Activity className="h-3.5 w-3.5 text-primary" />} />
            <StatCard label="Area" value={afSurvey ? `${afSurvey.tower2.floors}` : survey?.warehouseArea || `${property.floors} floors`} icon={<Building2 className="h-3.5 w-3.5 text-primary" />} />
            <StatCard label="Construction" value={afSurvey?.constructionType || survey?.constructionType || property.constructionMaterial} icon={<Shield className="h-3.5 w-3.5 text-primary" />} />
            <StatCard label="Risk Score" value={`${property.riskScore}/100`} icon={<AlertTriangle className="h-3.5 w-3.5 text-primary" />} />
          </div>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <Collapsible key={section.id} open={openSections.has(section.id)} onOpenChange={() => toggleSection(section.id)}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer">
                {section.icon}
                <span className="text-sm font-semibold text-foreground flex-1 text-left">{section.title}</span>
                {openSections.has(section.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 rounded-xl border border-border bg-card p-4">
                {section.content}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </ScrollArea>
  );
}

/* ─── Viva-specific sections from real survey data ─── */

function buildVivaSections(_property: Property): SurveySection[] {
  const s = surveyHighlights;
  return [
    {
      id: "overview",
      title: "1. Survey Overview & Insured Details",
      icon: <Eye className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Insured Information</p>
              <KVRow label="Insured" value={s.insured} />
              <KVRow label="Parent Group" value={s.parentGroup} />
              <KVRow label="Facility Manager" value={s.facilityManager} />
              <KVRow label="Contact Person" value={s.contactPerson} />
              <KVRow label="Surveyor" value={s.surveyor} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Site Summary</p>
              <KVRow label="Location" value={s.location} />
              <KVRow label="Total Sum Insured" value={`AED ${(s.totalSumInsured / 1_000_000).toFixed(0)}M`} />
              <KVRow label="Warehouse Area" value={s.warehouseArea} />
              <KVRow label="Roof Height" value={s.roofHeight} />
              <KVRow label="Max Rack Height" value={s.maxRackHeight} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "construction",
      title: "2. Construction & Building Details",
      icon: <Building2 className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-3">
          <KVRow label="Construction Type" value={s.constructionType} />
          <KVRow label="Roof Material" value={s.roofMaterial} />
          <KVRow label="Loading Bays" value={s.totalLoadingBays} />
          <KVRow label="Emergency Exits" value={s.totalEmergencyExits} />
          <KVRow label="Smoke Vents" value={s.totalSmokeVents} />
          <KVRow label="Adjacent Exposure" value={s.adjacentExposure} />
          <div className="mt-2 p-3 rounded-lg bg-accent/30 border border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Surveyor Notes</p>
            <p className="text-xs text-foreground leading-relaxed">
              Single-storey warehouse with Kirby-type light non-combustible structure. Roof consists of Kingspan sandwich panels with 80mm PIR insulation (DCL certified). The facility floor level sits 1.35m above road level. Office block (G+2) is attached to the west side, connected to a security tower via a 65m enclosed overhead footbridge.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "facility-zones",
      title: "3. Facility Zones & Layout",
      icon: <MapPin className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Interactive breakdown of all {facilityZones.length} identified zones within the facility.</p>
          {facilityZones.map((zone) => <ZoneCard key={zone.id} zone={zone} />)}
        </div>
      ),
    },
    {
      id: "fire-protection",
      title: "4. Fire Protection & Safety Systems",
      icon: <Flame className="h-4 w-4 text-status-rejected" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard label="ESFR Sprinklers" value="K11.2 + K8.0" icon={<Droplets className="h-3.5 w-3.5 text-primary" />} />
            <StatCard label="In-Rack Sprinklers" value="K5.6" icon={<Droplets className="h-3.5 w-3.5 text-primary" />} />
            <StatCard label="Fire Pump" value="2,500 GPM" icon={<Zap className="h-3.5 w-3.5 text-primary" />} />
            <StatCard label="Water Reserve" value="300K gal" icon={<Droplets className="h-3.5 w-3.5 text-primary" />} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Systems</p>
            <KVRow label="Fire Alarm Control Panel" value="Connected to Civil Defense (10 min response)" />
            <KVRow label="Cold Storage Protection" value="Pre-action sprinkler system (prevents false discharge)" />
            <KVRow label="LV/Generator Room" value="Foam System + FM200" />
            <KVRow label="Fire Drills" value={s.fireDrillFrequency} />
            <KVRow label="Trained Firefighters" value={s.totalTrainedFirefighters} />
          </div>
          <EquipmentSummary />
        </div>
      ),
    },
    {
      id: "security",
      title: "5. Security & Access Control",
      icon: <Shield className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-2">
          <KVRow label="Security Personnel" value={s.securityPersonnel} />
          <KVRow label="Access Control" value="Security tower checkpoint — all visitors screened" />
          <KVRow label="CCTV" value="Full facility coverage with central monitoring station" />
          <KVRow label="Civil Defense Response" value={s.civilDefenseResponse} />
          <div className="mt-2 p-3 rounded-lg bg-accent/30 border border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Observation</p>
            <p className="text-xs text-foreground leading-relaxed">
              Access is controlled through a dedicated security tower with 24/7 personnel (5 day-shift, 5 night-shift). The tower connects to the office block via a 65m enclosed overhead footbridge. CCTV feeds are monitored centrally from the BMS control room within the office block.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "natural-hazards",
      title: "6. Natural Hazard Exposure",
      icon: <Wind className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-3">
          {Object.entries(s.naturalHazards).map(([key, level]) => (
            <NaturalHazardBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} level={level} />
          ))}
          <div className="mt-2 p-3 rounded-lg bg-status-approved/5 border border-status-approved/20">
            <p className="text-xs text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-status-approved shrink-0" />
              All natural hazard exposures rated <strong>Low</strong> for this location (Jebel Ali Free Zone South).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "recommendations",
      title: "7. Survey Recommendations & Key Concerns",
      icon: <AlertTriangle className="h-4 w-4 text-status-pending" />,
      content: (
        <div className="space-y-3">
          {[
            { severity: "high" as const, title: "Shared Fire Pump — Single Point of Failure", desc: "The fire pump set (2,500 GPM) is shared with the adjacent Landmark Group warehouse. A failure or simultaneous demand could compromise fire suppression for both facilities." },
            { severity: "medium" as const, title: "PIR Insulated Roof Panels", desc: "Kingspan sandwich panels with 80mm PIR core. While DCL certified, PIR can contribute to fire spread if the outer skin is breached. Monitor for panel integrity." },
            { severity: "medium" as const, title: "Forklift Battery Charging Zone", desc: "Dedicated charging area for electric forklifts identified as an ignition hazard zone. Ensure adequate ventilation and separation from combustible stock." },
            { severity: "low" as const, title: "Adjacent Exposure — 25m Gap", desc: "Landmark Group warehouse is 25m away. While the gap meets minimum separation requirements, radiant heat exposure could be a concern in a large-scale fire." },
          ].map((rec) => (
            <div key={rec.title} className="flex gap-3 p-3 rounded-lg border border-border bg-card/50">
              <Badge variant={rec.severity === "high" ? "danger" : rec.severity === "medium" ? "warning" : "default"}>
                {rec.severity.toUpperCase()}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{rec.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rec.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "housekeeping",
      title: "8. Housekeeping & Management",
      icon: <Users className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-2">
          <KVRow label="Overall Housekeeping" value="Good" />
          <KVRow label="Stock Demarcations" value="In place" />
          <KVRow label="Congestion" value="None observed" />
          <KVRow label="Floor Condition" value="Good — 1.35m above road level" />
          <KVRow label="Emergency Exits" value={`${s.totalEmergencyExits} exits — all marked with illuminated signage`} />
          <KVRow label="Fire Drill Frequency" value={s.fireDrillFrequency} />
          <KVRow label="Trained Firefighters" value={`${s.totalTrainedFirefighters} personnel`} />
        </div>
      ),
    },
  ];
}

/* ─── Generic fallback for non-Viva properties ─── */

function buildGenericSections(property: Property): SurveySection[] {
  return [
    {
      id: "overview",
      title: "1. Property Overview",
      icon: <Eye className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-2">
          <KVRow label="Property Name" value={property.name} />
          <KVRow label="Address" value={`${property.address}, ${property.city}`} />
          <KVRow label="Type" value={property.type} />
          <KVRow label="Construction" value={property.constructionMaterial} />
          <KVRow label="Year Built" value={property.yearBuilt} />
          <KVRow label="Floors" value={property.floors} />
          <KVRow label="Occupancy" value={property.occupancy} />
          <KVRow label="Occupancy Capacity" value={property.occupancyCapacity} />
          <KVRow label="Sum Insured" value={`AED ${(property.sumInsured / 1_000_000).toFixed(1)}M`} />
        </div>
      ),
    },
    {
      id: "condition",
      title: "2. Condition Assessment",
      icon: <Thermometer className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {(["electricalCondition", "plumbingCondition", "roofCondition"] as const).map((key) => (
              <div key={key} className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-[10px] text-muted-foreground capitalize mb-1">{key.replace("Condition", "")}</p>
                <ConditionDot condition={property[key]} />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "fire-protection",
      title: "3. Fire Protection",
      icon: <Flame className="h-4 w-4 text-status-rejected" />,
      content: (
        <div className="space-y-2">
          {Object.entries(property.fireProtection).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
              <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
              {val ? <CheckCircle2 className="h-4 w-4 text-status-approved" /> : <XCircle className="h-4 w-4 text-status-rejected" />}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "exposure",
      title: "4. Exposure Analysis",
      icon: <AlertTriangle className="h-4 w-4 text-status-pending" />,
      content: (
        <div className="space-y-2">
          <KVRow label="Flood Zone" value={property.floodZone ? "Yes" : "No"} />
          <KVRow label="Near Coast" value={property.nearCoast ? "Yes" : "No"} />
          <KVRow label="Near Industrial Area" value={property.nearIndustrial ? "Yes" : "No"} />
        </div>
      ),
    },
  ];
}

/* ─── Al Fattan Currency House sections from real AIG survey + PAR slip ─── */

function buildAlFattanSections(_property: Property): SurveySection[] {
  const s = alFattanSurveyHighlights;
  return [
    {
      id: "overview",
      title: "1. Survey Overview & Insured Details",
      icon: <Eye className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Insured Information</p>
              <KVRow label="Insured" value={s.insured} />
              <KVRow label="Insurer" value={s.insurer} />
              <KVRow label="Class of Insurance" value={s.classOfInsurance} />
              <KVRow label="Form" value={s.form} />
              <KVRow label="Period" value={s.periodOfInsurance} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Survey Details</p>
              <KVRow label="File Number" value={s.surveyFileNumber} />
              <KVRow label="Survey Date" value={s.surveyDate} />
              <KVRow label="Risk Engineer" value={s.surveyor} />
              <KVRow label="Underwriter" value={s.underwriter} />
              <KVRow label="Facility Manager" value={s.facilityManager} />
              <KVRow label="Location" value={s.location} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "construction",
      title: "2. Building Details — Twin Towers",
      icon: <Building2 className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-semibold text-foreground mb-2">Tower 2 (Main)</p>
              <KVRow label="Height" value={s.tower2.height} />
              <KVRow label="Floors" value={s.tower2.floors} />
              <KVRow label="Construction" value="Reinforced Concrete" />
              <KVRow label="Façade" value={s.façadeComposition} />
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-semibold text-foreground mb-2">Tower 1</p>
              <KVRow label="Height" value={s.tower1.height} />
              <KVRow label="Floors" value={s.tower1.floors} />
              <KVRow label="Construction" value="Reinforced Concrete" />
              <KVRow label="Separation" value="~20m above podium level" />
            </div>
          </div>
          <KVRow label="Year Built" value={s.yearBuilt} />
          <KVRow label="Shared Structure" value="4 common basement levels + 3 podium levels" />
          <KVRow label="Pavilion" value="4B + G + 2 — Retail & Commercial" />
          <KVRow label="Fire Protection Coverage" value={s.fireProtectionCoverage} />
          <div className="mt-2 p-3 rounded-lg bg-status-pending/5 border border-status-pending/20">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-status-pending" />ACP Cladding Concern</p>
            <p className="text-xs text-foreground leading-relaxed">
              Both towers have 40% non-fire rated ACP cladding + 60% double glazed glass. Site contact mentioned rockwool insulation but documentation could not be confirmed. AIG flagged this as a critical risk improvement (19-04-03). Combustible insulation in metal panels aids fire propagation.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "sum-insured",
      title: "3. Sum Insured Breakdown",
      icon: <Activity className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-3">
          {Object.entries(s.sumInsuredBreakdown).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
            return <KVRow key={key} label={label} value={`AED ${(value / 1_000_000).toFixed(1)}M`} />;
          })}
          <div className="border-t-2 border-primary/30 pt-2">
            <KVRow label="Total Sum Insured" value={`AED ${(s.totalSumInsured / 1_000_000).toFixed(0)}M`} />
          </div>
          {/* Visual breakdown bar */}
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Premium Allocation by Value</p>
            <div className="flex h-6 rounded-lg overflow-hidden">
              <div className="bg-primary/60" style={{ width: `${(1_500_000_000 / s.totalSumInsured) * 100}%` }} title="Building" />
              <div className="bg-status-pending/60" style={{ width: `${(450_000_000 / s.totalSumInsured) * 100}%` }} title="Loss of Rent" />
              <div className="bg-status-approved/60" style={{ width: `${(150_000_000 / s.totalSumInsured) * 100}%` }} title="Alt Accommodation" />
              <div className="bg-accent" style={{ width: `${(8_200_000 / s.totalSumInsured) * 100}%` }} title="Other" />
            </div>
            <div className="flex gap-3 mt-1.5 flex-wrap">
              <span className="text-[9px] flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary/60" />Building (71%)</span>
              <span className="text-[9px] flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-status-pending/60" />Loss of Rent (21%)</span>
              <span className="text-[9px] flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-status-approved/60" />Alt Accommodation (7%)</span>
              <span className="text-[9px] flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-accent" />Other (1%)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "facility-zones",
      title: "4. Facility Zones & Layout",
      icon: <MapPin className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Interactive breakdown of all {alFattanFacilityZones.length} identified zones: twin towers, podium, pavilion, basements, and utility areas.</p>
          {alFattanFacilityZones.map((zone) => <ZoneCard key={zone.id} zone={zone} />)}
        </div>
      ),
    },
    {
      id: "fire-protection",
      title: "5. Fire Protection & Safety Systems",
      icon: <Flame className="h-4 w-4 text-status-rejected" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard label="Coverage" value="~95%" icon={<Shield className="h-3.5 w-3.5 text-primary" />} />
            <StatCard label="Sprinkler Type" value="Wet Pipe" icon={<Droplets className="h-3.5 w-3.5 text-primary" />} />
            <StatCard label="EDG Protection" value="Foam Deluge" icon={<Flame className="h-3.5 w-3.5 text-primary" />} />
            <StatCard label="LPG Protection" value="Water Deluge" icon={<Droplets className="h-3.5 w-3.5 text-primary" />} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Systems</p>
            <KVRow label="Sprinkler System" value="Wet-pipe throughout both towers, podium, pavilion, basements" />
            <KVRow label="Fire Alarm" value="Centralized FACP connected to Dubai Civil Defence" />
            <KVRow label="EDG Room" value="Automatic foam deluge fire suppression" />
            <KVRow label="LPG Tanks" value="Automatic water deluge on podium roof" />
            <KVRow label="Stairwells" value="Pressurized emergency stairwells" />
            <KVRow label="Fire Fighting Elevator" value="Dedicated shaft in Tower 2" />
          </div>
          {/* Equipment summary */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Equipment Inventory</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border bg-card p-2 text-center">
                <p className="text-lg font-bold text-foreground">{alFattanEquipmentMarkers.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Items</p>
              </div>
              <div className="rounded-lg border border-status-approved/30 bg-status-approved/5 p-2 text-center">
                <p className="text-lg font-bold text-status-approved">{alFattanEquipmentMarkers.filter(e => e.status === "operational").length}</p>
                <p className="text-[10px] text-muted-foreground">Operational</p>
              </div>
              <div className="rounded-lg border border-status-pending/30 bg-status-pending/5 p-2 text-center">
                <p className="text-lg font-bold text-status-pending">{alFattanEquipmentMarkers.filter(e => e.status === "needs-attention").length}</p>
                <p className="text-[10px] text-muted-foreground">Needs Attention</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "risk-improvements",
      title: "6. AIG Risk Improvements",
      icon: <AlertTriangle className="h-4 w-4 text-status-pending" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground mb-2">{s.riskImprovements.length} risk improvements identified by AIG during the April 2019 survey. {s.riskImprovements.filter(r => r.category.includes("Physical")).length} physical protection, {s.riskImprovements.filter(r => r.category.includes("Human")).length} human element.</p>
          {s.riskImprovements.map((rec) => (
            <div key={rec.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card/50">
              <div className="shrink-0 flex flex-col items-center gap-1">
                <Badge variant={rec.severity === "high" ? "danger" : rec.severity === "medium" ? "warning" : "default"}>
                  {rec.severity.toUpperCase()}
                </Badge>
                <span className="text-[9px] font-mono text-muted-foreground">{rec.id}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{rec.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 italic">{rec.category}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.description}</p>
                <p className="text-[10px] text-foreground mt-1.5"><strong>Client Response:</strong> {rec.response}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "natural-hazards",
      title: "7. Natural Hazard Exposure",
      icon: <Wind className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-3">
          {Object.entries(s.naturalHazards).map(([key, level]) => (
            <NaturalHazardBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} level={level} />
          ))}
          <div className="mt-2 p-3 rounded-lg bg-status-pending/5 border border-status-pending/20">
            <p className="text-xs text-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-status-pending shrink-0" />
              Facility is in <strong>Earthquake MR Zone 2</strong> — moderate seismic risk. Seismic protection improvements recommended for LPG tanks, gas lines, and sprinkler system bracing.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "policy-summary",
      title: "8. Policy Terms Summary",
      icon: <FileText className="h-4 w-4 text-primary" />,
      content: (
        <div className="space-y-3">
          <KVRow label="Territory" value="United Arab Emirates" />
          <KVRow label="Jurisdiction" value="United Arab Emirates" />
          <KVRow label="Machinery Breakdown" value="AED 2,000,000 (First Loss Basis)" />
          <KVRow label="Loss of Rent" value="AED 250,000,000 any one occurrence" />
          <KVRow label="Loss of Attraction (Leased)" value="AED 50,000,000" />
          <KVRow label="Loss of Attraction (Unleased)" value="AED 50,000,000" />
          <KVRow label="Alternative Accommodation" value="AED 150,000,000" />
          <KVRow label="Public Authorities" value="AED 50,000,000" />
          <KVRow label="Demolition" value="AED 20,000,000" />
          <KVRow label="Minor Works" value="AED 2,000,000" />
          <KVRow label="Capital Additions" value="20% of SI (30 days notice)" />
          <KVRow label="Errors & Omissions" value="AED 50,000,000" />
          <KVRow label="Reinstatement Value" value="85% Condition of Average" />
          <KVRow label="Loss Adjusters" value="Miller International / Crawford" />
          <KVRow label="Cover Whilst Unoccupied" value="90 Days" />
          <KVRow label="Cancellation Notice" value="30 days (pro-rata both sides)" />
        </div>
      ),
    },
  ];
}

// Generates 3D facility zones and equipment markers from any Property
// Uses property metadata (type, floors, fire protection, occupancy, AI insights, etc.)
// to create a meaningful 3D model with risk hotspots

import type { Property } from "@/data/mock-properties";
import type { FacilityZone, EquipmentMarker } from "@/data/viva-survey-data";

// ─── Building type templates ─────────────────────────────

interface BuildingTemplate {
  zones: (p: Property) => FacilityZone[];
  equipment: (p: Property) => EquipmentMarker[];
}

const floorHeight = (floors: number) => Math.min(floors * 0.015, 0.8);
const age = (p: Property) => new Date().getFullYear() - p.yearBuilt;
const condRisk = (c: string): "low" | "medium" | "high" => c === "good" ? "low" : c === "fair" ? "medium" : "high";

function hasHighInsight(p: Property, cat: string): boolean {
  return p.aiInsights.some(i => i.category === cat && i.severity === "high");
}

// ─── High-Rise (office/residential with many floors) ─────

function highRiseZones(p: Property): FacilityZone[] {
  const h = floorHeight(p.floors);
  const zones: FacilityZone[] = [
    {
      id: `${p.id}-main`, name: `Main Tower — ${p.floors} Floors`, type: "office",
      description: `${p.constructionMaterial} high-rise. ${p.occupancy}. Built ${p.yearBuilt}.`,
      dimensions: `${p.floors} floors | Capacity: ${p.occupancyCapacity.toLocaleString()}`,
      position: { x: 0.3, y: 0, z: 0.3 }, size: { w: 0.25, h, d: 0.25 },
      color: "oklch(0.50 0.14 220)",
      details: {
        "Floors": String(p.floors), "Construction": p.constructionMaterial,
        "Year Built": String(p.yearBuilt), "Age": `${age(p)} years`,
        "Occupancy": p.occupancy, "Capacity": p.occupancyCapacity.toLocaleString(),
        "Sum Insured": `AED ${(p.sumInsured / 1e6).toFixed(0)}M`,
      },
      hazards: [
        ...(p.floors > 50 ? ["Extreme high-rise — extended evacuation time"] : []),
        ...(age(p) > 30 ? ["Aged infrastructure — degradation risk"] : []),
        ...(hasHighInsight(p, "structural") ? ["Structural concern flagged by AI"] : []),
        ...(hasHighInsight(p, "fire") ? ["Fire risk flagged by AI"] : []),
      ],
      protectionSystems: [
        ...(p.fireProtection.sprinklers ? ["Sprinkler System"] : []),
        ...(p.fireProtection.alarms ? ["Fire Alarm System"] : []),
        ...(p.fireProtection.extinguishers ? ["Fire Extinguishers"] : []),
        ...(p.floors > 25 ? ["Refuge Floors"] : []),
      ],
      condition: p.roofCondition, riskLevel: p.riskScore > 60 ? "high" : p.riskScore > 35 ? "medium" : "low",
    },
    {
      id: `${p.id}-podium`, name: "Podium / Ground Level", type: "office",
      description: "Ground-level entrance, lobby, retail, and service areas.",
      position: { x: 0.2, y: 0, z: 0.2 }, size: { w: 0.45, h: 0.08, d: 0.45 },
      color: "oklch(0.45 0.10 200)",
      details: { "Level": "Ground + Mezzanine", "Access": "Main entrance and service bays" },
      hazards: ["High foot traffic", "Vehicle access point"],
      protectionSystems: ["Sprinklers", "CCTV", "Access Control"],
      condition: "good", riskLevel: "low",
    },
    {
      id: `${p.id}-mep`, name: "MEP / Plant Rooms", type: "utility",
      description: "Mechanical, electrical, and plumbing plant rooms. Chillers, generators, switchgear.",
      position: { x: 0.7, y: 0, z: 0.7 }, size: { w: 0.12, h: 0.12, d: 0.12 },
      color: "oklch(0.50 0.15 50)",
      details: {
        "Electrical": p.electricalCondition, "Plumbing": p.plumbingCondition,
        "Generator": "Backup diesel generators",
      },
      hazards: ["Electrical fire risk", "Diesel fuel storage", ...(p.electricalCondition !== "good" ? ["Electrical condition: " + p.electricalCondition] : [])],
      protectionSystems: ["FM200 / Gas Suppression", "Fire Detection", "Emergency Power"],
      condition: p.electricalCondition as "good" | "fair" | "poor",
      riskLevel: condRisk(p.electricalCondition),
    },
  ];

  // Parking
  zones.push({
    id: `${p.id}-parking`, name: "Basement Parking", type: "loading",
    description: "Multi-level underground parking structure.",
    position: { x: 0.2, y: -0.05, z: 0.2 }, size: { w: 0.45, h: 0.05, d: 0.45 },
    color: "oklch(0.35 0.05 240)",
    details: { "Levels": "Multiple basement levels", "Ventilation": "Mechanical" },
    hazards: ["Vehicle fire risk", "CO accumulation", "Evacuation bottleneck"],
    protectionSystems: ["Sprinklers", "CO Detection", "Smoke Extraction"],
    condition: "good", riskLevel: "medium",
  });

  return zones;
}

// ─── Industrial / Smelter ────────────────────────────────

function industrialZones(p: Property): FacilityZone[] {
  return [
    {
      id: `${p.id}-main`, name: "Main Production Hall", type: "warehouse",
      description: `Primary industrial facility. ${p.occupancy}. ${p.constructionMaterial} construction.`,
      dimensions: `Single storey | Capacity: ${p.occupancyCapacity.toLocaleString()}`,
      position: { x: 0.1, y: 0, z: 0.15 }, size: { w: 0.55, h: 0.2, d: 0.5 },
      color: "oklch(0.45 0.12 30)",
      details: {
        "Construction": p.constructionMaterial, "Year Built": String(p.yearBuilt),
        "Age": `${age(p)} years`, "Occupancy": p.occupancy,
        "Sum Insured": `AED ${(p.sumInsured / 1e6).toFixed(0)}M`,
      },
      hazards: [
        ...(age(p) > 30 ? [`${age(p)}-year-old facility — structural degradation`] : []),
        ...(p.nearIndustrial ? ["Industrial zone — explosion/contamination exposure"] : []),
        ...(hasHighInsight(p, "fire") ? ["Critical fire risk — AI flagged"] : []),
        ...p.aiInsights.filter(i => i.severity === "high").slice(0, 2).map(i => i.text.slice(0, 80)),
      ],
      protectionSystems: [
        ...(p.fireProtection.sprinklers ? ["Sprinkler / Foam System"] : ["⚠ No sprinklers"]),
        ...(p.fireProtection.alarms ? ["Fire Detection & Alarm"] : []),
        ...(p.fireProtection.extinguishers ? ["Fire Extinguishers"] : []),
      ],
      condition: p.roofCondition, riskLevel: p.riskScore > 60 ? "high" : "medium",
    },
    {
      id: `${p.id}-admin`, name: "Admin / Control Building", type: "office",
      description: "Administrative offices and process control room.",
      position: { x: 0.7, y: 0, z: 0.2 }, size: { w: 0.15, h: 0.15, d: 0.15 },
      color: "oklch(0.50 0.10 180)",
      details: { "Function": "Admin & Control", "Floors": "2-3 storeys" },
      hazards: ["Business interruption hub"],
      protectionSystems: ["Sprinklers", "Fire Alarm", "CCTV"],
      condition: "good", riskLevel: "low",
    },
    {
      id: `${p.id}-storage`, name: "Raw Material Storage", type: "warehouse",
      description: "Storage area for raw materials and finished goods.",
      position: { x: 0.1, y: 0, z: 0.7 }, size: { w: 0.35, h: 0.12, d: 0.2 },
      color: "oklch(0.48 0.14 60)",
      details: { "Type": "Open and covered storage" },
      hazards: ["Combustible materials", "Contamination risk"],
      protectionSystems: p.fireProtection.hydrantNearby ? ["Yard Hydrants", "Extinguishers"] : ["Extinguishers only"],
      condition: p.roofCondition, riskLevel: "medium",
    },
    {
      id: `${p.id}-utility`, name: "Power Plant / Utilities", type: "utility",
      description: "Power generation, transformers, and utility services.",
      position: { x: 0.7, y: 0, z: 0.65 }, size: { w: 0.15, h: 0.1, d: 0.2 },
      color: "oklch(0.50 0.18 50)",
      details: { "Electrical": p.electricalCondition, "Power": "On-site generation" },
      hazards: ["Electrical fire", "Transformer explosion", "Fuel storage"],
      protectionSystems: ["Fire Detection", "Gas Suppression", "Emergency Shutdown"],
      condition: p.electricalCondition as "good" | "fair" | "poor",
      riskLevel: condRisk(p.electricalCondition),
    },
    ...(p.nearCoast ? [{
      id: `${p.id}-coastal`, name: "Coastal Exposure Zone", type: "external" as const,
      description: "Area exposed to salt spray, storm surge, and coastal hazards.",
      position: { x: 0.0, y: 0, z: 0.0 }, size: { w: 1.0, h: 0.02, d: 0.08 },
      color: "oklch(0.55 0.20 230)",
      details: { "Hazard": "Salt corrosion, storm surge" },
      hazards: ["Salt spray corrosion on steel", "Storm surge flooding"],
      protectionSystems: ["Corrosion protection coatings"],
      condition: "fair" as const, riskLevel: "high" as const,
    }] : []),
  ];
}

// ─── Retail / Mall ───────────────────────────────────────

function retailZones(p: Property): FacilityZone[] {
  return [
    {
      id: `${p.id}-main`, name: "Main Retail Concourse", type: "office",
      description: `${p.occupancy}. Multi-level retail space with ${p.occupancyCapacity.toLocaleString()} daily capacity.`,
      dimensions: `${p.floors} levels | ${p.occupancyCapacity.toLocaleString()} capacity`,
      position: { x: 0.1, y: 0, z: 0.1 }, size: { w: 0.65, h: 0.15, d: 0.65 },
      color: "oklch(0.52 0.13 280)",
      details: {
        "Levels": String(p.floors), "Construction": p.constructionMaterial,
        "Daily Visitors": p.occupancyCapacity.toLocaleString(),
        "Sum Insured": `AED ${(p.sumInsured / 1e6).toFixed(0)}M`,
      },
      hazards: [
        `${p.occupancyCapacity.toLocaleString()} daily visitors — extreme evacuation complexity`,
        ...(p.floodZone ? ["Flood zone — lower-level water ingress risk"] : []),
        ...p.aiInsights.filter(i => i.severity === "high").slice(0, 2).map(i => i.text.slice(0, 80)),
      ],
      protectionSystems: [
        ...(p.fireProtection.sprinklers ? ["Full sprinkler coverage"] : []),
        "Fire compartmentalization", "Smoke extraction system",
        ...(p.fireProtection.alarms ? ["Addressable fire alarm"] : []),
      ],
      condition: p.roofCondition, riskLevel: p.riskScore > 50 ? "high" : "medium",
    },
    {
      id: `${p.id}-anchor`, name: "Anchor / Special Attractions", type: "office",
      description: "Major anchor stores and special attractions (aquarium, ice rink, entertainment).",
      position: { x: 0.15, y: 0, z: 0.15 }, size: { w: 0.3, h: 0.12, d: 0.3 },
      color: "oklch(0.55 0.16 310)",
      details: { "Type": "Entertainment & anchor tenants" },
      hazards: ["Unique risk exposures (water, ice, ammonia)", "High value contents"],
      protectionSystems: ["Dedicated suppression systems", "Leak detection"],
      condition: "good", riskLevel: "medium",
    },
    {
      id: `${p.id}-parking`, name: "Multi-Level Parking", type: "loading",
      description: "Parking structure serving mall visitors.",
      position: { x: 0.1, y: -0.06, z: 0.1 }, size: { w: 0.65, h: 0.06, d: 0.65 },
      color: "oklch(0.35 0.05 240)",
      details: { "Type": "Underground & multi-storey" },
      hazards: ["Vehicle fire", "Evacuation congestion"],
      protectionSystems: ["Sprinklers", "CO detection", "Ventilation"],
      condition: "good", riskLevel: "medium",
    },
    {
      id: `${p.id}-services`, name: "Service / Loading Area", type: "loading",
      description: "Delivery bays and back-of-house service corridors.",
      position: { x: 0.78, y: 0, z: 0.3 }, size: { w: 0.12, h: 0.08, d: 0.4 },
      color: "oklch(0.45 0.08 100)",
      details: { "Access": "Restricted service vehicles" },
      hazards: ["Vehicle collision", "Fire from deliveries"],
      protectionSystems: ["CCTV", "Extinguishers", "Hydrants"],
      condition: "good", riskLevel: "low",
    },
    {
      id: `${p.id}-mep`, name: "Central Plant / MEP", type: "utility",
      description: "Central chiller plant, electrical switchgear, and building services.",
      position: { x: 0.78, y: 0, z: 0.75 }, size: { w: 0.12, h: 0.1, d: 0.12 },
      color: "oklch(0.50 0.15 50)",
      details: { "Electrical": p.electricalCondition, "HVAC": "Central chiller plant" },
      hazards: ["Electrical fire", "Refrigerant leak"],
      protectionSystems: ["Gas suppression", "Fire detection"],
      condition: p.electricalCondition as "good" | "fair" | "poor",
      riskLevel: condRisk(p.electricalCondition),
    },
  ];
}

// ─── Warehouse ───────────────────────────────────────────

function warehouseZones(p: Property): FacilityZone[] {
  return [
    {
      id: `${p.id}-main`, name: "Main Warehouse", type: "warehouse",
      description: `${p.occupancy}. ${p.constructionMaterial} structure.`,
      dimensions: `Single storey | Capacity: ${p.occupancyCapacity.toLocaleString()}`,
      position: { x: 0.15, y: 0, z: 0.2 }, size: { w: 0.55, h: 0.3, d: 0.5 },
      color: "oklch(0.50 0.14 220)",
      details: {
        "Construction": p.constructionMaterial, "Year Built": String(p.yearBuilt),
        "Occupancy": p.occupancy, "Sum Insured": `AED ${(p.sumInsured / 1e6).toFixed(0)}M`,
      },
      hazards: [
        "Combustible storage",
        ...(p.nearIndustrial ? ["Adjacent industrial exposure"] : []),
        ...p.aiInsights.filter(i => i.severity === "high").slice(0, 2).map(i => i.text.slice(0, 80)),
      ],
      protectionSystems: [
        ...(p.fireProtection.sprinklers ? ["Sprinkler System"] : ["⚠ No sprinklers"]),
        ...(p.fireProtection.alarms ? ["Fire Alarm"] : []),
        ...(p.fireProtection.extinguishers ? ["Extinguishers"] : []),
      ],
      condition: p.roofCondition, riskLevel: p.riskScore > 50 ? "high" : "medium",
    },
    {
      id: `${p.id}-office`, name: "Office Area", type: "office",
      description: "Administrative office space within or adjacent to warehouse.",
      position: { x: 0.72, y: 0, z: 0.2 }, size: { w: 0.15, h: 0.2, d: 0.15 },
      color: "oklch(0.50 0.10 180)",
      details: { "Function": "Admin & dispatch" },
      hazards: [],
      protectionSystems: ["Sprinklers", "Alarms"],
      condition: "good", riskLevel: "low",
    },
    {
      id: `${p.id}-loading`, name: "Loading / Dispatch Bay", type: "loading",
      description: "Vehicle loading and unloading area.",
      position: { x: 0.15, y: 0, z: 0 }, size: { w: 0.55, h: 0.08, d: 0.1 },
      color: "oklch(0.48 0.10 90)",
      details: { "Access": "Truck docking bays" },
      hazards: ["Vehicle ignition", "Loading accidents"],
      protectionSystems: p.fireProtection.hydrantNearby ? ["Yard hydrants", "Extinguishers"] : ["Extinguishers"],
      condition: "good", riskLevel: "medium",
    },
    {
      id: `${p.id}-utility`, name: "Utility / Plant Room", type: "utility",
      description: "Electrical switchgear, generator, and services.",
      position: { x: 0.02, y: 0, z: 0.05 }, size: { w: 0.1, h: 0.15, d: 0.1 },
      color: "oklch(0.50 0.15 50)",
      details: { "Electrical": p.electricalCondition },
      hazards: ["Electrical fire", "Generator fuel"],
      protectionSystems: ["Fire detection"],
      condition: p.electricalCondition as "good" | "fair" | "poor",
      riskLevel: condRisk(p.electricalCondition),
    },
  ];
}

// ─── Equipment generators ────────────────────────────────

function generateEquipment(p: Property, zones: FacilityZone[]): EquipmentMarker[] {
  const eq: EquipmentMarker[] = [];
  const mainZone = zones[0]?.id || `${p.id}-main`;
  const utilZone = zones.find(z => z.type === "utility")?.id || mainZone;
  let idx = 0;

  // Sprinklers
  if (p.fireProtection.sprinklers) {
    eq.push(
      { id: `${p.id}-eq-${idx++}`, name: "Sprinkler System — Main Zone", type: "sprinkler", zone: mainZone,
        position: { x: 0.35, y: 0.5, z: 0.35 }, details: "Automatic sprinkler coverage across primary area", status: "operational", icon: "💦" },
      { id: `${p.id}-eq-${idx++}`, name: "Sprinkler System — Secondary Zone", type: "sprinkler", zone: mainZone,
        position: { x: 0.55, y: 0.5, z: 0.55 }, details: "Extended sprinkler coverage", status: "operational", icon: "💦" },
    );
  }

  // Fire alarm
  if (p.fireProtection.alarms) {
    eq.push(
      { id: `${p.id}-eq-${idx++}`, name: "Fire Alarm Control Panel", type: "fire-panel", zone: mainZone,
        position: { x: 0.7, y: 0.15, z: 0.25 }, details: "Addressable fire alarm panel with zone monitoring", status: "operational", icon: "🚨" },
      { id: `${p.id}-eq-${idx++}`, name: "Smoke / Heat Detectors", type: "detector", zone: mainZone,
        position: { x: 0.4, y: 0.55, z: 0.4 }, details: "Ceiling-mounted detection array", status: "operational", icon: "🔔" },
    );
  }

  // Extinguishers
  if (p.fireProtection.extinguishers) {
    eq.push(
      { id: `${p.id}-eq-${idx++}`, name: "Fire Extinguisher Station — East", type: "fire-extinguisher", zone: mainZone,
        position: { x: 0.65, y: 0.05, z: 0.3 }, details: "Dry powder and CO2 extinguishers", status: "operational", icon: "🧯" },
      { id: `${p.id}-eq-${idx++}`, name: "Fire Extinguisher Station — West", type: "fire-extinguisher", zone: mainZone,
        position: { x: 0.2, y: 0.05, z: 0.5 }, details: "Portable fire extinguishers at marked stations", status: "operational", icon: "🧯" },
    );
  }

  // Hydrants
  if (p.fireProtection.hydrantNearby) {
    eq.push(
      { id: `${p.id}-eq-${idx++}`, name: "Fire Hydrant — Main Access", type: "hydrant", zone: mainZone,
        position: { x: 0.2, y: 0.02, z: 0.05 }, details: "External hydrant within 100m", status: "operational", icon: "🚒" },
    );
  }

  // Generator
  eq.push(
    { id: `${p.id}-eq-${idx++}`, name: "Emergency Generator", type: "generator", zone: utilZone,
      position: { x: 0.05, y: 0.08, z: 0.08 }, details: "Backup diesel generator for critical systems", status: "operational", icon: "⚡" },
  );

  // CCTV
  eq.push(
    { id: `${p.id}-eq-${idx++}`, name: "CCTV Monitoring", type: "cctv", zone: mainZone,
      position: { x: 0.8, y: 0.35, z: 0.2 }, details: "Security camera coverage across facility", status: "operational", icon: "📹" },
  );

  // BMS
  eq.push(
    { id: `${p.id}-eq-${idx++}`, name: "Building Management System", type: "bms", zone: mainZone,
      position: { x: 0.75, y: 0.1, z: 0.3 }, details: "Centralised BMS monitoring fire, HVAC, and security", status: "operational", icon: "🖥️" },
  );

  // Emergency exits
  eq.push(
    { id: `${p.id}-eq-${idx++}`, name: "Emergency Exits — North", type: "emergency-exit", zone: mainZone,
      position: { x: 0.3, y: 0.05, z: 0.15 }, details: "Emergency exit cluster with illuminated signage", status: "operational", icon: "🚪" },
    { id: `${p.id}-eq-${idx++}`, name: "Emergency Exits — South", type: "emergency-exit", zone: mainZone,
      position: { x: 0.5, y: 0.05, z: 0.7 }, details: "Emergency exit cluster", status: "operational", icon: "🚪" },
  );

  // ── AI Insights — ALL severity levels as color-coded markers ──
  const severityConfig = {
    high:   { prefix: "🔴 CRITICAL", status: "needs-attention" as const, icon: "🔴", yBase: 0.35 },
    medium: { prefix: "🟡 WARNING",  status: "maintenance" as const,     icon: "🟡", yBase: 0.25 },
    low:    { prefix: "🟢 INFO",     status: "operational" as const,     icon: "🟢", yBase: 0.15 },
  };
  const categoryIcons: Record<string, string> = {
    fire: "🔥", structural: "🏗️", flood: "🌊", environmental: "🌿", security: "🛡️",
  };

  p.aiInsights.forEach((insight, i) => {
    const cfg = severityConfig[insight.severity];
    const catIcon = categoryIcons[insight.category] || "📋";
    // Spread markers in a grid pattern to avoid overlap
    const col = i % 4;
    const row = Math.floor(i / 4);
    eq.push({
      id: `${p.id}-eq-insight-${i}`,
      name: `${cfg.prefix} ${catIcon} ${insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}`,
      type: "detector",
      zone: mainZone,
      position: { x: 0.15 + col * 0.18, y: cfg.yBase + row * 0.08, z: 0.55 + row * 0.1 },
      details: insight.text,
      status: cfg.status,
      icon: cfg.icon,
    });
  });

  // ── Condition-based markers ──
  if (p.roofCondition === "poor" || p.roofCondition === "fair") {
    const isPoor = p.roofCondition === "poor";
    eq.push({ id: `${p.id}-eq-${idx++}`, name: `${isPoor ? "🔴" : "🟡"} Roof Condition: ${p.roofCondition.toUpperCase()}`, type: "detector", zone: mainZone,
      position: { x: 0.4, y: 0.6, z: 0.4 }, details: `Roof rated ${p.roofCondition}. ${isPoor ? "Requires immediate attention. Water ingress and structural risk." : "Moderate wear observed — monitor closely."}`, status: isPoor ? "needs-attention" : "maintenance", icon: isPoor ? "🔴" : "🟡" });
  }
  if (p.electricalCondition === "poor" || p.electricalCondition === "fair") {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: `${p.electricalCondition === "poor" ? "🔴" : "🟡"} Electrical: ${p.electricalCondition.toUpperCase()}`, type: "generator", zone: utilZone,
      position: { x: 0.08, y: 0.12, z: 0.1 }, details: `Electrical systems rated ${p.electricalCondition}. ${p.electricalCondition === "poor" ? "Fire hazard — immediate remediation needed." : "Monitor closely."}`, status: p.electricalCondition === "poor" ? "needs-attention" : "maintenance", icon: "⚡" });
  }

  // ── Location / exposure markers ──
  if (p.floodZone) {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: "🌊 Flood Zone Exposure", type: "detector", zone: mainZone,
      position: { x: 0.4, y: 0.01, z: 0.8 }, details: "Property in designated flood zone. Ground-level water ingress risk. Loading factor applied.", status: "needs-attention", icon: "🌊" });
  }
  if (p.nearCoast) {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: "🏖️ Coastal Proximity", type: "detector", zone: mainZone,
      position: { x: 0.7, y: 0.02, z: 0.85 }, details: "Within 5km of coastline — salt spray corrosion on façade and structural steel. Storm surge exposure.", status: "maintenance", icon: "🏖️" });
  }
  if (p.nearIndustrial) {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: "🏭 Industrial Zone Adjacency", type: "detector", zone: mainZone,
      position: { x: 0.1, y: 0.02, z: 0.85 }, details: "Adjacent to industrial zone — explosion, contamination, and fire spread exposure from neighboring facilities.", status: "needs-attention", icon: "🏭" });
  }

  // ── Loading factor markers (pricing/underwriting adjustments) ──
  const ageYears = new Date().getFullYear() - p.yearBuilt;
  if (ageYears > 30) {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: "📅 Building Age Loading (+10%)", type: "detector", zone: mainZone,
      position: { x: 0.6, y: 0.45, z: 0.2 }, details: `Built ${p.yearBuilt} (${ageYears} years old). Aged infrastructure — higher degradation, MEP lifecycle risk. Loading factor applied.`, status: "needs-attention", icon: "📅" });
  } else if (ageYears > 15) {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: "📅 Building Age Loading (+5%)", type: "detector", zone: mainZone,
      position: { x: 0.6, y: 0.45, z: 0.2 }, details: `Built ${p.yearBuilt} (${ageYears} years old). Mid-life infrastructure — moderate degradation risk.`, status: "maintenance", icon: "📅" });
  }
  if (p.occupancyCapacity > 10000) {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: "👥 Extreme Occupancy (+12%)", type: "detector", zone: mainZone,
      position: { x: 0.5, y: 0.1, z: 0.3 }, details: `Capacity ${p.occupancyCapacity.toLocaleString()} — very high density, evacuation complexity, liability exposure. Significant loading applied.`, status: "needs-attention", icon: "👥" });
  } else if (p.occupancyCapacity > 5000) {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: "👥 High Occupancy (+8%)", type: "detector", zone: mainZone,
      position: { x: 0.5, y: 0.1, z: 0.3 }, details: `Capacity ${p.occupancyCapacity.toLocaleString()} — high density, complex evacuation requirements.`, status: "maintenance", icon: "👥" });
  }
  if (!p.fireProtection.sprinklers) {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: "🚫 No Sprinklers (+15%)", type: "sprinkler", zone: mainZone,
      position: { x: 0.35, y: 0.4, z: 0.35 }, details: "No automatic sprinkler system installed — major fire suppression gap. Significant premium loading applied.", status: "needs-attention", icon: "🚫" });
  }
  if (!p.fireProtection.hydrantNearby) {
    eq.push({ id: `${p.id}-eq-${idx++}`, name: "🚫 No Nearby Hydrant (+8%)", type: "hydrant", zone: mainZone,
      position: { x: 0.65, y: 0.02, z: 0.7 }, details: "No fire hydrant within 100m — water supply concerns for firefighting operations.", status: "needs-attention", icon: "🚫" });
  }

  return eq;
}

// ─── Main generator ──────────────────────────────────────

export function generateFacilityData(p: Property): { zones: FacilityZone[]; equipment: EquipmentMarker[] } {
  let zones: FacilityZone[];

  if (p.type === "industrial") {
    zones = industrialZones(p);
  } else if (p.type === "retail") {
    zones = retailZones(p);
  } else if (p.type === "warehouse") {
    zones = warehouseZones(p);
  } else if (p.floors > 10) {
    zones = highRiseZones(p);
  } else {
    zones = highRiseZones(p); // default to high-rise layout for office/residential
  }

  const equipment = generateEquipment(p, zones);
  return { zones, equipment };
}

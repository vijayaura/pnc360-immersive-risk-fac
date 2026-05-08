// Detailed survey data extracted from Risk Survey Report SRV-2025-1294
// Used by the 3D Facility Explorer to annotate the interactive model

export interface FacilityZone {
  id: string;
  name: string;
  type: "warehouse" | "office" | "cold-storage" | "utility" | "external" | "loading" | "security";
  description: string;
  dimensions?: string;
  position: { x: number; y: number; z: number }; // normalized 0-1
  size: { w: number; h: number; d: number }; // normalized 0-1
  color: string;
  details: Record<string, string>;
  hazards: string[];
  protectionSystems: string[];
  condition: "good" | "fair" | "poor";
  riskLevel: "low" | "medium" | "high";
}

export interface EquipmentMarker {
  id: string;
  name: string;
  type: "sprinkler" | "fire-extinguisher" | "fire-hose" | "smoke-vent" | "detector" | "cctv" | "emergency-exit" | "hydrant" | "fire-panel" | "generator" | "pump" | "bms" | "charging-station" | "esfr" | "rack";
  zone: string;
  position: { x: number; y: number; z: number };
  details: string;
  status: "operational" | "maintenance" | "needs-attention";
  icon: string;
}

export const facilityZones: FacilityZone[] = [
  {
    id: "z-warehouse-dry",
    name: "Dry Chamber — Main Warehouse",
    type: "warehouse",
    description: "Primary dry goods storage area with high-bay racking system. ESFR and in-rack sprinkler coverage. Stores food and non-food supermarket items on pallets.",
    dimensions: "~30,000 sqm | Roof Height: 19.5m | Last Rack: 12.34m",
    position: { x: 0.15, y: 0, z: 0.2 },
    size: { w: 0.55, h: 0.6, d: 0.55 },
    color: "oklch(0.55 0.15 220)",
    details: {
      "Floor Area": "~30,000 sqm",
      "Roof Height": "19.5m",
      "Max Rack Height": "12.34m",
      "Storage Method": "Racks over pallets",
      "Stock Type": "Food & non-food items (combustible)",
      "Congestion": "No",
      "Demarcations": "In place",
      "Floor Level": "1.35m above road level",
    },
    hazards: ["Combustible stock", "High rack storage", "Forklift operations"],
    protectionSystems: ["ESFR Sprinklers (K11.2 & K8.0)", "In-rack Sprinklers (K5.6)", "Smoke Vents (174)", "Fire Hose Reels", "Portable Fire Extinguishers"],
    condition: "good",
    riskLevel: "medium",
  },
  {
    id: "z-cold-chiller",
    name: "Chiller Room",
    type: "cold-storage",
    description: "Temperature-controlled chiller storage maintained between 5-9°C. Pre-action sprinkler system to prevent accidental discharge in cold environment.",
    dimensions: "Part of cold chamber complex",
    position: { x: 0.15, y: 0, z: 0.75 },
    size: { w: 0.25, h: 0.6, d: 0.2 },
    color: "oklch(0.60 0.18 230)",
    details: {
      "Temperature": "5°C to 9°C",
      "Protection": "Pre-action sprinkler system",
      "Stock": "Perishable food items",
    },
    hazards: ["Ammonia refrigerant leak risk", "Condensation / slip hazard"],
    protectionSystems: ["Pre-action Sprinkler System", "Temperature Monitoring", "Leak Detection"],
    condition: "good",
    riskLevel: "medium",
  },
  {
    id: "z-cold-freezer",
    name: "Freezer Room",
    type: "cold-storage",
    description: "Deep-freeze storage at -24°C. Backup by emergency generator. Pre-action sprinkler system installed.",
    dimensions: "Part of cold chamber complex",
    position: { x: 0.4, y: 0, z: 0.75 },
    size: { w: 0.25, h: 0.6, d: 0.2 },
    color: "oklch(0.50 0.20 250)",
    details: {
      "Temperature": "-24°C",
      "Backup Power": "Emergency generator",
      "Protection": "Pre-action sprinkler system",
    },
    hazards: ["Extreme cold exposure", "Ammonia leak risk", "Power failure — stock loss"],
    protectionSystems: ["Pre-action Sprinkler System", "Emergency Generator Backup", "Temperature Alarms"],
    condition: "good",
    riskLevel: "medium",
  },
  {
    id: "z-office",
    name: "Office Block (G+2)",
    type: "office",
    description: "Three-storey office space joined to warehouse. Ground floor + 2 upper floors. Connected to security tower via 65m overhead enclosed footbridge.",
    dimensions: "G + 2 storeys",
    position: { x: 0.72, y: 0, z: 0.2 },
    size: { w: 0.18, h: 0.45, d: 0.25 },
    color: "oklch(0.55 0.12 180)",
    details: {
      "Storeys": "Ground + 2",
      "Connection": "Joined to warehouse",
      "Footbridge": "65m enclosed overhead bridge to tower",
    },
    hazards: ["Electrical fire risk", "Evacuation via footbridge"],
    protectionSystems: ["Sprinkler System", "Fire Alarms", "Emergency Exits"],
    condition: "good",
    riskLevel: "low",
  },
  {
    id: "z-tower",
    name: "Security Tower",
    type: "security",
    description: "Entry security checkpoint structure. All visitors pass through security desk. Connected to office via 65m enclosed footbridge.",
    position: { x: 0.92, y: 0, z: 0.2 },
    size: { w: 0.06, h: 0.35, d: 0.08 },
    color: "oklch(0.50 0.10 160)",
    details: {
      "Function": "Security checkpoint",
      "Access Control": "Yes",
      "Connection": "Overhead footbridge to office (65m)",
    },
    hazards: [],
    protectionSystems: ["Access Control", "CCTV", "Security Personnel"],
    condition: "good",
    riskLevel: "low",
  },
  {
    id: "z-footbridge",
    name: "Enclosed Footbridge",
    type: "external",
    description: "65-meter enclosed overhead pedestrian bridge connecting security tower to office block.",
    position: { x: 0.78, y: 0.3, z: 0.22 },
    size: { w: 0.16, h: 0.05, d: 0.04 },
    color: "oklch(0.45 0.08 200)",
    details: { "Length": "~65m", "Type": "Enclosed overhead" },
    hazards: ["Evacuation bottleneck"],
    protectionSystems: [],
    condition: "good",
    riskLevel: "low",
  },
  {
    id: "z-lv-room",
    name: "LV / Generator / Refrigeration Room",
    type: "utility",
    description: "Detached utility building housing low-voltage switchgear, diesel generators, and chiller plant equipment. RCC construction.",
    position: { x: 0.02, y: 0, z: 0.05 },
    size: { w: 0.1, h: 0.25, d: 0.12 },
    color: "oklch(0.50 0.15 50)",
    details: {
      "Construction": "RCC (Reinforced Cement Concrete)",
      "Contains": "LV Switchgear, Diesel Generator, Refrigeration Plant",
      "Status": "Detached from warehouse",
    },
    hazards: ["Electrical fire", "Diesel fuel storage", "Refrigerant leak"],
    protectionSystems: ["Foam System", "FM200 System", "Fire Detection"],
    condition: "good",
    riskLevel: "medium",
  },
  {
    id: "z-pump-room",
    name: "Fire Pump Room",
    type: "utility",
    description: "Detached pump room housing shared fire pump set (electric & diesel). 2,500 GPM capacity with 300,000 gallon water reserve. Shared with Landmark Group warehouse.",
    position: { x: 0.02, y: 0, z: 0.5 },
    size: { w: 0.1, h: 0.2, d: 0.1 },
    color: "oklch(0.55 0.20 25)",
    details: {
      "Pump Type": "Electric & Diesel",
      "Capacity": "2,500 GPM",
      "RPM": "2,950",
      "Rated Pressure": "174 psi",
      "Water Reserve": "300,000 gallons",
      "Shared": "With Landmark Group",
    },
    hazards: ["Single point of failure — shared pump", "Diesel fire risk"],
    protectionSystems: ["Fire Detection", "Foam Protection"],
    condition: "good",
    riskLevel: "high",
  },
  {
    id: "z-loading-bays",
    name: "Loading Bays (111 Bays)",
    type: "loading",
    description: "111 loading bays for truck docking. High vehicle traffic area with multiple ignition sources.",
    position: { x: 0.15, y: 0, z: 0 },
    size: { w: 0.55, h: 0.15, d: 0.08 },
    color: "oklch(0.50 0.10 90)",
    details: {
      "Total Bays": "111",
      "Vehicle Type": "Trucks and delivery vehicles",
      "Traffic": "High",
    },
    hazards: ["Vehicle collision", "Fuel ignition", "Loading accidents"],
    protectionSystems: ["Fire Extinguishers", "Yard Hydrants"],
    condition: "good",
    riskLevel: "medium",
  },
];

export const equipmentMarkers: EquipmentMarker[] = [
  // ESFR Sprinklers
  { id: "eq-esfr-1", name: "ESFR Sprinkler Array — Dry Chamber West", type: "esfr", zone: "z-warehouse-dry", position: { x: 0.25, y: 0.55, z: 0.35 }, details: "K11.2 ESFR heads, ceiling-mounted, covering high-bay racking area", status: "operational", icon: "💦" },
  { id: "eq-esfr-2", name: "ESFR Sprinkler Array — Dry Chamber East", type: "esfr", zone: "z-warehouse-dry", position: { x: 0.55, y: 0.55, z: 0.35 }, details: "K8.0 ESFR heads, ceiling-mounted", status: "operational", icon: "💦" },
  // In-rack sprinklers
  { id: "eq-rack-1", name: "In-Rack Sprinklers — Aisle 1-20", type: "sprinkler", zone: "z-warehouse-dry", position: { x: 0.3, y: 0.3, z: 0.3 }, details: "K5.6 in-rack sprinkler heads within racking system up to 12.34m", status: "operational", icon: "🔫" },
  { id: "eq-rack-2", name: "In-Rack Sprinklers — Aisle 21-40", type: "sprinkler", zone: "z-warehouse-dry", position: { x: 0.5, y: 0.3, z: 0.45 }, details: "K5.6 in-rack sprinkler heads", status: "operational", icon: "🔫" },
  // Smoke vents
  { id: "eq-vent-1", name: "Smoke Ventilation System", type: "smoke-vent", zone: "z-warehouse-dry", position: { x: 0.4, y: 0.58, z: 0.4 }, details: "174 smoke vents across roof with skylights", status: "operational", icon: "🌫️" },
  // Fire hose reels
  { id: "eq-fhr-1", name: "Fire Hose Reel Cabinet — West Wall", type: "fire-hose", zone: "z-warehouse-dry", position: { x: 0.16, y: 0.15, z: 0.35 }, details: "Wall-mounted FHR within racking system area", status: "operational", icon: "🧯" },
  { id: "eq-fhr-2", name: "Fire Hose Reel Cabinet — East Wall", type: "fire-hose", zone: "z-warehouse-dry", position: { x: 0.68, y: 0.15, z: 0.35 }, details: "Wall-mounted FHR", status: "operational", icon: "🧯" },
  // Fire extinguishers
  { id: "eq-pfe-1", name: "Portable Fire Extinguisher Station", type: "fire-extinguisher", zone: "z-warehouse-dry", position: { x: 0.35, y: 0.05, z: 0.25 }, details: "Dry powder and CO2 extinguishers at marked stations", status: "operational", icon: "🧯" },
  // Detectors
  { id: "eq-det-1", name: "Smoke/Heat Detector Array", type: "detector", zone: "z-warehouse-dry", position: { x: 0.4, y: 0.57, z: 0.35 }, details: "Ceiling-mounted smoke and heat detectors connected to FACP", status: "operational", icon: "🔔" },
  // FACP
  { id: "eq-facp", name: "Fire Alarm Control Panel (FACP)", type: "fire-panel", zone: "z-office", position: { x: 0.75, y: 0.15, z: 0.25 }, details: "Main FACP with Civil Defense connection (10-min response)", status: "operational", icon: "🚨" },
  // BMS
  { id: "eq-bms", name: "BMS / Control Room", type: "bms", zone: "z-office", position: { x: 0.78, y: 0.1, z: 0.3 }, details: "Building Management System monitoring all fire, HVAC, and security systems", status: "operational", icon: "🖥️" },
  // CCTV
  { id: "eq-cctv-1", name: "CCTV Monitoring Station", type: "cctv", zone: "z-tower", position: { x: 0.93, y: 0.2, z: 0.22 }, details: "Central CCTV monitoring with feeds from entire facility", status: "operational", icon: "📹" },
  // Emergency exits
  { id: "eq-exit-1", name: "Emergency Exit Cluster — North", type: "emergency-exit", zone: "z-warehouse-dry", position: { x: 0.3, y: 0.05, z: 0.2 }, details: "Multiple emergency exits (~22 total across facility)", status: "operational", icon: "🚪" },
  { id: "eq-exit-2", name: "Emergency Exit Cluster — South", type: "emergency-exit", zone: "z-warehouse-dry", position: { x: 0.5, y: 0.05, z: 0.72 }, details: "Emergency exits with illuminated signage", status: "operational", icon: "🚪" },
  // Hydrants
  { id: "eq-hyd-1", name: "Yard Hydrant — Main Entrance", type: "hydrant", zone: "z-loading-bays", position: { x: 0.25, y: 0.02, z: 0.02 }, details: "External yard hydrant with breeching inlet", status: "operational", icon: "🚒" },
  { id: "eq-hyd-2", name: "Yard Hydrant — Rear", type: "hydrant", zone: "z-loading-bays", position: { x: 0.6, y: 0.02, z: 0.02 }, details: "External yard hydrant", status: "operational", icon: "🚒" },
  // Fire pumps
  { id: "eq-pump", name: "Fire Pump Set (Electric + Diesel)", type: "pump", zone: "z-pump-room", position: { x: 0.05, y: 0.08, z: 0.53 }, details: "2,500 GPM, 2,950 RPM, 174 psi. 300,000 gallon water reserve. Shared with Landmark Group.", status: "operational", icon: "⛽" },
  // Generator
  { id: "eq-gen", name: "Emergency Diesel Generator", type: "generator", zone: "z-lv-room", position: { x: 0.05, y: 0.1, z: 0.08 }, details: "Backup power for freezer rooms and critical systems. Foam protection installed.", status: "operational", icon: "⚡" },
  // Charging stations
  { id: "eq-charge", name: "Forklift Battery Charging Station", type: "charging-station", zone: "z-warehouse-dry", position: { x: 0.6, y: 0.05, z: 0.55 }, details: "Dedicated charging area for electric forklifts. Fire ignition hazard zone.", status: "operational", icon: "🔋" },
  // Racking
  { id: "eq-rack-sys", name: "High-Bay Racking System", type: "rack", zone: "z-warehouse-dry", position: { x: 0.4, y: 0.28, z: 0.4 }, details: "Pallet racking up to 12.34m height. In-rack sprinklers installed within. Flue spaces maintained.", status: "operational", icon: "📦" },
  // Pre-action in cold storage
  { id: "eq-preaction-1", name: "Pre-Action Sprinkler — Chiller", type: "sprinkler", zone: "z-cold-chiller", position: { x: 0.25, y: 0.45, z: 0.82 }, details: "Pre-action system prevents accidental water discharge in cold environment", status: "operational", icon: "💧" },
  { id: "eq-preaction-2", name: "Pre-Action Sprinkler — Freezer", type: "sprinkler", zone: "z-cold-freezer", position: { x: 0.5, y: 0.45, z: 0.82 }, details: "Pre-action system for -24°C freezer environment", status: "operational", icon: "💧" },
];

export const surveyHighlights = {
  insured: "Viva Enterprise Holdings Limited",
  parentGroup: "Landmark Group",
  location: "Plot No. S60323, Jebel Ali Free Zone South, Dubai, UAE",
  coordinates: { lat: 24.931270209907105, lng: 55.104961029951745 },
  surveyDate: "10/06/2025",
  surveyor: "JOSEPHM",
  contactPerson: "Mr. Nived (Safety Engineer / Al Futtaim Eng & Tech)",
  facilityManager: "Al Futtaim Engineering and Technology",
  totalSumInsured: 155000000,
  warehouseArea: "44,600 sqm",
  roofHeight: "19.5m",
  maxRackHeight: "12.34m",
  totalLoadingBays: 111,
  totalEmergencyExits: 22,
  totalSmokeVents: 174,
  totalTrainedFirefighters: 24,
  securityPersonnel: "5 day / 5 night shift",
  constructionType: "Light Non Combustible (LNC) / Kirby Type",
  roofMaterial: "Kingspan sandwich panel, 80mm PIR insulation, DCL certified",
  adjacentExposure: "Landmark Group Warehouse — 25m gap",
  civilDefenseResponse: "10 minutes",
  fireDrillFrequency: "Half yearly with Civil Defense participation",
  naturalHazards: {
    flood: "Low",
    wind: "Low",
    earthquake: "Low",
    subsidence: "Low",
    pollution: "Low",
    theft: "Low",
  },
};

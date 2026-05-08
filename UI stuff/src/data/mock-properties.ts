export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: "warehouse" | "office" | "retail" | "industrial" | "residential";
  constructionMaterial: string;
  floors: number;
  yearBuilt: number;
  occupancy: string;
  occupancyCapacity: number;
  sumInsured: number;
  fireProtection: {
    sprinklers: boolean;
    alarms: boolean;
    extinguishers: boolean;
    hydrantNearby: boolean;
  };
  electricalCondition: "good" | "fair" | "poor";
  plumbingCondition: "good" | "fair" | "poor";
  roofCondition: "good" | "fair" | "poor";
  status: "pending" | "approved" | "referred" | "rejected";
  broker: string;
  submissionDate: string;
  riskScore: number;
  images: string[];
  aiInsights: AIInsight[];
  documents: Document[];
  floodZone: boolean;
  nearCoast: boolean;
  nearIndustrial: boolean;
  insurerName: string;
  shareOffered: number; // percentage
  reinsuranceBroker: string;
  riskStartDate: string;
  dateApproached: string;
  claims?: {
    date: string;
    peril: string;
    description: string;
    grossPaid: number;
    netPaid: number;
    reserves: number;
    status: "closed" | "open" | "reopened";
  }[];
}

export interface SourceRef {
  documentId: string;
  documentName: string;
  section: string;
  page?: number;
}

export interface AIInsight {
  id: string;
  text: string;
  severity: "high" | "medium" | "low";
  confidence: number;
  category: "fire" | "flood" | "structural" | "environmental" | "security";
  status: "pending" | "accepted" | "dismissed";
  sourceRef?: SourceRef;
}

export interface PremiumLoadingItem {
  id: string;
  factor: string;
  aiSuggested: number;
  current: number;
  explanation: string;
  category: "location" | "construction" | "occupancy" | "protection" | "hazard" | "custom";
}

export interface CoveredPeril {
  id: string;
  name: string;
  included: boolean;
  sublimit: number | null;
  sublimitBasis: string;
  premiumAllocationPct: number;
}

export interface DeductibleItem {
  id: string;
  peril: string;
  type: "percentage" | "fixed" | "time";
  value: number;
  minimum?: number;
  unit: string;
  description: string;
}

export interface ExclusionItem {
  id: string;
  name: string;
  clause: string;
  standard: boolean;
  negotiable: boolean;
  description: string;
}

export interface FeeBreakdown {
  brokerageRate: number;
  reinsuranceCession: number;
  policyFee: number;
  surveyFee: number;
  adminFee: number;
}

export interface PremiumConfig {
  baseRatePerMille: number;
  baseRateExplanation: string;
  loadings: PremiumLoadingItem[];
  commissionRate: number;
  deductiblePercent: number;
  coveredPerils: CoveredPeril[];
  deductibles: DeductibleItem[];
  exclusions: ExclusionItem[];
  fees: FeeBreakdown;
}

export function getPremiumConfig(property: Property): PremiumConfig {
  const typeRates: Record<string, number> = { office: 0.35, retail: 0.45, warehouse: 0.65, industrial: 1.2, residential: 0.3 };
  const baseRate = typeRates[property.type] || 0.5;

  const loadings: PremiumLoadingItem[] = [
    { id: "l-flood", factor: "Flood Zone", aiSuggested: property.floodZone ? 15 : 0, current: property.floodZone ? 15 : 0, explanation: property.floodZone ? "Property in designated flood zone. 2024 Dubai floods caused significant damage to similar properties." : "Not in flood zone — no loading applied.", category: "location" },
    { id: "l-coast", factor: "Coastal Proximity", aiSuggested: property.nearCoast ? 8 : 0, current: property.nearCoast ? 8 : 0, explanation: property.nearCoast ? "Within 5km of coastline — salt corrosion and storm surge risk." : "Not near coast.", category: "location" },
    { id: "l-industrial", factor: "Industrial Adjacency", aiSuggested: property.nearIndustrial ? 12 : 0, current: property.nearIndustrial ? 12 : 0, explanation: property.nearIndustrial ? "Adjacent to industrial zone — explosion and contamination exposure." : "No industrial exposure.", category: "location" },
    { id: "l-construction", factor: "Construction Quality", aiSuggested: property.constructionMaterial.includes("Steel") ? -5 : property.constructionMaterial.includes("Wood") ? 20 : 0, current: property.constructionMaterial.includes("Steel") ? -5 : property.constructionMaterial.includes("Wood") ? 20 : 0, explanation: `${property.constructionMaterial} — ${property.constructionMaterial.includes("Steel") ? "fire-resistant, discount applied" : "standard construction rating"}.`, category: "construction" },
    { id: "l-age", factor: "Building Age", aiSuggested: new Date().getFullYear() - property.yearBuilt > 30 ? 10 : new Date().getFullYear() - property.yearBuilt > 15 ? 5 : 0, current: new Date().getFullYear() - property.yearBuilt > 30 ? 10 : new Date().getFullYear() - property.yearBuilt > 15 ? 5 : 0, explanation: `Built ${property.yearBuilt} (${new Date().getFullYear() - property.yearBuilt} years old). ${new Date().getFullYear() - property.yearBuilt > 30 ? "Aged infrastructure — higher degradation risk." : "Within acceptable age range."}`, category: "construction" },
    { id: "l-roof", factor: "Roof Condition", aiSuggested: property.roofCondition === "poor" ? 10 : property.roofCondition === "fair" ? 5 : -2, current: property.roofCondition === "poor" ? 10 : property.roofCondition === "fair" ? 5 : -2, explanation: `Roof rated '${property.roofCondition}'. ${property.roofCondition === "poor" ? "Requires immediate attention." : property.roofCondition === "fair" ? "Moderate wear observed." : "Well maintained."}`, category: "construction" },
    { id: "l-sprinkler", factor: "Sprinkler System", aiSuggested: property.fireProtection.sprinklers ? -10 : 15, current: property.fireProtection.sprinklers ? -10 : 15, explanation: property.fireProtection.sprinklers ? "Automatic sprinkler system installed — significant fire risk reduction." : "No sprinklers — major fire suppression gap.", category: "protection" },
    { id: "l-alarm", factor: "Fire Alarm System", aiSuggested: property.fireProtection.alarms ? -3 : 5, current: property.fireProtection.alarms ? -3 : 5, explanation: property.fireProtection.alarms ? "Fire alarm system operational." : "No fire alarm — delayed response risk.", category: "protection" },
    { id: "l-hydrant", factor: "Hydrant Proximity", aiSuggested: property.fireProtection.hydrantNearby ? -5 : 8, current: property.fireProtection.hydrantNearby ? -5 : 8, explanation: property.fireProtection.hydrantNearby ? "Fire hydrant within 100m." : "No nearby hydrant — water supply concerns.", category: "protection" },
    { id: "l-occupancy", factor: "Occupancy Density", aiSuggested: property.occupancyCapacity > 10000 ? 12 : property.occupancyCapacity > 5000 ? 8 : property.occupancyCapacity > 1000 ? 3 : 0, current: property.occupancyCapacity > 10000 ? 12 : property.occupancyCapacity > 5000 ? 8 : property.occupancyCapacity > 1000 ? 3 : 0, explanation: `Capacity ${property.occupancyCapacity.toLocaleString()} — ${property.occupancyCapacity > 10000 ? "very high density, evacuation complexity." : property.occupancyCapacity > 5000 ? "high density." : "manageable density."}`, category: "occupancy" },
  ];

  const si = property.sumInsured;

  const coveredPerils: CoveredPeril[] = [
    { id: "cp-fire", name: "Fire & Lightning", included: true, sublimit: null, sublimitBasis: "Full SI", premiumAllocationPct: 35 },
    { id: "cp-explosion", name: "Explosion", included: true, sublimit: null, sublimitBasis: "Full SI", premiumAllocationPct: 10 },
    { id: "cp-storm", name: "Storm, Tempest & Cyclone", included: true, sublimit: Math.round(si * 0.3), sublimitBasis: "Per Occurrence", premiumAllocationPct: 8 },
    { id: "cp-flood", name: "Flood & Inundation", included: property.floodZone, sublimit: Math.round(si * 0.25), sublimitBasis: "Per Occurrence, Annual Aggregate", premiumAllocationPct: property.floodZone ? 12 : 0 },
    { id: "cp-earthquake", name: "Earthquake & Allied Perils", included: true, sublimit: Math.round(si * 0.5), sublimitBasis: "Per Occurrence", premiumAllocationPct: 10 },
    { id: "cp-bi", name: "Business Interruption", included: true, sublimit: Math.round(si * 0.3), sublimitBasis: "Gross Profit — 12 months", premiumAllocationPct: 15 },
    { id: "cp-machinery", name: "Machinery Breakdown", included: property.type === "industrial" || property.type === "warehouse", sublimit: Math.round(si * 0.1), sublimitBasis: "Repair/Replace", premiumAllocationPct: property.type === "industrial" ? 5 : 0 },
    { id: "cp-tpl", name: "Third Party Liability", included: true, sublimit: 10_000_000, sublimitBasis: "Any One Occurrence", premiumAllocationPct: 3 },
    { id: "cp-debris", name: "Debris Removal", included: true, sublimit: Math.round(si * 0.05), sublimitBasis: "Included in SI", premiumAllocationPct: 1 },
    { id: "cp-terrorism", name: "Terrorism (POOL Re)", included: si > 100_000_000, sublimit: Math.round(si * 0.1), sublimitBasis: "Per Occurrence", premiumAllocationPct: si > 100_000_000 ? 3 : 0 },
    { id: "cp-rent", name: "Loss of Rent", included: property.type !== "industrial", sublimit: Math.round(si * 0.05), sublimitBasis: "12 months", premiumAllocationPct: 2 },
    { id: "cp-water", name: "Water Damage (Burst Pipes)", included: true, sublimit: Math.round(si * 0.15), sublimitBasis: "Per Occurrence", premiumAllocationPct: 3 },
  ];

  const deductibles: DeductibleItem[] = [
    { id: "d-pd", peril: "Property Damage (All Other)", type: "percentage", value: 2, minimum: 50_000, unit: "% of SI (min AED 50,000)", description: "Standard property damage deductible" },
    { id: "d-natcat", peril: "Natural Catastrophe (EQ/Flood/Storm)", type: "percentage", value: 5, minimum: 250_000, unit: "% of SI (min AED 250,000)", description: "Higher deductible for natural perils" },
    { id: "d-mb", peril: "Machinery Breakdown", type: "percentage", value: 10, unit: "% of each claim", description: "Applied per machinery claim" },
    { id: "d-bi", peril: "Business Interruption", type: "time", value: 14, unit: "days waiting period", description: "Time excess before BI coverage triggers" },
    { id: "d-tpl", peril: "Third Party Liability", type: "fixed", value: 25_000, unit: "AED per claim", description: "Fixed deductible per TPL claim" },
    { id: "d-water", peril: "Water Damage", type: "fixed", value: 10_000, unit: "AED per claim", description: "Fixed deductible for burst pipe claims" },
  ];

  const exclusions: ExclusionItem[] = [
    { id: "ex-war", name: "War & Civil Commotion", clause: "NMA 464", standard: true, negotiable: false, description: "Loss from war, invasion, civil war, rebellion, revolution, insurrection, or military power" },
    { id: "ex-nuclear", name: "Nuclear & Radioactive", clause: "NMA 1975", standard: true, negotiable: false, description: "Nuclear reaction, radiation, or radioactive contamination" },
    { id: "ex-cyber", name: "Cyber Attack", clause: "LMA 5408", standard: true, negotiable: true, description: "Loss arising from malicious cyber activity — buyback available" },
    { id: "ex-wear", name: "Wear & Tear / Gradual Deterioration", clause: "Standard", standard: true, negotiable: false, description: "Gradual deterioration, inherent vice, or latent defect" },
    { id: "ex-pollution", name: "Gradual Pollution", clause: "Standard", standard: true, negotiable: false, description: "Pollution unless caused by a sudden and accidental insured event" },
    { id: "ex-confiscation", name: "Government Confiscation", clause: "Standard", standard: true, negotiable: false, description: "Seizure, confiscation, or requisition by any authority" },
    { id: "ex-communicable", name: "Communicable Disease", clause: "LMA 5394", standard: true, negotiable: false, description: "Loss arising from or relating to communicable disease" },
    { id: "ex-asbestos", name: "Asbestos", clause: "Standard", standard: property.yearBuilt < 2000, negotiable: false, description: "Loss arising from asbestos in any form" },
    { id: "ex-consequential", name: "Consequential Loss (unless BI bought)", clause: "Standard", standard: true, negotiable: true, description: "Indirect loss unless Business Interruption section purchased" },
    { id: "ex-sanctions", name: "Sanctions Limitation", clause: "LMA 3100", standard: true, negotiable: false, description: "No coverage for sanctioned entities or countries" },
  ];

  const fees: FeeBreakdown = {
    brokerageRate: 15,
    reinsuranceCession: property.sumInsured > 500_000_000 ? 40 : property.sumInsured > 100_000_000 ? 25 : 10,
    policyFee: 2500,
    surveyFee: property.type === "industrial" ? 15000 : property.type === "warehouse" ? 8000 : 5000,
    adminFee: 1000,
  };

  return {
    baseRatePerMille: baseRate,
    baseRateExplanation: `Base rate for ${property.type} property: ${baseRate}‰ per industry manual. Adjusted for UAE market conditions.`,
    loadings: loadings.filter(l => l.aiSuggested !== 0),
    commissionRate: 15,
    deductiblePercent: 2,
    coveredPerils,
    deductibles,
    exclusions,
    fees,
  };
}

export interface Document {
  id: string;
  name: string;
  type: "proposal" | "survey" | "certificate" | "photo" | "report" | "note";
  uploadDate: string;
  size: string;
}

export interface RiskScoreBreakdown {
  baseScore: number;
  locationRisk: number;
  constructionRisk: number;
  occupancyRisk: number;
  protectionCredit: number;
  adjacentRisk: number;
  roofCondition: number;
  fireStationProximity: number;
  floodZoneRisk: number;
  total: number;
}

export function calculateRiskScore(property: Property): RiskScoreBreakdown {
  let baseScore = 50;
  const locationRisk = property.nearCoast ? 8 : 0;
  const constructionRisk = property.constructionMaterial === "Steel" ? -5 : property.constructionMaterial === "Wood" ? 15 : 5;
  const occupancyRisk = property.type === "warehouse" ? 10 : property.type === "industrial" ? 12 : 3;
  const protectionCredit = (property.fireProtection.sprinklers ? -8 : 0) + (property.fireProtection.alarms ? -3 : 0) + (property.fireProtection.hydrantNearby ? -5 : 0);
  const adjacentRisk = property.nearIndustrial ? 10 : 0;
  const roofCondition = property.roofCondition === "poor" ? 8 : property.roofCondition === "fair" ? 4 : 0;
  const fireStationProximity = -5;
  const floodZoneRisk = property.floodZone ? 12 : 0;
  const total = Math.max(0, Math.min(100, baseScore + locationRisk + constructionRisk + occupancyRisk + protectionCredit + adjacentRisk + roofCondition + fireStationProximity + floodZoneRisk));
  return { baseScore, locationRisk, constructionRisk, occupancyRisk, protectionCredit, adjacentRisk, roofCondition, fireStationProximity, floodZoneRisk, total };
}

export const mockProperties: Property[] = [
  {
    id: "prop-001",
    name: "Burj Khalifa",
    address: "1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai",
    city: "Dubai",
    country: "UAE",
    lat: 25.1972,
    lng: 55.2744,
    type: "office",
    constructionMaterial: "Reinforced Concrete & Steel",
    floors: 163,
    yearBuilt: 2010,
    occupancy: "Mixed-Use — Office, Residential, Hotel (Armani)",
    occupancyCapacity: 12000,
    sumInsured: 1500000000,
    fireProtection: { sprinklers: true, alarms: true, extinguishers: true, hydrantNearby: true },
    electricalCondition: "good",
    plumbingCondition: "good",
    roofCondition: "good",
    status: "approved",
    broker: "Marsh McLennan UAE",
    submissionDate: "2026-04-15",
    riskScore: 38,
    images: [],
    floodZone: false,
    nearCoast: false,
    nearIndustrial: false,
    insurerName: "AXA Gulf",
    shareOffered: 25,
    reinsuranceBroker: "Guy Carpenter",
    riskStartDate: "2026-07-01",
    dateApproached: "2026-04-10",
    aiInsights: [
      { id: "ai-1", text: "World's tallest building — extreme high-rise premium applies (163 floors). Evacuation time estimated 2+ hours for full building", severity: "high", confidence: 98, category: "structural", status: "pending", sourceRef: { documentId: "doc-3", documentName: "Structural Engineering Report.pdf", section: "Section 4.2 — Vertical Evacuation Analysis", page: 12 } },
      { id: "ai-2", text: "Aluminium & glass cladding — potential fire spread risk similar to Address Hotel 2015 incident. Panels meet post-2017 UAE fire code", severity: "medium", confidence: 88, category: "fire", status: "pending", sourceRef: { documentId: "doc-2", documentName: "Emaar Fire Safety Certificate 2026.pdf", section: "Cladding Compliance — Appendix B", page: 8 } },
      { id: "ai-3", text: "Full advanced fire suppression: pressurized refuge floors every 25 stories, dedicated firefighting elevator shafts, and zoned sprinkler system", severity: "low", confidence: 97, category: "fire", status: "accepted", sourceRef: { documentId: "doc-2", documentName: "Emaar Fire Safety Certificate 2026.pdf", section: "Section 3.1 — Active Protection Systems", page: 5 } },
      { id: "ai-4", text: "Wind load exposure at 828m height — structural sway within design tolerance but contents damage risk during storms", severity: "medium", confidence: 85, category: "environmental", status: "pending", sourceRef: { documentId: "doc-3", documentName: "Structural Engineering Report.pdf", section: "Section 6 — Wind Load Analysis", page: 24 } },
      { id: "ai-5", text: "Aggregation risk: Armani Hotel + corporate offices + residential = multi-line exposure in single structure", severity: "high", confidence: 92, category: "security", status: "pending", sourceRef: { documentId: "doc-1", documentName: "Burj Khalifa Master Policy Proposal.pdf", section: "Section 2 — Occupancy Schedule", page: 3 } },
    ],
    documents: [
      { id: "doc-1", name: "Burj Khalifa Master Policy Proposal.pdf", type: "proposal", uploadDate: "2026-04-15", size: "12.4 MB" },
      { id: "doc-2", name: "Emaar Fire Safety Certificate 2026.pdf", type: "certificate", uploadDate: "2026-04-10", size: "3.1 MB" },
      { id: "doc-3", name: "Structural Engineering Report.pdf", type: "survey", uploadDate: "2026-04-08", size: "18.5 MB" },
    ],
  },
  {
    id: "prop-002",
    name: "Emirates Towers",
    address: "Sheikh Zayed Road, Trade Centre Area",
    city: "Dubai",
    country: "UAE",
    lat: 25.2173,
    lng: 55.2821,
    type: "office",
    constructionMaterial: "Reinforced Concrete",
    floors: 54,
    yearBuilt: 2000,
    occupancy: "Grade A Office & Jumeirah Emirates Towers Hotel",
    occupancyCapacity: 6000,
    sumInsured: 450000000,
    fireProtection: { sprinklers: true, alarms: true, extinguishers: true, hydrantNearby: true },
    electricalCondition: "good",
    plumbingCondition: "fair",
    roofCondition: "good",
    status: "approved",
    broker: "Aon Risk Solutions",
    submissionDate: "2026-04-20",
    riskScore: 32,
    images: [],
    floodZone: false,
    nearCoast: false,
    nearIndustrial: false,
    insurerName: "Oman Insurance Co.",
    shareOffered: 30,
    reinsuranceBroker: "Aon Reinsurance",
    riskStartDate: "2026-08-01",
    dateApproached: "2026-04-15",
    aiInsights: [
      { id: "ai-6", text: "Building age 26 years — MEP systems require lifecycle assessment. Plumbing rated fair", severity: "medium", confidence: 85, category: "structural", status: "pending" },
      { id: "ai-7", text: "Twin tower design — dual-tower fire separation meets code but shared podium creates interconnected risk", severity: "medium", confidence: 82, category: "fire", status: "pending" },
      { id: "ai-8", text: "Government tenancies (DEWA, courts) — high business interruption exposure if offices rendered unusable", severity: "medium", confidence: 90, category: "security", status: "pending" },
    ],
    documents: [
      { id: "doc-4", name: "Emirates Towers Policy Renewal.pdf", type: "proposal", uploadDate: "2026-04-20", size: "5.2 MB" },
      { id: "doc-5", name: "MEP Condition Assessment.pdf", type: "survey", uploadDate: "2026-04-18", size: "7.8 MB" },
    ],
  },
  {
    id: "prop-003",
    name: "Dubai Aluminium (DUBAL) Smelter",
    address: "Jebel Ali Industrial Area",
    city: "Dubai",
    country: "UAE",
    lat: 25.0024,
    lng: 55.0595,
    type: "industrial",
    constructionMaterial: "Steel & Pre-engineered Metal",
    floors: 1,
    yearBuilt: 1979,
    occupancy: "Aluminium Smelting & Manufacturing (Emirates Global Aluminium)",
    occupancyCapacity: 3500,
    sumInsured: 800000000,
    fireProtection: { sprinklers: false, alarms: true, extinguishers: true, hydrantNearby: false },
    electricalCondition: "fair",
    plumbingCondition: "fair",
    roofCondition: "poor",
    status: "referred",
    broker: "Willis Towers Watson",
    submissionDate: "2026-04-10",
    riskScore: 85,
    images: [],
    floodZone: false,
    nearCoast: true,
    nearIndustrial: true,
    insurerName: "Dubai Insurance Co.",
    shareOffered: 15,
    reinsuranceBroker: "Willis Re",
    riskStartDate: "2026-06-15",
    dateApproached: "2026-04-01",
    aiInsights: [
      { id: "ai-9", text: "Molten aluminium at 960°C — catastrophic fire/explosion risk. 2019 potline incident caused AED 120M damage", severity: "high", confidence: 98, category: "fire", status: "pending" },
      { id: "ai-10", text: "Facility age 47 years — oldest industrial plant in Jebel Ali. Multiple expansion phases create non-uniform structural integrity", severity: "high", confidence: 94, category: "structural", status: "pending" },
      { id: "ai-11", text: "No sprinkler system in smelting halls (incompatible with molten metal operations) — reliance on foam suppression and blast shields", severity: "high", confidence: 96, category: "fire", status: "pending" },
      { id: "ai-12", text: "Coastal location — salt corrosion detected on structural steel members, accelerated degradation of roofing", severity: "medium", confidence: 88, category: "environmental", status: "pending" },
      { id: "ai-13", text: "Hazardous emissions: fluoride & SO2 — environmental liability exposure. Adjacent to Jebel Ali Port", severity: "medium", confidence: 85, category: "environmental", status: "pending" },
    ],
    documents: [
      { id: "doc-6", name: "EGA DUBAL Risk Submission.pdf", type: "proposal", uploadDate: "2026-04-10", size: "15.3 MB" },
      { id: "doc-7", name: "Environmental Compliance Report.pdf", type: "report", uploadDate: "2026-04-08", size: "9.1 MB" },
      { id: "doc-8", name: "Smelter Inspection Photos.zip", type: "photo", uploadDate: "2026-04-05", size: "85 MB" },
    ],
  },
  {
    id: "prop-004",
    name: "The Dubai Mall",
    address: "Financial Center Road, Downtown Dubai",
    city: "Dubai",
    country: "UAE",
    lat: 25.1985,
    lng: 55.2796,
    type: "retail",
    constructionMaterial: "Reinforced Concrete",
    floors: 4,
    yearBuilt: 2008,
    occupancy: "Mega Retail Mall — 1,200+ stores, Aquarium, Ice Rink",
    occupancyCapacity: 80000,
    sumInsured: 2200000000,
    fireProtection: { sprinklers: true, alarms: true, extinguishers: true, hydrantNearby: true },
    electricalCondition: "good",
    plumbingCondition: "good",
    roofCondition: "good",
    status: "pending",
    broker: "Lockton MENA",
    submissionDate: "2026-04-30",
    riskScore: 42,
    images: [],
    floodZone: true,
    nearCoast: false,
    nearIndustrial: false,
    insurerName: "Orient Insurance PJSC",
    shareOffered: 20,
    reinsuranceBroker: "Gallagher Re",
    riskStartDate: "2026-09-01",
    dateApproached: "2026-04-25",
    aiInsights: [
      { id: "ai-14", text: "80,000 daily visitors — extreme liability and evacuation complexity. 2024 Dubai floods caused lower-level water ingress", severity: "high", confidence: 95, category: "flood", status: "pending" },
      { id: "ai-15", text: "Dubai Aquarium (10M litres) — structural failure would cause massive water damage to adjacent retail levels", severity: "high", confidence: 90, category: "structural", status: "pending" },
      { id: "ai-16", text: "Indoor ice rink refrigeration system — ammonia leak risk. Dedicated containment protocols in place", severity: "medium", confidence: 82, category: "environmental", status: "pending" },
      { id: "ai-17", text: "Full fire compartmentalization with smoke extraction — meets international standards", severity: "low", confidence: 96, category: "fire", status: "accepted" },
    ],
    documents: [
      { id: "doc-9", name: "Dubai Mall Master Policy Proposal.pdf", type: "proposal", uploadDate: "2026-04-30", size: "8.9 MB" },
      { id: "doc-10", name: "Flood Risk Assessment Post-2024.pdf", type: "report", uploadDate: "2026-04-28", size: "6.4 MB" },
    ],
  },
  {
    id: "prop-005",
    name: "ADNOC Ruwais Refinery",
    address: "Ruwais Industrial Complex, Al Dhafra Region",
    city: "Abu Dhabi",
    country: "UAE",
    lat: 24.1103,
    lng: 52.7306,
    type: "industrial",
    constructionMaterial: "Steel & Reinforced Concrete",
    floors: 1,
    yearBuilt: 1981,
    occupancy: "Oil Refining & Petrochemical Processing — 922,000 bpd capacity",
    occupancyCapacity: 5000,
    sumInsured: 5000000000,
    fireProtection: { sprinklers: true, alarms: true, extinguishers: true, hydrantNearby: true },
    electricalCondition: "good",
    plumbingCondition: "fair",
    roofCondition: "fair",
    status: "referred",
    broker: "Marsh McLennan UAE",
    submissionDate: "2026-03-20",
    riskScore: 78,
    images: [],
    floodZone: false,
    nearCoast: true,
    nearIndustrial: true,
    insurerName: "ADNIC",
    shareOffered: 10,
    reinsuranceBroker: "Swiss Re Corporate Solutions",
    riskStartDate: "2026-05-01",
    dateApproached: "2026-03-10",
    aiInsights: [
      { id: "ai-18", text: "World's largest integrated refinery — single-location PML estimated AED 8B+. Vapour cloud explosion (VCE) scenario modelled", severity: "high", confidence: 99, category: "fire", status: "pending" },
      { id: "ai-19", text: "45-year-old facility with continuous upgrades — ADNOC invested $45B in Ruwais expansion (2025). Mixed-age infrastructure", severity: "high", confidence: 92, category: "structural", status: "pending" },
      { id: "ai-20", text: "Coastal desert location — sandstorm abrasion on pipework, salt-laden humidity accelerates corrosion", severity: "medium", confidence: 87, category: "environmental", status: "pending" },
      { id: "ai-21", text: "On-site fire brigade with foam trucks — response time <3 minutes. Dedicated helipad for emergency evacuation", severity: "low", confidence: 95, category: "fire", status: "accepted" },
      { id: "ai-22", text: "Business interruption: refinery shutdown = AED 500M+/month in lost production. Contingent BI extends to ADNOC downstream", severity: "high", confidence: 96, category: "security", status: "pending" },
    ],
    documents: [
      { id: "doc-11", name: "ADNOC Ruwais Energy Package Submission.pdf", type: "proposal", uploadDate: "2026-03-20", size: "25.0 MB" },
      { id: "doc-12", name: "Process Safety Audit 2026.pdf", type: "survey", uploadDate: "2026-03-15", size: "14.2 MB" },
      { id: "doc-13", name: "Corrosion Under Insulation Report.pdf", type: "report", uploadDate: "2026-03-10", size: "8.7 MB" },
    ],
  },
  {
    id: "prop-006",
    name: "Etihad Towers",
    address: "Corniche Road, Al Ras Al Akhdar",
    city: "Abu Dhabi",
    country: "UAE",
    lat: 24.4620,
    lng: 54.3310,
    type: "residential",
    constructionMaterial: "Reinforced Concrete",
    floors: 79,
    yearBuilt: 2011,
    occupancy: "Luxury Residential, Office & Conrad Hotel",
    occupancyCapacity: 3500,
    sumInsured: 650000000,
    fireProtection: { sprinklers: true, alarms: true, extinguishers: true, hydrantNearby: true },
    electricalCondition: "good",
    plumbingCondition: "good",
    roofCondition: "good",
    status: "approved",
    broker: "Gallagher MENA",
    submissionDate: "2026-04-10",
    riskScore: 30,
    images: [],
    floodZone: false,
    nearCoast: true,
    nearIndustrial: false,
    insurerName: "Abu Dhabi National Insurance",
    shareOffered: 35,
    reinsuranceBroker: "Holborn Insurance Brokers",
    riskStartDate: "2026-07-15",
    dateApproached: "2026-04-05",
    aiInsights: [
      { id: "ai-23", text: "5-tower complex on Corniche — iconic Abu Dhabi landmark. Observation deck at 300m (Tower 2) adds public liability", severity: "medium", confidence: 88, category: "security", status: "pending" },
      { id: "ai-24", text: "Seafront location — moderate salt spray corrosion on façade. Exterior maintenance programme active", severity: "low", confidence: 80, category: "environmental", status: "pending" },
      { id: "ai-25", text: "Full fire protection with refuge floors — compliant with Abu Dhabi Civil Defence standards", severity: "low", confidence: 95, category: "fire", status: "accepted" },
    ],
    documents: [
      { id: "doc-14", name: "Etihad Towers Portfolio Proposal.pdf", type: "proposal", uploadDate: "2026-04-10", size: "6.1 MB" },
      { id: "doc-15", name: "Façade Condition Survey.pdf", type: "survey", uploadDate: "2026-04-05", size: "4.3 MB" },
    ],
  },
  {
    id: "prop-007",
    name: "Viva Enterprise Distribution Centre",
    address: "Plot No. S60323, Jebel Ali Free Zone South",
    city: "Dubai",
    country: "UAE",
    lat: 24.931270,
    lng: 55.104961,
    type: "warehouse",
    constructionMaterial: "Steel & Sandwich Panel (LNC/Kirby)",
    floors: 1,
    yearBuilt: 2024,
    occupancy: "Distribution Centre — Supermarket Supply Chain (Viva Supermarket / Landmark Group)",
    occupancyCapacity: 500,
    sumInsured: 155000000,
    fireProtection: { sprinklers: true, alarms: true, extinguishers: true, hydrantNearby: true },
    electricalCondition: "good",
    plumbingCondition: "good",
    roofCondition: "good",
    status: "pending",
    broker: "Orient Insurance PJSC",
    submissionDate: "2025-06-10",
    riskScore: 45,
    images: [],
    floodZone: false,
    nearCoast: false,
    nearIndustrial: true,
    insurerName: "Orient Insurance PJSC",
    shareOffered: 100,
    reinsuranceBroker: "Howden Re",
    riskStartDate: "2025-07-01",
    dateApproached: "2025-06-01",
    aiInsights: [
      { id: "ai-v1", text: "Sandwich panel roof with PIR insulation (Kingspan 80mm) — combustible core risk. DCL certified and Dubai Civil Defense approved, but fire spread through panel joints remains a concern for warehouse fires", severity: "high", confidence: 94, category: "fire", status: "pending", sourceRef: { documentId: "doc-v1", documentName: "Risk Survey Report SRV-2025-1294.pdf", section: "Construction Details", page: 5 } },
      { id: "ai-v2", text: "44,600 sqm warehouse with 19.5m roof height — ESFR sprinklers (K11.2 & K8.0) with in-rack sprinklers (K5.6) provide comprehensive coverage. Pre-action system in cold chambers. Fire pump capacity 2,500 GPM with 300,000 gallon reserve", severity: "low", confidence: 97, category: "fire", status: "accepted", sourceRef: { documentId: "doc-v1", documentName: "Risk Survey Report SRV-2025-1294.pdf", section: "Protection and Detection Systems", page: 11 } },
      { id: "ai-v3", text: "Cold storage chambers (freezer at -24°C, chiller at 5-9°C) — ammonia refrigeration leak risk. Refrigeration plant room detached from warehouse, reducing blast exposure", severity: "medium", confidence: 88, category: "environmental", status: "pending", sourceRef: { documentId: "doc-v1", documentName: "Risk Survey Report SRV-2025-1294.pdf", section: "Occupancy", page: 7 } },
      { id: "ai-v4", text: "Adjacent to Landmark Group Mega DC Warehouse with only 25m gap separation — fire spread exposure between buildings. Shared fire pump system creates single point of failure for fire suppression", severity: "high", confidence: 91, category: "fire", status: "pending", sourceRef: { documentId: "doc-v1", documentName: "Risk Survey Report SRV-2025-1294.pdf", section: "Exposure Details", page: 15 } },
      { id: "ai-v5", text: "Building age 1 year (built 2024) — new construction with modern fire code compliance. 174 smoke vents and skylights in roof. 22 emergency exits. 24 staff trained for firefighting with half-yearly drills", severity: "low", confidence: 96, category: "structural", status: "accepted", sourceRef: { documentId: "doc-v1", documentName: "Risk Survey Report SRV-2025-1294.pdf", section: "Management Control System", page: 18 } },
      { id: "ai-v6", text: "111 loading bays — high vehicle traffic creates ignition source risk. Forklift battery charging stations identified as fire ignition hazard requiring dedicated ventilation", severity: "medium", confidence: 85, category: "fire", status: "pending", sourceRef: { documentId: "doc-v1", documentName: "Risk Survey Report SRV-2025-1294.pdf", section: "Occupancy Details", page: 8 } },
      { id: "ai-v7", text: "Combustible stock (food and non-food items) stored in racks over pallets up to 12.34m height — significant fire load. Storage height maintained and demarcations in place", severity: "medium", confidence: 90, category: "fire", status: "pending", sourceRef: { documentId: "doc-v1", documentName: "Risk Survey Report SRV-2025-1294.pdf", section: "Occupancy Details", page: 8 } },
      { id: "ai-v8", text: "Swiss Re CatNet assessment: Low risk across all natural hazards (flood, wind, earthquake, subsidence). No accumulation exposure identified", severity: "low", confidence: 95, category: "environmental", status: "accepted", sourceRef: { documentId: "doc-v1", documentName: "Risk Survey Report SRV-2025-1294.pdf", section: "Natural Hazard Map", page: 16 } },
    ],
    documents: [
      { id: "doc-v1", name: "Risk Survey Report SRV-2025-1294.pdf", type: "survey", uploadDate: "2025-06-10", size: "4.8 MB" },
      { id: "doc-v2", name: "Viva Enterprise Policy Proposal.pdf", type: "proposal", uploadDate: "2025-06-08", size: "2.1 MB" },
      { id: "doc-v3", name: "Kingspan Roof Panel Fire Certificate.pdf", type: "certificate", uploadDate: "2025-06-05", size: "1.2 MB" },
      { id: "doc-v4", name: "Fire Pump Test Records 2025.pdf", type: "report", uploadDate: "2025-06-03", size: "3.5 MB" },
      { id: "doc-v5", name: "Swiss Re CatNet Report.pdf", type: "report", uploadDate: "2025-06-01", size: "2.8 MB" },
      { id: "doc-v6", name: "Warehouse Survey Photos.zip", type: "photo", uploadDate: "2025-06-10", size: "45 MB" },
    ],
  },
  {
    id: "prop-008",
    name: "Al Fattan Currency House",
    address: "Tower 1 & 2, Plot No. GB-02, DIFC",
    city: "Dubai",
    country: "UAE",
    lat: 25.212399,
    lng: 55.281308,
    type: "office",
    constructionMaterial: "Reinforced Concrete with ACP Cladding",
    floors: 34,
    yearBuilt: 2009,
    occupancy: "Grade A Office — Twin Towers (4B+G+10 & 4B+G+34) with Retail Pavilion, DIFC",
    occupancyCapacity: 5000,
    sumInsured: 2_108_200_000,
    fireProtection: { sprinklers: true, alarms: true, extinguishers: true, hydrantNearby: true },
    electricalCondition: "good",
    plumbingCondition: "good",
    roofCondition: "good",
    status: "pending",
    broker: "Al Hilal Takaful",
    submissionDate: "2026-05-01",
    riskScore: 48,
    images: [],
    floodZone: false,
    nearCoast: false,
    nearIndustrial: false,
    insurerName: "Al Hilal Takaful",
    shareOffered: 40,
    reinsuranceBroker: "Guy Carpenter",
    riskStartDate: "2026-06-01",
    dateApproached: "2026-04-28",
    aiInsights: [
      { id: "ai-af1", text: "Non-fire rated ACP cladding on both towers (40% ACP + 60% glass) — significant fire spread risk to external façade. Similar cladding implicated in several UAE high-rise fires (Address Hotel 2015, Torch Tower 2017). Documentation of insulation type not confirmed by facility management.", severity: "high", confidence: 96, category: "fire", status: "pending", sourceRef: { documentId: "doc-af2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-03 — ACP Panel Documentation", page: 5 } },
      { id: "ai-af2", text: "Emergency diesel generator day tanks have NO containment/bunding — leaking fuel could spread and ignite. AIG flagged as Important Physical Protection improvement. Loss expectancy AED 7M before fix, AED 200K after. Client agreed to remediate.", severity: "high", confidence: 94, category: "fire", status: "pending", sourceRef: { documentId: "doc-af2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-06 — Diesel Day Tank Containment", page: 7 } },
      { id: "ai-af3", text: "LPG tanks on podium roof lack seismic shutoff valve on main gas supply line. Facility is in Earthquake MR Zone 2. Fire following earthquake often causes more damage than shaking. Loss expectancy AED 9.5M before fix, AED 300K after.", severity: "high", confidence: 92, category: "structural", status: "pending", sourceRef: { documentId: "doc-af2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-07 — Seismic Protection LPG", page: 7 } },
      { id: "ai-af4", text: "~95% of site has automatic fire protection and detection. Wet-pipe sprinkler system throughout both towers, podium, and basements. However, sprinkler system lacks seismic bracing per NFPA 13 — risk of pipe breakage during earthquake.", severity: "medium", confidence: 90, category: "fire", status: "pending", sourceRef: { documentId: "doc-af2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-08 — Seismic Bracing Sprinklers", page: 7 } },
      { id: "ai-af5", text: "Twin tower design with shared 4-level basement and 3-level podium — interconnected risk. Tower separation above podium is ~20m. A fire in the podium or basement could simultaneously affect both towers and the Pavilion.", severity: "medium", confidence: 88, category: "fire", status: "pending", sourceRef: { documentId: "doc-af1", documentName: "Al Fattan Currency House PAR Slip 2020.pdf", section: "Location / Premises", page: 1 } },
      { id: "ai-af6", text: "Total Sum Insured AED 2.108B — dominated by Building value (AED 1.5B) and Loss of Rent (AED 450M / 36 months). Very high BI exposure for DIFC Grade A office space. Loss of Attraction sublimit AED 100M (leased + unleased).", severity: "medium", confidence: 95, category: "security", status: "accepted", sourceRef: { documentId: "doc-af1", documentName: "Al Fattan Currency House PAR Slip 2020.pdf", section: "Total Sum Insured Schedule", page: 2 } },
      { id: "ai-af7", text: "Building age 17 years (built 2009). DEWA transformer maintenance program details not available at time of AIG survey. Oil-filled transformers pose fire risk without confirmed preventive maintenance schedule.", severity: "medium", confidence: 82, category: "structural", status: "pending", sourceRef: { documentId: "doc-af2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-04 — DEWA Transformers", page: 6 } },
      { id: "ai-af8", text: "Comprehensive policy extensions including Machinery Breakdown (AED 2M first loss), Alternative Accommodation (AED 150M), Demolition (AED 20M), Public Authorities (AED 50M), and full subsidence cover per LM7.", severity: "low", confidence: 97, category: "security", status: "accepted", sourceRef: { documentId: "doc-af1", documentName: "Al Fattan Currency House PAR Slip 2020.pdf", section: "Conditions / Extensions / Clauses", page: 3 } },
    ],
    documents: [
      { id: "doc-af1", name: "Al Fattan Currency House PAR Slip 2020.pdf", type: "proposal", uploadDate: "2026-05-01", size: "2.4 MB" },
      { id: "doc-af2", name: "AIG Property Risk Improvement Report.pdf", type: "survey", uploadDate: "2026-05-01", size: "4.8 MB" },
      { id: "doc-af3", name: "Al Fattan Tower Full View.jpg", type: "photo", uploadDate: "2026-05-01", size: "1.2 MB" },
      { id: "doc-af4", name: "Al Fattan Podium View.jpg", type: "photo", uploadDate: "2026-05-01", size: "0.9 MB" },
      { id: "doc-af5", name: "Al Fattan Pavilion Area.jpg", type: "photo", uploadDate: "2026-05-01", size: "1.1 MB" },
      { id: "doc-af6", name: "Al Fattan Signage Close-up.jpg", type: "photo", uploadDate: "2026-05-01", size: "0.8 MB" },
    ],
  },
  {
    id: "prop-009",
    name: "Al Fattan Currency House [GPT-5 Mini]",
    address: "Tower 1 & 2, Plot No. GB-02, DIFC",
    city: "Dubai",
    country: "UAE",
    lat: 25.212399,
    lng: 55.281308,
    type: "office",
    constructionMaterial: "Reinforced Concrete with ACP Cladding",
    floors: 34,
    yearBuilt: 2009,
    occupancy: "Grade A Office — Twin Towers (4B+G+10 & 4B+G+34) with Retail Pavilion, DIFC",
    occupancyCapacity: 5000,
    sumInsured: 2_108_200_000,
    fireProtection: { sprinklers: true, alarms: true, extinguishers: true, hydrantNearby: true },
    electricalCondition: "good",
    plumbingCondition: "good",
    roofCondition: "good",
    status: "pending",
    broker: "Al Hilal Takaful",
    submissionDate: "2026-05-04",
    riskScore: 72,
    images: ["/images/al-fattan-gpt-tower.jpg", "/images/al-fattan-gpt-signage.jpg", "/images/al-fattan-gpt-pavilion.jpg", "/images/al-fattan-gpt-podium.jpg"],
    floodZone: false,
    nearCoast: false,
    nearIndustrial: false,
    insurerName: "Al Hilal Takaful",
    shareOffered: 40,
    reinsuranceBroker: "Guy Carpenter",
    riskStartDate: "2026-06-01",
    dateApproached: "2026-05-01",
    aiInsights: [
      { id: "ai-gpt1", text: "Non fire-rated ACP cladding on ~40% of façades with unverified insulation (claimed rockwool but no documentation). This creates a high risk of rapid external fire spread and vertical propagation between floors, increasing potential for total loss and occupant exposure. Regulatory non-compliance and elevated reinstatement costs likely.", severity: "high", confidence: 92, category: "fire", status: "pending", sourceRef: { documentId: "doc-gpt2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-03 — ACP Panel Documentation", page: 5 } },
      { id: "ai-gpt2", text: "Diesel day tanks located inside the EDG room have no secondary containment (NFPA 30 violation). This presents both a significant fire ignition risk and an environmental contamination risk from fuel spillage, plus likely regulatory breach and increased cleanup and BI exposure.", severity: "high", confidence: 90, category: "environmental", status: "pending", sourceRef: { documentId: "doc-gpt2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-06 — Diesel Day Tank Containment", page: 7 } },
      { id: "ai-gpt3", text: "LPG tanks on the podium roof lack seismic shutoff valves despite being in MR Zone 2. In a seismic event this could lead to pipe/tank rupture with catastrophic fire/explosion consequences and inability to quickly isolate fuel supply.", severity: "high", confidence: 85, category: "fire", status: "pending", sourceRef: { documentId: "doc-gpt2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-07 — Seismic Protection LPG", page: 7 } },
      { id: "ai-gpt4", text: "Sprinkler and associated pipework are reported to lack seismic bracing per NFPA 13. Unbraced systems may fail during seismic activity, resulting in loss of water-based suppression and elevated damage and BI exposure following an earthquake.", severity: "medium", confidence: 82, category: "structural", status: "pending", sourceRef: { documentId: "doc-gpt2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-08 — Seismic Bracing Sprinklers", page: 7 } },
      { id: "ai-gpt5", text: "Foam deluge and water deluge systems lack available design documentation and hydraulic details. Without verified design/coverage, these systems may be ineffective for fuel/chemical fires in plant or loading areas, endangering fire control and increasing potential loss severity.", severity: "medium", confidence: 78, category: "fire", status: "pending", sourceRef: { documentId: "doc-gpt2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-05 — Deluge System Details", page: 6 } },
      { id: "ai-gpt6", text: "DEWA-owned transformers (oil-filled) have no documented maintenance/inspection programme. Transformer oil leaks, degradation or failure can cause fires, explosions, and environmental contamination; unknown maintenance increases likelihood of undetected deterioration.", severity: "medium", confidence: 75, category: "environmental", status: "pending", sourceRef: { documentId: "doc-gpt2", documentName: "AIG Property Risk Improvement Report.pdf", section: "Risk Improvement 19-04-04 — DEWA Transformers", page: 6 } },
      { id: "ai-gpt7", text: "Operational controls are weak: emergency procedures and formal hot work management are absent/insufficient, and there is no requirement to notify insurer for fire protection impairments exceeding 8 hours. These gaps increase risk frequency and magnitude due to human/contractor activity and impaired suppression.", severity: "medium", confidence: 82, category: "security", status: "pending" },
      { id: "ai-gpt8", text: "Building configuration exposures: two towers separated by ~20m above shared podium and common 4-level basements. Shared services, common podium roof plant (LPG, EDG), and high-rise verticality increase risk of cascading losses and extended business interruption if podium-level loss compromises both towers.", severity: "medium", confidence: 80, category: "structural", status: "pending", sourceRef: { documentId: "doc-gpt1", documentName: "Al Fattan Currency House PAR Slip 2020.pdf", section: "Location / Premises", page: 1 } },
    ],
    documents: [
      { id: "doc-gpt1", name: "Al Fattan Currency House PAR Slip 2020.docx", type: "proposal", uploadDate: "2026-05-04", size: "1.8 MB" },
      { id: "doc-gpt2", name: "AIG Property Risk Improvement Report.pdf", type: "survey", uploadDate: "2026-05-04", size: "4.8 MB" },
      { id: "doc-gpt3", name: "Al Fattan Tower Full View.jpg", type: "photo", uploadDate: "2026-05-04", size: "1.2 MB" },
      { id: "doc-gpt4", name: "Al Fattan Currency House Signage.jpg", type: "photo", uploadDate: "2026-05-04", size: "0.9 MB" },
      { id: "doc-gpt5", name: "Al Fattan Pavilion Area.jpg", type: "photo", uploadDate: "2026-05-04", size: "1.1 MB" },
      { id: "doc-gpt6", name: "Al Fattan Podium View.jpg", type: "photo", uploadDate: "2026-05-04", size: "0.8 MB" },
    ],
  },
];

export const floodZonePolygons = [
  {
    id: "fz-1",
    name: "Downtown Dubai Flood Zone (2024 Flood Impact Area)",
    positions: [
      [25.190, 55.265] as [number, number],
      [25.190, 55.290] as [number, number],
      [25.205, 55.290] as [number, number],
      [25.205, 55.265] as [number, number],
    ],
  },
  {
    id: "fz-2",
    name: "Ruwais Coastal Surge Zone",
    positions: [
      [24.100, 52.715] as [number, number],
      [24.100, 52.745] as [number, number],
      [24.120, 52.745] as [number, number],
      [24.120, 52.715] as [number, number],
    ],
  },
];

export const fireStations = [
  { id: "fs-1", name: "Rashidiya Civil Defence", lat: 25.2050, lng: 55.2750, radius: 2000 },
  { id: "fs-2", name: "Trade Centre Fire Station", lat: 25.2200, lng: 55.2800, radius: 1500 },
  { id: "fs-3", name: "Jebel Ali Fire Station", lat: 25.0050, lng: 55.0650, radius: 2500 },
  { id: "fs-4", name: "Abu Dhabi Corniche Fire Station", lat: 24.4650, lng: 54.3350, radius: 2000 },
  { id: "fs-5", name: "Ruwais Industrial Fire Brigade", lat: 24.1120, lng: 52.7350, radius: 3000 },
  { id: "fs-6", name: "JAFZA South Civil Defence", lat: 24.9350, lng: 55.1100, radius: 2000 },
];

export const industrialZones = [
  {
    id: "iz-1",
    name: "Jebel Ali Industrial Area",
    positions: [
      [24.990, 55.040] as [number, number],
      [24.990, 55.080] as [number, number],
      [25.015, 55.080] as [number, number],
      [25.015, 55.040] as [number, number],
    ],
  },
  {
    id: "iz-2",
    name: "Ruwais Industrial Complex",
    positions: [
      [24.095, 52.710] as [number, number],
      [24.095, 52.755] as [number, number],
      [24.125, 52.755] as [number, number],
      [24.125, 52.710] as [number, number],
    ],
  },
];

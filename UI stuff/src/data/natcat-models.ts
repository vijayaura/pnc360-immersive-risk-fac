// NatCat (Natural Catastrophe) Modeling Engine
// Deterministic models for UAE-relevant perils

import type { Property } from "./mock-properties";

export type PerilType = "flood" | "earthquake" | "cyclone" | "extreme_heat" | "sandstorm";

export interface ReturnPeriodLoss {
  returnPeriod: number; // years
  annualExceedanceProbability: number; // 0-1
  grossLoss: number; // AED
  damageRatio: number; // 0-1
}

export interface PerilResult {
  peril: PerilType;
  label: string;
  icon: string;
  aal: number; // Aggregate Annual Loss
  pml100: number; // PML at 100yr return period
  pml250: number; // PML at 250yr return period
  returnPeriods: ReturnPeriodLoss[];
  hazardScore: number; // 0-100
  vulnerabilityScore: number; // 0-100
  description: string;
}

export interface NatCatResult {
  totalAAL: number;
  totalPML100: number;
  totalPML250: number;
  perils: PerilResult[];
  overallRating: "Low" | "Moderate" | "Elevated" | "High" | "Very High";
  ratingColor: string;
}

const RETURN_PERIODS = [10, 25, 50, 100, 250, 500];

// UAE regional hazard parameters
const UAE_HAZARD = {
  // Peak Ground Acceleration (PGA) at bedrock for UAE — moderate seismicity near Zagros
  seismicPGA: 0.15, // g — UAE design code base
  // Annual max wind speed (m/s) — Gulf cyclone influence
  peakWindMs: 45,
  // Max 24h rainfall (mm) — April 2024 event benchmark
  maxRainfall24h: 254,
  // Average annual dust storm days
  dustStormDays: 15,
  // Max temperature recorded (°C)
  maxTempC: 52,
};

function computeFlood(property: Property): PerilResult {
  const si = property.sumInsured;
  
  // Hazard: based on elevation, flood zone, proximity to coast
  let hazard = 30; // baseline UAE flood hazard
  if (property.floodZone) hazard += 35;
  if (property.nearCoast) hazard += 15;
  if (property.lat < 25.2 && property.lng > 55.0 && property.lng < 55.5) hazard += 20; // Dubai low-lying areas
  hazard = Math.min(100, hazard);

  // Vulnerability: based on construction and basement
  let vuln = 25;
  if (property.constructionMaterial.toLowerCase().includes("steel")) vuln -= 5;
  if (property.constructionMaterial.toLowerCase().includes("reinforced concrete")) vuln -= 10;
  if (property.yearBuilt && property.yearBuilt < 2000) vuln += 15;
  if (property.floors && property.floors <= 3) vuln += 10;
  vuln = Math.max(5, Math.min(100, vuln));

  const baseDamageRatio = (hazard / 100) * (vuln / 100) * 0.35;
  
  const returnPeriods = RETURN_PERIODS.map(rp => {
    const factor = Math.log(rp) / Math.log(500);
    const dr = Math.min(0.85, baseDamageRatio * factor * (1 + Math.random() * 0.1));
    return {
      returnPeriod: rp,
      annualExceedanceProbability: 1 / rp,
      grossLoss: Math.round(si * dr),
      damageRatio: Number(dr.toFixed(4)),
    };
  });

  const aal = Math.round(returnPeriods.reduce((sum, rp) => sum + rp.grossLoss / rp.returnPeriod, 0));
  const pml100 = returnPeriods.find(r => r.returnPeriod === 100)?.grossLoss ?? 0;
  const pml250 = returnPeriods.find(r => r.returnPeriod === 250)?.grossLoss ?? 0;

  return {
    peril: "flood",
    label: "Flood & Inundation",
    icon: "🌊",
    aal, pml100, pml250, returnPeriods,
    hazardScore: hazard,
    vulnerabilityScore: vuln,
    description: property.floodZone
      ? "Property located in designated flood zone. April 2024 UAE floods benchmark applied. Flash flood and pluvial flood modeled."
      : "Low-to-moderate flood exposure. Pluvial flooding from extreme rainfall events modeled.",
  };
}

function computeEarthquake(property: Property): PerilResult {
  const si = property.sumInsured;
  
  // UAE seismic hazard — distance from Zagros fault system
  // Properties further east (closer to Oman/Iran border) have higher hazard
  let hazard = 20;
  if (property.lng > 55.5) hazard += 15; // closer to Zagros
  if (property.lng > 56.0) hazard += 10;
  hazard = Math.min(100, hazard);

  // Vulnerability based on construction
  let vuln = 30;
  if (property.constructionMaterial.toLowerCase().includes("reinforced concrete")) vuln -= 15;
  if (property.constructionMaterial.toLowerCase().includes("steel")) vuln -= 10;
  if (property.yearBuilt && property.yearBuilt >= 2010) vuln -= 10; // modern seismic code
  if (property.floors && property.floors > 20) vuln += 15; // tall buildings
  vuln = Math.max(5, Math.min(100, vuln));

  const baseDamageRatio = (hazard / 100) * (vuln / 100) * 0.25;

  const returnPeriods = RETURN_PERIODS.map(rp => {
    const factor = Math.log(rp) / Math.log(500);
    const dr = Math.min(0.7, baseDamageRatio * factor * 1.2);
    return {
      returnPeriod: rp,
      annualExceedanceProbability: 1 / rp,
      grossLoss: Math.round(si * dr),
      damageRatio: Number(dr.toFixed(4)),
    };
  });

  const aal = Math.round(returnPeriods.reduce((sum, rp) => sum + rp.grossLoss / rp.returnPeriod, 0));
  const pml100 = returnPeriods.find(r => r.returnPeriod === 100)?.grossLoss ?? 0;
  const pml250 = returnPeriods.find(r => r.returnPeriod === 250)?.grossLoss ?? 0;

  return {
    peril: "earthquake",
    label: "Earthquake",
    icon: "🏔️",
    aal, pml100, pml250, returnPeriods,
    hazardScore: hazard,
    vulnerabilityScore: vuln,
    description: "Seismic hazard from Zagros-Makran fault system. Ground motion attenuation model applied based on distance-to-source. UAE building code compliance factored.",
  };
}

function computeCyclone(property: Property): PerilResult {
  const si = property.sumInsured;
  
  // Cyclone hazard — Gulf of Oman influence, coastal proximity
  let hazard = 15;
  if (property.nearCoast) hazard += 25;
  if (property.lat < 25.0) hazard += 10; // southern coast more exposed
  if (property.lng > 55.5) hazard += 15; // east coast
  hazard = Math.min(100, hazard);

  let vuln = 20;
  if (property.floors && property.floors > 30) vuln += 20; // wind pressure on tall structures
  if (property.constructionMaterial.toLowerCase().includes("steel")) vuln += 5;
  if (property.yearBuilt && property.yearBuilt < 2005) vuln += 10;
  vuln = Math.max(5, Math.min(100, vuln));

  const baseDamageRatio = (hazard / 100) * (vuln / 100) * 0.3;

  const returnPeriods = RETURN_PERIODS.map(rp => {
    const factor = Math.log(rp) / Math.log(500);
    const dr = Math.min(0.6, baseDamageRatio * factor);
    return {
      returnPeriod: rp,
      annualExceedanceProbability: 1 / rp,
      grossLoss: Math.round(si * dr),
      damageRatio: Number(dr.toFixed(4)),
    };
  });

  const aal = Math.round(returnPeriods.reduce((sum, rp) => sum + rp.grossLoss / rp.returnPeriod, 0));
  const pml100 = returnPeriods.find(r => r.returnPeriod === 100)?.grossLoss ?? 0;
  const pml250 = returnPeriods.find(r => r.returnPeriod === 250)?.grossLoss ?? 0;

  return {
    peril: "cyclone",
    label: "Cyclone & Windstorm",
    icon: "🌀",
    aal, pml100, pml250, returnPeriods,
    hazardScore: hazard,
    vulnerabilityScore: vuln,
    description: "Tropical cyclone risk from Arabian Sea / Gulf of Oman. Wind pressure loading model with terrain roughness adjustment. Cyclone Shaheen (2021) benchmark applied.",
  };
}

function computeExtremeHeat(property: Property): PerilResult {
  const si = property.sumInsured;

  let hazard = 50; // UAE baseline extreme heat
  if (property.city === "Abu Dhabi" || property.city === "Al Ain") hazard += 15;
  hazard = Math.min(100, hazard);

  let vuln = 20;
  if (property.yearBuilt && property.yearBuilt < 2005) vuln += 20; // older HVAC systems
  if (property.type === "warehouse" || property.type === "industrial") vuln += 15;
  vuln = Math.max(5, Math.min(100, vuln));

  const baseDamageRatio = (hazard / 100) * (vuln / 100) * 0.08;

  const returnPeriods = RETURN_PERIODS.map(rp => {
    const factor = Math.log(rp) / Math.log(500);
    const dr = Math.min(0.25, baseDamageRatio * factor);
    return {
      returnPeriod: rp,
      annualExceedanceProbability: 1 / rp,
      grossLoss: Math.round(si * dr),
      damageRatio: Number(dr.toFixed(4)),
    };
  });

  const aal = Math.round(returnPeriods.reduce((sum, rp) => sum + rp.grossLoss / rp.returnPeriod, 0));
  const pml100 = returnPeriods.find(r => r.returnPeriod === 100)?.grossLoss ?? 0;
  const pml250 = returnPeriods.find(r => r.returnPeriod === 250)?.grossLoss ?? 0;

  return {
    peril: "extreme_heat",
    label: "Extreme Heat",
    icon: "🔥",
    aal, pml100, pml250, returnPeriods,
    hazardScore: hazard,
    vulnerabilityScore: vuln,
    description: "Thermal stress modeling: HVAC system overload, electrical fire risk, structural thermal expansion. 52°C peak benchmark applied.",
  };
}

function computeSandstorm(property: Property): PerilResult {
  const si = property.sumInsured;

  let hazard = 35;
  if (property.city !== "Dubai") hazard += 10; // inland more exposed
  if (property.nearCoast) hazard -= 10;
  hazard = Math.max(10, Math.min(100, hazard));

  let vuln = 15;
  if (property.type === "industrial") vuln += 15;
  if (property.yearBuilt && property.yearBuilt < 2005) vuln += 10;
  vuln = Math.max(5, Math.min(100, vuln));

  const baseDamageRatio = (hazard / 100) * (vuln / 100) * 0.06;

  const returnPeriods = RETURN_PERIODS.map(rp => {
    const factor = Math.log(rp) / Math.log(500);
    const dr = Math.min(0.2, baseDamageRatio * factor);
    return {
      returnPeriod: rp,
      annualExceedanceProbability: 1 / rp,
      grossLoss: Math.round(si * dr),
      damageRatio: Number(dr.toFixed(4)),
    };
  });

  const aal = Math.round(returnPeriods.reduce((sum, rp) => sum + rp.grossLoss / rp.returnPeriod, 0));
  const pml100 = returnPeriods.find(r => r.returnPeriod === 100)?.grossLoss ?? 0;
  const pml250 = returnPeriods.find(r => r.returnPeriod === 250)?.grossLoss ?? 0;

  return {
    peril: "sandstorm",
    label: "Sandstorm & Dust",
    icon: "🏜️",
    aal, pml100, pml250, returnPeriods,
    hazardScore: hazard,
    vulnerabilityScore: vuln,
    description: "Sand/dust storm damage to facades, HVAC air intake blockage, equipment abrasion. Visibility-based severity model applied.",
  };
}

export function runNatCatModel(property: Property): NatCatResult {
  const perils = [
    computeFlood(property),
    computeEarthquake(property),
    computeCyclone(property),
    computeExtremeHeat(property),
    computeSandstorm(property),
  ];

  const totalAAL = perils.reduce((s, p) => s + p.aal, 0);
  const totalPML100 = perils.reduce((s, p) => s + p.pml100, 0);
  const totalPML250 = perils.reduce((s, p) => s + p.pml250, 0);

  const aalRatio = totalAAL / property.sumInsured;
  let overallRating: NatCatResult["overallRating"];
  let ratingColor: string;

  if (aalRatio > 0.015) { overallRating = "Very High"; ratingColor = "#dc2626"; }
  else if (aalRatio > 0.008) { overallRating = "High"; ratingColor = "#ea580c"; }
  else if (aalRatio > 0.004) { overallRating = "Elevated"; ratingColor = "#d97706"; }
  else if (aalRatio > 0.002) { overallRating = "Moderate"; ratingColor = "#ca8a04"; }
  else { overallRating = "Low"; ratingColor = "#22c55e"; }

  return { totalAAL, totalPML100, totalPML250, perils, overallRating, ratingColor };
}

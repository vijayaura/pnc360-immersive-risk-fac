export interface Claim {
  id: string;
  date: string;
  peril: "fire" | "flood" | "windstorm" | "earthquake" | "theft" | "liability" | "water_damage" | "electrical";
  description: string;
  grossPaid: number;
  netPaid: number;
  reserves: number;
  status: "closed" | "open" | "reopened";
}

export interface LossHistory {
  propertyId: string;
  claims: Claim[];
  fiveYearIncurred: number;
  burningCost: number; // as percentage of sum insured
  largestLoss: number;
  frequencyPerYear: number;
}

export function getLossHistory(propertyId: string, sumInsured: number, propertyClaims?: { date: string; peril: string; description: string; grossPaid: number; netPaid: number; reserves: number; status: "closed" | "open" | "reopened" }[]): LossHistory {
  const claimsMap: Record<string, Claim[]> = {
    "prop-001": [
      { id: "clm-001", date: "2024-06-15", peril: "water_damage", description: "Burst pipe on 42nd floor — water damage to 3 floors of office space", grossPaid: 2_400_000, netPaid: 1_800_000, reserves: 0, status: "closed" },
      { id: "clm-002", date: "2023-01-08", peril: "fire", description: "Electrical panel fire in parking level B2 — contained by sprinklers", grossPaid: 850_000, netPaid: 650_000, reserves: 0, status: "closed" },
      { id: "clm-003", date: "2022-11-20", peril: "windstorm", description: "Window panel dislodged during storm — façade repair on floor 98", grossPaid: 1_200_000, netPaid: 900_000, reserves: 150_000, status: "closed" },
    ],
    "prop-002": [
      { id: "clm-004", date: "2024-04-16", peril: "flood", description: "April 2024 Dubai floods — basement level fully submerged, stock loss", grossPaid: 45_000_000, netPaid: 32_000_000, reserves: 5_000_000, status: "open" },
      { id: "clm-005", date: "2023-07-12", peril: "fire", description: "Kitchen fire in food court — spread to 2 adjacent units", grossPaid: 8_500_000, netPaid: 6_200_000, reserves: 0, status: "closed" },
      { id: "clm-006", date: "2021-09-30", peril: "liability", description: "Slip and fall claim — visitor injured on wet floor", grossPaid: 350_000, netPaid: 350_000, reserves: 0, status: "closed" },
    ],
    "prop-003": [
      { id: "clm-007", date: "2024-04-16", peril: "flood", description: "April 2024 floods — ground floor water ingress, equipment damage", grossPaid: 3_200_000, netPaid: 2_400_000, reserves: 800_000, status: "open" },
      { id: "clm-008", date: "2022-03-15", peril: "electrical", description: "Transformer failure — business interruption 3 weeks", grossPaid: 1_500_000, netPaid: 1_100_000, reserves: 0, status: "closed" },
    ],
    "prop-004": [
      { id: "clm-009", date: "2025-02-10", peril: "fire", description: "Smelter pot room fire — molten aluminium spill, major property damage", grossPaid: 120_000_000, netPaid: 45_000_000, reserves: 30_000_000, status: "open" },
      { id: "clm-010", date: "2023-08-22", peril: "liability", description: "Worker injury — heat exhaustion during summer operations", grossPaid: 450_000, netPaid: 450_000, reserves: 0, status: "closed" },
      { id: "clm-011", date: "2022-05-14", peril: "electrical", description: "Power grid surge — control system failure, 2-week shutdown", grossPaid: 18_000_000, netPaid: 12_000_000, reserves: 0, status: "closed" },
      { id: "clm-012", date: "2021-12-01", peril: "fire", description: "Cable tray fire in carbon plant — contained within 4 hours", grossPaid: 5_500_000, netPaid: 4_000_000, reserves: 0, status: "closed" },
    ],
    "prop-005": [
      { id: "clm-013", date: "2023-11-05", peril: "windstorm", description: "Façade panel displacement on tower 2 during windstorm", grossPaid: 2_800_000, netPaid: 2_100_000, reserves: 0, status: "closed" },
      { id: "clm-014", date: "2022-06-18", peril: "water_damage", description: "HVAC condensation leak — ceiling and floor damage floors 15-17", grossPaid: 950_000, netPaid: 700_000, reserves: 0, status: "closed" },
    ],
    "prop-006": [
      { id: "clm-015", date: "2024-01-20", peril: "fire", description: "Process unit fire — delayed shutdown caused extended damage", grossPaid: 85_000_000, netPaid: 30_000_000, reserves: 20_000_000, status: "open" },
      { id: "clm-016", date: "2023-04-10", peril: "liability", description: "Environmental contamination — soil remediation required", grossPaid: 12_000_000, netPaid: 8_500_000, reserves: 3_000_000, status: "open" },
      { id: "clm-017", date: "2022-09-08", peril: "windstorm", description: "Storage tank roof damage during cyclone Shaheen aftermath", grossPaid: 4_200_000, netPaid: 3_000_000, reserves: 0, status: "closed" },
    ],
    "prop-007": [],
  };

  // Use property-stored claims first (from email ingestion), then hardcoded mock, then generic
  let claims: Claim[];
  if (propertyClaims && propertyClaims.length > 0) {
    claims = propertyClaims.map((c, i) => ({
      id: `clm-email-${propertyId}-${i}`,
      date: c.date,
      peril: (c.peril as Claim["peril"]) || "water_damage",
      description: c.description,
      grossPaid: c.grossPaid,
      netPaid: c.netPaid,
      reserves: c.reserves,
      status: c.status,
    }));
  } else {
    claims = claimsMap[propertyId] || generateGenericClaims(propertyId, sumInsured);
  }
  const fiveYearIncurred = claims.reduce((sum, c) => sum + c.grossPaid + c.reserves, 0);
  const largestLoss = claims.length > 0 ? Math.max(...claims.map(c => c.grossPaid)) : 0;
  const frequencyPerYear = claims.length / 5;
  const burningCost = sumInsured > 0 ? (fiveYearIncurred / 5 / sumInsured) * 1000 : 0; // per mille

  return { propertyId, claims, fiveYearIncurred, burningCost, largestLoss, frequencyPerYear };
}

function generateGenericClaims(propertyId: string, sumInsured: number): Claim[] {
  return [
    {
      id: `clm-gen-${propertyId}-1`,
      date: "2023-06-15",
      peril: "water_damage",
      description: "Minor water damage from plumbing leak",
      grossPaid: Math.round(sumInsured * 0.002),
      netPaid: Math.round(sumInsured * 0.0015),
      reserves: 0,
      status: "closed",
    },
  ];
}

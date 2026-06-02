import { mockProperties, type Property } from '../data/mock-data';

import type {
  EnrichedInsight,
  GeoClaim,
  PeerBenchmark,
  RenewalDelta,
  RiskRoomProperty,
  TimelineEvent,
  UwNotepadEntry,
} from './types';

function enrichProperty(property: Property): RiskRoomProperty {
  const base = property;

  const enrichedInsights: EnrichedInsight[] = base.aiInsights.map((ins, i) => ({
    ...ins,
    category: ins.category,
    underwritingImpact:
      ins.severity === 'high'
        ? 'Referral / terms adjustment likely'
        : ins.severity === 'medium'
          ? 'Monitor at pricing'
          : 'Informational',
    floor: ins.category === 'structural' && base.floors > 50 ? 42 : undefined,
    sources: [
      {
        id: `src-${ins.id}-doc`,
        label: base.documents[0]?.name ?? 'Submission pack',
        type: 'document',
        ref: base.documents[0]?.id ?? 'doc-1',
        capturedAt: base.documents[0]?.uploadDate ?? base.submissionDate,
        page: i === 0 ? 'p. 12' : 'p. 8',
        freshness: 'recent',
      },
      {
        id: `src-${ins.id}-img`,
        label: 'ESRI World Imagery',
        type: 'imagery',
        ref: `${base.lat},${base.lng}`,
        capturedAt: '2025-Q1',
        freshness: 'recent',
      },
      ...(ins.category === 'fire' || ins.category === 'flood'
        ? [
            {
              id: `src-${ins.id}-model`,
              label: 'EUR EP2024 hazard blend',
              type: 'model' as const,
              ref: 'natcat-v3',
              capturedAt: '2026-03',
              freshness: 'recent' as const,
            },
          ]
        : []),
    ],
  }));

  const geoClaims: GeoClaim[] = [
    {
      id: 'cl-1',
      date: '2024-06-15',
      peril: 'Water Damage',
      perilVariant: 'water',
      description: 'Burst pipe on 42nd floor — plant rooms & retail units.',
      grossPaid: 'AED 2.4M',
      netPaid: 'AED 1.9M',
      reserves: 'AED 0.2M',
      status: 'Closed',
      lat: base.lat + 0.0003,
      lng: base.lng + 0.0002,
      floor: 42,
    },
    {
      id: 'cl-2',
      date: '2023-11-02',
      peril: 'Fire',
      perilVariant: 'fire',
      description: 'Kitchen exhaust fire — podium level, contained.',
      grossPaid: 'AED 0.8M',
      netPaid: 'AED 0.6M',
      reserves: 'AED 0',
      status: 'Closed',
      lat: base.lat - 0.0002,
      lng: base.lng + 0.0004,
      floor: 2,
    },
    {
      id: 'cl-3',
      date: '2022-03-18',
      peril: 'Wind',
      perilVariant: 'wind',
      description: 'Façade panel damage during haboob — upper spire.',
      grossPaid: 'AED 1.4M',
      netPaid: 'AED 1.1M',
      reserves: 'AED 0.1M',
      status: 'Closed',
      lat: base.lat + 0.0001,
      lng: base.lng - 0.0003,
      floor: 148,
    },
  ];

  const timeline: TimelineEvent[] = [
    { id: 't1', year: base.yearBuilt, label: 'Built', kind: 'construction', detail: base.constructionMaterial },
    { id: 't2', year: 2019, month: 6, label: 'Major MEP retrofit', kind: 'capex', detail: 'Chiller plant upgrade' },
    { id: 't3', year: 2022, month: 3, label: 'Wind claim', kind: 'claim', detail: 'AED 1.4M façade panel' },
    { id: 't4', year: 2023, month: 11, label: 'Fire incident', kind: 'claim', detail: 'Podium kitchen exhaust' },
    { id: 't5', year: 2024, month: 6, label: 'Water damage', kind: 'claim', detail: '42nd floor pipe burst' },
    { id: 't6', year: 2025, month: 1, label: 'Fire safety certificate', kind: 'certificate', detail: 'UAE post-2017 code' },
    { id: 't7', year: 2025, month: 9, label: 'Executive survey', kind: 'survey', detail: 'External engineer visit' },
    { id: 't8', year: 2026, month: 4, label: 'Renewal submission', kind: 'renewal', detail: base.broker },
    { id: 't9', year: 2026, label: 'Today', kind: 'today', detail: 'Live assessment' },
    { id: 't10', year: 2030, label: 'Climate projection', kind: 'projection', detail: '+12 heat days >42°C' },
  ];

  const renewalDeltas: RenewalDelta[] = [
    // Identified risks from proposal (broker / submission documents)
    { label: 'Cladding certificate', direction: 'neutral', value: 'Renewed 2025', impact: 'positive', source: 'proposal' },
    { label: 'Large loss', direction: 'up', value: '1 water claim 2024', impact: 'negative', source: 'proposal' },
    { label: 'Sum insured', direction: 'up', value: '+4.2% TSI', impact: 'neutral', source: 'proposal' },
    { label: 'Sprinkler scope', direction: 'neutral', value: 'Unchanged', impact: 'positive', source: 'proposal' },
    // AI-identified risks (models, imagery, live feeds, ultra intelligence)
    { label: 'Heat days >42°C', direction: 'up', value: '+12 vs prior term', impact: 'negative', source: 'ai' },
    { label: 'Compound wind+flood', direction: 'up', value: 'Correlation +18%', impact: 'negative', source: 'ai' },
    { label: 'Roof ponding signal', direction: 'up', value: 'West elevation · satellite', impact: 'negative', source: 'ai' },
    { label: 'Night occupancy drift', direction: 'up', value: 'Floors 45–52 anomaly', impact: 'negative', source: 'ai' },
    { label: 'Peer rate pulse', direction: 'up', value: '+0.4‰ vs cluster', impact: 'neutral', source: 'ai' },
  ];

  const peers: PeerBenchmark[] = mockProperties
    .filter((p) => p.id !== base.id && p.type === base.type)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      riskScore: p.riskScore,
      ratePerMille: 0.35 + p.riskScore / 200,
      type: p.type,
    }));

  const floorZones =
    base.floors > 20
      ? [
          { id: 'z1', label: 'Spire & ME levels', floors: `${base.floors - 20}–${base.floors}`, occupancy: 'Mechanical / comms', riskNote: 'Wind & access stress', score: base.riskScore + 12 },
          { id: 'z2', label: 'Office stack', floors: '20–120', occupancy: 'Office / mixed', riskNote: 'Standard high-rise profile', score: base.riskScore },
          { id: 'z3', label: 'Podium & retail', floors: '1–19', occupancy: 'Retail / F&B', riskNote: 'Fire & BI concentration', score: base.riskScore + 6 },
          { id: 'z4', label: 'Basement plant', floors: 'B3–B1', occupancy: 'MEP / parking', riskNote: 'Flood & water damage', score: base.riskScore + 8 },
        ]
      : [
          { id: 'z1', label: 'Main occupancy', floors: `1–${base.floors}`, occupancy: base.type, riskNote: 'Primary exposure', score: base.riskScore },
        ];

  return {
    ...base,
    enrichedInsights,
    geoClaims,
    timeline,
    renewalDeltas,
    peers,
    floorZones,
    orientationSummary: `You are underwriting ${base.name} — ${base.floors}-floor ${base.type} in ${base.city}. Primary perils: wind, fire, water, BI.`,
    primaryPerils: ['Windstorm', 'Fire', 'Water damage', 'Business interruption'],
    marketPulse: 'Facultative appetite moderate for UAE towers · Guy Carpenter active',
    submissionHeat: '2 brokers tracking similar tower capacity this week',
  };
}

export function getRiskRoomProperty(property: Property): RiskRoomProperty {
  return enrichProperty(property);
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

/** Sample notepad entries for demo — property-aware where useful. */
export function getDefaultUwNotepad(property: Property): UwNotepadEntry[] {
  const isTower = property.floors > 50;
  return [
    {
      id: 'note-obs-1',
      kind: 'observation',
      text: isTower
        ? 'Street View confirms façade cladding consistent with 2025 certificate — no visible delamination at podium level.'
        : 'Site perimeter fencing intact; yard storage appears segregated from main occupancy block.',
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
    },
    {
      id: 'note-obs-2',
      kind: 'observation',
      text: 'Nearest fire station ~13 min drive — within acceptable response band for UAE high-rise class; verify night-time routing.',
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(3.5),
    },
    {
      id: 'note-obs-3',
      kind: 'observation',
      text: 'Water body within 70 m of site — pluvial exposure flag; basement MEP zone score elevated in composite breakdown.',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'note-obs-4',
      kind: 'observation',
      text: 'Peer cluster rate pulse +0.4‰ — Emirates Towers and Al Fattan trading softer; market room for technical adjustment.',
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'note-dec-1',
      kind: 'decision',
      text: 'Accept high-severity evacuation insight — subject to broker confirming staged egress drills for floors above 120.',
      createdAt: hoursAgo(4.5),
      updatedAt: hoursAgo(4.5),
    },
    {
      id: 'note-dec-2',
      kind: 'decision',
      text: 'Request broker clarification on BI indemnity period (90 vs 120 days) before indicative quote.',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(2.5),
    },
    {
      id: 'note-dec-3',
      kind: 'decision',
      text: 'Hold facultative outreach until AI compound wind+flood correlation (+18%) reviewed with cat modelling team.',
      createdAt: hoursAgo(1.5),
      updatedAt: hoursAgo(0.5),
    },
  ];
}

export const BURNING_COST_SERIES = [
  { year: '2022', value: 0.8 },
  { year: '2023', value: 0.57 },
  { year: '2024', value: 1.6 },
  { year: '2025', value: 0 },
  { year: '2026', value: 0 },
];

export function formatAED(n: number) {
  if (n >= 1_000_000_000) return `AED ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  return `AED ${n.toLocaleString()}`;
}

import type { ScenarioState } from './types';

export function scenarioAdjustedScore(base: number, scenario: ScenarioState) {
  let s = base;
  if (scenario.siMultiplier > 1.1) s += 4;
  if (scenario.siMultiplier < 0.9) s -= 3;
  if (scenario.compoundWindFlood) s += 8;
  if (scenario.mitigationFlood) s -= 6;
  if (scenario.heatWaveStress) s += 5;
  if (scenario.windGustStress) s += 6;
  if (scenario.supplyChainStress) s += 4;
  if (scenario.occupancyMode === 'vacancy-stress') s += 7;
  if (scenario.occupancyMode === 'peak-occupancy') s += 3;
  if (scenario.biExtensionDays >= 30) s += 2;
  return Math.min(100, Math.max(0, Math.round(s)));
}

export function scenarioAdjustedAal(baseSi: number, baseScore: number, scenario: ScenarioState) {
  const si = baseSi * scenario.siMultiplier;
  const hazard = 1 + baseScore / 200;
  let aal = si * 0.0042 * hazard;
  if (scenario.compoundWindFlood) aal *= 1.22;
  if (scenario.mitigationFlood) aal *= 0.82;
  if (scenario.heatWaveStress) aal *= 1.08;
  if (scenario.windGustStress) aal *= 1.11;
  if (scenario.supplyChainStress) aal *= 1.14;
  if (scenario.biExtensionDays > 0) aal *= 1 + scenario.biExtensionDays / 400;
  if (scenario.deductiblePct > 0) aal *= 1 - scenario.deductiblePct / 500;
  if (scenario.occupancyMode === 'vacancy-stress') aal *= 1.18;
  if (scenario.occupancyMode === 'peak-occupancy') aal *= 1.09;
  return aal;
}

export function scenarioRatePerMille(baseSi: number, baseScore: number, scenario: ScenarioState) {
  const aal = scenarioAdjustedAal(baseSi, baseScore, scenario);
  return (aal / baseSi) * 1000;
}

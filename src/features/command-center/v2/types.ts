import type { Property } from '../data/mock-data';

export type RiskLayerId = 'physical' | 'environmental' | 'operational' | 'financial' | 'predictive';

export type MapLayerId =
  | 'footprint'
  | 'flood'
  | 'wind'
  | 'fire'
  | 'quake'
  | 'bi'
  | 'claims'
  | 'peers'
  | 'firestations'
  | 'water'
  | 'hospitals'
  | 'industrial'
  | 'construction'
  | 'nuclear'
  | 'firezone'
  | 'chemical'
  | 'airport';

export type SpatialCanvasMode = 'map' | 'satellite' | 'streetview';

export type ContextModeId =
  | 'ground'
  | 'perils'
  | 'experience'
  | 'predictive'
  | 'pricing'
  | null;

export type TimelineEventKind =
  | 'construction'
  | 'claim'
  | 'survey'
  | 'capex'
  | 'certificate'
  | 'renewal'
  | 'climate'
  | 'today'
  | 'projection';

export interface EvidenceSource {
  id: string;
  label: string;
  type: 'document' | 'imagery' | 'model' | 'survey' | 'api' | 'broker';
  ref: string;
  capturedAt: string;
  page?: string;
  freshness: 'live' | 'recent' | 'stale';
}

export interface EnrichedInsight {
  id: string;
  text: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  category: string;
  status: 'pending' | 'accepted' | 'dismissed';
  sources: EvidenceSource[];
  underwritingImpact: string;
  floor?: number;
}

export interface GeoClaim {
  id: string;
  date: string;
  peril: string;
  perilVariant: 'water' | 'fire' | 'wind';
  description: string;
  grossPaid: string;
  netPaid: string;
  reserves: string;
  status: string;
  lat: number;
  lng: number;
  floor?: number;
}

export interface TimelineEvent {
  id: string;
  year: number;
  month?: number;
  label: string;
  kind: TimelineEventKind;
  detail?: string;
}

export interface RenewalDelta {
  label: string;
  direction: 'up' | 'down' | 'neutral';
  value: string;
  impact: 'positive' | 'negative' | 'neutral';
  source: 'proposal' | 'ai';
}

export interface PeerBenchmark {
  id: string;
  name: string;
  lat: number;
  lng: number;
  riskScore: number;
  ratePerMille: number;
  type: string;
}

export interface FloorZone {
  id: string;
  label: string;
  floors: string;
  occupancy: string;
  riskNote: string;
  score: number;
}

export interface ScenarioState {
  siMultiplier: number;
  biExtensionDays: number;
  deductiblePct: number;
  occupancyMode: 'as-submitted' | 'vacancy-stress' | 'peak-occupancy';
  mitigationFlood: boolean;
  compoundWindFlood: boolean;
  heatWaveStress: boolean;
  windGustStress: boolean;
  supplyChainStress: boolean;
}

export interface UwAnnotation {
  id: string;
  lat: number;
  lng: number;
  text: string;
  author: string;
  createdAt: string;
}

export interface UwNotepadEntry {
  id: string;
  kind: 'observation' | 'decision';
  text: string;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use UwNotepadEntry — kept for brief export compatibility */
export interface DecisionLogEntry {
  id: string;
  action: string;
  rationale: string;
  timestamp: string;
  actor: string;
}

export interface LiveWeatherSnapshot {
  temperatureC: number;
  humidityPct: number;
  windMs: number;
  precipitationMm: number;
  weatherCode: number;
  fetchedAt: string;
  source: string;
}

export interface RiskRoomProperty extends Property {
  enrichedInsights: EnrichedInsight[];
  geoClaims: GeoClaim[];
  timeline: TimelineEvent[];
  renewalDeltas: RenewalDelta[];
  peers: PeerBenchmark[];
  floorZones: FloorZone[];
  orientationSummary: string;
  primaryPerils: string[];
  marketPulse: string;
  submissionHeat: string;
}

export const DEFAULT_SCENARIO: ScenarioState = {
  siMultiplier: 1,
  biExtensionDays: 0,
  deductiblePct: 0,
  occupancyMode: 'as-submitted',
  mitigationFlood: false,
  compoundWindFlood: false,
  heatWaveStress: false,
  windGustStress: false,
  supplyChainStress: false,
};

export const RISK_LAYERS: {
  id: RiskLayerId;
  title: string;
  description: string;
  mode: ContextModeId;
  accent: string;
}[] = [
  {
    id: 'physical',
    title: 'Physical',
    description: 'Location, imagery, vertical footprint',
    mode: 'ground',
    accent: 'sky',
  },
  {
    id: 'environmental',
    title: 'Environmental',
    description: 'NatCat, weather, climate trajectory',
    mode: 'perils',
    accent: 'emerald',
  },
  {
    id: 'operational',
    title: 'Operational',
    description: 'Occupancy, processes, BI exposure',
    mode: 'experience',
    accent: 'amber',
  },
  {
    id: 'financial',
    title: 'Financial',
    description: 'Loss experience, burning cost, survey',
    mode: 'pricing',
    accent: 'violet',
  },
  {
    id: 'predictive',
    title: 'Predictive',
    description: 'AI scenarios & compound stress',
    mode: 'predictive',
    accent: 'indigo',
  },
];

export const MAP_LAYERS: { id: MapLayerId; label: string; color: string; group?: 'hazard' | 'proximity' | 'risk' }[] = [
  { id: 'footprint', label: 'Footprint', color: '#38bdf8', group: 'hazard' },
  { id: 'flood', label: 'Flood', color: '#22d3ee', group: 'hazard' },
  { id: 'wind', label: 'Wind', color: '#a78bfa', group: 'hazard' },
  { id: 'fire', label: 'Fire ring', color: '#fb923c', group: 'hazard' },
  { id: 'bi', label: 'BI ring', color: '#fbbf24', group: 'hazard' },
  { id: 'claims', label: 'Claims', color: '#ef4444', group: 'hazard' },
  { id: 'peers', label: 'Peers', color: '#94a3b8', group: 'hazard' },
  { id: 'firestations', label: 'Fire stations', color: '#ef4444', group: 'proximity' },
  { id: 'water', label: 'Water bodies', color: '#0ea5e9', group: 'proximity' },
  { id: 'hospitals', label: 'Hospitals', color: '#f472b6', group: 'proximity' },
  { id: 'industrial', label: 'Industrial', color: '#737373', group: 'risk' },
  { id: 'construction', label: 'Construction', color: '#f59e0b', group: 'risk' },
  { id: 'nuclear', label: 'Nuclear', color: '#eab308', group: 'risk' },
  { id: 'firezone', label: 'Fire-prone zone', color: '#ea580c', group: 'risk' },
  { id: 'chemical', label: 'Chemical plant', color: '#a855f7', group: 'risk' },
  { id: 'airport', label: 'Airport', color: '#64748b', group: 'risk' },
];

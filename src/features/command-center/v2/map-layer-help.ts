import type { MapLayerId, SpatialCanvasMode } from './types';

export const MAP_LAYER_HELP: Record<
  MapLayerId,
  { label: string; explanation: string }
> = {
  footprint: {
    label: 'Footprint',
    explanation:
      'Building outline at submitted coordinates — use to verify geocode accuracy and compare against satellite imagery.',
  },
  flood: {
    label: 'Flood',
    explanation:
      'Pluvial / surface-water exposure ring (~400 m). Highlights proximity to flood-prone zones for nat-cat and BI water-damage assessment.',
  },
  wind: {
    label: 'Wind',
    explanation:
      'Wind / cyclone exposure context (~1.2 km). Relevant for tall façades, cladding fixings, and coastal wind fetch.',
  },
  fire: {
    label: 'Fire ring',
    explanation:
      'Combustible-load and fire spread context (~650 m). Flags adjacency to industrial or dense urban fire loads.',
  },
  quake: {
    label: 'Quake',
    explanation:
      'Seismic exposure overlay — structural vulnerability and non-structural damage potential for high-rise assets.',
  },
  bi: {
    label: 'BI ring',
    explanation:
      'Business interruption catchment at 500 m, 2 km, and 10 km — dependency on neighbours, utilities, and access routes.',
  },
  claims: {
    label: 'Claims',
    explanation:
      'Geo-located loss pins by peril and floor. Click a pin to inspect gross paid, reserves, and timeline placement.',
  },
  peers: {
    label: 'Peers',
    explanation:
      'Ghost benchmark sites nearby — compare risk score and rate per mille against similar footprint cluster.',
  },
  firestations: {
    label: 'Fire stations',
    explanation:
      'Nearest civil-defence / fire response assets with drive time. Critical for life-safety, NFPA response, and large-loss fire scenarios.',
  },
  water: {
    label: 'Water bodies',
    explanation:
      'Lakes, canals, and rivers within search radius — distance in metres from site for pluvial flooding and surface-water ingress.',
  },
  hospitals: {
    label: 'Hospitals',
    explanation:
      'Emergency medical facilities with drive time — relevant for occupancy, public liability, and catastrophe planning.',
  },
  industrial: {
    label: 'Industrial',
    explanation:
      'Industrial zones and manufacturing adjacency — fire load, pollution, and downstream BI dependency from neighbouring plants.',
  },
  construction: {
    label: 'Construction',
    explanation:
      'Active construction sites nearby — hot work, crane oversail, vibration, and third-party damage exposure during build phase.',
  },
  nuclear: {
    label: 'Nuclear',
    explanation:
      'Nuclear generation or related facilities in extended radius — catastrophe accumulation and exclusion / sublimit review.',
  },
  firezone: {
    label: 'Fire-prone zone',
    explanation:
      'Vegetation and scrub classified as wildfire / brush-fire fuel — distance in metres for external fire spread and ember attack.',
  },
  chemical: {
    label: 'Chemical plant',
    explanation:
      'Chemical works, refineries, and hazardous process plants — toxic release, explosion, and contamination BI scenarios.',
  },
  airport: {
    label: 'Airport',
    explanation:
      'Aerodromes within 30 km — debris, vibration, terrorism accumulation, and height / crane restrictions in flight paths.',
  },
};

export const SPATIAL_VIEW_HELP: Record<
  SpatialCanvasMode,
  { label: string; explanation: string }
> = {
  map: {
    label: 'Map',
    explanation:
      'Dark hazard basemap with underwriting layers — toggle proximity, peril rings, and risk infrastructure on top.',
  },
  satellite: {
    label: 'Satellite',
    explanation:
      'Esri satellite imagery for roof condition, site layout, yard storage, and perimeter security verification.',
  },
  streetview: {
    label: 'Street View',
    explanation:
      'Ground-level panorama at risk coordinates — façade materials, access routes, street congestion, and neighbouring exposures.',
  },
};

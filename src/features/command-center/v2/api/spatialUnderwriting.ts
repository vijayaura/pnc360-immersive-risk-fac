export type SpatialPoiKind =
  | 'fire_station'
  | 'hospital'
  | 'water'
  | 'industrial'
  | 'construction'
  | 'nuclear'
  | 'firezone'
  | 'chemical'
  | 'airport';

export type SpatialPoi = {
  id: string;
  kind: SpatialPoiKind;
  name: string;
  lat: number;
  lng: number;
  distanceM?: number;
  driveMin?: number;
  driveKm?: number;
};

export type RiskInfrastructureKey =
  | 'industrial'
  | 'construction'
  | 'nuclear'
  | 'firezone'
  | 'chemical'
  | 'airport';

export type SpatialUnderwritingData = {
  fireStations: SpatialPoi[];
  hospitals: SpatialPoi[];
  waterBodies: SpatialPoi[];
  riskInfrastructure: Record<RiskInfrastructureKey, SpatialPoi[]>;
  source: string;
};

const OVERPASS = 'https://overpass-api.de/api/interpreter';

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDriveMin(distanceM: number) {
  const urbanKmh = 32;
  return Math.max(1, Math.round((distanceM / 1000 / urbanKmh) * 60));
}

async function fetchOsrmDriveMin(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<{ min: number; km: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      min: Math.max(1, Math.round(route.duration / 60)),
      km: Math.round((route.distance / 1000) * 10) / 10,
    };
  } catch {
    return null;
  }
}

async function overpassQuery(query: string) {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error('Overpass unavailable');
  return res.json();
}

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function parseOverpassElements(
  elements: OverpassElement[],
  kind: SpatialPoiKind,
  defaultName: string,
): SpatialPoi[] {
  return elements
    .map((el) => {
      const plat = el.lat ?? el.center?.lat;
      const plng = el.lon ?? el.center?.lon;
      if (plat == null || plng == null) return null;
      const name =
        el.tags?.name ||
        el.tags?.['name:en'] ||
        el.tags?.operator ||
        el.tags?.['generator:source'] ||
        `${defaultName} #${el.id}`;
      return {
        id: `${kind}-${el.id}`,
        kind,
        name,
        lat: plat,
        lng: plng,
      } satisfies SpatialPoi;
    })
    .filter(Boolean) as SpatialPoi[];
}

function enrichWithDistance(originLat: number, originLng: number, pois: SpatialPoi[], limit = 5) {
  return [...pois]
    .map((p) => ({ ...p, distanceM: haversineM(originLat, originLng, p.lat, p.lng) }))
    .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0))
    .slice(0, limit);
}

async function enrichWithDriveTimes(originLat: number, originLng: number, pois: SpatialPoi[], limit = 5) {
  const sorted = enrichWithDistance(originLat, originLng, pois, limit);

  return Promise.all(
    sorted.map(async (p) => {
      const osrm = await fetchOsrmDriveMin(originLat, originLng, p.lat, p.lng);
      if (osrm) {
        return { ...p, driveMin: osrm.min, driveKm: osrm.km };
      }
      return {
        ...p,
        driveMin: estimateDriveMin(p.distanceM ?? 0),
        driveKm: Math.round(((p.distanceM ?? 0) / 1000) * 10) / 10,
      };
    }),
  );
}

function emptyRiskInfrastructure(): Record<RiskInfrastructureKey, SpatialPoi[]> {
  return {
    industrial: [],
    construction: [],
    nuclear: [],
    firezone: [],
    chemical: [],
    airport: [],
  };
}

/** Demo POIs when Overpass/OSRM unavailable — Burj Khalifa / Dubai CBD area. */
function fallbackData(lat: number, lng: number): SpatialUnderwritingData {
  const entries: { kind: SpatialPoiKind; name: string; dLat: number; dLng: number }[] = [
    { kind: 'fire_station', name: 'Dubai Civil Defence — Downtown', dLat: 0.008, dLng: -0.006 },
    { kind: 'fire_station', name: 'Al Quoz Fire Station', dLat: -0.045, dLng: -0.02 },
    { kind: 'hospital', name: 'Mediclinic City Hospital', dLat: 0.018, dLng: 0.008 },
    { kind: 'water', name: 'Dubai Fountain basin', dLat: 0.001, dLng: 0.002 },
    { kind: 'water', name: 'Dubai Creek inlet', dLat: 0.035, dLng: -0.018 },
    { kind: 'industrial', name: 'Jebel Ali industrial zone', dLat: -0.08, dLng: -0.06 },
    { kind: 'construction', name: 'Downtown tower crane site', dLat: 0.014, dLng: 0.011 },
    { kind: 'nuclear', name: 'Barakah NPP (regional reference)', dLat: 0.45, dLng: -0.35 },
    { kind: 'firezone', name: 'Desert scrub — fire-prone belt', dLat: 0.06, dLng: -0.04 },
    { kind: 'chemical', name: 'Jebel Ali refinery cluster', dLat: -0.09, dLng: -0.055 },
    { kind: 'airport', name: 'DXB — Dubai International', dLat: 0.05, dLng: 0.08 },
  ];

  const all = entries.map((o, i) => {
    const plat = lat + o.dLat;
    const plng = lng + o.dLng;
    const distanceM = haversineM(lat, lng, plat, plng);
    const withDrive = o.kind === 'fire_station' || o.kind === 'hospital';
    return {
      id: `fallback-${i}`,
      kind: o.kind,
      name: o.name,
      lat: plat,
      lng: plng,
      distanceM,
      ...(withDrive
        ? { driveMin: estimateDriveMin(distanceM), driveKm: Math.round((distanceM / 1000) * 10) / 10 }
        : {}),
    } satisfies SpatialPoi;
  });

  const riskInfrastructure = emptyRiskInfrastructure();
  for (const p of all) {
    if (p.kind in riskInfrastructure) {
      riskInfrastructure[p.kind as RiskInfrastructureKey].push(p);
    }
  }

  return {
    fireStations: all.filter((p) => p.kind === 'fire_station'),
    hospitals: all.filter((p) => p.kind === 'hospital'),
    waterBodies: all.filter((p) => p.kind === 'water'),
    riskInfrastructure,
    source: 'Demo synthesis',
  };
}

function classifyRiskInfrastructure(elements: OverpassElement[]) {
  const risk = emptyRiskInfrastructure();

  for (const el of elements) {
    const tags = el.tags ?? {};

    if (tags.landuse === 'industrial' && !tags.industrial?.includes('chemical')) {
      risk.industrial.push(...parseOverpassElements([el], 'industrial', 'Industrial zone'));
      continue;
    }
    if (tags.landuse === 'construction' || tags.building === 'construction') {
      risk.construction.push(...parseOverpassElements([el], 'construction', 'Construction site'));
      continue;
    }
    if (
      tags['generator:source'] === 'nuclear' ||
      tags['plant:source'] === 'nuclear' ||
      tags.power === 'nuclear'
    ) {
      risk.nuclear.push(...parseOverpassElements([el], 'nuclear', 'Nuclear facility'));
      continue;
    }
    if (
      tags.natural === 'wood' ||
      tags.natural === 'scrub' ||
      tags.landuse === 'forest' ||
      tags.landuse === 'meadow'
    ) {
      risk.firezone.push(...parseOverpassElements([el], 'firezone', 'Fire-prone vegetation'));
      continue;
    }
    if (
      tags.industrial === 'chemical' ||
      tags.man_made === 'works' ||
      tags.landuse === 'brownfield' ||
      (tags.landuse === 'industrial' && tags.product?.includes('chemical'))
    ) {
      risk.chemical.push(...parseOverpassElements([el], 'chemical', 'Chemical / refinery'));
      continue;
    }
    if (tags.aeroway === 'aerodrome' || tags.aeroway === 'runway') {
      risk.airport.push(...parseOverpassElements([el], 'airport', 'Airport'));
    }
  }

  return risk;
}

export async function fetchSpatialUnderwritingPois(lat: number, lng: number): Promise<SpatialUnderwritingData> {
  const radius = 8000;
  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="fire_station"](around:${radius},${lat},${lng});
      way["amenity"="fire_station"](around:${radius},${lat},${lng});
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      way["amenity"="hospital"](around:${radius},${lat},${lng});
      way["natural"="water"](around:5000,${lat},${lng});
      relation["natural"="water"](around:5000,${lat},${lng});
      way["waterway"~"river|canal|stream"](around:5000,${lat},${lng});
      way["landuse"="industrial"](around:${radius},${lat},${lng});
      way["landuse"="construction"](around:${radius},${lat},${lng});
      way["building"="construction"](around:${radius},${lat},${lng});
      node["generator:source"="nuclear"](around:50000,${lat},${lng});
      way["generator:source"="nuclear"](around:50000,${lat},${lng});
      way["plant:source"="nuclear"](around:50000,${lat},${lng});
      way["natural"~"wood|scrub"](around:${radius},${lat},${lng});
      way["landuse"~"forest|meadow"](around:${radius},${lat},${lng});
      way["industrial"="chemical"](around:${radius},${lat},${lng});
      way["man_made"="works"](around:${radius},${lat},${lng});
      node["aeroway"="aerodrome"](around:30000,${lat},${lng});
      way["aeroway"="aerodrome"](around:30000,${lat},${lng});
    );
    out center 60;
  `;

  try {
    const json = await overpassQuery(query);
    const elements: OverpassElement[] = json.elements ?? [];

    const fireStations = parseOverpassElements(
      elements.filter((e) => e.tags?.amenity === 'fire_station'),
      'fire_station',
      'Fire station',
    );
    const hospitals = parseOverpassElements(
      elements.filter((e) => e.tags?.amenity === 'hospital'),
      'hospital',
      'Hospital',
    );
    const water = parseOverpassElements(
      elements.filter((e) => e.tags?.natural === 'water' || e.tags?.waterway != null),
      'water',
      'Water body',
    );

    const rawRisk = classifyRiskInfrastructure(elements);

    const [fireEnriched, hospitalEnriched, waterEnriched] = await Promise.all([
      enrichWithDriveTimes(lat, lng, fireStations, 6),
      enrichWithDriveTimes(lat, lng, hospitals, 4),
      Promise.resolve(enrichWithDistance(lat, lng, water, 5)),
    ]);

    const riskInfrastructure = Object.fromEntries(
      (Object.keys(rawRisk) as RiskInfrastructureKey[]).map((key) => [
        key,
        enrichWithDistance(lat, lng, rawRisk[key], 4),
      ]),
    ) as Record<RiskInfrastructureKey, SpatialPoi[]>;

    return {
      fireStations: fireEnriched,
      hospitals: hospitalEnriched,
      waterBodies: waterEnriched,
      riskInfrastructure,
      source: 'OpenStreetMap · OSRM',
    };
  } catch {
    return fallbackData(lat, lng);
  }
}

export const RISK_INFRASTRUCTURE_LAYERS: {
  id: RiskInfrastructureKey;
  label: string;
  color: string;
  icon: string;
}[] = [
  { id: 'industrial', label: 'Industrial', color: '#737373', icon: '🏭' },
  { id: 'construction', label: 'Construction', color: '#f59e0b', icon: '🏗️' },
  { id: 'nuclear', label: 'Nuclear', color: '#eab308', icon: '☢️' },
  { id: 'firezone', label: 'Fire-prone zone', color: '#ea580c', icon: '🔥' },
  { id: 'chemical', label: 'Chemical plant', color: '#a855f7', icon: '⚗️' },
  { id: 'airport', label: 'Airport', color: '#64748b', icon: '✈️' },
];

import { CARTO_DARK } from './api/liveApis';

const SESSION_KEY = 'risk-room-intro-basemap-v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

type IntroBasemapCache = {
  propertyKey: string;
  readyAt: number;
};

const preloadedUrls = new Set<string>();

export function introPropertyKey(lat: number, lng: number, id?: string) {
  return id ?? `${lat.toFixed(4)}:${lng.toFixed(4)}`;
}

function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, z: zoom };
}

function tileUrl(x: number, y: number, z: number, subdomain = 'a') {
  return CARTO_DARK.replace('{s}', subdomain)
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{r}', '');
}

function preloadImage(url: string) {
  if (preloadedUrls.has(url)) return Promise.resolve();
  preloadedUrls.add(url);
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/** Warm browser cache for intro fly-in tiles at wide + property zoom. */
export function preloadIntroBasemapTiles(lat: number, lng: number): Promise<void> {
  const urls: string[] = [];
  const startLat = lat + 18;
  const startLng = lng - 4;

  for (const [pointLat, pointLng, zoom] of [
    [startLat, startLng, 4],
    [lat, lng, 16],
  ] as const) {
    const { x, y } = latLngToTile(pointLat, pointLng, zoom);
    const radius = zoom === 4 ? 1 : 2;
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (const sub of ['a', 'b']) {
          urls.push(tileUrl(x + dx, y + dy, zoom, sub));
        }
      }
    }
  }

  return Promise.all(urls.map(preloadImage)).then(() => undefined);
}

export function markIntroBasemapReady(propertyKey: string) {
  try {
    const entry: IntroBasemapCache = { propertyKey, readyAt: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(entry));
  } catch {
    /* sessionStorage unavailable */
  }
}

export function isIntroBasemapReady(propertyKey: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as IntroBasemapCache;
    return parsed.propertyKey === propertyKey && Date.now() - parsed.readyAt < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

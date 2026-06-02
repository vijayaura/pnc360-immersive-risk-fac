import type { LiveWeatherSnapshot } from '../types';

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';

export async function fetchLiveWeather(lat: number, lng: number): Promise<LiveWeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code',
    wind_speed_unit: 'ms',
    timezone: 'auto',
  });

  const res = await fetch(`${OPEN_METEO}?${params}`);
  if (!res.ok) throw new Error('Weather API unavailable');

  const data = await res.json();
  const c = data.current;

  return {
    temperatureC: c.temperature_2m,
    humidityPct: c.relative_humidity_2m,
    windMs: c.wind_speed_10m,
    precipitationMm: c.precipitation,
    weatherCode: c.weather_code,
    fetchedAt: c.time ?? new Date().toISOString(),
    source: 'Open-Meteo · Live',
  };
}

export async function fetchHistoricalWeatherYear(lat: number, lng: number, year: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`,
    daily: 'temperature_2m_max,wind_speed_10m_max,precipitation_sum',
    timezone: 'auto',
  });

  const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
  if (!res.ok) return null;
  return res.json();
}

export function weatherCodeLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Variable';
}

export const ESRI_SATELLITE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export const CARTO_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

export function streetViewEmbedUrl(lat: number, lng: number, apiKey?: string) {
  if (apiKey?.trim()) {
    return `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(apiKey.trim())}&location=${lat},${lng}&heading=270&pitch=0&fov=90`;
  }
  return `https://maps.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=12,270,0,0,5&output=svembed`;
}

export function satelliteStaticPreview(lat: number, lng: number) {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=17&size=640x360&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
}

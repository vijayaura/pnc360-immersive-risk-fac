import { createServerFn } from "@tanstack/react-start";
import type { LiveWeatherResponse } from "./weather.server";

// Inline fetch logic to avoid .server.ts import issues in some environments
const CACHE = new Map<string, { data: LiveWeatherResponse; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function degToCompass(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function wmoToCondition(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "clear" : "clear_night";
  if (code <= 3) return "partly_cloudy";
  if (code >= 45 && code <= 48) return "haze";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 95) return "thunderstorm";
  return "cloudy";
}

function wmoToLabel(code: number): string {
  const labels: Record<number, string> = {
    0:"Clear Sky",1:"Mainly Clear",2:"Partly Cloudy",3:"Overcast",
    45:"Fog",48:"Depositing Rime Fog",51:"Light Drizzle",53:"Moderate Drizzle",
    55:"Dense Drizzle",61:"Slight Rain",63:"Moderate Rain",65:"Heavy Rain",
    80:"Slight Showers",81:"Moderate Showers",82:"Violent Showers",
    95:"Thunderstorm",96:"Thunderstorm with Hail",99:"Thunderstorm with Heavy Hail",
  };
  return labels[code] ?? "Unknown";
}

export const getWeather = createServerFn({ method: "GET" })
  .inputValidator((data: { lat: number; lng: number }) => data)
  .handler(async ({ data }) => {
    try {
      const key = `${data.lat.toFixed(3)}_${data.lng.toFixed(3)}`;
      const cached = CACHE.get(key);
      if (cached && Date.now() < cached.expiry) return cached.data;

      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", data.lat.toString());
      url.searchParams.set("longitude", data.lng.toString());
      url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,is_day,weather_code");
      url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,weather_code,sunrise,sunset");
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("forecast_days", "7");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
      const json = await res.json() as any;

      const isDay = json.current.is_day === 1;
      const current = {
        tempC: Math.round(json.current.temperature_2m),
        feelsLikeC: Math.round(json.current.apparent_temperature),
        humidity: Math.round(json.current.relative_humidity_2m),
        windSpeedKmh: Math.round(json.current.wind_speed_10m),
        windDirection: Math.round(json.current.wind_direction_10m),
        windDirectionLabel: degToCompass(json.current.wind_direction_10m),
        precipMm: json.current.precipitation,
        cloudCover: json.current.cloud_cover,
        uvIndex: Math.round(json.current.uv_index),
        visibilityKm: 10,
        pressureHpa: Math.round(json.current.surface_pressure),
        condition: wmoToCondition(json.current.weather_code, isDay),
        isDay,
        updatedAt: new Date().toISOString(),
      };

      const dayNames = ["Today","Tomorrow","Day 3","Day 4","Day 5","Day 6","Day 7"];
      const forecast = (json.daily.time as string[]).map((date: string, i: number) => ({
        date,
        dayLabel: dayNames[i] ?? `Day ${i + 1}`,
        highC: Math.round(json.daily.temperature_2m_max[i]),
        lowC: Math.round(json.daily.temperature_2m_min[i]),
        precipMm: json.daily.precipitation_sum[i],
        precipProbability: json.daily.precipitation_probability_max[i] ?? 0,
        windSpeedMaxKmh: Math.round(json.daily.wind_speed_10m_max[i]),
        uvIndexMax: Math.round(json.daily.uv_index_max[i]),
        condition: wmoToLabel(json.daily.weather_code[i]),
        sunrise: json.daily.sunrise[i],
        sunset: json.daily.sunset[i],
      }));

      const result: LiveWeatherResponse = {
        current,
        forecast,
        location: {
          lat: data.lat,
          lng: data.lng,
          elevation: json.elevation ?? 0,
          timezone: json.timezone ?? "Asia/Dubai",
        },
      };

      CACHE.set(key, { data: result, expiry: Date.now() + CACHE_TTL });
      return result;
    } catch (error) {
      console.error("[weather] Fetch failed:", error instanceof Error ? error.message : error);
      return null;
    }
  });

import { useState, useEffect } from "react";
import type { Property } from "@/data/mock-properties";
import { getWeather } from "@/server/weather.functions";
import type { LiveWeatherResponse } from "@/server/weather.server";
import {
  Thermometer, Droplets, Wind, Sun, Eye, CloudRain,
  ArrowUp, Gauge, RefreshCw, Loader2, CloudLightning,
  Cloud, CloudSun, Sunrise, Sunset,
} from "lucide-react";

interface LiveWeatherPanelProps {
  property: Property;
}

const conditionEmoji: Record<string, string> = {
  clear: "☀️", clear_night: "🌙", partly_cloudy: "⛅", cloudy: "☁️",
  rain: "🌧️", thunderstorm: "⛈️", haze: "🌫️", sandstorm: "🏜️", dust: "🌫️",
};

function UVBadge({ uv }: { uv: number }) {
  const color = uv >= 11 ? "bg-purple-500/20 text-purple-300" :
    uv >= 8 ? "bg-red-500/20 text-red-300" :
    uv >= 6 ? "bg-orange-500/20 text-orange-300" :
    uv >= 3 ? "bg-yellow-500/20 text-yellow-300" :
    "bg-green-500/20 text-green-300";
  const label = uv >= 11 ? "Extreme" : uv >= 8 ? "Very High" : uv >= 6 ? "High" : uv >= 3 ? "Moderate" : "Low";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{uv} — {label}</span>;
}

export function LiveWeatherPanel({ property }: LiveWeatherPanelProps) {
  const [weather, setWeather] = useState<LiveWeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchClientSide = async (lat: number, lng: number): Promise<LiveWeatherResponse | null> => {
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", lat.toString());
      url.searchParams.set("longitude", lng.toString());
      url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,is_day,weather_code");
      url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,weather_code,sunrise,sunset");
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("forecast_days", "7");
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      const json = await res.json() as any;
      const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
      const wmoC = (c: number, d: boolean) => {
        if (c === 0) return d ? "clear" : "clear_night";
        if (c <= 3) return "partly_cloudy";
        if (c >= 45 && c <= 48) return "haze";
        if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return "rain";
        if (c >= 95) return "thunderstorm";
        return "cloudy";
      };
      const wmoL: Record<number, string> = {0:"Clear Sky",1:"Mainly Clear",2:"Partly Cloudy",3:"Overcast",45:"Fog",51:"Light Drizzle",61:"Slight Rain",63:"Moderate Rain",65:"Heavy Rain",80:"Slight Showers",81:"Moderate Showers",95:"Thunderstorm"};
      const isDay = json.current.is_day === 1;
      const dayNames = ["Today","Tomorrow","Day 3","Day 4","Day 5","Day 6","Day 7"];
      return {
        current: {
          tempC: Math.round(json.current.temperature_2m),
          feelsLikeC: Math.round(json.current.apparent_temperature),
          humidity: Math.round(json.current.relative_humidity_2m),
          windSpeedKmh: Math.round(json.current.wind_speed_10m),
          windDirection: Math.round(json.current.wind_direction_10m),
          windDirectionLabel: dirs[Math.round(json.current.wind_direction_10m / 22.5) % 16],
          precipMm: json.current.precipitation,
          cloudCover: json.current.cloud_cover,
          uvIndex: Math.round(json.current.uv_index),
          visibilityKm: 10,
          pressureHpa: Math.round(json.current.surface_pressure),
          condition: wmoC(json.current.weather_code, isDay),
          isDay,
          updatedAt: new Date().toISOString(),
        },
        forecast: (json.daily.time as string[]).map((date: string, i: number) => ({
          date, dayLabel: dayNames[i] ?? `Day ${i+1}`,
          highC: Math.round(json.daily.temperature_2m_max[i]),
          lowC: Math.round(json.daily.temperature_2m_min[i]),
          precipMm: json.daily.precipitation_sum[i],
          precipProbability: json.daily.precipitation_probability_max[i] ?? 0,
          windSpeedMaxKmh: Math.round(json.daily.wind_speed_10m_max[i]),
          uvIndexMax: Math.round(json.daily.uv_index_max[i]),
          condition: wmoL[json.daily.weather_code[i]] ?? "Unknown",
          sunrise: json.daily.sunrise[i],
          sunset: json.daily.sunset[i],
        })),
        location: { lat, lng, elevation: json.elevation ?? 0, timezone: json.timezone ?? "Asia/Dubai" },
      };
    } catch {
      return null;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try server function first
      const data = await getWeather({ data: { lat: property.lat, lng: property.lng } });
      if (data) {
        setWeather(data);
        setLastRefresh(new Date());
        setLoading(false);
        return;
      }
    } catch {
      // Server function failed, will try client-side
    }
    // Fallback: fetch directly from browser
    try {
      const data = await fetchClientSide(property.lat, property.lng);
      if (data) {
        setWeather(data);
        setLastRefresh(new Date());
      } else {
        setError("Unable to fetch live weather data");
      }
    } catch {
      setError("Weather service unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [property.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Fetching live weather for {property.name}...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <CloudLightning className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error ?? "No data"}</p>
        <button onClick={fetchData} className="text-xs text-primary hover:underline flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const { current, forecast, location } = weather;

  return (
    <div className="space-y-4 p-1">
      {/* Live Badge + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold text-green-400">LIVE</span>
          <span className="text-[10px] text-muted-foreground">
            via Open-Meteo • {location.timezone} • {location.elevation}m ASL
          </span>
        </div>
        <button onClick={fetchData} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <RefreshCw className="h-3 w-3" />
          {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Refresh"}
        </button>
      </div>

      {/* Current Conditions - Hero Card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-accent/5 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-foreground">{current.tempC}°</span>
              <span className="text-lg text-muted-foreground">C</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Feels like {current.feelsLikeC}°C
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-2xl">{conditionEmoji[current.condition] ?? "🌡️"}</span>
              <span className="text-sm font-medium text-foreground capitalize">
                {current.condition.replace(/_/g, " ")}
              </span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-muted-foreground">{property.city}, {property.country}</p>
            <p className="text-[10px] text-muted-foreground">{property.lat.toFixed(4)}°N, {property.lng.toFixed(4)}°E</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <MetricTile icon={Droplets} label="Humidity" value={`${current.humidity}%`} />
        <MetricTile icon={Wind} label="Wind" value={`${current.windSpeedKmh} km/h`} sub={current.windDirectionLabel} />
        <MetricTile icon={Gauge} label="Pressure" value={`${current.pressureHpa} hPa`} />
        <MetricTile icon={Sun} label="UV Index" value={<UVBadge uv={current.uvIndex} />} />
        <MetricTile icon={Eye} label="Visibility" value={`${current.visibilityKm} km`} />
        <MetricTile icon={Cloud} label="Cloud Cover" value={`${current.cloudCover}%`} />
      </div>

      {/* Risk Implications */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">⚠️ Weather Risk Implications</h3>
        <div className="space-y-2">
          {current.tempC >= 44 && (
            <RiskItem color="text-red-400" text={`Extreme heat (${current.tempC}°C) — HVAC overload risk, electrical fire probability elevated. Workers heat stress advisory.`} />
          )}
          {current.windSpeedKmh >= 40 && (
            <RiskItem color="text-orange-400" text={`High winds (${current.windSpeedKmh} km/h ${current.windDirectionLabel}) — Facade damage risk, construction site hazards, loose material projectile risk.`} />
          )}
          {current.humidity >= 70 && (
            <RiskItem color="text-blue-400" text={`High humidity (${current.humidity}%) — Corrosion acceleration, mold risk, electrical short circuit probability increased.`} />
          )}
          {current.precipMm > 0 && (
            <RiskItem color="text-blue-400" text={`Active precipitation (${current.precipMm}mm) — Flash flood monitoring recommended for low-lying areas.`} />
          )}
          {current.uvIndex >= 8 && (
            <RiskItem color="text-purple-400" text={`Very high UV index (${current.uvIndex}) — Accelerated material degradation, roof membrane stress.`} />
          )}
          {current.tempC < 44 && current.windSpeedKmh < 40 && current.humidity < 70 && current.precipMm === 0 && current.uvIndex < 8 && (
            <RiskItem color="text-green-400" text="Current conditions within normal parameters. No elevated weather-related risks detected." />
          )}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">📅 7-Day Forecast</h3>
        <div className="grid grid-cols-7 gap-1">
          {forecast.map((day) => (
            <div key={day.date} className="text-center rounded-lg bg-accent/30 p-2 hover:bg-accent/50 transition-colors">
              <p className="text-[10px] font-semibold text-foreground">{day.dayLabel}</p>
              <p className="text-[9px] text-muted-foreground">{day.date.slice(5)}</p>
              <p className="text-lg my-1">{conditionEmoji[day.condition.toLowerCase().replace(/ /g, "_")] ?? "🌡️"}</p>
              <p className="text-xs font-bold text-foreground">{day.highC}°</p>
              <p className="text-[10px] text-muted-foreground">{day.lowC}°</p>
              {day.precipProbability > 0 && (
                <p className="text-[9px] text-blue-400 mt-1">💧 {day.precipProbability}%</p>
              )}
              {day.windSpeedMaxKmh >= 40 && (
                <p className="text-[9px] text-orange-400">💨 {day.windSpeedMaxKmh}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Forecast Risk Outlook */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">🔮 Forecast Risk Outlook</h3>
        <div className="space-y-2">
          {forecast.some(d => d.precipProbability > 60) && (
            <RiskItem color="text-blue-400" text={`Heavy rainfall expected — ${forecast.filter(d => d.precipProbability > 60).length} days with >60% precipitation probability. Monitor for flash flooding.`} />
          )}
          {forecast.some(d => d.highC >= 48) && (
            <RiskItem color="text-red-400" text={`Extreme heat wave — temperatures reaching ${Math.max(...forecast.map(d => d.highC))}°C. Extended cooling system stress expected.`} />
          )}
          {forecast.some(d => d.windSpeedMaxKmh >= 50) && (
            <RiskItem color="text-orange-400" text={`Storm force winds expected — gusts up to ${Math.max(...forecast.map(d => d.windSpeedMaxKmh))} km/h. Structural wind loading assessment recommended.`} />
          )}
          {!forecast.some(d => d.precipProbability > 60 || d.highC >= 48 || d.windSpeedMaxKmh >= 50) && (
            <RiskItem color="text-green-400" text="7-day outlook shows no severe weather risks. Standard monitoring continues." />
          )}
        </div>
      </div>
    </div>
  );
}

function MetricTile({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-accent/20 p-3 text-center">
      <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <div className="text-sm font-semibold text-foreground mt-0.5">{value}</div>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function RiskItem({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`text-xs mt-0.5 ${color}`}>●</span>
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

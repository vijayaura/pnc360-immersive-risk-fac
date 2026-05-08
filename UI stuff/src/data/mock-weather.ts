export type WeatherCondition = "clear" | "partly_cloudy" | "cloudy" | "dust" | "rain" | "thunderstorm" | "sandstorm" | "haze";
export type AlertSeverity = "extreme" | "severe" | "moderate" | "minor";
export type AlertType = "dust_storm" | "thunderstorm" | "flood" | "extreme_heat" | "high_wind" | "fog";

export interface CurrentWeather {
  propertyId: string;
  condition: WeatherCondition;
  tempC: number;
  humidity: number;
  windSpeedKmh: number;
  windDirection: string;
  visibilityKm: number;
  uvIndex: number;
  feelsLikeC: number;
}

export interface ForecastDay {
  day: string;
  condition: WeatherCondition;
  highC: number;
  lowC: number;
  precipMm: number;
  windSpeedKmh: number;
}

export interface PropertyForecast {
  propertyId: string;
  days: ForecastDay[];
}

export interface WeatherAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  area: string;
  startTime: string;
  endTime: string;
  affectedPropertyIds: string[];
  polygon: [number, number][]; // lat/lng pairs for map overlay
}

export const weatherConditionEmoji: Record<WeatherCondition, string> = {
  clear: "☀️",
  partly_cloudy: "⛅",
  cloudy: "☁️",
  dust: "🌫️",
  rain: "🌧️",
  thunderstorm: "⛈️",
  sandstorm: "🏜️",
  haze: "😶‍🌫️",
};

export const alertTypeEmoji: Record<AlertType, string> = {
  dust_storm: "🏜️",
  thunderstorm: "⛈️",
  flood: "🌊",
  extreme_heat: "🔥",
  high_wind: "💨",
  fog: "🌫️",
};

export const alertSeverityColor: Record<AlertSeverity, string> = {
  extreme: "#dc2626",
  severe: "#ea580c",
  moderate: "#d97706",
  minor: "#ca8a04",
};

// Current weather per property
export const currentWeather: CurrentWeather[] = [
  {
    propertyId: "prop-001",
    condition: "partly_cloudy",
    tempC: 42,
    humidity: 55,
    windSpeedKmh: 28,
    windDirection: "NW",
    visibilityKm: 8,
    uvIndex: 11,
    feelsLikeC: 47,
  },
  {
    propertyId: "prop-002",
    condition: "sandstorm",
    tempC: 46,
    humidity: 15,
    windSpeedKmh: 65,
    windDirection: "W",
    visibilityKm: 1.5,
    uvIndex: 6,
    feelsLikeC: 50,
  },
  {
    propertyId: "prop-003",
    condition: "thunderstorm",
    tempC: 38,
    humidity: 72,
    windSpeedKmh: 45,
    windDirection: "SE",
    visibilityKm: 4,
    uvIndex: 3,
    feelsLikeC: 43,
  },
  {
    propertyId: "prop-004",
    condition: "haze",
    tempC: 44,
    humidity: 35,
    windSpeedKmh: 22,
    windDirection: "NE",
    visibilityKm: 5,
    uvIndex: 10,
    feelsLikeC: 48,
  },
  {
    propertyId: "prop-005",
    condition: "dust",
    tempC: 47,
    humidity: 12,
    windSpeedKmh: 55,
    windDirection: "W",
    visibilityKm: 2,
    uvIndex: 8,
    feelsLikeC: 52,
  },
  {
    propertyId: "prop-006",
    condition: "clear",
    tempC: 41,
    humidity: 40,
    windSpeedKmh: 18,
    windDirection: "N",
    visibilityKm: 10,
    uvIndex: 12,
    feelsLikeC: 45,
  },
];

// 3-day forecast per property
export const forecasts: PropertyForecast[] = [
  {
    propertyId: "prop-001",
    days: [
      { day: "Tomorrow", condition: "thunderstorm", highC: 40, lowC: 32, precipMm: 35, windSpeedKmh: 40 },
      { day: "Day 2", condition: "rain", highC: 37, lowC: 30, precipMm: 18, windSpeedKmh: 25 },
      { day: "Day 3", condition: "partly_cloudy", highC: 39, lowC: 31, precipMm: 2, windSpeedKmh: 15 },
    ],
  },
  {
    propertyId: "prop-002",
    days: [
      { day: "Tomorrow", condition: "sandstorm", highC: 48, lowC: 38, precipMm: 0, windSpeedKmh: 70 },
      { day: "Day 2", condition: "dust", highC: 46, lowC: 36, precipMm: 0, windSpeedKmh: 45 },
      { day: "Day 3", condition: "haze", highC: 44, lowC: 35, precipMm: 0, windSpeedKmh: 20 },
    ],
  },
  {
    propertyId: "prop-003",
    days: [
      { day: "Tomorrow", condition: "thunderstorm", highC: 36, lowC: 29, precipMm: 50, windSpeedKmh: 55 },
      { day: "Day 2", condition: "rain", highC: 35, lowC: 28, precipMm: 30, windSpeedKmh: 35 },
      { day: "Day 3", condition: "cloudy", highC: 37, lowC: 29, precipMm: 5, windSpeedKmh: 20 },
    ],
  },
  {
    propertyId: "prop-004",
    days: [
      { day: "Tomorrow", condition: "clear", highC: 45, lowC: 35, precipMm: 0, windSpeedKmh: 18 },
      { day: "Day 2", condition: "partly_cloudy", highC: 44, lowC: 34, precipMm: 0, windSpeedKmh: 15 },
      { day: "Day 3", condition: "clear", highC: 46, lowC: 36, precipMm: 0, windSpeedKmh: 12 },
    ],
  },
  {
    propertyId: "prop-005",
    days: [
      { day: "Tomorrow", condition: "sandstorm", highC: 49, lowC: 39, precipMm: 0, windSpeedKmh: 60 },
      { day: "Day 2", condition: "dust", highC: 47, lowC: 37, precipMm: 0, windSpeedKmh: 40 },
      { day: "Day 3", condition: "haze", highC: 45, lowC: 36, precipMm: 0, windSpeedKmh: 25 },
    ],
  },
  {
    propertyId: "prop-006",
    days: [
      { day: "Tomorrow", condition: "partly_cloudy", highC: 42, lowC: 33, precipMm: 0, windSpeedKmh: 20 },
      { day: "Day 2", condition: "clear", highC: 43, lowC: 34, precipMm: 0, windSpeedKmh: 15 },
      { day: "Day 3", condition: "clear", highC: 44, lowC: 34, precipMm: 0, windSpeedKmh: 12 },
    ],
  },
];

// Active weather alerts
export const weatherAlerts: WeatherAlert[] = [
  {
    id: "alert-001",
    type: "dust_storm",
    severity: "extreme",
    title: "Severe Dust Storm Warning",
    description: "Major sandstorm moving across western Abu Dhabi. Visibility below 500m expected. All outdoor operations at risk. ADNOC facilities on high alert.",
    area: "Western Abu Dhabi — Ruwais Industrial Corridor",
    startTime: "2026-05-02T06:00",
    endTime: "2026-05-03T18:00",
    affectedPropertyIds: ["prop-002", "prop-005"],
    polygon: [
      [24.15, 52.5],
      [24.15, 53.2],
      [24.55, 53.2],
      [24.55, 52.5],
    ],
  },
  {
    id: "alert-002",
    type: "thunderstorm",
    severity: "severe",
    title: "Thunderstorm & Flash Flood Warning",
    description: "Heavy thunderstorms expected with 40-60mm rainfall in 6 hours. Flash flooding risk in low-lying areas. Repeat of April 2024 event patterns detected.",
    area: "Dubai — Sharjah Metropolitan",
    startTime: "2026-05-02T14:00",
    endTime: "2026-05-03T06:00",
    affectedPropertyIds: ["prop-001", "prop-003"],
    polygon: [
      [25.1, 55.1],
      [25.1, 55.5],
      [25.35, 55.5],
      [25.35, 55.1],
    ],
  },
  {
    id: "alert-003",
    type: "extreme_heat",
    severity: "moderate",
    title: "Extreme Heat Advisory",
    description: "Temperatures exceeding 48°C. Heat stress risk for workers. Building cooling systems under maximum load — electrical fire risk elevated.",
    area: "UAE-wide",
    startTime: "2026-05-02T10:00",
    endTime: "2026-05-04T18:00",
    affectedPropertyIds: ["prop-001", "prop-002", "prop-003", "prop-004", "prop-005", "prop-006"],
    polygon: [
      [22.5, 51.5],
      [22.5, 56.5],
      [26.5, 56.5],
      [26.5, 51.5],
    ],
  },
  {
    id: "alert-004",
    type: "high_wind",
    severity: "severe",
    title: "High Wind Warning — Coastal Areas",
    description: "Wind gusts up to 80 km/h along coast. Risk of facade damage to high-rise structures. Construction site hazards. Marine operations suspended.",
    area: "Dubai Coast — JBR to Business Bay",
    startTime: "2026-05-02T12:00",
    endTime: "2026-05-03T00:00",
    affectedPropertyIds: ["prop-001", "prop-006"],
    polygon: [
      [25.15, 55.15],
      [25.15, 55.32],
      [25.25, 55.32],
      [25.25, 55.15],
    ],
  },
];

// Historical weather losses for each property
export const historicalWeatherLosses: Record<string, { event: string; date: string; lossAED: number }[]> = {
  "prop-001": [
    { event: "April 2024 Dubai Floods", date: "2024-04-16", lossAED: 12000000 },
    { event: "2023 Summer Heat — HVAC Failure", date: "2023-07-22", lossAED: 850000 },
  ],
  "prop-002": [
    { event: "2024 Ruwais Dust Storm", date: "2024-03-11", lossAED: 3200000 },
    { event: "2022 Sandstorm — Equipment Damage", date: "2022-05-08", lossAED: 5600000 },
  ],
  "prop-003": [
    { event: "April 2024 Dubai Floods", date: "2024-04-16", lossAED: 8500000 },
  ],
  "prop-004": [],
  "prop-005": [
    { event: "2023 Ruwais Sandstorm", date: "2023-06-15", lossAED: 18000000 },
    { event: "2024 Heat Wave — Pipeline Stress", date: "2024-08-02", lossAED: 7500000 },
  ],
  "prop-006": [
    { event: "2024 Coastal Storm Surge", date: "2024-11-20", lossAED: 2100000 },
  ],
};

// Weather threat scoring
export function getWeatherThreatLevel(propertyId: string): { level: number; label: string; color: string } {
  const weather = currentWeather.find((w) => w.propertyId === propertyId);
  const alerts = weatherAlerts.filter((a) => a.affectedPropertyIds.includes(propertyId));

  let score = 0;

  // Base weather conditions
  if (weather) {
    if (weather.condition === "sandstorm") score += 40;
    else if (weather.condition === "thunderstorm") score += 35;
    else if (weather.condition === "rain") score += 15;
    else if (weather.condition === "dust") score += 20;
    else if (weather.condition === "haze") score += 10;

    if (weather.tempC >= 48) score += 15;
    else if (weather.tempC >= 44) score += 10;
    else if (weather.tempC >= 40) score += 5;

    if (weather.windSpeedKmh >= 60) score += 20;
    else if (weather.windSpeedKmh >= 40) score += 10;
    else if (weather.windSpeedKmh >= 25) score += 5;

    if (weather.visibilityKm < 2) score += 15;
    else if (weather.visibilityKm < 5) score += 8;
  }

  // Alert severity
  alerts.forEach((a) => {
    if (a.severity === "extreme") score += 30;
    else if (a.severity === "severe") score += 20;
    else if (a.severity === "moderate") score += 10;
    else score += 5;
  });

  score = Math.min(100, score);

  if (score >= 70) return { level: score, label: "Severe", color: "#dc2626" };
  if (score >= 45) return { level: score, label: "Warning", color: "#ea580c" };
  if (score >= 25) return { level: score, label: "Watch", color: "#d97706" };
  return { level: score, label: "Clear", color: "#22c55e" };
}

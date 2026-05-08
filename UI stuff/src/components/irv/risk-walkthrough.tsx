import type { Property } from "@/data/mock-properties";
import { calculateRiskScore, getPremiumConfig } from "@/data/mock-properties";
import { currentWeather, forecasts, weatherAlerts, weatherConditionEmoji } from "@/data/mock-weather";
import {
  X, ChevronLeft, ChevronRight, Play, Pause, MapPin, Building2, Shield, CloudRain,
  Brain, BarChart3, DollarSign, Gavel, Droplets, Zap, Wind, Eye,
  AlertTriangle, CheckCircle2, XCircle, Users, Layers, ArrowRight, Flame
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

interface RiskWalkthroughProps {
  property: Property;
  onExit: (targetTab?: string) => void;
}

interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tabMapping: string;
}

const chapters: Chapter[] = [
  { id: "arrival", title: "Arrival", subtitle: "Location & Context", icon: <MapPin className="h-5 w-5" />, tabMapping: "streetview" },
  { id: "building", title: "The Building", subtitle: "Structure & Construction", icon: <Building2 className="h-5 w-5" />, tabMapping: "twin" },
  { id: "surroundings", title: "Surroundings", subtitle: "Proximity & Exposure", icon: <Layers className="h-5 w-5" />, tabMapping: "map" },
  { id: "weather", title: "Weather & Climate", subtitle: "Environmental Threats", icon: <CloudRain className="h-5 w-5" />, tabMapping: "map" },
  { id: "insights", title: "What AI Found", subtitle: "Key Risk Signals", icon: <Brain className="h-5 w-5" />, tabMapping: "insights" },
  { id: "scoring", title: "Risk Score", subtitle: "Quantified Assessment", icon: <BarChart3 className="h-5 w-5" />, tabMapping: "scoring" },
  { id: "pricing", title: "The Price", subtitle: "Premium Breakdown", icon: <DollarSign className="h-5 w-5" />, tabMapping: "pricing" },
  { id: "decision", title: "Your Call", subtitle: "Underwriting Decision", icon: <Gavel className="h-5 w-5" />, tabMapping: "decision" },
];

function useAnimatedNumber(target: number, duration = 1500, ready = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!ready) { setValue(0); return; }
    const startTime = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, ready]);
  return value;
}

export function RiskWalkthrough({ property, onExit }: RiskWalkthroughProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animPhase, setAnimPhase] = useState<"enter" | "visible" | "exit">("enter");
  const [contentReady, setContentReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const CHAPTER_DURATION = 12000;

  useEffect(() => {
    setAnimPhase("enter");
    setContentReady(false);
    const t = setTimeout(() => {
      setAnimPhase("visible");
      setContentReady(true);
    }, 600);
    return () => clearTimeout(t);
  }, [currentChapter]);

  useEffect(() => {
    if (!isPlaying || animPhase !== "visible") return;
    timerRef.current = setTimeout(() => {
      if (currentChapter < chapters.length - 1) {
        goToChapter(currentChapter + 1);
      } else {
        setIsPlaying(false);
      }
    }, CHAPTER_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentChapter, animPhase]);

  const goToChapter = useCallback((index: number) => {
    if (index < 0 || index >= chapters.length) return;
    setAnimPhase("exit");
    setTimeout(() => setCurrentChapter(index), 400);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit(chapters[currentChapter].tabMapping);
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goToChapter(currentChapter + 1); }
      if (e.key === "ArrowLeft") goToChapter(currentChapter - 1);
      if (e.key === "p") setIsPlaying((p) => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentChapter, goToChapter, onExit]);

  const chapter = chapters[currentChapter];
  const weather = currentWeather.find((w) => w.propertyId === property.id);
  const forecast = forecasts.find((f) => f.propertyId === property.id);
  const alerts = weatherAlerts.filter((a) => a.affectedPropertyIds.includes(property.id));
  const riskBreakdown = calculateRiskScore(property);
  const premiumConfig = getPremiumConfig(property);
  const totalLoadingPercent = premiumConfig.loadings.reduce((s, l) => s + l.current, 0);
  const adjustedRate = premiumConfig.baseRatePerMille * (1 + totalLoadingPercent / 100);
  const grossPremium = (property.sumInsured / 1000) * adjustedRate;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, oklch(0.35 0.15 255) 0%, transparent 60%),
                         radial-gradient(ellipse at 70% 80%, oklch(0.25 0.12 ${property.riskScore >= 70 ? 25 : property.riskScore >= 40 ? 60 : 150}) 0%, transparent 50%)`,
          }}
        />
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 walkthrough-particle"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${8 + Math.random() * 12}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onExit(chapter.tabMapping)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>
          <div>
            <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase">Risk Walkthrough</p>
            <p className="text-white text-sm font-semibold">{property.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsPlaying((p) => !p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-all">
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span className="hidden md:inline">{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <span className="text-white/30 text-xs font-mono">{currentChapter + 1}/{chapters.length}</span>
        </div>
      </div>

      {/* Chapter dots - hidden on mobile */}
      <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-3">
        {chapters.map((ch, i) => (
          <button key={ch.id} onClick={() => goToChapter(i)} className="group flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
              i === currentChapter ? "bg-white scale-125 shadow-[0_0_12px_rgba(255,255,255,0.5)]" :
              i < currentChapter ? "bg-white/50" : "bg-white/15"
            }`} />
            <span className={`text-[10px] font-medium transition-all duration-300 whitespace-nowrap ${
              i === currentChapter ? "text-white/80 opacity-100 translate-x-0" : "text-white/0 opacity-0 -translate-x-2"
            } group-hover:text-white/60 group-hover:opacity-100 group-hover:translate-x-0`}>
              {ch.title}
            </span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className={`absolute inset-0 flex items-center justify-center px-6 md:px-20 py-20 transition-all duration-500 ${
        animPhase === "enter" ? "opacity-0 translate-y-8 scale-95" :
        animPhase === "exit" ? "opacity-0 -translate-y-8 scale-95" :
        "opacity-100 translate-y-0 scale-100"
      }`}>
        {currentChapter === 0 && <ArrivalChapter property={property} ready={contentReady} />}
        {currentChapter === 1 && <BuildingChapter property={property} ready={contentReady} />}
        {currentChapter === 2 && <SurroundingsChapter property={property} ready={contentReady} />}
        {currentChapter === 3 && <WeatherChapter property={property} weather={weather} forecast={forecast} alerts={alerts} ready={contentReady} />}
        {currentChapter === 4 && <InsightsChapter property={property} ready={contentReady} />}
        {currentChapter === 5 && <ScoringChapter breakdown={riskBreakdown} ready={contentReady} />}
        {currentChapter === 6 && <PricingChapter property={property} premiumConfig={premiumConfig} grossPremium={grossPremium} adjustedRate={adjustedRate} ready={contentReady} />}
        {currentChapter === 7 && <DecisionChapter property={property} riskScore={riskBreakdown.total} grossPremium={grossPremium} onExit={() => onExit("decision")} ready={contentReady} />}
      </div>

      {/* Nav arrows + progress */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <button onClick={() => goToChapter(currentChapter - 1)} disabled={currentChapter === 0} className="p-2.5 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white disabled:opacity-20 transition-all">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="w-32 md:w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white/60 rounded-full transition-all duration-700 ease-out" style={{ width: `${((currentChapter + 1) / chapters.length) * 100}%` }} />
        </div>
        <button onClick={() => goToChapter(currentChapter + 1)} disabled={currentChapter === chapters.length - 1} className="p-2.5 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white disabled:opacity-20 transition-all">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Chapter subtitle */}
      <div className={`absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-20 text-center transition-all duration-700 delay-300 ${contentReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex items-center gap-2 text-white/30 text-[10px] tracking-[0.25em] uppercase font-medium">
          {chapter.icon}
          <span>{chapter.subtitle}</span>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-2 right-4 md:right-6 z-20 text-white/15 text-[9px] hidden md:flex gap-3">
        <span>← → Navigate</span>
        <span>Space Next</span>
        <span>P Pause</span>
        <span>Esc Exit</span>
      </div>
    </div>
  );
}

/* ==================== CHAPTER COMPONENTS ==================== */

function ArrivalChapter({ property, ready }: { property: Property; ready: boolean }) {
  const streetViewEmbedUrl = `https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${property.lat},${property.lng}&heading=0&pitch=10&fov=80`;

  return (
    <div className="w-full max-w-6xl flex flex-col items-center gap-6 md:gap-8">
      {/* Interactive Street View embed */}
      <div className={`relative w-full aspect-[2/1] max-h-[50vh] rounded-2xl overflow-hidden transition-all duration-1000 ${ready ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}>
        <iframe
          src={streetViewEmbedUrl}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Street View of ${property.name}`}
        />
        {/* Gradient overlay at bottom for text legibility */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pointer-events-none">
          <div className="flex items-end gap-2 mb-1">
            <MapPin className="h-4 w-4 text-white/60 shrink-0" />
            <p className="text-white/60 text-xs tracking-widest uppercase">{property.city}, {property.country}</p>
          </div>
          <h2 className="text-white text-2xl md:text-5xl font-bold tracking-tight">{property.name}</h2>
          <p className="text-white/50 text-sm mt-1 hidden md:block">{property.address}</p>
        </div>
        {/* Live badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1.5 pointer-events-none">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] font-medium text-white/80">INTERACTIVE STREET VIEW</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-3xl">
        {[
          { label: "Property Type", value: property.type, icon: <Building2 className="h-4 w-4" /> },
          { label: "Broker", value: property.broker, icon: <Users className="h-4 w-4" /> },
          { label: "Sum Insured", value: `AED ${(property.sumInsured / 1_000_000).toFixed(0)}M`, icon: <DollarSign className="h-4 w-4" /> },
        ].map((card, i) => (
          <div key={card.label} className={`bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${800 + i * 200}ms` }}>
            <div className="flex items-center justify-center text-white/30 mb-2">{card.icon}</div>
            <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-wider">{card.label}</p>
            <p className="text-white text-xs md:text-sm font-semibold mt-0.5 capitalize">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuildingChapter({ property, ready }: { property: Property; ready: boolean }) {
  const floors = useAnimatedNumber(property.floors, 1500, ready);
  const capacity = useAnimatedNumber(property.occupancyCapacity, 1500, ready);
  const age = useAnimatedNumber(new Date().getFullYear() - property.yearBuilt, 1500, ready);

  const conditionColor = (c: string) =>
    c === "good" ? "text-green-400 bg-green-400/10" :
    c === "fair" ? "text-amber-400 bg-amber-400/10" :
    "text-red-400 bg-red-400/10";

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-6 md:gap-8">
      <div className={`text-center transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">{property.name}</h2>
        <p className="text-white/40 text-sm mt-1">{property.constructionMaterial}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-3xl">
        {[
          { label: "Floors", value: floors },
          { label: "Capacity", value: capacity.toLocaleString() },
          { label: "Building Age", value: `${age} yrs` },
        ].map((stat, i) => (
          <div key={stat.label} className={`text-center transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${400 + i * 200}ms` }}>
            <p className="text-white text-3xl md:text-6xl font-bold tabular-nums">{stat.value}</p>
            <p className="text-white/30 text-[10px] md:text-xs uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-3xl">
        <div className={`bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "1000ms" }}>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Shield className="h-4 w-4 text-blue-400" />
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Fire Protection</p>
          </div>
          <div className="space-y-2">
            {[
              { label: "Sprinklers", active: property.fireProtection.sprinklers },
              { label: "Alarms", active: property.fireProtection.alarms },
              { label: "Extinguishers", active: property.fireProtection.extinguishers },
              { label: "Hydrant Nearby", active: property.fireProtection.hydrantNearby },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-white/50 text-sm">{item.label}</span>
                {item.active ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className={`bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "1200ms" }}>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Eye className="h-4 w-4 text-purple-400" />
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Condition Assessment</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Electrical", value: property.electricalCondition },
              { label: "Plumbing", value: property.plumbingCondition },
              { label: "Roof", value: property.roofCondition },
            ].map((c) => (
              <div key={c.label} className="flex items-center justify-between">
                <span className="text-white/50 text-sm">{c.label}</span>
                <span className={`text-xs font-semibold capitalize rounded-full px-2.5 py-0.5 ${conditionColor(c.value)}`}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SurroundingsChapter({ property, ready }: { property: Property; ready: boolean }) {
  const exposures = [
    { label: "Flood Zone", active: property.floodZone, icon: <Droplets className="h-5 w-5" />, desc: "Located in a designated flood zone. Historical flooding events recorded." },
    { label: "Coastal Proximity", active: property.nearCoast, icon: <Wind className="h-5 w-5" />, desc: "Within 5km of coastline. Salt corrosion and storm surge exposure." },
    { label: "Industrial Adjacent", active: property.nearIndustrial, icon: <Zap className="h-5 w-5" />, desc: "Adjacent to industrial zone. Explosion, fire spread, and contamination risk." },
  ];
  const activeExposures = exposures.filter((e) => e.active);

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-6 md:gap-8">
      <div className={`text-center transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">What's Around</h2>
        <p className="text-white/40 text-sm mt-1">{property.address}, {property.city}</p>
      </div>

      <div className={`w-full max-w-4xl aspect-[2.2/1] rounded-2xl overflow-hidden border border-white/10 transition-all duration-1000 ${ready ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}>
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${property.lat},${property.lng}&zoom=15&maptype=satellite`}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-3xl">
        {exposures.map((exp, i) => (
          <div key={exp.label} className={`relative rounded-xl border p-3 md:p-4 transition-all duration-700 ${exp.active ? "bg-red-500/5 border-red-500/30" : "bg-white/3 border-white/10"} ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${800 + i * 200}ms` }}>
            <div className={`mb-2 ${exp.active ? "text-red-400" : "text-white/20"}`}>{exp.icon}</div>
            <p className={`text-xs md:text-sm font-semibold ${exp.active ? "text-white" : "text-white/30"}`}>{exp.label}</p>
            {exp.active ? (
              <p className="text-white/50 text-[10px] md:text-xs mt-1">{exp.desc}</p>
            ) : (
              <p className="text-white/20 text-[10px] md:text-xs mt-1">Not applicable</p>
            )}
            {exp.active && <AlertTriangle className="absolute top-2 right-2 h-3.5 w-3.5 text-red-400 animate-pulse" />}
          </div>
        ))}
      </div>

      {activeExposures.length === 0 && (
        <div className={`flex items-center gap-2 text-green-400 transition-all duration-700 delay-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">No proximity hazards detected</span>
        </div>
      )}
    </div>
  );
}

function WeatherChapter({ property, weather, forecast, alerts, ready }: {
  property: Property;
  weather?: { condition: string; tempC: number; humidity: number; windSpeedKmh: number; feelsLikeC: number; visibilityKm: number; uvIndex: number };
  forecast?: { days: { day: string; condition: string; highC: number; lowC: number; precipMm: number }[] };
  alerts: { title: string; severity: string; description: string }[];
  ready: boolean;
}) {
  if (!weather) return <p className="text-white/40">No weather data available</p>;
  const emoji = weatherConditionEmoji[weather.condition as keyof typeof weatherConditionEmoji] || "🌡️";

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-6 md:gap-8">
      <div className={`text-center transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <p className="text-5xl md:text-6xl mb-2">{emoji}</p>
        <h2 className="text-white text-4xl md:text-5xl font-bold">{weather.tempC}°C</h2>
        <p className="text-white/40 text-sm capitalize mt-1">Feels like {weather.feelsLikeC}°C</p>
      </div>

      <div className="grid grid-cols-4 gap-2 md:gap-4 w-full max-w-3xl">
        {[
          { label: "Humidity", value: `${weather.humidity}%`, icon: <Droplets className="h-4 w-4" /> },
          { label: "Wind", value: `${weather.windSpeedKmh} km/h`, icon: <Wind className="h-4 w-4" /> },
          { label: "Visibility", value: `${weather.visibilityKm} km`, icon: <Eye className="h-4 w-4" /> },
          { label: "UV Index", value: `${weather.uvIndex}`, icon: <Flame className="h-4 w-4" /> },
        ].map((m, i) => (
          <div key={m.label} className={`bg-white/5 border border-white/10 rounded-xl p-2.5 md:p-3 text-center transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${600 + i * 150}ms` }}>
            <div className="flex items-center justify-center text-white/30 mb-1">{m.icon}</div>
            <p className="text-white text-sm md:text-lg font-bold">{m.value}</p>
            <p className="text-white/30 text-[9px] md:text-[10px] uppercase tracking-wider">{m.label}</p>
          </div>
        ))}
      </div>

      {forecast && (
        <div className={`flex gap-3 md:gap-4 transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "1200ms" }}>
          {forecast.days.map((day) => {
            const dayEmoji = weatherConditionEmoji[day.condition as keyof typeof weatherConditionEmoji] || "🌡️";
            return (
              <div key={day.day} className="bg-white/5 border border-white/10 rounded-xl px-4 md:px-5 py-3 text-center min-w-[80px] md:min-w-[100px]">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">{day.day}</p>
                <p className="text-2xl my-1">{dayEmoji}</p>
                <p className="text-white text-sm font-semibold">{day.highC}° / {day.lowC}°</p>
                {day.precipMm > 0 && <p className="text-blue-400 text-[10px] mt-0.5">{day.precipMm}mm rain</p>}
              </div>
            );
          })}
        </div>
      )}

      {alerts.length > 0 && (
        <div className={`w-full max-w-2xl space-y-2 transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "1500ms" }}>
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-semibold">{alert.title}</p>
                <p className="text-white/50 text-xs mt-0.5">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightsChapter({ property, ready }: { property: Property; ready: boolean }) {
  const sorted = [...property.aiInsights].sort((a, b) => {
    const sev: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2);
  });
  const sevColors: Record<string, string> = { high: "border-red-500/40 bg-red-500/5", medium: "border-amber-500/40 bg-amber-500/5", low: "border-green-500/40 bg-green-500/5" };
  const sevDot: Record<string, string> = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-green-400" };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-5 md:gap-6">
      <div className={`text-center transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">AI Risk Signals</h2>
        <p className="text-white/40 text-sm mt-1">{sorted.length} findings from document analysis</p>
      </div>
      <div className="w-full space-y-2.5 max-h-[55vh] overflow-y-auto pr-2">
        {sorted.map((insight, i) => (
          <div key={insight.id} className={`border rounded-xl p-3 md:p-4 transition-all duration-700 ${sevColors[insight.severity] || ""} ${ready ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`} style={{ transitionDelay: `${600 + i * 250}ms` }}>
            <div className="flex items-start gap-3">
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${sevDot[insight.severity] || ""}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs md:text-sm leading-relaxed">{insight.text}</p>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                  <span className="text-white/30 text-[10px] uppercase font-medium">{insight.category}</span>
                  <span className="text-white/20 text-[10px]">•</span>
                  <span className="text-white/30 text-[10px]">{insight.confidence}% confidence</span>
                  {insight.sourceRef && (
                    <>
                      <span className="text-white/20 text-[10px]">•</span>
                      <span className="text-blue-400/60 text-[10px] truncate">{insight.sourceRef.documentName}</span>
                    </>
                  )}
                </div>
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                insight.severity === "high" ? "text-red-400 bg-red-400/10" :
                insight.severity === "medium" ? "text-amber-400 bg-amber-400/10" :
                "text-green-400 bg-green-400/10"
              }`}>{insight.severity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoringChapter({ breakdown, ready }: { breakdown: ReturnType<typeof calculateRiskScore>; ready: boolean }) {
  const animatedScore = useAnimatedNumber(breakdown.total, 2000, ready);
  const scoreColor = breakdown.total >= 70 ? "text-red-400" : breakdown.total >= 40 ? "text-amber-400" : "text-green-400";
  const arcColor = breakdown.total >= 70 ? "#f87171" : breakdown.total >= 40 ? "#fbbf24" : "#4ade80";
  const radius = 90;
  const circumference = Math.PI * radius;
  const progress = animatedScore / 100;

  const factors = [
    { label: "Location", value: breakdown.locationRisk },
    { label: "Construction", value: breakdown.constructionRisk },
    { label: "Occupancy", value: breakdown.occupancyRisk },
    { label: "Protection", value: breakdown.protectionCredit },
    { label: "Adjacent Risk", value: breakdown.adjacentRisk },
    { label: "Roof", value: breakdown.roofCondition },
    { label: "Flood Zone", value: breakdown.floodZoneRisk },
  ].filter((f) => f.value !== 0);

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-6 md:gap-8">
      <div className={`relative transition-all duration-1000 ${ready ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
        <svg width="220" height="130" viewBox="0 0 220 130">
          <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
          <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke={arcColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circumference}`} strokeDashoffset={`${circumference * (1 - progress)}`} style={{ transition: "stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <p className={`text-4xl md:text-5xl font-bold tabular-nums ${scoreColor}`}>{animatedScore}</p>
          <p className="text-white/30 text-[10px] uppercase tracking-wider">Risk Score</p>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-2">
        {factors.map((f, i) => (
          <div key={f.label} className={`flex items-center gap-3 transition-all duration-700 ${ready ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`} style={{ transitionDelay: `${1000 + i * 150}ms` }}>
            <span className="text-white/50 text-xs w-24 md:w-28 text-right">{f.label}</span>
            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${f.value > 0 ? "bg-red-400/70" : "bg-green-400/70"}`} style={{ width: `${Math.min(Math.abs(f.value) * 5, 100)}%`, transitionDelay: `${1200 + i * 150}ms` }} />
            </div>
            <span className={`text-xs font-mono w-8 text-right ${f.value > 0 ? "text-red-400" : "text-green-400"}`}>{f.value > 0 ? "+" : ""}{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingChapter({ property, premiumConfig, grossPremium, adjustedRate, ready }: {
  property: Property;
  premiumConfig: ReturnType<typeof getPremiumConfig>;
  grossPremium: number;
  adjustedRate: number;
  ready: boolean;
}) {
  const animatedPremium = useAnimatedNumber(Math.round(grossPremium), 2500, ready);

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-6 md:gap-8">
      <div className={`text-center transition-all duration-1000 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <p className="text-white/30 text-xs uppercase tracking-[0.3em] mb-2">Gross Premium</p>
        <p className="text-white text-3xl md:text-6xl font-bold tabular-nums">AED {animatedPremium.toLocaleString()}</p>
        <p className="text-white/30 text-sm mt-1">Base {premiumConfig.baseRatePerMille}‰ → Adjusted {adjustedRate.toFixed(3)}‰</p>
      </div>
      <div className="w-full max-w-2xl space-y-2">
        <p className={`text-white/40 text-[10px] uppercase tracking-wider font-medium mb-2 transition-all duration-700 delay-700 ${ready ? "opacity-100" : "opacity-0"}`}>Premium Loadings</p>
        {premiumConfig.loadings.map((loading, i) => (
          <div key={loading.id} className={`flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 md:px-4 py-2 md:py-2.5 transition-all duration-700 ${ready ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`} style={{ transitionDelay: `${900 + i * 150}ms` }}>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs md:text-sm">{loading.factor}</p>
              <p className="text-white/30 text-[10px] mt-0.5 line-clamp-1 hidden md:block">{loading.explanation}</p>
            </div>
            <span className={`text-sm font-bold tabular-nums shrink-0 ml-2 ${loading.current > 0 ? "text-red-400" : "text-green-400"}`}>{loading.current > 0 ? "+" : ""}{loading.current}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionChapter({ property, riskScore, grossPremium, onExit, ready }: {
  property: Property;
  riskScore: number;
  grossPremium: number;
  onExit: () => void;
  ready: boolean;
}) {
  const highCount = property.aiInsights.filter((i) => i.severity === "high").length;
  const recommendation = riskScore >= 70 ? "Refer to Senior UW" : riskScore >= 50 ? "Approve with Conditions" : "Approve";
  const recColor = riskScore >= 70 ? "text-red-400 border-red-500/30 bg-red-500/5" :
    riskScore >= 50 ? "text-amber-400 border-amber-500/30 bg-amber-500/5" :
    "text-green-400 border-green-500/30 bg-green-500/5";

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-6 md:gap-8">
      <div className={`text-center transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">Your Call</h2>
        <p className="text-white/40 text-sm mt-1">AI recommendation based on analysis</p>
      </div>

      <div className={`border rounded-2xl p-6 md:p-8 text-center max-w-md w-full transition-all duration-1000 ${recColor} ${ready ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} style={{ transitionDelay: "400ms" }}>
        <Gavel className="h-7 w-7 md:h-8 md:w-8 mx-auto mb-3 opacity-70" />
        <p className="text-xl md:text-2xl font-bold">{recommendation}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-3xl">
        {[
          { label: "Risk Score", value: `${riskScore}/100` },
          { label: "Premium", value: `AED ${Math.round(grossPremium).toLocaleString()}` },
          { label: "Critical Flags", value: `${highCount}` },
          { label: "Status", value: property.status },
        ].map((s, i) => (
          <div key={s.label} className={`bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: `${800 + i * 150}ms` }}>
            <p className="text-white/30 text-[9px] md:text-[10px] uppercase tracking-wider">{s.label}</p>
            <p className="text-white text-sm md:text-lg font-bold mt-1 capitalize">{s.value}</p>
          </div>
        ))}
      </div>

      <button onClick={onExit} className={`flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "1400ms" }}>
        Exit to Workspace
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

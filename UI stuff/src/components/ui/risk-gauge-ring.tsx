interface RiskGaugeRingProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { dim: 32, stroke: 3, fontSize: "text-[10px]" },
  md: { dim: 40, stroke: 3.5, fontSize: "text-xs" },
  lg: { dim: 52, stroke: 4, fontSize: "text-sm" },
  xl: { dim: 72, stroke: 5, fontSize: "text-lg" },
};

export function RiskGaugeRing({ score, size = "md", showLabel = false, className = "" }: RiskGaugeRingProps) {
  const cfg = sizeConfig[size];
  const radius = (cfg.dim - cfg.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score, 100) / 100;
  const dashOffset = circumference * (1 - progress);

  const colorClass = score >= 70
    ? "text-risk-high"
    : score >= 40
    ? "text-risk-medium"
    : "text-risk-low";

  const bgRingClass = score >= 70
    ? "stroke-risk-high/15"
    : score >= 40
    ? "stroke-risk-medium/15"
    : "stroke-risk-low/15";

  return (
    <div className={`inline-flex flex-col items-center gap-0.5 ${className}`}>
      <div className="relative" style={{ width: cfg.dim, height: cfg.dim }}>
        <svg
          width={cfg.dim}
          height={cfg.dim}
          viewBox={`0 0 ${cfg.dim} ${cfg.dim}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={cfg.dim / 2}
            cy={cfg.dim / 2}
            r={radius}
            fill="none"
            strokeWidth={cfg.stroke}
            className={bgRingClass}
          />
          {/* Progress ring */}
          <circle
            cx={cfg.dim / 2}
            cy={cfg.dim / 2}
            r={radius}
            fill="none"
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            stroke="currentColor"
            className={colorClass}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold ${cfg.fontSize} ${colorClass}`}>
          {score}
        </span>
      </div>
      {showLabel && (
        <span className={`text-[9px] font-medium ${colorClass} uppercase tracking-wider`}>
          {score >= 70 ? "High" : score >= 40 ? "Medium" : "Low"}
        </span>
      )}
    </div>
  );
}

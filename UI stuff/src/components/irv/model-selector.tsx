import { Brain } from "lucide-react";

export const AI_MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
] as const;

export type AIModelId = (typeof AI_MODELS)[number]["value"];

interface ModelSelectorProps {
  value: AIModelId;
  onChange: (model: AIModelId) => void;
  disabled?: boolean;
  className?: string;
}

export function ModelSelector({ value, onChange, disabled, className = "" }: ModelSelectorProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Brain className="h-3 w-3 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AIModelId)}
        disabled={disabled}
        className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
      >
        {AI_MODELS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}

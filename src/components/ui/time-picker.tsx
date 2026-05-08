import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/shared/utils/lib-utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);

function parseTimeParts(
  value: string | undefined
): { h: string; m: string } | null {
  if (!value?.trim()) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(value.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return null;
  }
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
  };
}

function formatHm(h: string, m: string) {
  return `${h}:${m}`;
}

type Period = "AM" | "PM";

/** 24h clock → 12h UI (hour 1–12, padded mm, AM/PM) */
function to12From24(h24: number, minute: number): {
  hour12: number;
  minute: string;
  period: Period;
} {
  const period: Period = h24 >= 12 ? "PM" : "AM";
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return {
    hour12,
    minute: String(minute).padStart(2, "0"),
    period,
  };
}

/** 12h UI → 24h strings for storage */
function to24From12(
  hour12: number,
  minute: number,
  period: Period
): { h: string; m: string } {
  let h24: number;
  if (period === "AM") {
    h24 = hour12 === 12 ? 0 : hour12;
  } else {
    h24 = hour12 === 12 ? 12 : hour12 + 12;
  }
  return {
    h: String(h24).padStart(2, "0"),
    m: String(minute).padStart(2, "0"),
  };
}

function formatDisplay12(ui: {
  hour12: number;
  minute: string;
  period: Period;
}) {
  return `${String(ui.hour12).padStart(2, "0")}:${ui.minute} ${ui.period}`;
}

export interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
}

/**
 * Cross-browser time control. Value/onChange use 24h `HH:mm`; the UI is 12h with AM/PM.
 */
export function TimePicker({
  value = "",
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
  id,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parts24 = parseTimeParts(value);
  const ui = parts24
    ? to12From24(parseInt(parts24.h, 10), parseInt(parts24.m, 10))
    : null;
  const display = ui ? formatDisplay12(ui) : null;

  const emit = (
    hour12: number | undefined,
    minuteStr: string | undefined,
    period: Period | undefined
  ) => {
    const h12 = hour12 ?? 12;
    const m = minuteStr !== undefined ? parseInt(minuteStr, 10) : 0;
    const p = period ?? "AM";
    const { h, m: mm } = to24From12(h12, m, p);
    onChange?.(formatHm(h, mm));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between gap-2 text-left font-normal px-3",
            ariaInvalid && "border-destructive",
            className
          )}
          disabled={disabled}
          aria-invalid={ariaInvalid || undefined}
          aria-required={ariaRequired || undefined}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate tabular-nums text-left",
              !display && "text-muted-foreground"
            )}
          >
            {display ? display : placeholder}
          </span>
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 flex flex-col gap-2">
          <div className="flex gap-2 items-center flex-wrap">
            <Select
              value={ui ? String(ui.hour12).padStart(2, "0") : undefined}
              onValueChange={(hStr) => {
                const h12 = parseInt(hStr, 10);
                const m = ui?.minute ?? "00";
                const p = ui?.period ?? "AM";
                emit(h12, m, p);
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-[72px]" aria-label="Hour">
                <SelectValue placeholder="Hr" />
              </SelectTrigger>
              <SelectContent
                className="max-h-[min(280px,50vh)] time-picker-content"
                viewportClassName="max-h-[min(280px,50vh)] !overflow-y-scroll pr-1 time-picker-scrollbars"
                hideScrollButtons
              >
                {HOUR_12_OPTIONS.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-sm font-medium tabular-nums">
              :
            </span>
            <Select
              value={ui?.minute}
              onValueChange={(m) => {
                const h12 = ui?.hour12 ?? 12;
                const p = ui?.period ?? "AM";
                emit(h12, m, p);
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-[80px]" aria-label="Minute">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent
                className="max-h-[min(280px,50vh)] time-picker-content"
                viewportClassName="max-h-[min(280px,50vh)] !overflow-y-scroll pr-1 time-picker-scrollbars"
                hideScrollButtons
              >
                {MINUTE_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={ui?.period}
              onValueChange={(p) => {
                const h12 = ui?.hour12 ?? 12;
                const m = ui?.minute ?? "00";
                emit(h12, m, p as Period);
              }}
              disabled={disabled}
            >
              <SelectTrigger className="w-[76px]" aria-label="AM or PM">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent
                className="max-h-[min(280px,50vh)] time-picker-content"
                viewportClassName="max-h-[min(280px,50vh)] !overflow-y-scroll pr-1 time-picker-scrollbars"
                hideScrollButtons
              >
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {display && onChange ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

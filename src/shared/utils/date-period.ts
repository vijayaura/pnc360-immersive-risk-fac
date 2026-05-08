// Utility functions for date period calculations in proposal forms

export type PeriodUnit = "days" | "months" | "years";

export interface DatePeriodValue {
  startDate?: string;
  endDate?: string;
}

export interface CalculatedPeriod {
  value: number;
  unit: string;
}

/**
 * Calculate the period between two dates in the specified unit
 */
export function calculateDatePeriod(
  startDate: string | undefined,
  endDate: string | undefined,
  unit: PeriodUnit = "months"
): CalculatedPeriod | null {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return null;
  }

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (unit) {
    case "days":
      return {
        value: diffDays,
        unit: diffDays === 1 ? "day" : "days",
      };

    case "years": {
      let years = end.getFullYear() - start.getFullYear();
      const tempDate = new Date(start);
      tempDate.setFullYear(tempDate.getFullYear() + years);
      if (tempDate > end) years--;
      return {
        value: years,
        unit: years === 1 ? "year" : "years",
      };
    }

    case "months":
    default: {
      let months = (end.getFullYear() - start.getFullYear()) * 12;
      months += end.getMonth() - start.getMonth();
      if (end.getDate() < start.getDate()) months--;
      return {
        value: Math.max(0, months),
        unit: months === 1 ? "month" : "months",
      };
    }
  }
}

/**
 * Parse a date period value from various formats
 * Handles: object, JSON string, or returns default empty value
 */
export function parseDatePeriodValue(value: unknown): DatePeriodValue {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as DatePeriodValue;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return parsed as DatePeriodValue;
      }
    } catch {
      // Not valid JSON, return empty
    }
  }

  return { startDate: "", endDate: "" };
}

/**
 * Serialize a date period value for API submission
 */
export function serializeDatePeriodValue(value: unknown): {
  valueJson: DatePeriodValue;
  valueText: string;
} {
  const periodValue = parseDatePeriodValue(value);
  return {
    valueJson: periodValue,
    valueText: JSON.stringify(periodValue),
  };
}

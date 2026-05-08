import { useMemo } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { BaseFieldProps } from "../../types/form";
import { FieldLabelWithNote } from "./FieldLabelWithNote";
import { getDateValidationConstraints } from "../../utils/dateValidationConstraints";

interface PolicyPeriodValue {
    startDate?: string;
    endDate?: string;
}

// Calculate period between two dates
function calculatePeriod(
    startDate: string,
    endDate: string,
    unit: "days" | "months" | "years"
): { value: number; unit: string } | null {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
        return null;
    }

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (unit) {
        case "days":
            return { value: diffDays, unit: diffDays === 1 ? "day" : "days" };
        case "years": {
            let years = end.getFullYear() - start.getFullYear();
            const tempDate = new Date(start);
            tempDate.setFullYear(tempDate.getFullYear() + years);
            if (tempDate > end) years--;
            return { value: years, unit: years === 1 ? "year" : "years" };
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

export function PolicyPeriodField({
    field,
    value,
    error,
    onChange,
    isFieldRequired,
    disabled,
}: BaseFieldProps) {
    const periodValue: PolicyPeriodValue =
        typeof value === "object" && value !== null
            ? value
            : { startDate: "", endDate: "" };

    const fromDateLabel = field.fromDateLabel || "From Date";
    const toDateLabel = field.toDateLabel || "To Date";
    const periodUnit = field.periodCalculationUnit || "months";
    const shouldShowPeriod = field.autoCalculatePeriod !== false;

    const constraints = getDateValidationConstraints(field);
    const effectiveToMinDate = useMemo(() => {
        if (constraints.toMinDate && periodValue.startDate) {
            return constraints.toMinDate > periodValue.startDate
                ? constraints.toMinDate
                : periodValue.startDate;
        }
        return periodValue.startDate || constraints.toMinDate;
    }, [constraints.toMinDate, periodValue.startDate]);

    const calculatedPeriod = useMemo(() => {
        if (!periodValue.startDate || !periodValue.endDate) return null;
        return calculatePeriod(
            periodValue.startDate,
            periodValue.endDate,
            periodUnit
        );
    }, [periodValue.startDate, periodValue.endDate, periodUnit]);

    return (
        <div className="space-y-2">
            <FieldLabelWithNote
                label={field.label}
                required={isFieldRequired(field)}
                note={field.metadata?.note}
                htmlFor={field.id}
            />

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                        {fromDateLabel}
                    </Label>
                    <DatePicker
                        id={`${field.id}-start`}
                        value={periodValue.startDate || ""}
                        onChange={(date) => {
                            const nextValue = {
                                ...periodValue,
                                startDate: date || "",
                            };
                            if (date && periodValue.endDate && date > periodValue.endDate) {
                                nextValue.endDate = "";
                            }
                            onChange(field.name, nextValue);
                        }}
                        min={constraints.fromMinDate}
                        max={constraints.fromMaxDate}
                        placeholder="Select start date"
                        className={error ? "border-destructive" : ""}
                        disabled={disabled}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{toDateLabel}</Label>
                    <DatePicker
                        id={`${field.id}-end`}
                        value={periodValue.endDate || ""}
                        onChange={(date) => {
                            if (date && periodValue.startDate && date < periodValue.startDate) {
                                return;
                            }
                            onChange(field.name, { ...periodValue, endDate: date || "" });
                        }}
                        min={effectiveToMinDate}
                        max={constraints.toMaxDate}
                        placeholder="Select end date"
                        className={error ? "border-destructive" : ""}
                        disabled={disabled}
                    />
                </div>
            </div>

            {shouldShowPeriod && calculatedPeriod && (
                <div className="p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">Period: </span>
                    <span className="font-medium">
                        {calculatedPeriod.value} {calculatedPeriod.unit}
                    </span>
                </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
            {!error && <p className="text-xs text-transparent">&nbsp;</p>}
        </div>
    );
}

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from '@/shared/utils/lib-utils';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Input } from "@/components/ui/input";

export interface DatePickerProps {
    value?: string; // ISO date string (YYYY-MM-DD) or Year string (YYYY)
    onChange?: (date: string | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    min?: string; // ISO date string (YYYY-MM-DD)
    max?: string; // ISO date string (YYYY-MM-DD)
    id?: string;
    mode?: "date" | "year";
    /** Ranges of dates to disable (inclusive both ends). Each range has start/end as ISO date strings. */
    disabledRanges?: Array<{ start: string; end: string }>;
    /**
     * When `min` is not set, earliest year shown in the year dropdown.
     * Defaults to 1900.
     */
    fromYear?: number;
    /**
     * When `max` is not set, latest year shown in the year dropdown.
     * Defaults to current year + 30.
     */
    toYear?: number;
}

/**
 * DatePicker component using react-day-picker Calendar with year/month selectors
 * Prevents the 6-digit year bug by using a proper calendar UI
 */
export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    disabled = false,
    className,
    min,
    max,
    id,
    mode = "date",
    disabledRanges,
    fromYear: fromYearProp,
    toYear: toYearProp,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    function parseLocalDate(iso: string): Date | undefined {
        try {
            const str = String(iso).trim();
            if (!str) return undefined;

            if (str.length === 4 && !isNaN(Number(str))) {
                return new Date(parseInt(str, 10), 0, 1);
            }

            const parts = str.split("T")[0].split("-").map(Number);
            const year = parts[0];
            const month = parts.length > 1 && !isNaN(parts[1]) ? parts[1] - 1 : 0;
            const day = parts.length > 2 && !isNaN(parts[2]) ? parts[2] : 1;

            const date = new Date(year, month, day);
            return isNaN(date.getTime()) ? undefined : date;
        } catch (e) {
            return undefined;
        }
    }

    // Convert string value to Date object
    const selectedDate = value ? parseLocalDate(value) : undefined;

    // Convert min/max strings to Date objects
    const minDate = min ? parseLocalDate(min) : undefined;
    const maxDate = max ? parseLocalDate(max) : undefined;

    // Navigation bounds for month switching
    const fromMonth = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : undefined;
    const toMonth = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : undefined;

    const currentYear = new Date().getFullYear();
    const defaultFromYear = 1900;
    const defaultFutureYears = 100;

    // State for month/year navigation (declared before year range so we can include visible month)
    const [month, setMonth] = React.useState<Date>(selectedDate || new Date());

    // Year dropdown bounds: respect min/max dates; otherwise wide defaults + include value & calendar month
    const { minYear, maxYear } = React.useMemo(() => {
        let yMin = minDate ? minDate.getFullYear() : (fromYearProp ?? defaultFromYear);
        let yMax = maxDate ? maxDate.getFullYear() : (toYearProp ?? currentYear + defaultFutureYears);

        if (!minDate) {
            if (selectedDate) yMin = Math.min(yMin, selectedDate.getFullYear());
            yMin = Math.min(yMin, month.getFullYear());
        }
        if (!maxDate) {
            if (selectedDate) yMax = Math.max(yMax, selectedDate.getFullYear());
            yMax = Math.max(yMax, month.getFullYear());
        }
        if (yMin > yMax) {
            const t = yMin;
            yMin = yMax;
            yMax = t;
        }
        return { minYear: yMin, maxYear: yMax };
    }, [
        minDate,
        maxDate,
        fromYearProp,
        toYearProp,
        currentYear,
        selectedDate,
        month,
    ]);

    // Track if we've already auto-navigated on this open
    const hasAutoNavigated = React.useRef(false);

    // Auto-navigate to selected date's month when popover first opens
    React.useEffect(() => {
        if (open) {
            // Only auto-navigate if we haven't done it yet for this open session
            if (!hasAutoNavigated.current && selectedDate) {
                setMonth(selectedDate);
                hasAutoNavigated.current = true;
            }
        } else {
            // Reset the flag when popover closes
            hasAutoNavigated.current = false;
        }
    }, [open, selectedDate]);

    React.useEffect(() => {
        if (fromMonth && month < fromMonth) {
            setMonth(fromMonth);
        }
        if (toMonth && month > toMonth) {
            setMonth(toMonth);
        }
    }, [month, fromMonth, toMonth]);


    const handleSelect = (date: Date | undefined) => {
        if (date) {
            if (mode === "year") {
                onChange?.(date.getFullYear().toString());
            } else {
                // Format date as YYYY-MM-DD
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const formattedDate = `${year}-${month}-${day}`;
                onChange?.(formattedDate);
            }
        } else {
            onChange?.(undefined);
        }
        setOpen(false);
    };

    // Parse disabled ranges into Date pairs
    const parsedDisabledRanges = React.useMemo(() => {
        if (!disabledRanges?.length) return [];
        return disabledRanges.map(({ start, end }) => ({
            start: parseLocalDate(start),
            end: parseLocalDate(end),
        })).filter((r): r is { start: Date; end: Date } => !!r.start && !!r.end);
    }, [disabledRanges]);

    // Disable dates outside min/max range or within disabled ranges
    const disabledDates = React.useMemo(() => {
        return (date: Date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            for (const range of parsedDisabledRanges) {
                if (date >= range.start && date <= range.end) return true;
            }
            return false;
        };
    }, [minDate, maxDate, parsedDisabledRanges]);

    // Generate year options
    const years = React.useMemo(() => {
        const yearList = [];
        for (let year = minYear; year <= maxYear; year++) {
            yearList.push(year);
        }
        return yearList;
    }, [minYear, maxYear]);

    // Filter years based on search term — also include any valid 4-digit year typed directly
    const filteredYears = React.useMemo(() => {
        if (!searchTerm) return years;
        const matched = years.filter(year => year.toString().includes(searchTerm));
        // If user typed a full valid 4-digit year not in the list, append it
        if (searchTerm.length === 4) {
            const typed = parseInt(searchTerm, 10);
            if (!isNaN(typed) && typed > 0 && !matched.includes(typed)) {
                return [...matched, typed];
            }
        }
        return matched;
    }, [years, searchTerm]);

    // Month names
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleMonthChange = (monthIndex: string) => {
        const newMonth = new Date(month);
        newMonth.setMonth(parseInt(monthIndex));
        setMonth(newMonth);
    };

    const handleYearChange = (year: string) => {
        const selectedYear = parseInt(year);
        if (mode === "year") {
            onChange?.(year);
            setOpen(false);
            // Also update internal month state so it reflects the change if opened again
            const newMonth = new Date(month);
            newMonth.setFullYear(selectedYear);
            setMonth(newMonth);
        } else {
            const newMonth = new Date(month);
            newMonth.setFullYear(selectedYear);
            setMonth(newMonth);
        }
    };

    React.useEffect(() => {
        if (mode === "year" && open) {
            // Use a short delay to allow Radix UI to finish mounting and animating
            const timeoutId = window.setTimeout(() => {
                const targetYear = selectedDate ? selectedDate.getFullYear() : currentYear;
                const item = document.getElementById(`year-item-${targetYear}`);
                if (item) {
                    item.scrollIntoView({ block: "center", behavior: "instant" });
                }
            }, 50);

            return () => {
                window.clearTimeout(timeoutId);
            };
        }
    }, [open, mode, selectedDate, currentYear]);

    // Restore focus to search input after filteredYears re-render steals it
    React.useEffect(() => {
        if (mode === "year" && open && searchTerm !== "") {
            // Radix re-focuses list items on re-render — restore input focus
            const frame = requestAnimationFrame(() => {
                searchInputRef.current?.focus();
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [filteredYears, mode, open, searchTerm]);

    if (mode === "year") {
        return (
            <Select 
                open={open}
                onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    if (!isOpen) setSearchTerm("");
                }}
                value={selectedDate ? selectedDate.getFullYear().toString() : ""} 
                onValueChange={(val) => {
                    handleYearChange(val);
                    setSearchTerm("");
                }}
                disabled={disabled}
            >
                <SelectTrigger 
                    id={id} 
                    className={cn(
                        "w-full text-left font-normal", 
                        !selectedDate && "text-muted-foreground", 
                        className
                    )}
                >
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <SelectValue placeholder={!placeholder ? "Select Year" : placeholder} />
                        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </div>
                </SelectTrigger>
                <SelectContent className="p-2" hideScrollButtons={true}>
                    <div className="pb-2 px-1">
                        <Input
                            ref={searchInputRef}
                            autoFocus
                            placeholder="Search year..."
                            value={searchTerm}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Allow only positive numbers (0-9)
                                if (value === "" || /^\d+$/.test(value)) {
                                    setSearchTerm(value);
                                }
                            }}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            type="text"
                            inputMode="numeric"
                        />
                    </div>
                    <div className="max-h-[250px] overflow-y-auto year-picker-scrollbars">
                        {filteredYears.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No years found
                            </div>
                        ) : (
                            filteredYears.map((yearValue) => {
                                const isCurrentYear = yearValue === currentYear && !selectedDate;
                                return (
                                    <SelectItem 
                                        key={yearValue} 
                                        value={yearValue.toString()} 
                                        id={`year-item-${yearValue}`}
                                        className={cn(
                                            "pl-3 [&>span:first-child]:hidden",
                                            isCurrentYear ? "bg-primary/10 font-semibold text-primary focus:text-accent-foreground" : ""
                                        )}
                                    >
                                        {yearValue}
                                    </SelectItem>
                                );
                            })
                        )}
                    </div>
                </SelectContent>
            </Select>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    className={cn(
                        "date-picker-trigger group w-full justify-between gap-2 text-left font-normal px-3 hover:bg-background hover:text-foreground hover:border-primary/50 data-[state=open]:bg-background data-[state=open]:border-primary/50",
                        className
                    )}
                    disabled={disabled}
                >
                    <span
                        className={cn(
                            "min-w-0 flex-1 truncate text-left",
                            !selectedDate &&
                                "text-muted-foreground transition-colors group-hover:text-foreground"
                        )}
                    >
                        {selectedDate ? (
                            format(selectedDate, "dd-MM-yyyy")
                        ) : (
                            placeholder
                        )}
                    </span>
                    <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                    <div className="flex gap-2">
                        <Select
                            value={month.getMonth().toString()}
                            onValueChange={handleMonthChange}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((monthName, index) => {
                                    const candidate = new Date(month.getFullYear(), index, 1);
                                    const isDisabled = (fromMonth && candidate < fromMonth) || (toMonth && candidate > toMonth);
                                    return (
                                        <SelectItem key={index} value={index.toString()} disabled={isDisabled}>
                                            {monthName}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        <Select
                            value={month.getFullYear().toString()}
                            onValueChange={handleYearChange}
                        >
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent hideScrollButtons={true}>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    disabled={disabledDates}
                    month={month}
                    onMonthChange={setMonth}
                    fromMonth={fromMonth}
                    toMonth={toMonth}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

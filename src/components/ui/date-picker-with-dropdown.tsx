import * as React from "react"
import {
    addMonths,
    endOfMonth,
    format,
    isAfter,
    isBefore,
    setMonth,
    setYear,
    startOfMonth,
    subMonths,
} from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/shared/utils/lib-utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface DatePickerWithDropdownProps {
    value: Date | null
    onChange: (date: Date | null) => void
    fromDate?: Date
    toDate?: Date
    placeholder?: string
    fromYear?: number
    toYear?: number
    className?: string
    disabled?: boolean
    dateFormat?: string
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

const clampDisplayMonth = (month: Date, fromDate?: Date, toDate?: Date) => {
    const monthStart = startOfMonth(month)

    if (fromDate && isBefore(endOfMonth(monthStart), startOfMonth(fromDate))) {
        return startOfMonth(fromDate)
    }

    if (toDate && isAfter(monthStart, startOfMonth(toDate))) {
        return startOfMonth(toDate)
    }

    return monthStart
}

const isMonthWithinRange = (year: number, monthIndex: number, fromDate?: Date, toDate?: Date) => {
    const monthStart = startOfMonth(new Date(year, monthIndex, 1))
    const monthEnd = endOfMonth(monthStart)

    if (fromDate && isBefore(monthEnd, startOfMonth(fromDate))) {
        return false
    }

    if (toDate && isAfter(monthStart, startOfMonth(toDate))) {
        return false
    }

    return true
}

const isYearWithinRange = (year: number, fromDate?: Date, toDate?: Date) =>
    MONTHS.some((_, monthIndex) => isMonthWithinRange(year, monthIndex, fromDate, toDate))

export function DatePickerWithDropdown({
    value,
    onChange,
    fromDate,
    toDate,
    fromYear,
    toYear,
    placeholder = "Pick a date",
    className,
    disabled = false,
    dateFormat = "dd-MM-yyyy"
}: DatePickerWithDropdownProps) {
    const [open, setOpen] = React.useState(false)
    const [displayMonth, setDisplayMonth] = React.useState<Date>(() =>
        clampDisplayMonth(value || new Date(), fromDate, toDate)
    )

    // Sync display month when value changes
    React.useEffect(() => {
        if (value) {
            setDisplayMonth(clampDisplayMonth(value, fromDate, toDate))
        }
    }, [fromDate, toDate, value])

    React.useEffect(() => {
        setDisplayMonth((currentMonth) => clampDisplayMonth(currentMonth, fromDate, toDate))
    }, [fromDate, toDate])

    const currentYear = new Date().getFullYear()
    const yStart = fromYear || (fromDate ? fromDate.getFullYear() : currentYear - 100)
    const yEnd = toYear || (toDate ? toDate.getFullYear() : currentYear + 10)

    const years = Array.from({ length: yEnd - yStart + 1 }, (_, i) => yStart + i)
    const displayYear = displayMonth.getFullYear()

    const handleMonthChange = (monthIndexStr: string) => {
        const newMonth = parseInt(monthIndexStr, 10)
        setDisplayMonth(clampDisplayMonth(setMonth(displayMonth, newMonth), fromDate, toDate))
    }

    const handleYearChange = (yearStr: string) => {
        const newYear = parseInt(yearStr, 10)
        setDisplayMonth(clampDisplayMonth(setYear(displayMonth, newYear), fromDate, toDate))
    }

    const canGoToPreviousMonth = !fromDate || !isBefore(endOfMonth(subMonths(displayMonth, 1)), startOfMonth(fromDate))
    const canGoToNextMonth = !toDate || !isAfter(startOfMonth(addMonths(displayMonth, 1)), startOfMonth(toDate))

    const nextMonth = () => {
        if (!canGoToNextMonth) return
        setDisplayMonth(clampDisplayMonth(addMonths(displayMonth, 1), fromDate, toDate))
    }

    const prevMonth = () => {
        if (!canGoToPreviousMonth) return
        setDisplayMonth(clampDisplayMonth(subMonths(displayMonth, 1), fromDate, toDate))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal px-4",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, dateFormat) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
                <div className="flex items-center justify-between gap-1 mb-2">
                    {/* Custom Header Nav */}
                    <Button
                        variant="outline"
                        className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex-shrink-0 disabled:opacity-30"
                        onClick={prevMonth}
                        disabled={!canGoToPreviousMonth}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex gap-1 flex-1 justify-center items-center">
                        <Select
                            value={displayMonth.getMonth().toString()}
                            onValueChange={handleMonthChange}
                        >
                            <SelectTrigger className="h-8 w-[110px] focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[300px]">
                                <ScrollArea className="h-[250px] w-full">
                                    {MONTHS.map((month, idx) => (
                                        <SelectItem
                                            key={idx}
                                            value={idx.toString()}
                                            disabled={!isMonthWithinRange(displayYear, idx, fromDate, toDate)}
                                        >
                                            {month}
                                        </SelectItem>
                                    ))}
                                </ScrollArea>
                            </SelectContent>
                        </Select>

                        <Select
                            value={displayMonth.getFullYear().toString()}
                            onValueChange={handleYearChange}
                        >
                            <SelectTrigger className="h-8 w-[80px] focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-[300px]">
                                <ScrollArea className="h-[250px] w-full">
                                    {years.map((year) => (
                                        <SelectItem
                                            key={year}
                                            value={year.toString()}
                                            disabled={!isYearWithinRange(year, fromDate, toDate)}
                                        >
                                            {year}
                                        </SelectItem>
                                    ))}
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex-shrink-0 disabled:opacity-30"
                        onClick={nextMonth}
                        disabled={!canGoToNextMonth}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <Calendar
                    mode="single"
                    selected={value || undefined}
                    onSelect={(d) => {
                        onChange(d || null)
                        setOpen(false)
                    }}
                    month={displayMonth}
                    onMonthChange={setDisplayMonth}
                    fromDate={fromDate}
                    toDate={toDate}
                    classNames={{
                        caption: "hidden", // Hide completely the native caption/navigation
                        head_row: "flex w-full mt-0", // Fix spacing
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

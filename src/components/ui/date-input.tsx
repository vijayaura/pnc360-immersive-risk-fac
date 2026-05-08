import * as React from "react";
import { cn } from '@/shared/utils/lib-utils';

export interface DateInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onValueChange?: (value: string) => void;
}

/**
 * DateInput component that restricts year input to 4 digits
 * and prevents invalid date entries
 */
const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
    ({ className, value, onChange, onValueChange, ...props }, ref) => {
        // Validate and correct date value to ensure year is max 4 digits
        const validateAndCorrectDate = (dateValue: string): string => {
            if (!dateValue) return dateValue;

            // Parse the date value (format: YYYY-MM-DD)
            const parts = dateValue.split("-");

            if (parts.length === 3) {
                let [year, month, day] = parts;

                // Restrict year to 4 digits
                if (year.length > 4) {
                    year = year.slice(0, 4);
                }

                // Reconstruct and return the corrected date
                return `${year}-${month}-${day}`;
            }

            return dateValue;
        };

        const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
            const input = e.currentTarget;
            const currentValue = input.value;

            // Validate and correct the value
            const correctedValue = validateAndCorrectDate(currentValue);

            // If value was corrected, update the input
            if (correctedValue !== currentValue) {
                input.value = correctedValue;

                // Trigger onChange with corrected value
                const syntheticEvent = {
                    ...e,
                    target: input,
                    currentTarget: input,
                } as unknown as React.ChangeEvent<HTMLInputElement>;

                onChange?.(syntheticEvent);
                onValueChange?.(correctedValue);
            }

            // Call original onInput if provided
            props.onInput?.(e);
        };
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            const correctedValue = validateAndCorrectDate(inputValue);

            // If value needs correction, update it
            if (correctedValue !== inputValue) {
                e.target.value = correctedValue;
            }

            onChange?.(e);
            onValueChange?.(correctedValue);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            const input = e.currentTarget;
            const cursorPosition = input.selectionStart || 0;
            const currentValue = input.value;

            // Only apply restrictions if we have a value
            if (currentValue) {
                const parts = currentValue.split("-");

                // Check if cursor is in the year section (positions 0-4)
                const isEditingYear = cursorPosition <= 4;

                if (isEditingYear && parts[0]) {
                    const yearPart = parts[0];
                    const selectionStart = input.selectionStart || 0;
                    const selectionEnd = input.selectionEnd || 0;
                    const hasSelection = selectionStart !== selectionEnd;

                    // If year is already 4 digits and user is typing (not replacing selection)
                    if (yearPart.length >= 4 && !hasSelection && e.key >= "0" && e.key <= "9") {
                        e.preventDefault();
                        return;
                    }
                }
            }

            // Call the original onKeyDown if provided
            props.onKeyDown?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            // Final validation on blur
            const input = e.currentTarget;
            const correctedValue = validateAndCorrectDate(input.value);

            if (correctedValue !== input.value) {
                input.value = correctedValue;

                const syntheticEvent = {
                    ...e,
                    target: input,
                    currentTarget: input,
                } as unknown as React.ChangeEvent<HTMLInputElement>;

                onChange?.(syntheticEvent);
                onValueChange?.(correctedValue);
            }

            props.onBlur?.(e);
        };

        return (
            <input
                type="date"
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                value={value}
                onChange={handleChange}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                {...props}
            />
        );
    }
);

DateInput.displayName = "DateInput";

export { DateInput };

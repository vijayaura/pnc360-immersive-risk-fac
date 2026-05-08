import { formatIfNumber } from "./common-methods";
/**
 * Form utilities for handling dynamic form fields
 */

// Type for normalized option
export interface NormalizedOption {
    value: string;
    label: string;
}

// Type for raw option from API (can be string or object)
export type RawOption = string | { value: string; label: string };

/**
 * Normalize options array to always have {value, label} format
 * Handles both string[] and {value, label}[] formats from API
 * 
 * @param options - Raw options array from API
 * @returns Normalized options array with {value, label} format
 * 
 * @example
 * // String array input
 * normalizeOptions(["Office", "IT", "Consultancy"])
 * // Returns: [{value: "Office", label: "Office"}, {value: "IT", label: "IT"}, {value: "Consultancy", label: "Consultancy"}]
 * 
 * // Object array input (passes through)
 * normalizeOptions([{value: "office", label: "Office"}])
 * // Returns: [{value: "office", label: "Office"}]
 */
export const normalizeOptions = (options: RawOption[] | undefined | null): NormalizedOption[] => {
    if (!options || !Array.isArray(options)) {
        return [];
    }

    return options.map((opt) => {
        if (typeof opt === "string") {
            return { value: opt, label: formatIfNumber(opt) };
        }
        // Already in {value, label} format
        return opt;
    });
};

/**
 * Get the display label for a selected value
 * Useful when you have a value and need to find its label from options
 * 
 * @param options - Raw or normalized options array
 * @param value - The selected value to find label for
 * @returns The label for the value, or the value itself if not found
 */
export const getOptionLabel = (options: RawOption[] | undefined | null, value: string): string => {
    if (!value || !options) return value;

    const normalizedOptions = normalizeOptions(options);
    const found = normalizedOptions.find((opt) => opt.value === value);
    return found?.label ?? value;
};

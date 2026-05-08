/**
 * Utility functions for parsing and validating date period values from uploaded files
 * Handles multiple date formats and validates date ranges
 */

export interface ParsedDatePeriod {
    startDate: string; // ISO format YYYY-MM-DD
    endDate: string; // ISO format YYYY-MM-DD
    isValid: boolean;
    errors: string[];
    warnings: string[];
    originalValue: string;
}

/**
 * Common date format patterns
 */
const DATE_PATTERNS = [
    // DD-MM-YY or DD-MM-YYYY
    {
        regex: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/,
        parse: (match: RegExpMatchArray): Date | null => {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
            let year = parseInt(match[3], 10);

            // Handle 2-digit years
            if (year < 100) {
                year += year < 50 ? 2000 : 1900;
            }

            const date = new Date(year, month, day);

            // Validate the date is real
            if (
                date.getDate() !== day ||
                date.getMonth() !== month ||
                date.getFullYear() !== year
            ) {
                return null;
            }

            return date;
        },
    },
    // DD-Mon-YYYY (e.g., 13-Feb-2025)
    {
        regex: /^(\d{1,2})[\/\-\.]([A-Za-z]{3,})[\/\-\.](\d{2,4})$/,
        parse: (match: RegExpMatchArray): Date | null => {
            const day = parseInt(match[1], 10);
            const monthStr = match[2].toLowerCase();
            let year = parseInt(match[3], 10);

            // Handle 2-digit years
            if (year < 100) {
                year += year < 50 ? 2000 : 1900;
            }

            const months: { [key: string]: number } = {
                jan: 0, january: 0,
                feb: 1, february: 1,
                mar: 2, march: 2,
                apr: 3, april: 3,
                may: 4,
                jun: 5, june: 5,
                jul: 6, july: 6,
                aug: 7, august: 7,
                sep: 8, sept: 8, september: 8,
                oct: 9, october: 9,
                nov: 10, november: 10,
                dec: 11, december: 11,
            };

            const month = months[monthStr];
            if (month === undefined) return null;

            const date = new Date(year, month, day);

            // Validate the date is real
            if (
                date.getDate() !== day ||
                date.getMonth() !== month ||
                date.getFullYear() !== year
            ) {
                return null;
            }

            return date;
        },
    },
    // YYYY-MM-DD (ISO format)
    {
        regex: /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/,
        parse: (match: RegExpMatchArray): Date | null => {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const day = parseInt(match[3], 10);

            const date = new Date(year, month, day);

            // Validate the date is real
            if (
                date.getDate() !== day ||
                date.getMonth() !== month ||
                date.getFullYear() !== year
            ) {
                return null;
            }

            return date;
        },
    },
];

/**
 * Parse a single date string into a Date object
 */
function parseDateString(dateStr: string): Date | null {
    const trimmed = dateStr.trim();

    // Try each pattern
    for (const pattern of DATE_PATTERNS) {
        const match = trimmed.match(pattern.regex);
        if (match) {
            const date = pattern.parse(match);
            if (date) return date;
        }
    }

    // Try native Date parsing as fallback
    const nativeDate = new Date(trimmed);
    if (!isNaN(nativeDate.getTime())) {
        return nativeDate;
    }

    return null;
}

/**
 * Convert Date object to ISO format string (YYYY-MM-DD)
 */
function dateToISOString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse date period value from uploaded file
 * Handles formats like:
 * - "13-01-26 to 13-02-26"
 * - "13-Feb-2025 to 15-Mar-2025"
 * - "2025-01-13 - 2025-02-13"
 * - "13/01/2025 - 15/02/2025"
 */
export function parseDatePeriod(value: string | null | undefined): ParsedDatePeriod {
    const result: ParsedDatePeriod = {
        startDate: '',
        endDate: '',
        isValid: false,
        errors: [],
        warnings: [],
        originalValue: value || '',
    };

    // Handle empty or null values
    if (!value || typeof value !== 'string') {
        result.errors.push('Date period value is empty or invalid');
        return result;
    }

    const trimmed = value.trim();

    // Split by common separators (with and without spaces)
    // Order matters: try longer/more specific patterns first
    const separators = [' to ', ' till ', ' until ', ' - ', ' ~ ', 'to', 'till', 'until', '~', '-'];
    let parts: string[] = [];
    let usedSeparator = '';

    for (const sep of separators) {
        // Use case-insensitive search for word separators
        const regex = /^[a-z]+$/i.test(sep)
            ? new RegExp(sep, 'i')  // Case-insensitive for words like 'to', 'till'
            : new RegExp(sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));  // Escape special chars

        const lowerTrimmed = trimmed.toLowerCase();
        const lowerSep = sep.toLowerCase();

        if (lowerTrimmed.includes(lowerSep)) {
            // Split and filter out empty parts
            parts = trimmed.split(regex).filter(p => p.trim() !== '');
            if (parts.length >= 2) {
                usedSeparator = sep;
                break;
            }
        }
    }

    // If no separator found, try to extract two date patterns directly
    if (parts.length < 2) {
        // Enhanced pattern to match dates even when concatenated
        // Matches: DD-MM-YY, DD-MM-YYYY, DD/MM/YY, DD.MM.YYYY, etc.
        const datePattern = /\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}/g;
        const matches = trimmed.match(datePattern);
        if (matches && matches.length === 2) {
            parts = matches;
        }
    }

    if (parts.length < 2) {
        result.errors.push(
            `Could not parse date period. Expected format: "DD-MM-YYYY to DD-MM-YYYY" or "DD-Mon-YYYY to DD-Mon-YYYY". Got: "${trimmed}"`
        );
        return result;
    }

    // Parse start date
    const startDateStr = parts[0].trim();
    const startDate = parseDateString(startDateStr);

    if (!startDate) {
        result.errors.push(`Could not parse start date: "${startDateStr}"`);
    } else {
        result.startDate = dateToISOString(startDate);
    }

    // Parse end date
    const endDateStr = parts[1].trim();
    const endDate = parseDateString(endDateStr);

    if (!endDate) {
        result.errors.push(`Could not parse end date: "${endDateStr}"`);
    } else {
        result.endDate = dateToISOString(endDate);
    }

    // Validate date range if both dates are valid
    if (startDate && endDate) {
        // Check if end date is before start date
        if (endDate < startDate) {
            result.errors.push(
                `End date (${result.endDate}) cannot be before start date (${result.startDate})`
            );
        }

        // Check if dates are the same
        if (endDate.getTime() === startDate.getTime()) {
            result.warnings.push(
                `Start date and end date are the same (${result.startDate}). This may not be intended.`
            );
        }

        // Check if dates are too far in the past
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

        if (startDate < oneYearAgo) {
            result.warnings.push(
                `Start date (${result.startDate}) is more than 1 year in the past. Please verify this is correct.`
            );
        }

        // Check if dates are too far in the future
        const fiveYearsFromNow = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());

        if (endDate > fiveYearsFromNow) {
            result.warnings.push(
                `End date (${result.endDate}) is more than 5 years in the future. Please verify this is correct.`
            );
        }
    }

    // Set isValid flag
    result.isValid = result.errors.length === 0 && result.startDate !== '' && result.endDate !== '';

    return result;
}

/**
 * Format parsed date period for display
 */
export function formatDatePeriodForDisplay(parsed: ParsedDatePeriod): string {
    if (!parsed.isValid) {
        return parsed.originalValue;
    }

    // Format as "DD Mon YYYY to DD Mon YYYY"
    const formatDate = (isoDate: string): string => {
        const date = new Date(isoDate);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    return `${formatDate(parsed.startDate)} to ${formatDate(parsed.endDate)}`;
}

/**
 * Batch parse multiple date periods
 * Useful for processing uploaded files with multiple rows
 */
export function batchParseDatePeriods(
    values: string[]
): {
    results: ParsedDatePeriod[];
    summary: {
        total: number;
        valid: number;
        invalid: number;
        withWarnings: number;
    };
} {
    const results = values.map(parseDatePeriod);

    const summary = {
        total: results.length,
        valid: results.filter((r) => r.isValid).length,
        invalid: results.filter((r) => !r.isValid).length,
        withWarnings: results.filter((r) => r.warnings.length > 0).length,
    };

    return { results, summary };
}

/**
 * Get user-friendly error message for date period parsing
 */
export function getDatePeriodErrorMessage(parsed: ParsedDatePeriod): string {
    if (parsed.isValid) {
        return '';
    }

    if (parsed.errors.length > 0) {
        return parsed.errors[0]; // Return first error
    }

    return 'Invalid date period format';
}

/**
 * Get all validation messages (errors + warnings)
 */
export function getDatePeriodValidationMessages(parsed: ParsedDatePeriod): {
    type: 'error' | 'warning';
    message: string;
}[] {
    const messages: { type: 'error' | 'warning'; message: string }[] = [];

    parsed.errors.forEach((error) => {
        messages.push({ type: 'error', message: error });
    });

    parsed.warnings.forEach((warning) => {
        messages.push({ type: 'warning', message: warning });
    });

    return messages;
}

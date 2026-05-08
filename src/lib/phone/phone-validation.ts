import {
  validatePhoneNumberLength,
  isValidPhoneNumber,
  parsePhoneNumber,
} from "libphonenumber-js";

const LENGTH_ERROR_MESSAGES: Record<
  "INVALID_COUNTRY" | "NOT_A_NUMBER" | "TOO_SHORT" | "TOO_LONG" | "INVALID_LENGTH",
  string
> = {
  INVALID_COUNTRY: "Please select a valid country.",
  NOT_A_NUMBER: "Please enter a valid phone number.",
  TOO_SHORT: "Phone number is too short for the selected country.",
  TOO_LONG: "Phone number is too long for the selected country.",
  INVALID_LENGTH: "Phone number has an invalid length for the selected country.",
};

/**
 * Validates phone number using library length and validity checks.
 * @param value - E.164 phone string
 * @param required - whether the field is required
 * @returns Error message string or null if valid
 */

export function validatePhone(
  value: string | undefined,
  required: boolean
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return required ? "Please enter a phone number." : null;
  }

  const lengthResult = validatePhoneNumberLength(trimmed);
  if (lengthResult) {
    return LENGTH_ERROR_MESSAGES[lengthResult] ?? "Invalid phone number length.";
  }

  if (!isValidPhoneNumber(trimmed)) {
    return "Please enter a valid phone number.";
  }

  return null;
}

/**
 * Parse E.164 string to get country and national number (for backend or display).
 */
export function getPhoneParts(value: string | undefined): {
  countryCode: string;
  nationalNumber: string;
} | null {
  if (!value?.trim()) return null;
  try {
    const parsed = parsePhoneNumber(value);
    if (!parsed) return null;
    return {
      countryCode: parsed.countryCallingCode,
      nationalNumber: parsed.nationalNumber,
    };
  } catch {
    return null;
  }
}

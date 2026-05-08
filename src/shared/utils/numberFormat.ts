/**
 * Utility functions for number formatting in the UI
 * Ensures commas are shown in UI but not sent to APIs
 */

/**
 * Format a number with thousands separators for display
 * @param value - The number or string to format
 * @returns Formatted string with commas
 */
export const formatNumberWithCommas = (value: string | number): string => {
  if (!value || value === '') return '';
  
  // Convert to string and remove any existing commas
  const cleanValue = value.toString().replace(/,/g, '');
  
  // Check if it's a valid number
  if (isNaN(Number(cleanValue))) return value.toString();
  
  // Format with commas using consistent en-US locale
  return Number(cleanValue).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Remove commas from a formatted number string for API requests
 * @param value - The formatted string with commas
 * @returns Clean number string without commas
 */
export const removeCommasFromNumber = (value: string): string => {
  if (!value) return '';
  return value.replace(/,/g, '');
};

/**
 * Handle input change for number fields with comma formatting
 * @param value - The input value
 * @param setter - The setter function to update the state
 * @param fieldName - The field name to update
 */
export const handleNumberInputChange = (
  value: string,
  setter: (updater: (prev: any) => any) => void,
  fieldName: string
) => {
  // Remove commas and non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, '');
  
  // Update the state with the clean value
  setter((prev: any) => ({
    ...prev,
    [fieldName]: cleanValue
  }));
};

/**
 * Format a number for display in the UI with proper comma separation
 * @param value - The value to format
 * @returns Formatted string for display
 */
export const formatDisplayValue = (value: string | number): string => {
  if (!value || value === '') return '';
  
  const cleanValue = removeCommasFromNumber(value.toString());
  return formatNumberWithCommas(cleanValue);
};

/**
 * Utility to convert API errors to user-friendly messages
 */

interface ApiError {
  status?: number;
  message?: string;
}

/**
 * Convert an API error to a user-friendly message string
 * @param err - The error caught from an API call
 * @param defaultMessage - Fallback message if no specific error matches
 * @returns A user-friendly error message string
 */
export function apiErrorToMessage(
  err: unknown,
  defaultMessage = "An error occurred"
): string {
  const apiErr = err as ApiError;
  const status = apiErr?.status;
  const message = apiErr?.message;

  if (status === 400) return message || "Bad request.";
  if (status === 401) return "Unauthorized. Please log in again.";
  if (status === 403) return "You don't have permission.";
  if (status && status >= 500) return "Server error. Please try again later.";

  return message || defaultMessage;
}

/**
 * Get error message for toast notifications
 * @param err - The error caught from an API call
 * @param defaultMessage - Fallback message if no specific error matches
 * @returns Object with title and description for toast
 */
export function apiErrorToToast(
  err: unknown,
  defaultMessage = "An error occurred"
): { title: string; description: string } {
  const apiErr = err as ApiError;
  const status = apiErr?.status;
  const message = apiErr?.message;

  if (status === 400)
    return {
      title: "Bad Request",
      description: message || "Please check your data.",
    };
  if (status === 401)
    return { title: "Unauthorized", description: "Please log in again." };
  if (status === 403)
    return { title: "Forbidden", description: "You don't have permission." };
  if (status && status >= 500)
    return { title: "Server Error", description: "Please try again later." };

  return { title: "Error", description: message || defaultMessage };
}

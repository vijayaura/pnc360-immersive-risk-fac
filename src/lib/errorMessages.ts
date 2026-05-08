/**
 * Centralized error message utility
 *
 * Converts raw backend / network errors into user-friendly text
 * so that technical details are never shown to end-users.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorLike {
  message?: string;
  status?: number;
  code?: string;
  response?: { status?: number; data?: { message?: string } };
}

// ---------------------------------------------------------------------------
// HTTP status → friendly message
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<number, string> = {
  400: 'Something went wrong with your request. Please check the details and try again.',
  401: 'Your session has expired. Please log in again to continue.',
  403: "You don't have permission to perform this action. Please contact your administrator.",
  404: 'The requested resource could not be found.',
  409: 'This action conflicts with existing data. Please refresh the page and try again.',
  422: 'Some of the information provided is invalid. Please review and correct it.',
  429: 'Too many requests. Please wait a moment and try again.',
};

// ---------------------------------------------------------------------------
// Keyword patterns → friendly message
//
// Order matters: first match wins.
// ---------------------------------------------------------------------------

const KEYWORD_MAP: [RegExp, string][] = [
  [
    /duplicate.*key|unique.*constraint|already.*exists/i,
    'This record already exists. Please use a different value.',
  ],
  [
    /foreign.*key|constraint.*violation|violates.*constraint/i,
    'This item is linked to other records and cannot be modified right now.',
  ],
  [/token.*expired|jwt.*expired|token.*invalid/i, 'Your session has expired. Please log in again.'],
  [/unauthorized|not.*authorized/i, 'You are not authorized to perform this action.'],
  [/forbidden|access.*denied|not.*allowed/i, "You don't have permission to access this resource."],
  [/timeout|timed?\s*out|ETIMEDOUT|ECONNABORTED/i, 'The request took too long. Please try again.'],
  [
    /file.*too.*large|payload.*too.*large|entity.*too.*large/i,
    'The file is too large. Please upload a smaller file.',
  ],
  [
    /network|ECONNREFUSED|ENOTFOUND|ERR_NETWORK/i,
    'Unable to connect to the server. Please check your internet connection.',
  ],
  [
    /internal.*server|unexpected.*error/i,
    "We're experiencing a technical issue. Please try again shortly.",
  ],
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert any caught error into a clean, user-friendly message.
 *
 * @param error  - The caught error (Error, AxiosError, ApiError, string, or unknown)
 * @param fallback - Optional custom fallback message when nothing matches
 * @returns A user-friendly string safe to display in toasts / alerts
 *
 * @example
 * ```ts
 * try { await api.get('/company'); }
 * catch (err) {
 *   toast({ title: getErrorTitle(err), description: getUserFriendlyMessage(err) });
 * }
 * ```
 */
export function getUserFriendlyMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again later.',
): string {
  // 1. Extract raw message & status from the error
  const { message: rawMessage, status } = extractErrorInfo(error);

  // 2. Try HTTP status map first (most reliable signal)
  if (status && STATUS_MAP[status]) {
    return STATUS_MAP[status];
  }

  // 3. For 5xx → generic server message
  if (status && status >= 500) {
    return "We're experiencing a server issue. Please try again shortly.";
  }

  // 4. Try keyword pattern matching on the raw message
  if (rawMessage) {
    for (const [pattern, friendly] of KEYWORD_MAP) {
      if (pattern.test(rawMessage)) {
        return friendly;
      }
    }
  }

  // 5. Fallback
  return fallback;
}

/**
 * Get a short, context-aware title for the error alert / toast.
 *
 * @param error - The caught error
 * @returns A short title string like "Access Denied", "Session Expired", etc.
 */
export function getErrorTitle(error?: unknown): string {
  const { status } = extractErrorInfo(error);

  switch (status) {
    case 401:
      return 'Session Expired';
    case 403:
      return 'Access Denied';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Validation Error';
    case 429:
      return 'Rate Limited';
    default:
      if (status && status >= 500) return 'Server Error';
      return 'Something Went Wrong';
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function extractErrorInfo(error: unknown): { message: string; status?: number } {
  if (!error) {
    return { message: '' };
  }

  // String error
  if (typeof error === 'string') {
    return { message: error };
  }

  const err = error as ErrorLike;

  // Axios-style error with response
  const status = err.status ?? err.response?.status;
  const message = err.response?.data?.message ?? err.message ?? '';

  return { message, status };
}

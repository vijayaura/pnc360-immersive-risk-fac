/**
 * Notification event kinds from the notifications domain API.
 * Use these constants instead of raw strings when comparing `eventKind`.
 */
export const NOTIFICATION_EVENT_KINDS = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  APPROVED: 'APPROVED',
  APPROVED_WITH_CONDITIONS: 'APPROVED_WITH_CONDITIONS',
  REJECTED: 'REJECTED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  CHAT_QUERY: 'CHAT_QUERY',
  CHAT_RESPONSE: 'CHAT_RESPONSE',
  PRIORITY_CHANGED: 'PRIORITY_CHANGED',
  DELETED: 'DELETED',
} as const;

export type NotificationEventKind =
  (typeof NOTIFICATION_EVENT_KINDS)[keyof typeof NOTIFICATION_EVENT_KINDS];

const KIND_VALUES = new Set<string>(Object.values(NOTIFICATION_EVENT_KINDS));

export function normalizeNotificationEventKind(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

export function isKnownNotificationEventKind(value: unknown): value is NotificationEventKind {
  return KIND_VALUES.has(normalizeNotificationEventKind(value));
}

/** True when the notification should deep-link with chat open (bell → detail page). */
export function shouldOpenChatFromNotification(value: unknown): boolean {
  return normalizeNotificationEventKind(value) === NOTIFICATION_EVENT_KINDS.CHAT_QUERY;
}

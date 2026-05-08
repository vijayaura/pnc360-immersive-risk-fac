import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { checkInboxForSubmissions } from "@/server/email-ingestion.functions";

export interface AttachmentInfo {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface EmailCandidate {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
  attachments: AttachmentInfo[];
}

interface EmailPollingContextValue {
  pendingEmails: EmailCandidate[];
  pendingCount: number;
  lastChecked: Date | null;
  checking: boolean;
  poll: () => Promise<void>;
  dismissEmail: (emailId: string) => void;
  clearAll: () => void;
}

const EmailPollingContext = createContext<EmailPollingContextValue | null>(null);

const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

export function EmailPollingProvider({ children }: { children: ReactNode }) {
  const [pendingEmails, setPendingEmails] = useState<EmailCandidate[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const checkingRef = useRef(false);

  const poll = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    try {
      const result = await checkInboxForSubmissions({ data: { maxResults: 20 } });
      if (!result.error && result.emails) {
        const newEmails = result.emails.filter((e: EmailCandidate) => !seenIdsRef.current.has(e.id));
        if (newEmails.length > 0) {
          newEmails.forEach((e: EmailCandidate) => seenIdsRef.current.add(e.id));
          setPendingEmails((prev) => [...prev, ...newEmails]);
        }
      }
      setLastChecked(new Date());
    } catch {
      // silent fail for background poll
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, []);

  const dismissEmail = useCallback((emailId: string) => {
    setPendingEmails((prev) => prev.filter((e) => e.id !== emailId));
  }, []);

  const clearAll = useCallback(() => {
    setPendingEmails([]);
  }, []);

  useEffect(() => {
    // Initial poll after 5s delay
    const initialTimeout = setTimeout(poll, 5000);
    // Recurring poll
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [poll]);

  return (
    <EmailPollingContext.Provider
      value={{
        pendingEmails,
        pendingCount: pendingEmails.length,
        lastChecked,
        checking,
        poll,
        dismissEmail,
        clearAll,
      }}
    >
      {children}
    </EmailPollingContext.Provider>
  );
}

export function useEmailPolling() {
  const ctx = useContext(EmailPollingContext);
  if (!ctx) {
    // Return a safe no-op default when outside provider (e.g. login page)
    return {
      pendingEmails: [] as EmailCandidate[],
      pendingCount: 0,
      lastChecked: null,
      checking: false,
      poll: async () => {},
      dismissEmail: () => {},
      clearAll: () => {},
    };
  }
  return ctx;
}

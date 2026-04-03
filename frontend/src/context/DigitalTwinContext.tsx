import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DigitalTwin } from "../types/digitalTwin";

interface DigitalTwinContextValue {
  twin: DigitalTwin | null;
  sessionId: string | null;
  setTwin: (twin: DigitalTwin) => void;
  clearTwin: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const DigitalTwinContext = createContext<DigitalTwinContextValue | null>(null);

const SESSION_STORAGE_KEY = "cliniq_session";

interface StoredSession {
  sessionId: string;
  twin: DigitalTwin;
  savedAt: number;
}

export function DigitalTwinProvider({ children }: { children: React.ReactNode }) {
  const [twin, setTwinState] = useState<DigitalTwin | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed: StoredSession = JSON.parse(stored);
        const TWO_HOURS = 2 * 60 * 60 * 1000;
        if (Date.now() - parsed.savedAt < TWO_HOURS) {
          setTwinState(parsed.twin);
          setSessionId(parsed.sessionId);
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const setTwin = useCallback((newTwin: DigitalTwin) => {
    setTwinState(newTwin);
    setSessionId(newTwin.session_id);
    try {
      const toStore: StoredSession = {
        sessionId: newTwin.session_id,
        twin: newTwin,
        savedAt: Date.now(),
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // sessionStorage might be full or unavailable
    }
  }, []);

  const clearTwin = useCallback(() => {
    setTwinState(null);
    setSessionId(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  return (
    <DigitalTwinContext.Provider
      value={{ twin, sessionId, setTwin, clearTwin, isLoading, setIsLoading }}
    >
      {children}
    </DigitalTwinContext.Provider>
  );
}

export function useDigitalTwin(): DigitalTwinContextValue {
  const ctx = useContext(DigitalTwinContext);
  if (!ctx) {
    throw new Error("useDigitalTwin must be used within DigitalTwinProvider");
  }
  return ctx;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type BackendStatus = "checking" | "awake" | "waking";

interface BackendStatusContextValue {
  status: BackendStatus;
  /** Força uma nova checagem de saúde */
  recheck: () => void;
}

const BackendStatusContext = createContext<BackendStatusContextValue>({
  status: "checking",
  recheck: () => {},
});

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}

const HEALTH_URL = `${process.env.NEXT_PUBLIC_API_URL}/health`;
const POLL_INTERVAL = 3_000;
const MAX_ATTEMPTS = 40; // ~2 min

async function ping(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(HEALTH_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export function BackendStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const attempts = useRef(0);
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (polling.current) {
      clearInterval(polling.current);
      polling.current = null;
    }
  }, []);

  const check = useCallback(async () => {
    const ok = await ping();
    if (ok) {
      setStatus("awake");
      stopPolling();
      attempts.current = 0;
    } else {
      attempts.current += 1;
      setStatus("waking");
      if (attempts.current >= MAX_ATTEMPTS) {
        stopPolling();
      }
    }
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    attempts.current = 0;
    setStatus("checking");
    check();
    polling.current = setInterval(check, POLL_INTERVAL);
  }, [check, stopPolling]);

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, [startPolling, stopPolling]);

  return (
    <BackendStatusContext.Provider value={{ status, recheck: startPolling }}>
      {children}
    </BackendStatusContext.Provider>
  );
}

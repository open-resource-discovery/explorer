import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export const PROXY_PORT = 44123;
export const PROXY_BASE_URL =
  import.meta.env.VITE_PROXY_BASE_URL ?? "/proxy-api";
const HEALTH_CHECK_TIMEOUT_MS = 2_000;

export interface ProxyHealth {
  available: boolean;
  sessionId: string | null;
}

export interface ProxyState extends ProxyHealth {
  recheckSession: () => Promise<ProxyHealth>;
}

interface HealthResponse {
  session?: string;
}

async function checkProxyHealth(): Promise<ProxyHealth> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT_MS,
    );

    const response = await fetch(`${PROXY_BASE_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { available: false, sessionId: null };
    }

    const body = (await response.json()) as HealthResponse;
    return {
      available: true,
      sessionId: body.session ?? null,
    };
  } catch {
    return { available: false, sessionId: null };
  }
}

interface ProxyProviderProps {
  children: ReactNode;
}

const noopRecheck = async (): Promise<ProxyHealth> => ({
  available: false,
  sessionId: null,
});

const ProxyContext = createContext<ProxyState>({
  available: false,
  sessionId: null,
  recheckSession: noopRecheck,
});

export function ProxyProvider({ children }: ProxyProviderProps) {
  const [health, setHealth] = useState<ProxyHealth>({
    available: false,
    sessionId: null,
  });

  const applyHealthResult = useCallback((result: ProxyHealth) => {
    setHealth((prev) =>
      prev.available === result.available && prev.sessionId === result.sessionId
        ? prev
        : result,
    );
    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void checkProxyHealth().then((result) => {
      if (!cancelled) applyHealthResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [applyHealthResult]);

  const recheckSession = useCallback(async (): Promise<ProxyHealth> => {
    const result = await checkProxyHealth();
    return applyHealthResult(result);
  }, [applyHealthResult]);

  const state = useMemo(
    () => ({ ...health, recheckSession }),
    [health, recheckSession],
  );

  return (
    <ProxyContext.Provider value={state}>{children}</ProxyContext.Provider>
  );
}

export function useProxy(): ProxyState {
  return useContext(ProxyContext);
}

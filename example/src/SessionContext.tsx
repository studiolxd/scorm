/**
 * SessionContext — shares a single reactive session state across all demo sections.
 *
 * ScormProvider intentionally keeps status.initialized = false (static snapshot).
 * This context wraps useScorm() and tracks initialized/terminated as local React
 * state, then distributes the result to all sections so they share one live view
 * of the session lifecycle.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { useScorm } from '@studiolxd/scorm/react';
import type { Result, ScormError } from '@studiolxd/scorm/react';

type BoolResult = Result<true, ScormError> | undefined;

interface SessionValue {
  api: ReturnType<typeof useScorm>['api'];
  status: ReturnType<typeof useScorm>['status'];
  raw: ReturnType<typeof useScorm>['raw'];
  initialized: boolean;
  terminated: boolean;
  initialize: () => BoolResult;
  commit: () => BoolResult;
  terminate: () => BoolResult;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSessionContext(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used inside SessionContext.Provider');
  return ctx;
}

export function useSessionValue(): SessionValue {
  const { api, status, raw } = useScorm();
  const [initialized, setInitialized] = useState(false);
  const [terminated, setTerminated] = useState(false);

  const initialize = useCallback((): BoolResult => {
    if (!api) return undefined;
    const r = api.initialize();
    if (r.ok) setInitialized(true);
    return r;
  }, [api]);

  const commit = useCallback((): BoolResult => {
    if (!api) return undefined;
    return api.commit();
  }, [api]);

  const terminate = useCallback((): BoolResult => {
    if (!api) return undefined;
    const r = api.terminate();
    if (r.ok) { setInitialized(false); setTerminated(true); }
    return r;
  }, [api]);

  return { api, status, raw, initialized, terminated, initialize, commit, terminate };
}

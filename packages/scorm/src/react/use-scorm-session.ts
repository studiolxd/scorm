import { useCallback, useSyncExternalStore } from 'react';
import { useScorm } from './use-scorm';
import type { ScormContextValue } from './scorm-context';
import type { Result } from '../result/result';
import type { ScormError } from '../errors/scorm-error';

export interface ScormSessionValue extends ScormContextValue {
  /**
   * Whether `initialize()` has succeeded and the session is live.
   * Reactive — triggers re-render when it changes.
   */
  initialized: boolean;
  /**
   * Whether `terminate()` has succeeded in this session.
   * Reactive — triggers re-render when it changes.
   */
  terminated: boolean;
  /** Initialize the session (updates reactive state). `undefined` when no API. */
  initialize: () => Result<true, ScormError> | undefined;
  /** Terminate the session (updates reactive state). `undefined` when no API. */
  terminate: () => Result<true, ScormError> | undefined;
  /** Commit pending data. State is not affected. `undefined` when no API. */
  commit: () => Result<true, ScormError> | undefined;
}

/**
 * `useScorm()` plus reactive `initialized`/`terminated` state.
 *
 * Subscribes to the underlying session via `useSyncExternalStore`, so the component
 * re-renders whenever the lifecycle state changes — including when another component
 * sharing the same provider initializes or terminates.
 *
 * @example
 * ```tsx
 * function Course() {
 *   const { initialized, initialize, terminate, api } = useScormSession();
 *   useEffect(() => { initialize(); }, [initialize]);
 *   if (!initialized) return <p>Connecting…</p>;
 *   return <CourseContent api={api} onFinish={terminate} />;
 * }
 * ```
 */
export function useScormSession(): ScormSessionValue {
  const context = useScorm();
  const { session } = context;

  const subscribe = useCallback(
    (onStoreChange: () => void) => (session ? session.on('change', onStoreChange) : () => {}),
    [session],
  );
  const getSnapshot = useCallback(() => session?.status ?? context.status, [session, context.status]);

  const status = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const initialize = useCallback(() => session?.initialize(), [session]);
  const terminate = useCallback(() => session?.terminate(), [session]);
  const commit = useCallback(() => session?.commit(), [session]);

  return {
    ...context,
    status,
    initialized: status.initialized,
    terminated: status.terminated,
    initialize,
    terminate,
    commit,
  };
}

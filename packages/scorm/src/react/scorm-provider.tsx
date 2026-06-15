import { useMemo } from 'react';
import { ScormContext, type ScormContextValue } from './scorm-context';
import { createScormSession } from '../session/create-scorm-session';
import type { ScormProviderProps } from '../types/options';

/**
 * SCORM Provider component.
 *
 * Creates an observable {@link ScormSession} (locating the SCORM API object) and
 * makes the session + driver + high-level API available to descendants via context.
 *
 * **Does NOT auto-initialize.** Call `initialize()` explicitly, or use
 * `useScormAutoTerminate()` which initializes on mount.
 *
 * For reactive `initialized`/`terminated` state use `useScormSession()`; the
 * `status` exposed by `useScorm()` is a snapshot read at render time.
 *
 * **`noLmsBehavior: 'throw'`** will throw synchronously during render. Wrap the
 * provider in a React Error Boundary to handle this gracefully.
 *
 * @example
 * ```tsx
 * <ScormProvider version="auto" options={{ noLmsBehavior: 'mock' }}>
 *   <CourseContent />
 * </ScormProvider>
 * ```
 */
export function ScormProvider({ version, options = {}, children }: ScormProviderProps) {
  const session = useMemo(
    () => createScormSession(version, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, options.noLmsBehavior, options.maxParentDepth, options.checkOpener, options.debug, options.fallbackVersion],
  );

  const contextValue = useMemo<ScormContextValue>(
    () => ({ status: session.status, raw: session.raw, api: session.api, session }),
    [session],
  );

  return (
    <ScormContext.Provider value={contextValue}>
      {children}
    </ScormContext.Provider>
  );
}

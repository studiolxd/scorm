import { useMemo, useRef } from 'react';
import { ScormContext, type ScormContextValue } from './scorm-context';
import { createDriver } from '../core/create-driver';
import { ScormApi } from '../api/scorm-api';
import { createLogger } from '../debug/logger';
import type { ScormProviderProps } from '../types/options';
import type { ScormStatus } from '../types/status';

/**
 * SCORM Provider component.
 *
 * Locates the SCORM API object and makes the driver + high-level API
 * available to descendants via React context.
 *
 * **Does NOT auto-initialize.** The consumer must call `api.initialize()` explicitly.
 *
 * **`status.initialized` is always `false`** in the context value — the provider does
 * not track runtime state. Consumers who need reactive initialized/terminated status
 * should maintain their own `useState` after calling `api.initialize()`.
 *
 * **`noLmsBehavior: 'throw'`** will throw synchronously during render. Wrap the
 * provider in a React Error Boundary to handle this gracefully.
 *
 * @example
 * ```tsx
 * <ScormProvider version="1.2" options={{ noLmsBehavior: 'mock' }}>
 *   <CourseContent />
 * </ScormProvider>
 * ```
 */
export function ScormProvider({ version, options = {}, children }: ScormProviderProps) {
  // Keep loggerRef in sync with options.debug so toggling debug at runtime
  // (e.g. in dev tools) takes effect without requiring a remount.
  const loggerRef = useRef(createLogger(options.debug ?? false));
  loggerRef.current = createLogger(options.debug ?? false);

  const contextValue = useMemo<ScormContextValue>(() => {
    const driverResult = createDriver(version, options, loggerRef.current);

    // Resolve the concrete version to report in status. When 'auto' resolves to a
    // real driver we use the detected version; otherwise fall back to fallbackVersion.
    const fallbackVersion = options.fallbackVersion ?? '2004';

    if (driverResult.ok) {
      const driver = driverResult.value;
      const api = new ScormApi(driver);
      const status: ScormStatus = {
        version: driver.version,
        apiFound: true,
        initialized: false,
        terminated: false,
        noLmsBehavior: options.noLmsBehavior ?? 'error',
      };
      return { status, raw: driver, api };
    }

    // API not found and noLmsBehavior === 'error'
    const status: ScormStatus = {
      version: version === 'auto' ? fallbackVersion : version,
      apiFound: false,
      initialized: false,
      terminated: false,
      noLmsBehavior: options.noLmsBehavior ?? 'error',
    };
    return { status, raw: null, api: null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, options.noLmsBehavior, options.maxParentDepth, options.checkOpener, options.debug, options.fallbackVersion]);

  return (
    <ScormContext.Provider value={contextValue}>
      {children}
    </ScormContext.Provider>
  );
}

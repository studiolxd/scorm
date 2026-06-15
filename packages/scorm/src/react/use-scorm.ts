import { useContext } from 'react';
import { ScormContext, type ScormContextValue } from './scorm-context';

/**
 * Hook to access the SCORM context.
 *
 * Must be used within a `<ScormProvider>`. Throws if used outside.
 *
 * @returns The SCORM context value with `status`, `raw` driver, and `api`.
 *
 * @example
 * ```tsx
 * function CourseContent() {
 *   const { api, status } = useScorm();
 *   if (!api) return <p>No SCORM API</p>;
 *   // use api.initialize(), api.setComplete(), etc.
 * }
 * ```
 */
export function useScorm(): ScormContextValue {
  const context = useContext(ScormContext);
  if (context === null) {
    throw new Error(
      'useScorm() must be used within a <ScormProvider>. ' +
      'Wrap your application (or the relevant subtree) with <ScormProvider version="1.2"|"2004">.',
    );
  }
  return context;
}

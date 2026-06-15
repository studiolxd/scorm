import { useEffect } from 'react';
import { useScorm } from './use-scorm';
import { autoTerminate, type AutoTerminateOptions } from '../lifecycle/auto-terminate';

export type { AutoTerminateOptions };

/**
 * Opt-in hook that handles the SCORM lifecycle automatically.
 *
 * Thin React wrapper over the framework-agnostic {@link autoTerminate}: on mount it
 * initializes the session; on unmount, page unload (`beforeunload`/`pagehide`), or
 * `freeze` it sets session time, commits, and terminates.
 *
 * @example
 * ```tsx
 * function CourseContent() {
 *   useScormAutoTerminate({ trackSessionTime: true });
 *   // session is auto-initialized, will auto-terminate on unmount/unload
 * }
 * ```
 */
export function useScormAutoTerminate(options: AutoTerminateOptions = {}): void {
  const { session } = useScorm();
  const { trackSessionTime = true, handleUnload = true, handleFreeze = true } = options;

  useEffect(() => {
    if (!session) return;
    return autoTerminate(session, { trackSessionTime, handleUnload, handleFreeze });
  }, [session, trackSessionTime, handleUnload, handleFreeze]);
}

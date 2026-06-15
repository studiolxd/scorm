import { useEffect } from 'react';
import { useScorm } from './use-scorm';
import { autoCommit } from '../lifecycle/auto-commit';

/**
 * Opt-in hook that periodically commits to persist progress.
 *
 * Thin React wrapper over the framework-agnostic {@link autoCommit}. Complements
 * (does not replace) the commit performed by {@link useScormAutoTerminate} on unload.
 * Pass `0` (or a negative number) to disable.
 *
 * @param intervalMs How often to commit, in milliseconds. Default: 60000 (1 min).
 *
 * @example
 * ```tsx
 * function CourseContent() {
 *   useScormAutoCommit(30_000); // flush every 30s
 * }
 * ```
 */
export function useScormAutoCommit(intervalMs = 60_000): void {
  const { session } = useScorm();

  useEffect(() => {
    if (!session) return;
    return autoCommit(session, intervalMs);
  }, [session, intervalMs]);
}

import { useEffect } from 'react';
import { useScorm } from './use-scorm';

/**
 * Opt-in hook that periodically calls `api.commit()` to persist progress.
 *
 * Many LMS implementations only durably store data on commit, so long sessions
 * risk losing progress if the tab is closed abruptly between manual commits.
 * This hook flushes on a fixed interval as a safety net. It complements (and does
 * not replace) the commit performed by {@link useScormAutoTerminate} on unload.
 *
 * Pass `0` (or a negative number) to disable — useful for toggling at runtime.
 * Commits issued before `initialize()` are harmless: the driver returns an error
 * Result, which is intentionally ignored here.
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
  const { api } = useScorm();

  useEffect(() => {
    if (!api || !intervalMs || intervalMs <= 0) return;

    const id = setInterval(() => {
      // Commit errors are intentionally swallowed — this is a best-effort background
      // flush. Surfacing a transient commit failure here would be noise.
      api.commit();
    }, intervalMs);

    return () => clearInterval(id);
  }, [api, intervalMs]);
}

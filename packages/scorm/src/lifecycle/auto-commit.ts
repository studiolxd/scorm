import type { ScormSession } from '../session/create-scorm-session';

/**
 * Framework-agnostic periodic commit for a {@link ScormSession}.
 *
 * Calls `session.commit()` every `intervalMs` as a best-effort flush so long
 * sessions don't lose progress if the tab closes abruptly. Returns a `dispose()`
 * that clears the timer. Pass `0` (or a negative number) to disable (no-op).
 *
 * Commit errors are intentionally swallowed — this is a background flush.
 *
 * @param intervalMs Interval in milliseconds. Default: 60000 (1 min).
 */
export function autoCommit(session: ScormSession, intervalMs = 60_000): () => void {
  if (!session.api || !intervalMs || intervalMs <= 0) return () => {};

  const id = setInterval(() => {
    session.commit();
  }, intervalMs);

  return () => clearInterval(id);
}

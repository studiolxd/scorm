import type { ScormSession } from '../session/create-scorm-session';

/** Options for {@link autoTerminate}. */
export interface AutoTerminateOptions {
  /** Track elapsed time and set session time before terminate. Default: true. */
  trackSessionTime?: boolean;
  /** Listen to beforeunload/pagehide events. Default: true. */
  handleUnload?: boolean;
  /** Listen to the Page Lifecycle `freeze` event. Default: true. */
  handleFreeze?: boolean;
}

/**
 * Framework-agnostic auto-terminate wiring for a {@link ScormSession}.
 *
 * - Calls `session.initialize()` immediately.
 * - On page unload (`beforeunload`/`pagehide`), `freeze`, or when the returned
 *   dispose function runs: sets session time, commits, and terminates.
 *
 * Returns a `dispose()` that terminates and removes listeners. Safe under SSR
 * (no `window`): it initializes but attaches no listeners.
 *
 * Adapters (React `useScormAutoTerminate`, Vue, Angular, …) call this inside their
 * lifecycle and invoke the returned function on teardown.
 */
export function autoTerminate(session: ScormSession, options: AutoTerminateOptions = {}): () => void {
  const { trackSessionTime = true, handleUnload = true, handleFreeze = true } = options;
  if (!session.api) return () => {};

  let terminated = false;
  let sessionStart: number | null = null;

  const initResult = session.initialize();
  if (initResult && initResult.ok) sessionStart = Date.now();

  const doTerminate = (): void => {
    if (terminated) return;
    terminated = true;

    if (trackSessionTime && sessionStart !== null && session.api) {
      session.api.setSessionTime(Date.now() - sessionStart);
    }
    // Commit/terminate errors are intentionally swallowed — this runs on unload/
    // teardown paths where throwing would skip the terminate call entirely.
    session.commit();
    session.terminate();
  };

  const hasWindow = typeof window !== 'undefined';
  if (hasWindow && handleUnload) {
    window.addEventListener('beforeunload', doTerminate);
    window.addEventListener('pagehide', doTerminate, { capture: true });
  }
  if (hasWindow && handleFreeze) {
    window.addEventListener('freeze', doTerminate);
  }

  return () => {
    doTerminate();
    if (hasWindow && handleUnload) {
      window.removeEventListener('beforeunload', doTerminate);
      window.removeEventListener('pagehide', doTerminate, { capture: true });
    }
    if (hasWindow && handleFreeze) {
      window.removeEventListener('freeze', doTerminate);
    }
  };
}

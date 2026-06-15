// ─────────────────────────────────────────────────────────────────────────────
// @studiolxd/scorm/svelte — Svelte store adapter
// ─────────────────────────────────────────────────────────────────────────────
import { readable, type Readable } from 'svelte/store';
import { createScormSession, type ScormSession } from '../session/create-scorm-session';
import { autoTerminate } from '../lifecycle/auto-terminate';
import { autoCommit } from '../lifecycle/auto-commit';
import type { ScormStatus } from '../types/status';
import type { ScormVersion } from '../types/common';
import type { ScormProviderOptions } from '../types/options';

/** Extra options for {@link createScormStore}. */
export interface ScormStoreOptions extends ScormProviderOptions {
  /** Initialize immediately and terminate on `destroy()` / unload. Default: false. */
  autoTerminate?: boolean;
  /** Commit every N ms. 0 disables. Default: 0. */
  autoCommitMs?: number;
}

/** Return value of {@link createScormStore}. */
export interface ScormStore {
  session: ScormSession;
  /** A Svelte readable store of the session status (use with `$status`). */
  status: Readable<ScormStatus>;
  /** Tear down lifecycle wiring and the session. */
  destroy(): void;
}

/**
 * Create a SCORM session exposed as a Svelte store.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createScormStore } from '@studiolxd/scorm/svelte';
 *   import { onDestroy } from 'svelte';
 *   const scorm = createScormStore('auto', { noLmsBehavior: 'mock' });
 *   const { status } = scorm;
 *   onDestroy(scorm.destroy);
 * </script>
 * {#if $status.initialized}live{/if}
 * ```
 */
export function createScormStore(
  version: ScormVersion | 'auto',
  options: ScormStoreOptions = {},
): ScormStore {
  const { autoTerminate: enableAutoTerminate = false, autoCommitMs = 0, ...providerOptions } = options;

  const session = createScormSession(version, providerOptions);
  const disposers: Array<() => void> = [];
  if (enableAutoTerminate) disposers.push(autoTerminate(session));
  if (autoCommitMs > 0) disposers.push(autoCommit(session, autoCommitMs));

  const status = readable<ScormStatus>(session.status, (set) => session.on('change', set));

  return {
    session,
    status,
    destroy() {
      for (const dispose of disposers) dispose();
      session.destroy();
    },
  };
}

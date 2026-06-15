// ─────────────────────────────────────────────────────────────────────────────
// @studiolxd/scorm/vue — Vue 3 composable
// ─────────────────────────────────────────────────────────────────────────────
import { shallowRef, onScopeDispose, type ShallowRef } from 'vue';
import { createScormSession, type ScormSession } from '../session/create-scorm-session';
import { autoTerminate } from '../lifecycle/auto-terminate';
import { autoCommit } from '../lifecycle/auto-commit';
import type { ScormStatus } from '../types/status';
import type { ScormVersion } from '../types/common';
import type { ScormProviderOptions } from '../types/options';
import type { Result } from '../result/result';
import type { ScormError } from '../errors/scorm-error';

/** Extra options for {@link useScorm}. */
export interface UseScormOptions extends ScormProviderOptions {
  /** Initialize on setup and terminate on scope dispose / unload. Default: false. */
  autoTerminate?: boolean;
  /** Commit every N ms while mounted. 0 disables. Default: 0. */
  autoCommitMs?: number;
}

/** Return value of {@link useScorm}. */
export interface UseScormReturn {
  session: ScormSession;
  /** Reactive status. Updates on every lifecycle change. */
  status: ShallowRef<ScormStatus>;
  initialize: () => Result<true, ScormError> | undefined;
  commit: () => Result<true, ScormError> | undefined;
  terminate: () => Result<true, ScormError> | undefined;
}

/**
 * Vue composable that creates an observable SCORM session bound to the component
 * scope. The session is destroyed automatically on `onScopeDispose`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useScorm } from '@studiolxd/scorm/vue';
 * const { status, initialize } = useScorm('auto', { noLmsBehavior: 'mock' });
 * </script>
 * <template><p v-if="status.initialized">live</p></template>
 * ```
 */
export function useScorm(
  version: ScormVersion | 'auto',
  options: UseScormOptions = {},
): UseScormReturn {
  const { autoTerminate: enableAutoTerminate = false, autoCommitMs = 0, ...providerOptions } = options;

  const session = createScormSession(version, providerOptions);
  const status = shallowRef<ScormStatus>(session.status);
  const off = session.on('change', (s) => { status.value = s; });

  const disposers: Array<() => void> = [];
  if (enableAutoTerminate) disposers.push(autoTerminate(session));
  if (autoCommitMs > 0) disposers.push(autoCommit(session, autoCommitMs));

  onScopeDispose(() => {
    off();
    for (const dispose of disposers) dispose();
    session.destroy();
  });

  return {
    session,
    status,
    initialize: () => session.initialize(),
    commit: () => session.commit(),
    terminate: () => session.terminate(),
  };
}

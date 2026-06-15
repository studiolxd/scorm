// ─────────────────────────────────────────────────────────────────────────────
// @studiolxd/scorm/angular — Angular adapter (Angular >= 17)
//
// Decorator-free by design: ships only an InjectionToken + a functional provider,
// so it builds as plain ESM (no ng-packagr / Angular Package Format required) and
// is consumed by the app's own compiler. Requires Angular 17+ (stable signals,
// esbuild builder, standalone APIs).
// ─────────────────────────────────────────────────────────────────────────────
import { InjectionToken, inject, DestroyRef, signal, type Signal, type Provider } from '@angular/core';
import { createScormSession, type ScormSession } from '../session/create-scorm-session';
import { autoTerminate } from '../lifecycle/auto-terminate';
import { autoCommit } from '../lifecycle/auto-commit';
import type { ScormStatus } from '../types/status';
import type { ScormVersion } from '../types/common';
import type { ScormProviderOptions } from '../types/options';

/** What {@link SCORM} injects: the session plus a reactive status signal. */
export interface ScormHandle {
  session: ScormSession;
  /** Reactive status signal — call `status()` to read; updates on lifecycle changes. */
  status: Signal<ScormStatus>;
}

/** Injection token for the SCORM session handle. Inject with `inject(SCORM)`. */
export const SCORM = new InjectionToken<ScormHandle>('@studiolxd/scorm');

/** Extra options for {@link provideScorm}. */
export interface ProvideScormOptions extends ScormProviderOptions {
  /** Initialize on creation and terminate on `DestroyRef` / unload. Default: false. */
  autoTerminate?: boolean;
  /** Commit every N ms. 0 disables. Default: 0. */
  autoCommitMs?: number;
}

/**
 * Provide a SCORM session to an Angular application or component.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideScorm('auto', { noLmsBehavior: 'mock', autoTerminate: true })],
 * });
 * // in a component:
 * const { session, status } = inject(SCORM);   // status() is a signal
 * ```
 */
export function provideScorm(
  version: ScormVersion | 'auto',
  options: ProvideScormOptions = {},
): Provider {
  const { autoTerminate: enableAutoTerminate = false, autoCommitMs = 0, ...providerOptions } = options;

  return {
    provide: SCORM,
    useFactory: (): ScormHandle => {
      const session = createScormSession(version, providerOptions);
      const status = signal<ScormStatus>(session.status);
      const off = session.on('change', (s) => status.set(s));

      const disposers: Array<() => void> = [];
      if (enableAutoTerminate) disposers.push(autoTerminate(session));
      if (autoCommitMs > 0) disposers.push(autoCommit(session, autoCommitMs));

      inject(DestroyRef).onDestroy(() => {
        off();
        for (const dispose of disposers) dispose();
        session.destroy();
      });

      return { session, status };
    },
  };
}

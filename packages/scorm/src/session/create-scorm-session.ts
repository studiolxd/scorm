import { createDriver } from '../core/create-driver';
import { ScormApi } from '../api/scorm-api';
import { createLogger } from '../debug/logger';
import type { IScormApi } from '../types/api';
import type { IScormDriver } from '../types/driver';
import type { ScormStatus } from '../types/status';
import type { ScormVersion } from '../types/common';
import type { ScormProviderOptions } from '../types/options';
import type { Result } from '../result/result';
import type { ScormError } from '../errors/scorm-error';

/** Events emitted by a {@link ScormSession}. */
export type ScormSessionEvent = 'change';

type ChangeListener = (status: ScormStatus) => void;

/**
 * Framework-agnostic, observable SCORM session.
 *
 * Wraps API discovery + the high-level {@link IScormApi} and exposes reactive
 * lifecycle state through a tiny subscription model (`on('change')`). This is the
 * basis every adapter builds on (React, Vue, Angular, Svelte, Web Component) and
 * the ergonomic entry point for vanilla JS.
 *
 * @example
 * ```ts
 * const session = createScormSession('auto', { noLmsBehavior: 'mock' });
 * const off = session.on('change', (s) => console.log('initialized:', s.initialized));
 * session.initialize();
 * session.api?.setComplete();
 * session.commit();
 * session.terminate();
 * off();
 * ```
 */
export interface ScormSession {
  /** The high-level API, or null when no SCORM API was found (`noLmsBehavior: 'error'`). */
  readonly api: IScormApi | null;
  /** The raw low-level driver (escape hatch), or null. */
  readonly raw: IScormDriver | null;
  /** Current status snapshot. Reference is stable between `change` emissions. */
  readonly status: ScormStatus;
  /** Initialize the session. Updates reactive status and emits `change` on success. */
  initialize(): Result<true, ScormError> | undefined;
  /** Commit pending data. Does not change status. */
  commit(): Result<true, ScormError> | undefined;
  /** Terminate the session. Updates reactive status and emits `change` on success. */
  terminate(): Result<true, ScormError> | undefined;
  /** Subscribe to status changes. Returns an unsubscribe function. */
  on(event: ScormSessionEvent, cb: ChangeListener): () => void;
  /** Remove a previously registered listener. */
  off(event: ScormSessionEvent, cb: ChangeListener): void;
  /** Release all listeners. Call when the session is no longer needed. */
  destroy(): void;
}

/**
 * Create an observable SCORM session.
 *
 * Locates the SCORM API (or applies `noLmsBehavior`) and returns a session whose
 * `initialize`/`terminate` keep a reactive `status` and notify subscribers.
 *
 * @param version `'1.2'`, `'2004'`, or `'auto'` (detect the host LMS at runtime).
 * @param options Provider options (`noLmsBehavior`, `fallbackVersion`, `debug`, …).
 */
export function createScormSession(
  version: ScormVersion | 'auto',
  options: ScormProviderOptions = {},
): ScormSession {
  const logger = createLogger(options.debug ?? false);
  const driverResult = createDriver(version, options, logger);

  let driver: IScormDriver | null = null;
  let api: IScormApi | null = null;
  let apiFound = false;
  let resolvedVersion: ScormVersion;

  if (driverResult.ok) {
    driver = driverResult.value;
    api = new ScormApi(driver);
    apiFound = true;
    resolvedVersion = driver.version;
  } else {
    resolvedVersion = version === 'auto' ? (options.fallbackVersion ?? '2004') : version;
  }

  let status: ScormStatus = {
    version: resolvedVersion,
    apiFound,
    initialized: false,
    terminated: false,
    noLmsBehavior: options.noLmsBehavior ?? 'error',
  };

  const listeners = new Set<ChangeListener>();
  const setStatus = (patch: Partial<ScormStatus>): void => {
    status = { ...status, ...patch };
    for (const listener of listeners) listener(status);
  };

  return {
    get api() { return api; },
    get raw() { return driver; },
    get status() { return status; },

    initialize() {
      if (!api) return undefined;
      const result = api.initialize();
      if (result.ok && !status.initialized) setStatus({ initialized: true, terminated: false });
      return result;
    },

    commit() {
      if (!api) return undefined;
      return api.commit();
    },

    terminate() {
      if (!api) return undefined;
      const result = api.terminate();
      if (result.ok && !status.terminated) setStatus({ initialized: false, terminated: true });
      return result;
    },

    on(_event, cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    off(_event, cb) {
      listeners.delete(cb);
    },

    destroy() {
      listeners.clear();
    },
  };
}

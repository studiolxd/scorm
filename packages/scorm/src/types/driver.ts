import type { Result } from '../result/result';
import type { ScormError } from '../errors/scorm-error';
import type { ScormVersion } from './common';

/**
 * Common interface that both Scorm12Driver and Scorm2004Driver implement.
 * Operates at the raw string level. Type safety on paths is enforced
 * at the ScormApi (high-level) layer above.
 */
export interface IScormDriver {
  readonly version: ScormVersion;

  /** Call LMSInitialize / Initialize. */
  initialize(): Result<true, ScormError>;

  /** Call LMSFinish / Terminate. */
  terminate(): Result<true, ScormError>;

  /** Call LMSCommit / Commit. */
  commit(): Result<true, ScormError>;

  /** Call LMSGetValue / GetValue. */
  getValue(path: string): Result<string, ScormError>;

  /** Call LMSSetValue / SetValue. */
  setValue(path: string, value: string): Result<string, ScormError>;

  /** Get the last error code (0 = no error). */
  getLastError(): number;

  /** Get a human-readable error string for a given error code. */
  getErrorString(code: number): string;

  /** Get diagnostic information for a given error code. */
  getDiagnostic(code: number): string;

  /** Whether initialize() has been called successfully. */
  isInitialized(): boolean;
}

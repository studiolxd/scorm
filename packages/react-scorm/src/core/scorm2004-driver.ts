import type { IScormDriver } from '../types/driver';
import type { Scorm2004RawApi } from '../types/common';
import type { Logger } from '../debug/logger';
import { ok, err, type Result } from '../result/result';
import { ScormError } from '../errors/scorm-error';

/**
 * SCORM 2004 (4th Edition) driver that wraps the raw window.API_1484_11 object.
 * Translates between the unified IScormDriver interface and
 * the SCORM 2004 method names.
 */
export class Scorm2004Driver implements IScormDriver {
  readonly version = '2004' as const;
  private readonly api: Scorm2004RawApi;
  private readonly logger: Logger;
  private _initialized = false;
  private _terminated = false;

  constructor(api: Scorm2004RawApi, logger: Logger) {
    this.api = api;
    this.logger = logger;
  }

  /**
   * Call Initialize.
   *
   * Idempotent while the session is live: calling it again after a successful
   * initialize is a no-op that returns `ok(true)` (it does NOT re-issue
   * Initialize, which the LMS would reject with error 103).
   *
   * Once {@link terminate} has run, this driver is permanently spent — SCORM
   * forbids re-initializing a terminated session, so this returns error 104. To
   * start a fresh session, create a new driver (e.g. remount `<ScormProvider>`
   * with a changed `key`).
   */
  initialize(): Result<true, ScormError> {
    if (this._terminated) {
      return err(this.buildError('initialize', undefined, undefined, 104, 'Content Instance Terminated'));
    }
    if (this._initialized) {
      this.logger.debug('Initialize skipped — already initialized');
      return ok(true);
    }
    try {
      this.logger.debug('Initialize("")');
      const result = this.api.Initialize('');
      if (result === 'true') {
        this._initialized = true;
        this.logger.debug('Initialize succeeded');
        return ok(true);
      }
      return err(this.buildError('initialize'));
    } catch (e) {
      return err(this.buildError('initialize', undefined, e as Error));
    }
  }

  terminate(): Result<true, ScormError> {
    if (!this._initialized) {
      return err(this.buildError('terminate', undefined, undefined, 112, 'Termination Before Initialization'));
    }
    try {
      this.logger.debug('Terminate("")');
      const result = this.api.Terminate('');
      if (result === 'true') {
        this._initialized = false;
        this._terminated = true;
        this.logger.debug('Terminate succeeded');
        return ok(true);
      }
      return err(this.buildError('terminate'));
    } catch (e) {
      return err(this.buildError('terminate', undefined, e as Error));
    }
  }

  commit(): Result<true, ScormError> {
    if (this._terminated) {
      return err(this.buildError('commit', undefined, undefined, 143, 'Commit After Termination'));
    }
    if (!this._initialized) {
      return err(this.buildError('commit', undefined, undefined, 142, 'Commit Before Initialization'));
    }
    try {
      this.logger.debug('Commit("")');
      const result = this.api.Commit('');
      if (result === 'true') {
        this.logger.debug('Commit succeeded');
        return ok(true);
      }
      return err(this.buildError('commit'));
    } catch (e) {
      return err(this.buildError('commit', undefined, e as Error));
    }
  }

  getValue(path: string): Result<string, ScormError> {
    if (this._terminated) {
      return err(this.buildError('getValue', path, undefined, 123, 'Retrieve Data After Termination'));
    }
    if (!this._initialized) {
      return err(this.buildError('getValue', path, undefined, 122, 'Retrieve Data Before Initialization'));
    }
    try {
      this.logger.debug(`GetValue("${path}")`);
      const value = this.api.GetValue(path);
      const errorCode = parseInt(this.api.GetLastError(), 10);
      if (errorCode === 0) {
        this.logger.debug(`GetValue("${path}") => "${value}"`);
        return ok(value);
      }
      return err(this.buildError('getValue', path));
    } catch (e) {
      return err(this.buildError('getValue', path, e as Error));
    }
  }

  setValue(path: string, value: string): Result<string, ScormError> {
    if (this._terminated) {
      return err(this.buildError('setValue', path, undefined, 133, 'Store Data After Termination'));
    }
    if (!this._initialized) {
      return err(this.buildError('setValue', path, undefined, 132, 'Store Data Before Initialization'));
    }
    try {
      this.logger.debug(`SetValue("${path}", "${value}")`);
      const result = this.api.SetValue(path, value);
      const errorCode = parseInt(this.api.GetLastError(), 10);
      if (result === 'true' || errorCode === 0) {
        this.logger.debug(`SetValue("${path}", "${value}") succeeded`);
        return ok(result);
      }
      return err(this.buildError('setValue', path));
    } catch (e) {
      return err(this.buildError('setValue', path, e as Error));
    }
  }

  getLastError(): number {
    try {
      const code = parseInt(this.api.GetLastError(), 10);
      // Use isNaN check rather than || 0 to avoid treating NaN (garbled LMS
      // response) as "no error" (code 0), which could cause false success.
      return isNaN(code) ? 101 : code;
    } catch {
      return 101;
    }
  }

  getErrorString(code: number): string {
    try {
      return this.api.GetErrorString(String(code));
    } catch {
      return '';
    }
  }

  getDiagnostic(code: number): string {
    try {
      return this.api.GetDiagnostic(String(code));
    } catch {
      return '';
    }
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  private buildError(
    operation: string,
    path?: string,
    exception?: Error,
    overrideCode?: number,
    overrideMessage?: string,
  ): ScormError {
    let code = overrideCode ?? 101;
    let errorString = overrideMessage ?? 'General Exception';
    let diagnostic = '';

    if (overrideCode === undefined) {
      try {
        code = parseInt(this.api.GetLastError(), 10);
        if (isNaN(code)) code = 101;
        errorString = this.api.GetErrorString(String(code));
        diagnostic = this.api.GetDiagnostic(String(code));
      } catch {
        code = 101;
      }
    }

    return new ScormError({
      version: '2004',
      operation,
      path,
      code,
      errorString,
      diagnostic,
      exception,
      apiFound: true,
      initialized: this._initialized,
    });
  }
}

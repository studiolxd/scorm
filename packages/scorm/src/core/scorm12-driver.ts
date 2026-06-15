import type { IScormDriver } from '../types/driver';
import type { Scorm12RawApi } from '../types/common';
import type { Logger } from '../debug/logger';
import { ok, err, type Result } from '../result/result';
import { ScormError } from '../errors/scorm-error';

/**
 * SCORM 1.2 driver that wraps the raw window.API object.
 * Translates between the unified IScormDriver interface and
 * the SCORM 1.2 LMS* method names.
 */
export class Scorm12Driver implements IScormDriver {
  readonly version = '1.2' as const;
  private readonly api: Scorm12RawApi;
  private readonly logger: Logger;
  private _initialized = false;
  private _terminated = false;

  constructor(api: Scorm12RawApi, logger: Logger) {
    this.api = api;
    this.logger = logger;
  }

  /**
   * Call LMSInitialize.
   *
   * Idempotent while the session is live: calling it again after a successful
   * initialize is a no-op that returns `ok(true)` (it does NOT re-issue
   * LMSInitialize, which the LMS would reject with error 101/103).
   *
   * Once {@link terminate} has run, this driver is permanently spent — SCORM
   * forbids re-initializing a terminated session, so this returns an error. To
   * start a fresh session, create a new driver (e.g. remount `<ScormProvider>`
   * with a changed `key`).
   */
  initialize(): Result<true, ScormError> {
    if (this._terminated) {
      return err(this.buildError('initialize', undefined, undefined, 101, 'Session already terminated'));
    }
    if (this._initialized) {
      this.logger.debug('LMSInitialize skipped — already initialized');
      return ok(true);
    }
    try {
      this.logger.debug('LMSInitialize("")');
      const result = this.api.LMSInitialize('');
      if (result === 'true') {
        this._initialized = true;
        this.logger.debug('LMSInitialize succeeded');
        return ok(true);
      }
      return err(this.buildError('initialize'));
    } catch (e) {
      return err(this.buildError('initialize', undefined, e as Error));
    }
  }

  terminate(): Result<true, ScormError> {
    if (!this._initialized) {
      return err(this.buildError('terminate', undefined, undefined, 301, 'Not initialized'));
    }
    try {
      this.logger.debug('LMSFinish("")');
      const result = this.api.LMSFinish('');
      if (result === 'true') {
        this._initialized = false;
        this._terminated = true;
        this.logger.debug('LMSFinish succeeded');
        return ok(true);
      }
      return err(this.buildError('terminate'));
    } catch (e) {
      return err(this.buildError('terminate', undefined, e as Error));
    }
  }

  commit(): Result<true, ScormError> {
    if (!this._initialized) {
      return err(this.buildError('commit', undefined, undefined, 301, 'Not initialized'));
    }
    try {
      this.logger.debug('LMSCommit("")');
      const result = this.api.LMSCommit('');
      if (result === 'true') {
        this.logger.debug('LMSCommit succeeded');
        return ok(true);
      }
      return err(this.buildError('commit'));
    } catch (e) {
      return err(this.buildError('commit', undefined, e as Error));
    }
  }

  getValue(path: string): Result<string, ScormError> {
    if (!this._initialized) {
      return err(this.buildError('getValue', path, undefined, 301, 'Not initialized'));
    }
    try {
      this.logger.debug(`LMSGetValue("${path}")`);
      const value = this.api.LMSGetValue(path);
      const errorCode = parseInt(this.api.LMSGetLastError(), 10);
      if (errorCode === 0) {
        this.logger.debug(`LMSGetValue("${path}") => "${value}"`);
        return ok(value);
      }
      return err(this.buildError('getValue', path));
    } catch (e) {
      return err(this.buildError('getValue', path, e as Error));
    }
  }

  setValue(path: string, value: string): Result<string, ScormError> {
    if (!this._initialized) {
      return err(this.buildError('setValue', path, undefined, 301, 'Not initialized'));
    }
    try {
      this.logger.debug(`LMSSetValue("${path}", "${value}")`);
      const result = this.api.LMSSetValue(path, value);
      const errorCode = parseInt(this.api.LMSGetLastError(), 10);
      if (result === 'true' || errorCode === 0) {
        this.logger.debug(`LMSSetValue("${path}", "${value}") succeeded`);
        return ok(result);
      }
      return err(this.buildError('setValue', path));
    } catch (e) {
      return err(this.buildError('setValue', path, e as Error));
    }
  }

  getLastError(): number {
    try {
      const code = parseInt(this.api.LMSGetLastError(), 10);
      // Use isNaN check rather than || 0 to avoid treating NaN (garbled LMS
      // response) as "no error" (code 0), which could cause false success.
      return isNaN(code) ? 101 : code;
    } catch {
      return 101;
    }
  }

  getErrorString(code: number): string {
    try {
      return this.api.LMSGetErrorString(String(code));
    } catch {
      return '';
    }
  }

  getDiagnostic(code: number): string {
    try {
      return this.api.LMSGetDiagnostic(String(code));
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
        code = parseInt(this.api.LMSGetLastError(), 10);
        if (isNaN(code)) code = 101;
        errorString = this.api.LMSGetErrorString(String(code));
        diagnostic = this.api.LMSGetDiagnostic(String(code));
      } catch {
        code = 101;
      }
    }

    return new ScormError({
      version: '1.2',
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

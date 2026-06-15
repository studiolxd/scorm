import type { Scorm2004RawApi } from '../types/common';
import { SCORM_2004_ERRORS } from '../errors/error-codes';

/**
 * In-memory mock of the SCORM 2004 raw API (window.API_1484_11 shape).
 * Uses a Map as the backing store and validates call sequences
 * with the richer SCORM 2004 error codes.
 */
export class MockScorm2004Api implements Scorm2004RawApi {
  private store = new Map<string, string>();
  private lastError = '0';
  private initialized = false;
  private terminated = false;

  Initialize(_param: ''): string {
    if (this.terminated) {
      this.lastError = '104';
      return 'false';
    }
    if (this.initialized) {
      this.lastError = '103';
      return 'false';
    }
    this.initialized = true;
    this.lastError = '0';
    return 'true';
  }

  Terminate(_param: ''): string {
    if (!this.initialized && !this.terminated) {
      this.lastError = '112';
      return 'false';
    }
    if (this.terminated) {
      this.lastError = '113';
      return 'false';
    }
    this.initialized = false;
    this.terminated = true;
    this.lastError = '0';
    return 'true';
  }

  GetValue(element: string): string {
    if (!this.initialized && !this.terminated) {
      this.lastError = '122';
      return '';
    }
    if (this.terminated) {
      this.lastError = '123';
      return '';
    }
    this.lastError = '0';
    return this.store.get(element) ?? '';
  }

  SetValue(element: string, value: string): string {
    if (!this.initialized && !this.terminated) {
      this.lastError = '132';
      return 'false';
    }
    if (this.terminated) {
      this.lastError = '133';
      return 'false';
    }
    this.store.set(element, value);
    this.lastError = '0';
    return 'true';
  }

  Commit(_param: ''): string {
    if (!this.initialized && !this.terminated) {
      this.lastError = '142';
      return 'false';
    }
    if (this.terminated) {
      this.lastError = '143';
      return 'false';
    }
    this.lastError = '0';
    return 'true';
  }

  GetLastError(): string {
    return this.lastError;
  }

  GetErrorString(errorCode: string): string {
    return SCORM_2004_ERRORS[parseInt(errorCode, 10)] ?? '';
  }

  GetDiagnostic(_errorCode: string): string {
    return '';
  }

  // --- Test helpers (not part of the SCORM spec) ---

  /** @internal Reset all state for a fresh test. */
  _reset(): void {
    this.store.clear();
    this.lastError = '0';
    this.initialized = false;
    this.terminated = false;
  }

  /** @internal Get a snapshot of the internal store. */
  _getStore(): Map<string, string> {
    return new Map(this.store);
  }

  /** @internal Directly set the last error code (for testing error scenarios). */
  _setError(code: string): void {
    this.lastError = code;
  }

  /** @internal Check if the mock is currently initialized. */
  _isInitialized(): boolean {
    return this.initialized;
  }

  /** @internal Check if the mock has been terminated. */
  _isTerminated(): boolean {
    return this.terminated;
  }
}

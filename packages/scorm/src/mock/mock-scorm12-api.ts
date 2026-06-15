import type { Scorm12RawApi } from '../types/common';
import { SCORM_12_ERRORS } from '../errors/error-codes';

/**
 * In-memory mock of the SCORM 1.2 raw API (window.API shape).
 * Uses a Map as the backing store and validates call sequences.
 */
export class MockScorm12Api implements Scorm12RawApi {
  private store = new Map<string, string>();
  private lastError = '0';
  private initialized = false;
  private terminated = false;

  LMSInitialize(_param: ''): string {
    if (this.initialized) {
      this.lastError = '101';
      return 'false';
    }
    if (this.terminated) {
      this.lastError = '101';
      return 'false';
    }
    this.initialized = true;
    this.lastError = '0';
    return 'true';
  }

  LMSFinish(_param: ''): string {
    if (!this.initialized) {
      this.lastError = '301';
      return 'false';
    }
    this.initialized = false;
    this.terminated = true;
    this.lastError = '0';
    return 'true';
  }

  LMSGetValue(element: string): string {
    if (!this.initialized) {
      this.lastError = '301';
      return '';
    }
    this.lastError = '0';
    return this.store.get(element) ?? '';
  }

  LMSSetValue(element: string, value: string): string {
    if (!this.initialized) {
      this.lastError = '301';
      return 'false';
    }
    this.store.set(element, value);
    this.lastError = '0';
    return 'true';
  }

  LMSCommit(_param: ''): string {
    if (!this.initialized) {
      this.lastError = '301';
      return 'false';
    }
    this.lastError = '0';
    return 'true';
  }

  LMSGetLastError(): string {
    return this.lastError;
  }

  LMSGetErrorString(errorCode: string): string {
    return SCORM_12_ERRORS[parseInt(errorCode, 10)] ?? '';
  }

  LMSGetDiagnostic(_errorCode: string): string {
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

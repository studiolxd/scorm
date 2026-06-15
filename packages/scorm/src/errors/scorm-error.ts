import type { ScormVersion } from '../types/common';

/** All fields that describe a SCORM error. */
export interface ScormErrorInfo {
  /** Which SCORM version was in use. */
  version: ScormVersion | null;
  /** What operation was attempted (e.g. 'initialize', 'getValue', 'setValue'). */
  operation: string;
  /** The CMI path that was being accessed, if applicable. */
  path?: string;
  /** The numeric error code from the LMS. */
  code: number;
  /** Human-readable error string from the LMS. */
  errorString: string;
  /** Diagnostic info from the LMS. */
  diagnostic: string;
  /** If a JS exception occurred during the API call. */
  exception?: Error;
  /** Whether the SCORM API object was found in the DOM. */
  apiFound: boolean;
  /** Whether Initialize/LMSInitialize had been called successfully. */
  initialized: boolean;
}

/** Typed error class for all SCORM operations. */
export class ScormError extends Error implements ScormErrorInfo {
  public readonly version: ScormVersion | null;
  public readonly operation: string;
  public readonly path?: string;
  public readonly code: number;
  public readonly errorString: string;
  public readonly diagnostic: string;
  public readonly exception?: Error;
  public readonly apiFound: boolean;
  public readonly initialized: boolean;

  constructor(info: ScormErrorInfo) {
    super(
      `SCORM ${info.version ?? 'unknown'} error [${info.code}] during ${info.operation}` +
      (info.path ? ` on "${info.path}"` : '') +
      `: ${info.errorString}`
    );
    this.name = 'ScormError';
    this.version = info.version;
    this.operation = info.operation;
    this.path = info.path;
    this.code = info.code;
    this.errorString = info.errorString;
    this.diagnostic = info.diagnostic;
    this.exception = info.exception;
    this.apiFound = info.apiFound;
    this.initialized = info.initialized;
  }
}

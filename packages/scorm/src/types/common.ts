/** Supported SCORM versions. */
export type ScormVersion = '1.2' | '2004';

/**
 * The raw SCORM 1.2 API object shape (window.API).
 * All methods accept and return strings per the SCORM 1.2 RTE specification.
 */
export interface Scorm12RawApi {
  LMSInitialize(param: ''): string;
  LMSFinish(param: ''): string;
  LMSGetValue(element: string): string;
  LMSSetValue(element: string, value: string): string;
  LMSCommit(param: ''): string;
  LMSGetLastError(): string;
  LMSGetErrorString(errorCode: string): string;
  LMSGetDiagnostic(errorCode: string): string;
}

/**
 * The raw SCORM 2004 (4th Edition) API object shape (window.API_1484_11).
 * All methods accept and return strings per the SCORM 2004 RTE specification.
 */
export interface Scorm2004RawApi {
  Initialize(param: ''): string;
  Terminate(param: ''): string;
  GetValue(element: string): string;
  SetValue(element: string, value: string): string;
  Commit(param: ''): string;
  GetLastError(): string;
  GetErrorString(errorCode: string): string;
  GetDiagnostic(errorCode: string): string;
}

// React integration
export { ScormProvider } from './react/scorm-provider';
export { useScorm } from './react/use-scorm';
export { useScormAutoTerminate } from './react/use-scorm-auto-terminate';
export { useScormAutoCommit } from './react/use-scorm-auto-commit';
export { useScormSession } from './react/use-scorm-session';
export type { ScormContextValue } from './react/scorm-context';
export type { AutoTerminateOptions } from './react/use-scorm-auto-terminate';
export type { ScormSessionValue } from './react/use-scorm-session';

// High-level API
export { ScormApi } from './api/scorm-api';
export type {
  IScormApi,
  InteractionRecord,
  ObjectiveRecord,
  ScoreData,
  InteractionType,
  CommentRecord,
} from './types/api';

// Path builders
export {
  scorm12ObjectivePath,
  scorm12InteractionPath,
  scorm12InteractionObjectivePath,
  scorm12InteractionCorrectResponsePath,
  scorm2004ObjectivePath,
  scorm2004InteractionPath,
  scorm2004InteractionObjectivePath,
  scorm2004InteractionCorrectResponsePath,
  scorm2004CommentFromLearnerPath,
  scorm2004CommentFromLmsPath,
} from './api/path-builders';

// Time formatters
export { formatScorm12Time, formatScorm2004Time } from './api/time-format';

// Result type
export { ok, err, isOk, isErr, unwrap, unwrapOr } from './result/result';
export type { Result } from './result/result';

// Error types
export { ScormError } from './errors/scorm-error';
export type { ScormErrorInfo } from './errors/scorm-error';
export { SCORM_12_ERRORS, SCORM_2004_ERRORS } from './errors/error-codes';

// Core types
export type { ScormVersion, Scorm12RawApi, Scorm2004RawApi } from './types/common';
export type {
  Scorm12CmiPath,
  Scorm12CorePath,
  Scorm12ObjectiveField,
  Scorm12InteractionField,
} from './types/scorm12-cmi';
export type {
  Scorm2004CmiPath,
  Scorm2004LeafPath,
  Scorm2004ObjectiveField,
  Scorm2004InteractionField,
} from './types/scorm2004-cmi';
export type { IScormDriver } from './types/driver';
export type { ScormStatus } from './types/status';
export type { ScormProviderOptions, ScormProviderProps, NoLmsBehavior } from './types/options';

// Core classes (for advanced use)
export { findScormApi, detectScormApi, detectScormVersion } from './core/locator';
export type { LocatorResult, LocatorOptions, DetectResult } from './core/locator';
export { Scorm12Driver } from './core/scorm12-driver';
export { Scorm2004Driver } from './core/scorm2004-driver';
export { createDriver } from './core/create-driver';

// Mock (for testing)
export { MockScorm12Api } from './mock/mock-scorm12-api';
export { MockScorm2004Api } from './mock/mock-scorm2004-api';
export { createMockDriver } from './mock/mock-driver';

// Logger
export { createLogger } from './debug/logger';
export type { Logger } from './debug/logger';

// ─────────────────────────────────────────────────────────────────────────────
// @studiolxd/scorm/react — React adapter
//
// Re-exports the framework-agnostic core so consumers can import everything from
// a single entry: `import { ScormProvider, useScorm, ScormError } from '@studiolxd/scorm/react'`.
// ─────────────────────────────────────────────────────────────────────────────

// React integration
export { ScormProvider } from './scorm-provider';
export { useScorm } from './use-scorm';
export { useScormAutoTerminate } from './use-scorm-auto-terminate';
export { useScormAutoCommit } from './use-scorm-auto-commit';
export { useScormSession } from './use-scorm-session';
export type { ScormContextValue } from './scorm-context';
export type { AutoTerminateOptions } from './use-scorm-auto-terminate';
export type { ScormSessionValue } from './use-scorm-session';

// Re-export the whole core for convenience
export * from '../index';

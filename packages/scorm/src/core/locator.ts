import type { ScormVersion, Scorm12RawApi, Scorm2004RawApi } from '../types/common';

/** Result of the API locator search. */
export interface LocatorResult {
  /** The found API object, or null if not found. */
  api: Scorm12RawApi | Scorm2004RawApi | null;
  /**
   * Where the API was found, for diagnostics.
   * @internal Diagnostic only — never display this to learners.
   */
  source: string | null;
}

/** Options for the API locator. */
export interface LocatorOptions {
  /** Maximum depth to traverse window.parent. Default: 10. */
  maxParentDepth?: number;
  /** Whether to also check window.opener. Default: true. */
  checkOpener?: boolean;
}

/** Required method names for SCORM 1.2 raw API duck-type check. */
const SCORM12_REQUIRED_METHODS: (keyof Scorm12RawApi)[] = [
  'LMSInitialize', 'LMSFinish', 'LMSGetValue', 'LMSSetValue',
  'LMSCommit', 'LMSGetLastError', 'LMSGetErrorString', 'LMSGetDiagnostic',
];

/** Required method names for SCORM 2004 raw API duck-type check. */
const SCORM2004_REQUIRED_METHODS: (keyof Scorm2004RawApi)[] = [
  'Initialize', 'Terminate', 'GetValue', 'SetValue',
  'Commit', 'GetLastError', 'GetErrorString', 'GetDiagnostic',
];

/**
 * Verify that a candidate object exposes all required SCORM methods as functions.
 * Prevents non-array objects, prototype objects, or partially-shaped objects from
 * being accepted as valid SCORM API handles.
 */
function isValidScormApi(obj: unknown, version: ScormVersion): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const methods = version === '1.2' ? SCORM12_REQUIRED_METHODS : SCORM2004_REQUIRED_METHODS;
  const record = obj as Record<string, unknown>;
  return methods.every(m => typeof record[m] === 'function');
}

/**
 * Search for the SCORM API object in the window hierarchy.
 *
 * For SCORM 1.2, looks for `window.API`.
 * For SCORM 2004, looks for `window.API_1484_11`.
 *
 * Traverses window.parent up to `maxParentDepth`, then checks window.opener.
 * All cross-origin property accesses are wrapped in try/catch to handle SecurityError.
 *
 * The found object is duck-type validated to confirm it exposes all required SCORM
 * methods before being returned, preventing prototype-pollution or partially-shaped
 * objects from being accepted as valid API handles.
 */
export function findScormApi(
  version: ScormVersion,
  options: LocatorOptions = {},
): LocatorResult {
  // SSR / non-browser guard: during server-side rendering (Next.js, Remix) there is
  // no `window`. Touching it would throw a ReferenceError during render. Report "not
  // found" so the provider applies its noLmsBehavior strategy instead of crashing.
  if (typeof window === 'undefined') {
    return { api: null, source: null };
  }

  const { maxParentDepth = 10, checkOpener = true } = options;
  const apiName = version === '1.2' ? 'API' : 'API_1484_11';

  // Search starting from a given window, traversing parents
  const searchFrom = (startWindow: Window, label: string): LocatorResult => {
    let current: Window = startWindow;
    for (let depth = 0; depth <= maxParentDepth; depth++) {
      try {
        const api = (current as unknown as Record<string, unknown>)[apiName];
        if (isValidScormApi(api, version)) {
          return {
            api: api as Scorm12RawApi | Scorm2004RawApi,
            source: `${label}${depth > 0 ? ` (parent depth ${depth})` : ''}`,
          };
        }
      } catch {
        // Cross-origin SecurityError — stop this branch
        return { api: null, source: null };
      }

      // Move to parent
      try {
        if (current.parent === current || current.parent == null) {
          break; // Reached top of frame hierarchy
        }
        current = current.parent;
      } catch {
        // Cross-origin SecurityError on accessing parent
        break;
      }
    }
    return { api: null, source: null };
  };

  // 1. Search current window and its parents
  const result = searchFrom(window, 'window');
  if (result.api) return result;

  // 2. Check window.opener if configured
  if (checkOpener) {
    try {
      if (window.opener && window.opener !== window) {
        const openerResult = searchFrom(window.opener as Window, 'opener');
        if (openerResult.api) return openerResult;
      }
    } catch {
      // Cross-origin SecurityError on accessing opener
    }
  }

  return { api: null, source: null };
}

/** Result of the version-detection search. */
export interface DetectResult extends LocatorResult {
  /** The SCORM version whose API was found, or null if none was found. */
  version: ScormVersion | null;
}

/**
 * Detect which SCORM API the host LMS exposes, without knowing the version in advance.
 *
 * Probes for SCORM 2004 (`window.API_1484_11`) first, then SCORM 1.2 (`window.API`).
 * 2004 is checked first because an LMS that supports both typically prefers it, and a
 * 2004 SCO launched against a 1.2-only handle would fail. Returns the found API plus
 * the detected version, or `version: null` when neither is present (or during SSR).
 *
 * @example
 * ```ts
 * const found = detectScormApi();
 * if (found.version) console.log(`LMS speaks SCORM ${found.version}`);
 * ```
 */
export function detectScormApi(options: LocatorOptions = {}): DetectResult {
  const order: ScormVersion[] = ['2004', '1.2'];
  for (const version of order) {
    const result = findScormApi(version, options);
    if (result.api) {
      return { ...result, version };
    }
  }
  return { api: null, source: null, version: null };
}

/**
 * Convenience wrapper around {@link detectScormApi} that returns only the detected
 * SCORM version (`'2004'`, `'1.2'`, or `null` if no API is reachable).
 */
export function detectScormVersion(options: LocatorOptions = {}): ScormVersion | null {
  return detectScormApi(options).version;
}

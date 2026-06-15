import type { ScormVersion, Scorm12RawApi, Scorm2004RawApi } from '../types/common';
import type { IScormDriver } from '../types/driver';
import type { ScormProviderOptions } from '../types/options';
import type { Logger } from '../debug/logger';
import { ok, err, type Result } from '../result/result';
import { ScormError } from '../errors/scorm-error';
import { findScormApi, detectScormApi } from './locator';
import { Scorm12Driver } from './scorm12-driver';
import { Scorm2004Driver } from './scorm2004-driver';
import { createMockDriver } from '../mock/mock-driver';

function buildDriver(
  version: ScormVersion,
  api: Scorm12RawApi | Scorm2004RawApi,
  logger: Logger,
): IScormDriver {
  return version === '1.2'
    ? new Scorm12Driver(api as Scorm12RawApi, logger)
    : new Scorm2004Driver(api as Scorm2004RawApi, logger);
}

/**
 * Create the appropriate SCORM driver based on version and options.
 *
 * 1. Uses the locator to find the real SCORM API object. When `version` is `'auto'`,
 *    it probes for SCORM 2004 first, then 1.2, and adopts whichever is present.
 * 2. If found, wraps it in the version-specific driver.
 * 3. If not found, applies the noLmsBehavior strategy:
 *    - "error" (default): returns an error Result
 *    - "mock": creates an in-memory mock driver
 *    - "throw": throws a ScormError
 *
 * When `version` is `'auto'` and no API is found, the version reported in the error /
 * used for the mock falls back to `options.fallbackVersion` (default `'2004'`).
 */
export function createDriver(
  version: ScormVersion | 'auto',
  options: ScormProviderOptions,
  logger: Logger,
): Result<IScormDriver, ScormError> {
  const locatorOptions = {
    maxParentDepth: options.maxParentDepth,
    checkOpener: options.checkOpener,
  };

  if (version === 'auto') {
    const detected = detectScormApi(locatorOptions);
    if (detected.api && detected.version) {
      logger.debug(`SCORM API auto-detected: ${detected.version} (${detected.source})`);
      return ok(buildDriver(detected.version, detected.api, logger));
    }
  } else {
    const { api } = findScormApi(version, locatorOptions);
    if (api) {
      logger.debug(`SCORM ${version} API found`);
      return ok(buildDriver(version, api, logger));
    }
  }

  // No API found — apply noLmsBehavior. For 'auto', use the configured fallback
  // version when constructing the mock / reporting the error.
  const resolvedVersion: ScormVersion =
    version === 'auto' ? (options.fallbackVersion ?? '2004') : version;
  const behavior = options.noLmsBehavior ?? 'error';
  logger.warn(`SCORM ${resolvedVersion} API not found, using behavior: ${behavior}`);

  const diagnostic =
    `No ${resolvedVersion === '1.2' ? 'window.API' : 'window.API_1484_11'} found in window hierarchy`;

  switch (behavior) {
    case 'mock':
      return ok(createMockDriver(resolvedVersion, logger));

    case 'throw':
      throw new ScormError({
        version: resolvedVersion,
        operation: 'createDriver',
        code: 0,
        errorString: 'SCORM API not found',
        diagnostic,
        apiFound: false,
        initialized: false,
      });

    case 'error':
    default:
      return err(new ScormError({
        version: resolvedVersion,
        operation: 'createDriver',
        code: 0,
        errorString: 'SCORM API not found',
        diagnostic,
        apiFound: false,
        initialized: false,
      }));
  }
}

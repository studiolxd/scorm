import type { ScormVersion } from '../types/common';
import type { IScormDriver } from '../types/driver';
import type { Logger } from '../debug/logger';
import { Scorm12Driver } from '../core/scorm12-driver';
import { Scorm2004Driver } from '../core/scorm2004-driver';
import { MockScorm12Api } from './mock-scorm12-api';
import { MockScorm2004Api } from './mock-scorm2004-api';

/**
 * Create a mock driver that uses an in-memory store.
 * Reuses the real driver classes with mock API objects, ensuring
 * mock behavior exactly mirrors real LMS behavior.
 */
export function createMockDriver(version: ScormVersion, logger: Logger): IScormDriver {
  if (version === '1.2') {
    return new Scorm12Driver(new MockScorm12Api(), logger);
  }
  return new Scorm2004Driver(new MockScorm2004Api(), logger);
}

import { createContext } from 'react';
import type { IScormApi } from '../types/api';
import type { ScormStatus } from '../types/status';
import type { IScormDriver } from '../types/driver';
import type { ScormSession } from '../session/create-scorm-session';

/** The value provided by ScormProvider via React context. */
export interface ScormContextValue {
  /** Current SCORM connection status (snapshot at render time). */
  status: ScormStatus;
  /** The raw low-level driver (escape hatch for direct API calls). */
  raw: IScormDriver | null;
  /** The high-level version-agnostic API. */
  api: IScormApi | null;
  /** The underlying observable session (used by the lifecycle hooks). */
  session: ScormSession | null;
}

export const ScormContext = createContext<ScormContextValue | null>(null);

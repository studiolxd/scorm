import type { ScormVersion } from './common';
import type { NoLmsBehavior } from './options';

/** Runtime status of the SCORM connection. */
export interface ScormStatus {
  /** The SCORM version configured in the provider. */
  version: ScormVersion;
  /** Whether the SCORM API object was found in the window hierarchy. */
  apiFound: boolean;
  /** Whether Initialize/LMSInitialize has been called and succeeded. */
  initialized: boolean;
  /** Whether Terminate/LMSFinish has been called. */
  terminated: boolean;
  /** The NoLmsBehavior mode in effect. */
  noLmsBehavior: NoLmsBehavior;
}

/**
 * Exhaustive SCORM 1.2 CMI data model path types.
 * Based on the SCORM 1.2 Run-Time Environment specification.
 */

// --- Static paths ---

/** Core learner/session data. */
export type Scorm12CorePath =
  | 'cmi.core._children'
  | 'cmi.core.student_id'
  | 'cmi.core.student_name'
  | 'cmi.core.lesson_location'
  | 'cmi.core.credit'
  | 'cmi.core.lesson_status'
  | 'cmi.core.entry'
  | 'cmi.core.score._children'
  | 'cmi.core.score.raw'
  | 'cmi.core.score.max'
  | 'cmi.core.score.min'
  | 'cmi.core.total_time'
  | 'cmi.core.lesson_mode'
  | 'cmi.core.exit'
  | 'cmi.core.session_time';

/** Suspend and launch data. */
export type Scorm12DataPath =
  | 'cmi.suspend_data'
  | 'cmi.launch_data';

/** Free-text comments. */
export type Scorm12CommentsPath =
  | 'cmi.comments'
  | 'cmi.comments_from_lms';

/** Student data (read-only from LMS). */
export type Scorm12StudentDataPath =
  | 'cmi.student_data._children'
  | 'cmi.student_data.mastery_score'
  | 'cmi.student_data.max_time_allowed'
  | 'cmi.student_data.time_limit_action';

/** Student preferences. */
export type Scorm12StudentPreferencePath =
  | 'cmi.student_preference._children'
  | 'cmi.student_preference.audio'
  | 'cmi.student_preference.language'
  | 'cmi.student_preference.speed'
  | 'cmi.student_preference.text';

// --- Indexed collection field types ---

/** Fields available on cmi.objectives.n.* */
export type Scorm12ObjectiveField =
  | 'id'
  | 'score.raw'
  | 'score.max'
  | 'score.min'
  | 'score._children'
  | 'status';

/** Fields available on cmi.interactions.n.* */
export type Scorm12InteractionField =
  | 'id'
  | 'time'
  | 'type'
  | 'weighting'
  | 'student_response'
  | 'result'
  | 'latency';

/** Fields on cmi.interactions.n.objectives.m.* */
export type Scorm12InteractionObjectiveField = 'id';

/** Fields on cmi.interactions.n.correct_responses.m.* */
export type Scorm12InteractionCorrectResponseField = 'pattern';

// --- Indexed collection paths (template literal types) ---

/** Collection metadata paths. */
export type Scorm12CollectionMetaPath =
  | 'cmi.objectives._children'
  | 'cmi.objectives._count'
  | 'cmi.interactions._children'
  | 'cmi.interactions._count';

/** Objective paths: cmi.objectives.{n}.{field} */
export type Scorm12ObjectivePath =
  `cmi.objectives.${number}.${Scorm12ObjectiveField}`;

/** Interaction paths including nested objectives and correct_responses. */
export type Scorm12InteractionPath =
  | `cmi.interactions.${number}.${Scorm12InteractionField}`
  | `cmi.interactions.${number}.objectives.${number}.${Scorm12InteractionObjectiveField}`
  | `cmi.interactions.${number}.correct_responses.${number}.${Scorm12InteractionCorrectResponseField}`;

// --- Complete union ---

/** All valid SCORM 1.2 CMI paths. */
export type Scorm12CmiPath =
  | Scorm12CorePath
  | Scorm12DataPath
  | Scorm12CommentsPath
  | Scorm12StudentDataPath
  | Scorm12StudentPreferencePath
  | Scorm12CollectionMetaPath
  | Scorm12ObjectivePath
  | Scorm12InteractionPath;

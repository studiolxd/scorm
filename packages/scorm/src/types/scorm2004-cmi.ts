/**
 * Exhaustive SCORM 2004 (4th Edition) CMI data model path types.
 * Based on the SCORM 2004 4th Edition Run-Time Environment specification.
 */

// --- Static (leaf) paths ---

/** Top-level CMI elements. */
export type Scorm2004LeafPath =
  | 'cmi._version'
  | 'cmi.completion_status'
  | 'cmi.completion_threshold'
  | 'cmi.credit'
  | 'cmi.entry'
  | 'cmi.exit'
  | 'cmi.launch_data'
  | 'cmi.learner_id'
  | 'cmi.learner_name'
  | 'cmi.location'
  | 'cmi.max_time_allowed'
  | 'cmi.mode'
  | 'cmi.progress_measure'
  | 'cmi.scaled_passing_score'
  | 'cmi.score._children'
  | 'cmi.score.scaled'
  | 'cmi.score.raw'
  | 'cmi.score.min'
  | 'cmi.score.max'
  | 'cmi.session_time'
  | 'cmi.success_status'
  | 'cmi.suspend_data'
  | 'cmi.time_limit_action'
  | 'cmi.total_time';

/** Learner preference paths. */
export type Scorm2004PreferencePath =
  | 'cmi.learner_preference._children'
  | 'cmi.learner_preference.audio_level'
  | 'cmi.learner_preference.language'
  | 'cmi.learner_preference.delivery_speed'
  | 'cmi.learner_preference.audio_captioning';

// --- Indexed collection field types ---

/** Fields available on cmi.objectives.n.* */
export type Scorm2004ObjectiveField =
  | 'id'
  | 'score._children'
  | 'score.scaled'
  | 'score.raw'
  | 'score.min'
  | 'score.max'
  | 'success_status'
  | 'completion_status'
  | 'progress_measure'
  | 'description';

/** Fields available on cmi.interactions.n.* */
export type Scorm2004InteractionField =
  | 'id'
  | 'type'
  | 'timestamp'
  | 'weighting'
  | 'learner_response'
  | 'result'
  | 'latency'
  | 'description';

/** Fields on cmi.interactions.n.objectives.m.* */
export type Scorm2004InteractionObjectiveField = 'id';

/** Fields on cmi.interactions.n.correct_responses.m.* */
export type Scorm2004InteractionCorrectResponseField = 'pattern';

/** Fields on cmi.comments_from_learner.n.* */
export type Scorm2004CommentFromLearnerField = 'comment' | 'location' | 'timestamp';

/** Fields on cmi.comments_from_lms.n.* */
export type Scorm2004CommentFromLmsField = 'comment' | 'location' | 'timestamp';

// --- Indexed collection paths (template literal types) ---

/** Collection metadata paths. */
export type Scorm2004CollectionMetaPath =
  | 'cmi.objectives._children'
  | 'cmi.objectives._count'
  | 'cmi.interactions._children'
  | 'cmi.interactions._count'
  | 'cmi.comments_from_learner._children'
  | 'cmi.comments_from_learner._count'
  | 'cmi.comments_from_lms._children'
  | 'cmi.comments_from_lms._count';

/** Objective paths: cmi.objectives.{n}.{field} */
export type Scorm2004ObjectivePath =
  `cmi.objectives.${number}.${Scorm2004ObjectiveField}`;

/** Interaction paths including nested objectives and correct_responses. */
export type Scorm2004InteractionPath =
  | `cmi.interactions.${number}.${Scorm2004InteractionField}`
  | `cmi.interactions.${number}.objectives.${number}.${Scorm2004InteractionObjectiveField}`
  | `cmi.interactions.${number}.correct_responses.${number}.${Scorm2004InteractionCorrectResponseField}`;

/** Comment from learner paths. */
export type Scorm2004CommentFromLearnerPath =
  | `cmi.comments_from_learner.${number}.${Scorm2004CommentFromLearnerField}`;

/** Comment from LMS paths. */
export type Scorm2004CommentFromLmsPath =
  | `cmi.comments_from_lms.${number}.${Scorm2004CommentFromLmsField}`;

/** ADL navigation request paths. */
export type Scorm2004AdlNavPath =
  | 'adl.nav.request'
  | 'adl.nav.request_valid.continue'
  | 'adl.nav.request_valid.previous'
  | `adl.nav.request_valid.choice.${string}`
  | `adl.nav.request_valid.jump.${string}`;

// --- Complete union ---

/** All valid SCORM 2004 CMI paths. */
export type Scorm2004CmiPath =
  | Scorm2004LeafPath
  | Scorm2004PreferencePath
  | Scorm2004CollectionMetaPath
  | Scorm2004ObjectivePath
  | Scorm2004InteractionPath
  | Scorm2004CommentFromLearnerPath
  | Scorm2004CommentFromLmsPath
  | Scorm2004AdlNavPath;

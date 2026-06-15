import type { Scorm12ObjectiveField, Scorm12InteractionField } from '../types/scorm12-cmi';
import type { Scorm2004ObjectiveField, Scorm2004InteractionField, Scorm2004CommentFromLearnerField, Scorm2004CommentFromLmsField } from '../types/scorm2004-cmi';

// --- SCORM 1.2 path builders ---

/** Build a typed SCORM 1.2 objective path. */
export function scorm12ObjectivePath(
  index: number,
  field: Scorm12ObjectiveField,
): `cmi.objectives.${number}.${Scorm12ObjectiveField}` {
  return `cmi.objectives.${index}.${field}`;
}

/** Build a typed SCORM 1.2 interaction path. */
export function scorm12InteractionPath(
  index: number,
  field: Scorm12InteractionField,
): `cmi.interactions.${number}.${Scorm12InteractionField}` {
  return `cmi.interactions.${index}.${field}`;
}

/** Build a typed SCORM 1.2 interaction objective path. */
export function scorm12InteractionObjectivePath(
  interactionIndex: number,
  objectiveIndex: number,
): `cmi.interactions.${number}.objectives.${number}.id` {
  return `cmi.interactions.${interactionIndex}.objectives.${objectiveIndex}.id`;
}

/** Build a typed SCORM 1.2 interaction correct response path. */
export function scorm12InteractionCorrectResponsePath(
  interactionIndex: number,
  responseIndex: number,
): `cmi.interactions.${number}.correct_responses.${number}.pattern` {
  return `cmi.interactions.${interactionIndex}.correct_responses.${responseIndex}.pattern`;
}

// --- SCORM 2004 path builders ---

/** Build a typed SCORM 2004 objective path. */
export function scorm2004ObjectivePath(
  index: number,
  field: Scorm2004ObjectiveField,
): `cmi.objectives.${number}.${Scorm2004ObjectiveField}` {
  return `cmi.objectives.${index}.${field}`;
}

/** Build a typed SCORM 2004 interaction path. */
export function scorm2004InteractionPath(
  index: number,
  field: Scorm2004InteractionField,
): `cmi.interactions.${number}.${Scorm2004InteractionField}` {
  return `cmi.interactions.${index}.${field}`;
}

/** Build a typed SCORM 2004 interaction objective path. */
export function scorm2004InteractionObjectivePath(
  interactionIndex: number,
  objectiveIndex: number,
): `cmi.interactions.${number}.objectives.${number}.id` {
  return `cmi.interactions.${interactionIndex}.objectives.${objectiveIndex}.id`;
}

/** Build a typed SCORM 2004 interaction correct response path. */
export function scorm2004InteractionCorrectResponsePath(
  interactionIndex: number,
  responseIndex: number,
): `cmi.interactions.${number}.correct_responses.${number}.pattern` {
  return `cmi.interactions.${interactionIndex}.correct_responses.${responseIndex}.pattern`;
}

/** Build a typed SCORM 2004 comment from learner path. */
export function scorm2004CommentFromLearnerPath(
  index: number,
  field: Scorm2004CommentFromLearnerField,
): `cmi.comments_from_learner.${number}.${Scorm2004CommentFromLearnerField}` {
  return `cmi.comments_from_learner.${index}.${field}`;
}

/** Build a typed SCORM 2004 comment from LMS path. */
export function scorm2004CommentFromLmsPath(
  index: number,
  field: Scorm2004CommentFromLmsField,
): `cmi.comments_from_lms.${number}.${Scorm2004CommentFromLmsField}` {
  return `cmi.comments_from_lms.${index}.${field}`;
}

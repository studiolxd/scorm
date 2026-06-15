import type { IScormApi, InteractionRecord, InteractionType, ObjectiveRecord, ScoreData, CommentRecord } from '../types/api';
import type { IScormDriver } from '../types/driver';
import type { ScormVersion } from '../types/common';
import { ok, err, type Result } from '../result/result';
import { ScormError } from '../errors/scorm-error';
import { formatScorm12Time, formatScorm2004Time } from './time-format';

/**
 * High-level, version-agnostic SCORM API.
 *
 * Wraps an IScormDriver and provides ergonomic methods that
 * internally branch on the SCORM version to use the correct CMI paths.
 */
export class ScormApi implements IScormApi {
  readonly version: ScormVersion;
  private readonly driver: IScormDriver;

  constructor(driver: IScormDriver) {
    this.driver = driver;
    this.version = driver.version;
  }

  // --- Lifecycle ---

  initialize(): Result<true, ScormError> {
    return this.driver.initialize();
  }

  terminate(): Result<true, ScormError> {
    return this.driver.terminate();
  }

  commit(): Result<true, ScormError> {
    return this.driver.commit();
  }

  // --- Learner info ---

  getLearnerId(): Result<string, ScormError> {
    return this.driver.getValue(
      this.version === '1.2' ? 'cmi.core.student_id' : 'cmi.learner_id',
    );
  }

  getLearnerName(): Result<string, ScormError> {
    return this.driver.getValue(
      this.version === '1.2' ? 'cmi.core.student_name' : 'cmi.learner_name',
    );
  }

  // --- Launch / course data ---

  getLaunchData(): Result<string, ScormError> {
    return this.driver.getValue('cmi.launch_data');
  }

  getMode(): Result<string, ScormError> {
    return this.driver.getValue(
      this.version === '1.2' ? 'cmi.core.lesson_mode' : 'cmi.mode',
    );
  }

  getCredit(): Result<string, ScormError> {
    return this.driver.getValue(
      this.version === '1.2' ? 'cmi.core.credit' : 'cmi.credit',
    );
  }

  getEntry(): Result<string, ScormError> {
    return this.driver.getValue(
      this.version === '1.2' ? 'cmi.core.entry' : 'cmi.entry',
    );
  }

  // --- Location & suspend data ---

  getLocation(): Result<string, ScormError> {
    return this.driver.getValue(
      this.version === '1.2' ? 'cmi.core.lesson_location' : 'cmi.location',
    );
  }

  setLocation(value: string): Result<string, ScormError> {
    return this.driver.setValue(
      this.version === '1.2' ? 'cmi.core.lesson_location' : 'cmi.location',
      value,
    );
  }

  getSuspendData(): Result<string, ScormError> {
    return this.driver.getValue('cmi.suspend_data');
  }

  setSuspendData(value: string): Result<string, ScormError> {
    return this.driver.setValue('cmi.suspend_data', value);
  }

  // --- Completion / success status ---

  setComplete(): Result<string, ScormError> {
    if (this.version === '1.2') {
      return this.driver.setValue('cmi.core.lesson_status', 'completed');
    }
    return this.driver.setValue('cmi.completion_status', 'completed');
  }

  setIncomplete(): Result<string, ScormError> {
    if (this.version === '1.2') {
      return this.driver.setValue('cmi.core.lesson_status', 'incomplete');
    }
    return this.driver.setValue('cmi.completion_status', 'incomplete');
  }

  setPassed(): Result<string, ScormError> {
    if (this.version === '1.2') {
      return this.driver.setValue('cmi.core.lesson_status', 'passed');
    }
    return this.driver.setValue('cmi.success_status', 'passed');
  }

  setFailed(): Result<string, ScormError> {
    if (this.version === '1.2') {
      return this.driver.setValue('cmi.core.lesson_status', 'failed');
    }
    return this.driver.setValue('cmi.success_status', 'failed');
  }

  getCompletionStatus(): Result<string, ScormError> {
    if (this.version === '1.2') {
      return this.driver.getValue('cmi.core.lesson_status');
    }
    return this.driver.getValue('cmi.completion_status');
  }

  getSuccessStatus(): Result<string, ScormError> {
    if (this.version === '1.2') {
      // SCORM 1.2 doesn't have a separate success status
      return this.driver.getValue('cmi.core.lesson_status');
    }
    return this.driver.getValue('cmi.success_status');
  }

  // --- Score ---

  /**
   * Write score fields to the LMS.
   *
   * **Best-effort writes:** Each field is a separate `SetValue` call. Numeric inputs
   * (`raw`, `min`, `max`, `scaled`) are validated locally before any write is made.
   * If the LMS rejects a field for its own reasons after writes have already started,
   * earlier fields remain committed — SCORM has no rollback mechanism.
   */
  /**
   * Validate a raw/min/max score field. Returns a ScormError if invalid, else null.
   * In SCORM 1.2 these are constrained to 0–100 (CMIDecimal); SCORM 2004 only
   * requires a finite number.
   */
  private validateScoreField(field: 'raw' | 'min' | 'max', value: number): ScormError | null {
    const prefix = this.version === '1.2' ? 'cmi.core.score' : 'cmi.score';
    if (!isFinite(value)) {
      return new ScormError({
        version: this.version,
        operation: 'setScore',
        path: `${prefix}.${field}`,
        code: 405,
        errorString: 'Incorrect Data Type',
        diagnostic: `score.${field} must be a finite number, got: ${value}`,
        apiFound: true,
        initialized: true,
      });
    }
    if (this.version === '1.2' && (value < 0 || value > 100)) {
      return new ScormError({
        version: '1.2',
        operation: 'setScore',
        path: `${prefix}.${field}`,
        code: 405,
        errorString: 'Incorrect Data Type',
        diagnostic: `SCORM 1.2 score.${field} must be between 0 and 100, got: ${value}`,
        apiFound: true,
        initialized: true,
      });
    }
    return null;
  }

  setScore(data: ScoreData): Result<true, ScormError> {
    const prefix = this.version === '1.2' ? 'cmi.core.score' : 'cmi.score';

    // All setValue calls are attempted regardless of intermediate failures (best-effort).
    // The first error encountered is returned, but earlier writes may have already
    // succeeded, leaving the LMS in a partial state. This matches SCORM's own model
    // where each data-model element is set independently.
    const results: Result<string, ScormError>[] = [];

    for (const field of ['raw', 'min', 'max'] as const) {
      const value = data[field];
      if (value === undefined) continue;
      const invalid = this.validateScoreField(field, value);
      if (invalid) return err(invalid);
      results.push(this.driver.setValue(`${prefix}.${field}`, String(value)));
    }

    if (data.scaled !== undefined && this.version === '2004') {
      if (!isFinite(data.scaled) || data.scaled < -1 || data.scaled > 1) {
        return err(new ScormError({
          version: this.version,
          operation: 'setScore',
          path: 'cmi.score.scaled',
          code: 407,
          errorString: 'Data Model Element Value Out Of Range',
          diagnostic: `score.scaled must be between -1 and 1, got: ${data.scaled}`,
          apiFound: true,
          initialized: true,
        }));
      }
      results.push(this.driver.setValue('cmi.score.scaled', String(data.scaled)));
    }

    const firstError = results.find(r => !r.ok);
    if (firstError && !firstError.ok) return err(firstError.error);
    return ok(true);
  }

  getScore(): Result<ScoreData, ScormError> {
    const prefix = this.version === '1.2' ? 'cmi.core.score' : 'cmi.score';
    const scoreData: ScoreData = {};

    const rawResult = this.driver.getValue(`${prefix}.raw`);
    if (rawResult.ok && rawResult.value !== '') {
      scoreData.raw = parseFloat(rawResult.value);
    } else if (!rawResult.ok) {
      return err(rawResult.error);
    }

    const minResult = this.driver.getValue(`${prefix}.min`);
    if (minResult.ok && minResult.value !== '') {
      scoreData.min = parseFloat(minResult.value);
    }

    const maxResult = this.driver.getValue(`${prefix}.max`);
    if (maxResult.ok && maxResult.value !== '') {
      scoreData.max = parseFloat(maxResult.value);
    }

    if (this.version === '2004') {
      const scaledResult = this.driver.getValue('cmi.score.scaled');
      if (scaledResult.ok && scaledResult.value !== '') {
        scoreData.scaled = parseFloat(scaledResult.value);
      }
    }

    return ok(scoreData);
  }

  // --- Progress (2004 only) ---

  setProgressMeasure(value: number): Result<string, ScormError> {
    if (this.version === '1.2') {
      // No equivalent in SCORM 1.2, return success as no-op
      return ok('');
    }
    if (!isFinite(value) || value < 0 || value > 1) {
      return err(new ScormError({
        version: this.version,
        operation: 'setProgressMeasure',
        path: 'cmi.progress_measure',
        code: 407,
        errorString: 'Data Model Element Value Out Of Range',
        diagnostic: `progress_measure must be between 0 and 1, got: ${value}`,
        apiFound: true,
        initialized: true,
      }));
    }
    return this.driver.setValue('cmi.progress_measure', String(value));
  }

  // --- Session time ---

  setSessionTime(milliseconds: number): Result<string, ScormError> {
    const formatted = this.version === '1.2'
      ? formatScorm12Time(milliseconds)
      : formatScorm2004Time(milliseconds);
    const path = this.version === '1.2' ? 'cmi.core.session_time' : 'cmi.session_time';
    return this.driver.setValue(path, formatted);
  }

  getTotalTime(): Result<string, ScormError> {
    return this.driver.getValue(
      this.version === '1.2' ? 'cmi.core.total_time' : 'cmi.total_time',
    );
  }

  // --- Exit ---

  setExit(value: string): Result<string, ScormError> {
    return this.driver.setValue(
      this.version === '1.2' ? 'cmi.core.exit' : 'cmi.exit',
      value,
    );
  }

  // --- Objectives ---

  getObjectiveCount(): Result<number, ScormError> {
    const result = this.driver.getValue('cmi.objectives._count');
    if (!result.ok) return err(result.error);
    return ok(parseInt(result.value, 10) || 0);
  }

  getObjective(index: number): Result<ObjectiveRecord, ScormError> {
    const base = `cmi.objectives.${index}`;
    const record: ObjectiveRecord = { id: '' };

    const idResult = this.driver.getValue(`${base}.id`);
    if (!idResult.ok) return err(idResult.error);
    record.id = idResult.value;

    // Score fields
    const rawResult = this.driver.getValue(`${base}.score.raw`);
    if (rawResult.ok && rawResult.value !== '') record.scoreRaw = parseFloat(rawResult.value);

    const minResult = this.driver.getValue(`${base}.score.min`);
    if (minResult.ok && minResult.value !== '') record.scoreMin = parseFloat(minResult.value);

    const maxResult = this.driver.getValue(`${base}.score.max`);
    if (maxResult.ok && maxResult.value !== '') record.scoreMax = parseFloat(maxResult.value);

    if (this.version === '1.2') {
      const statusResult = this.driver.getValue(`${base}.status`);
      if (statusResult.ok && statusResult.value !== '') record.status = statusResult.value;
    } else {
      // SCORM 2004 additional fields
      const scaledResult = this.driver.getValue(`${base}.score.scaled`);
      if (scaledResult.ok && scaledResult.value !== '') record.scoreScaled = parseFloat(scaledResult.value);

      const successResult = this.driver.getValue(`${base}.success_status`);
      if (successResult.ok && successResult.value !== '') record.successStatus = successResult.value;

      const completionResult = this.driver.getValue(`${base}.completion_status`);
      if (completionResult.ok && completionResult.value !== '') record.completionStatus = completionResult.value;

      const progressResult = this.driver.getValue(`${base}.progress_measure`);
      if (progressResult.ok && progressResult.value !== '') record.progressMeasure = parseFloat(progressResult.value);

      const descResult = this.driver.getValue(`${base}.description`);
      if (descResult.ok && descResult.value !== '') record.description = descResult.value;
    }

    return ok(record);
  }

  /**
   * Write all fields of an objective entry to the LMS.
   *
   * **Best-effort writes:** Each field is a separate `SetValue` call. If the LMS
   * rejects one field, earlier fields in the same call remain committed — SCORM has
   * no rollback mechanism. For guaranteed atomicity, write fields individually via
   * `setRaw()` and handle each result separately.
   */
  setObjective(index: number, objective: ObjectiveRecord): Result<true, ScormError> {
    const base = `cmi.objectives.${index}`;
    const results: Result<string, ScormError>[] = [];

    results.push(this.driver.setValue(`${base}.id`, objective.id));

    if (objective.scoreRaw !== undefined) {
      results.push(this.driver.setValue(`${base}.score.raw`, String(objective.scoreRaw)));
    }
    if (objective.scoreMin !== undefined) {
      results.push(this.driver.setValue(`${base}.score.min`, String(objective.scoreMin)));
    }
    if (objective.scoreMax !== undefined) {
      results.push(this.driver.setValue(`${base}.score.max`, String(objective.scoreMax)));
    }

    if (this.version === '1.2') {
      if (objective.status) {
        results.push(this.driver.setValue(`${base}.status`, objective.status));
      }
    } else {
      if (objective.scoreScaled !== undefined) {
        results.push(this.driver.setValue(`${base}.score.scaled`, String(objective.scoreScaled)));
      }
      if (objective.successStatus) {
        results.push(this.driver.setValue(`${base}.success_status`, objective.successStatus));
      }
      if (objective.completionStatus) {
        results.push(this.driver.setValue(`${base}.completion_status`, objective.completionStatus));
      }
      if (objective.progressMeasure !== undefined) {
        results.push(this.driver.setValue(`${base}.progress_measure`, String(objective.progressMeasure)));
      }
      if (objective.description) {
        results.push(this.driver.setValue(`${base}.description`, objective.description));
      }
    }

    const firstError = results.find(r => !r.ok);
    if (firstError && !firstError.ok) return err(firstError.error);
    return ok(true);
  }

  // --- Interactions ---

  getInteractionCount(): Result<number, ScormError> {
    const result = this.driver.getValue('cmi.interactions._count');
    if (!result.ok) return err(result.error);
    return ok(parseInt(result.value, 10) || 0);
  }

  /**
   * Write all fields of an interaction entry to the LMS.
   *
   * **Best-effort writes:** Each field is a separate `SetValue` call. If the LMS
   * rejects one field, earlier fields in the same call remain committed — SCORM has
   * no rollback mechanism. For guaranteed atomicity, write fields individually via
   * `setRaw()` and handle each result separately.
   */
  recordInteraction(index: number, interaction: InteractionRecord): Result<true, ScormError> {
    const base = `cmi.interactions.${index}`;
    const results: Result<string, ScormError>[] = [];

    results.push(this.driver.setValue(`${base}.id`, interaction.id));
    results.push(this.driver.setValue(`${base}.type`, interaction.type));

    if (interaction.timestamp) {
      const timeField = this.version === '1.2' ? 'time' : 'timestamp';
      results.push(this.driver.setValue(`${base}.${timeField}`, interaction.timestamp));
    }

    if (interaction.weighting !== undefined) {
      results.push(this.driver.setValue(`${base}.weighting`, String(interaction.weighting)));
    }

    if (interaction.learnerResponse) {
      const responseField = this.version === '1.2' ? 'student_response' : 'learner_response';
      results.push(this.driver.setValue(`${base}.${responseField}`, interaction.learnerResponse));
    }

    if (interaction.result) {
      results.push(this.driver.setValue(`${base}.result`, interaction.result));
    }

    if (interaction.latency) {
      results.push(this.driver.setValue(`${base}.latency`, interaction.latency));
    }

    if (interaction.description && this.version === '2004') {
      results.push(this.driver.setValue(`${base}.description`, interaction.description));
    }

    // Correct responses
    if (interaction.correctResponses) {
      for (let i = 0; i < interaction.correctResponses.length; i++) {
        results.push(this.driver.setValue(
          `${base}.correct_responses.${i}.pattern`,
          interaction.correctResponses[i]!,
        ));
      }
    }

    // Objective IDs
    if (interaction.objectiveIds) {
      for (let i = 0; i < interaction.objectiveIds.length; i++) {
        results.push(this.driver.setValue(
          `${base}.objectives.${i}.id`,
          interaction.objectiveIds[i]!,
        ));
      }
    }

    const firstError = results.find(r => !r.ok);
    if (firstError && !firstError.ok) return err(firstError.error);
    return ok(true);
  }

  /**
   * Read back a recorded interaction by index.
   *
   * SCORM 2004 only. In SCORM 1.2 the `cmi.interactions.n.*` elements are write-only
   * per the spec, so this returns a ScormError (code 404) without touching the LMS.
   */
  getInteraction(index: number): Result<InteractionRecord, ScormError> {
    if (this.version === '1.2') {
      return err(new ScormError({
        version: '1.2',
        operation: 'getInteraction',
        path: `cmi.interactions.${index}`,
        code: 404,
        errorString: 'Element Is Write Only',
        diagnostic: 'SCORM 1.2 interactions are write-only and cannot be read back',
        apiFound: true,
        initialized: true,
      }));
    }

    const base = `cmi.interactions.${index}`;

    const idResult = this.driver.getValue(`${base}.id`);
    if (!idResult.ok) return err(idResult.error);

    const typeResult = this.driver.getValue(`${base}.type`);
    if (!typeResult.ok) return err(typeResult.error);

    const record: InteractionRecord = {
      id: idResult.value,
      type: (typeResult.value || 'other') as InteractionType,
    };

    const timestamp = this.driver.getValue(`${base}.timestamp`);
    if (timestamp.ok && timestamp.value !== '') record.timestamp = timestamp.value;

    const weighting = this.driver.getValue(`${base}.weighting`);
    if (weighting.ok && weighting.value !== '') record.weighting = parseFloat(weighting.value);

    const learnerResponse = this.driver.getValue(`${base}.learner_response`);
    if (learnerResponse.ok && learnerResponse.value !== '') record.learnerResponse = learnerResponse.value;

    const result = this.driver.getValue(`${base}.result`);
    if (result.ok && result.value !== '') record.result = result.value;

    const latency = this.driver.getValue(`${base}.latency`);
    if (latency.ok && latency.value !== '') record.latency = latency.value;

    const description = this.driver.getValue(`${base}.description`);
    if (description.ok && description.value !== '') record.description = description.value;

    const crCount = this.driver.getValue(`${base}.correct_responses._count`);
    if (crCount.ok && crCount.value !== '') {
      const count = parseInt(crCount.value, 10) || 0;
      const patterns: string[] = [];
      for (let i = 0; i < count; i++) {
        const pattern = this.driver.getValue(`${base}.correct_responses.${i}.pattern`);
        if (pattern.ok) patterns.push(pattern.value);
      }
      if (patterns.length > 0) record.correctResponses = patterns;
    }

    const objCount = this.driver.getValue(`${base}.objectives._count`);
    if (objCount.ok && objCount.value !== '') {
      const count = parseInt(objCount.value, 10) || 0;
      const ids: string[] = [];
      for (let i = 0; i < count; i++) {
        const objId = this.driver.getValue(`${base}.objectives.${i}.id`);
        if (objId.ok) ids.push(objId.value);
      }
      if (ids.length > 0) record.objectiveIds = ids;
    }

    return ok(record);
  }

  // --- Comments ---

  addLearnerComment(comment: string, location?: string, timestamp?: string): Result<true, ScormError> {
    if (this.version === '1.2') {
      // SCORM 1.2 comments are a single concatenated string, max 4096 chars per spec
      const existing = this.driver.getValue('cmi.comments');
      const current = existing.ok ? existing.value : '';
      const newComment = current ? `${current}\n${comment}` : comment;
      if (newComment.length > 4096) {
        return err(new ScormError({
          version: '1.2',
          operation: 'addLearnerComment',
          path: 'cmi.comments',
          code: 405,
          errorString: 'Incorrect Data Type',
          diagnostic: `cmi.comments exceeds maximum length of 4096 characters (got ${newComment.length})`,
          apiFound: true,
          initialized: true,
        }));
      }
      const result = this.driver.setValue('cmi.comments', newComment);
      if (!result.ok) return err(result.error);
      return ok(true);
    }

    // SCORM 2004: indexed comments_from_learner
    const countResult = this.driver.getValue('cmi.comments_from_learner._count');
    const count = countResult.ok ? (parseInt(countResult.value, 10) || 0) : 0;
    const base = `cmi.comments_from_learner.${count}`;
    const results: Result<string, ScormError>[] = [];

    results.push(this.driver.setValue(`${base}.comment`, comment));
    if (location) {
      results.push(this.driver.setValue(`${base}.location`, location));
    }
    if (timestamp) {
      results.push(this.driver.setValue(`${base}.timestamp`, timestamp));
    }

    const firstError = results.find(r => !r.ok);
    if (firstError && !firstError.ok) return err(firstError.error);
    return ok(true);
  }

  getLearnerCommentCount(): Result<number, ScormError> {
    if (this.version === '1.2') {
      // SCORM 1.2 doesn't have indexed learner comments
      return ok(0);
    }
    const result = this.driver.getValue('cmi.comments_from_learner._count');
    if (!result.ok) return err(result.error);
    return ok(parseInt(result.value, 10) || 0);
  }

  getLmsCommentCount(): Result<number, ScormError> {
    if (this.version === '1.2') {
      return ok(0);
    }
    const result = this.driver.getValue('cmi.comments_from_lms._count');
    if (!result.ok) return err(result.error);
    return ok(parseInt(result.value, 10) || 0);
  }

  /**
   * Read learner-authored comments, including their text.
   *
   * SCORM 1.2 stores learner comments as a single freeform string (`cmi.comments`);
   * it is returned as one entry (empty array if blank). SCORM 2004 returns each
   * indexed `comments_from_learner` entry with its location and timestamp.
   */
  getLearnerComments(): Result<CommentRecord[], ScormError> {
    if (this.version === '1.2') {
      const result = this.driver.getValue('cmi.comments');
      if (!result.ok) return err(result.error);
      return ok(result.value ? [{ comment: result.value }] : []);
    }
    return this.readIndexedComments('cmi.comments_from_learner');
  }

  /**
   * Read LMS-authored comments, including their text.
   *
   * SCORM 1.2 exposes a single read-only string (`cmi.comments_from_lms`); it is
   * returned as one entry (empty array if blank). SCORM 2004 returns each indexed
   * `comments_from_lms` entry with its location and timestamp.
   */
  getLmsComments(): Result<CommentRecord[], ScormError> {
    if (this.version === '1.2') {
      const result = this.driver.getValue('cmi.comments_from_lms');
      if (!result.ok) return err(result.error);
      return ok(result.value ? [{ comment: result.value }] : []);
    }
    return this.readIndexedComments('cmi.comments_from_lms');
  }

  /** Read an indexed SCORM 2004 comment collection (learner or LMS) into records. */
  private readIndexedComments(prefix: string): Result<CommentRecord[], ScormError> {
    const countResult = this.driver.getValue(`${prefix}._count`);
    if (!countResult.ok) return err(countResult.error);
    const count = parseInt(countResult.value, 10) || 0;

    const records: CommentRecord[] = [];
    for (let i = 0; i < count; i++) {
      const base = `${prefix}.${i}`;
      const commentResult = this.driver.getValue(`${base}.comment`);
      if (!commentResult.ok) return err(commentResult.error);

      const record: CommentRecord = { comment: commentResult.value };
      const location = this.driver.getValue(`${base}.location`);
      if (location.ok && location.value !== '') record.location = location.value;
      const timestamp = this.driver.getValue(`${base}.timestamp`);
      if (timestamp.ok && timestamp.value !== '') record.timestamp = timestamp.value;

      records.push(record);
    }
    return ok(records);
  }

  // --- Preferences ---

  getPreferences(): Result<Record<string, string>, ScormError> {
    const prefs: Record<string, string> = {};

    if (this.version === '1.2') {
      const keys = ['audio', 'language', 'speed', 'text'] as const;
      for (const key of keys) {
        const result = this.driver.getValue(`cmi.student_preference.${key}`);
        if (result.ok) prefs[key] = result.value;
      }
    } else {
      const keys = ['audio_level', 'language', 'delivery_speed', 'audio_captioning'] as const;
      for (const key of keys) {
        const result = this.driver.getValue(`cmi.learner_preference.${key}`);
        if (result.ok) prefs[key] = result.value;
      }
    }

    return ok(prefs);
  }

  setPreference(key: string, value: string): Result<string, ScormError> {
    const prefix = this.version === '1.2'
      ? 'cmi.student_preference'
      : 'cmi.learner_preference';
    return this.driver.setValue(`${prefix}.${key}`, value);
  }

  // --- Student data (1.2, read-only from LMS) ---

  getMasteryScore(): Result<string, ScormError> {
    if (this.version === '1.2') {
      return this.driver.getValue('cmi.student_data.mastery_score');
    }
    return this.driver.getValue('cmi.scaled_passing_score');
  }

  getMaxTimeAllowed(): Result<string, ScormError> {
    return this.driver.getValue(
      this.version === '1.2' ? 'cmi.student_data.max_time_allowed' : 'cmi.max_time_allowed',
    );
  }

  getTimeLimitAction(): Result<string, ScormError> {
    return this.driver.getValue(
      this.version === '1.2' ? 'cmi.student_data.time_limit_action' : 'cmi.time_limit_action',
    );
  }

  // --- ADL Navigation (2004 only) ---

  setNavRequest(request: string): Result<string, ScormError> {
    if (this.version === '1.2') {
      return ok('');
    }
    return this.driver.setValue('adl.nav.request', request);
  }

  getNavRequestValid(type: 'continue' | 'previous'): Result<string, ScormError> {
    if (this.version === '1.2') {
      return ok('');
    }
    return this.driver.getValue(`adl.nav.request_valid.${type}`);
  }

  // --- Raw escape hatch ---

  getRaw(path: string): Result<string, ScormError> {
    return this.driver.getValue(path);
  }

  setRaw(path: string, value: string): Result<string, ScormError> {
    return this.driver.setValue(path, value);
  }
}

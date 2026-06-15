import { describe, it, expect } from 'vitest';
import {
  scorm12ObjectivePath,
  scorm12InteractionPath,
  scorm12InteractionObjectivePath,
  scorm12InteractionCorrectResponsePath,
  scorm2004ObjectivePath,
  scorm2004InteractionPath,
  scorm2004InteractionObjectivePath,
  scorm2004InteractionCorrectResponsePath,
  scorm2004CommentFromLearnerPath,
  scorm2004CommentFromLmsPath,
} from '../../src/api/path-builders';

describe('SCORM 1.2 path builders', () => {
  it('builds objective path', () => {
    expect(scorm12ObjectivePath(0, 'id')).toBe('cmi.objectives.0.id');
    expect(scorm12ObjectivePath(3, 'score.raw')).toBe('cmi.objectives.3.score.raw');
    expect(scorm12ObjectivePath(1, 'status')).toBe('cmi.objectives.1.status');
  });

  it('builds interaction path', () => {
    expect(scorm12InteractionPath(0, 'id')).toBe('cmi.interactions.0.id');
    expect(scorm12InteractionPath(2, 'type')).toBe('cmi.interactions.2.type');
    expect(scorm12InteractionPath(1, 'student_response')).toBe('cmi.interactions.1.student_response');
  });

  it('builds interaction objective path', () => {
    expect(scorm12InteractionObjectivePath(0, 0)).toBe('cmi.interactions.0.objectives.0.id');
    expect(scorm12InteractionObjectivePath(2, 1)).toBe('cmi.interactions.2.objectives.1.id');
  });

  it('builds interaction correct response path', () => {
    expect(scorm12InteractionCorrectResponsePath(0, 0)).toBe('cmi.interactions.0.correct_responses.0.pattern');
    expect(scorm12InteractionCorrectResponsePath(1, 2)).toBe('cmi.interactions.1.correct_responses.2.pattern');
  });
});

describe('SCORM 2004 path builders', () => {
  it('builds objective path', () => {
    expect(scorm2004ObjectivePath(0, 'id')).toBe('cmi.objectives.0.id');
    expect(scorm2004ObjectivePath(1, 'score.scaled')).toBe('cmi.objectives.1.score.scaled');
    expect(scorm2004ObjectivePath(2, 'success_status')).toBe('cmi.objectives.2.success_status');
  });

  it('builds interaction path', () => {
    expect(scorm2004InteractionPath(0, 'id')).toBe('cmi.interactions.0.id');
    expect(scorm2004InteractionPath(1, 'learner_response')).toBe('cmi.interactions.1.learner_response');
    expect(scorm2004InteractionPath(0, 'description')).toBe('cmi.interactions.0.description');
  });

  it('builds interaction objective path', () => {
    expect(scorm2004InteractionObjectivePath(0, 0)).toBe('cmi.interactions.0.objectives.0.id');
  });

  it('builds interaction correct response path', () => {
    expect(scorm2004InteractionCorrectResponsePath(0, 0)).toBe('cmi.interactions.0.correct_responses.0.pattern');
  });

  it('builds comment from learner path', () => {
    expect(scorm2004CommentFromLearnerPath(0, 'comment')).toBe('cmi.comments_from_learner.0.comment');
    expect(scorm2004CommentFromLearnerPath(1, 'timestamp')).toBe('cmi.comments_from_learner.1.timestamp');
  });

  it('builds comment from LMS path', () => {
    expect(scorm2004CommentFromLmsPath(0, 'comment')).toBe('cmi.comments_from_lms.0.comment');
    expect(scorm2004CommentFromLmsPath(2, 'location')).toBe('cmi.comments_from_lms.2.location');
  });
});

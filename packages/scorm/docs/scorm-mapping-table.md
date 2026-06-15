# SCORM 1.2 vs 2004 Mapping Table

This table shows how the high-level API maps to SCORM 1.2 and SCORM 2004 CMI paths.

## Status Methods

| Method | SCORM 1.2 Path | SCORM 2004 Path |
|--------|----------------|-----------------|
| `setComplete()` | `cmi.core.lesson_status = "completed"` | `cmi.completion_status = "completed"` |
| `setIncomplete()` | `cmi.core.lesson_status = "incomplete"` | `cmi.completion_status = "incomplete"` |
| `setPassed()` | `cmi.core.lesson_status = "passed"` | `cmi.success_status = "passed"` |
| `setFailed()` | `cmi.core.lesson_status = "failed"` | `cmi.success_status = "failed"` |
| `getCompletionStatus()` | `cmi.core.lesson_status` | `cmi.completion_status` |
| `getSuccessStatus()` | `cmi.core.lesson_status` | `cmi.success_status` |

> **Note:** SCORM 1.2 uses a single `lesson_status` for both completion and success. SCORM 2004 separates them into `completion_status` and `success_status`.

## Learner Info

| Method | SCORM 1.2 Path | SCORM 2004 Path |
|--------|----------------|-----------------|
| `getLearnerId()` | `cmi.core.student_id` | `cmi.learner_id` |
| `getLearnerName()` | `cmi.core.student_name` | `cmi.learner_name` |

## Course Data

| Method | SCORM 1.2 Path | SCORM 2004 Path |
|--------|----------------|-----------------|
| `getLaunchData()` | `cmi.launch_data` | `cmi.launch_data` |
| `getMode()` | `cmi.core.lesson_mode` | `cmi.mode` |
| `getCredit()` | `cmi.core.credit` | `cmi.credit` |
| `getEntry()` | `cmi.core.entry` | `cmi.entry` |

## Location & Suspend Data

| Method | SCORM 1.2 Path | SCORM 2004 Path |
|--------|----------------|-----------------|
| `setLocation()` / `getLocation()` | `cmi.core.lesson_location` | `cmi.location` |
| `setSuspendData()` / `getSuspendData()` | `cmi.suspend_data` | `cmi.suspend_data` |

## Score

| Method | SCORM 1.2 Path | SCORM 2004 Path |
|--------|----------------|-----------------|
| `setScore({ raw })` | `cmi.core.score.raw` | `cmi.score.raw` |
| `setScore({ min })` | `cmi.core.score.min` | `cmi.score.min` |
| `setScore({ max })` | `cmi.core.score.max` | `cmi.score.max` |
| `setScore({ scaled })` | *(ignored)* | `cmi.score.scaled` |

> **Note:** `scaled` (-1.0 to 1.0) only exists in SCORM 2004. For SCORM 1.2, it is silently ignored.

> **Validation:** `raw`, `min`, and `max` must be finite numbers — NaN and Infinity are rejected with error code 405. `scaled` must be in the range `[-1, 1]` — out-of-range values are rejected with error code 407.

## Time

| Method | SCORM 1.2 | SCORM 2004 |
|--------|-----------|------------|
| `setSessionTime(ms)` | `cmi.core.session_time` (format: `HH:MM:SS.SS`) | `cmi.session_time` (format: `PT#H#M#S`) |
| `getTotalTime()` | `cmi.core.total_time` | `cmi.total_time` |

## Exit

| Method | SCORM 1.2 Path | SCORM 2004 Path |
|--------|----------------|-----------------|
| `setExit(value)` | `cmi.core.exit` | `cmi.exit` |

## Student Data

| Method | SCORM 1.2 Path | SCORM 2004 Path |
|--------|----------------|-----------------|
| `getMasteryScore()` | `cmi.student_data.mastery_score` | `cmi.scaled_passing_score` |
| `getMaxTimeAllowed()` | `cmi.student_data.max_time_allowed` | `cmi.max_time_allowed` |
| `getTimeLimitAction()` | `cmi.student_data.time_limit_action` | `cmi.time_limit_action` |

## Progress (2004 only)

| Method | SCORM 1.2 | SCORM 2004 Path |
|--------|-----------|-----------------|
| `setProgressMeasure(value)` | *(no-op, returns ok)* | `cmi.progress_measure` |

> **Validation:** `value` must be in the range `[0, 1]`. NaN and out-of-range values are rejected with error code 407.

## Preferences

| Method | SCORM 1.2 Prefix | SCORM 2004 Prefix |
|--------|-------------------|-------------------|
| `setPreference(key, value)` | `cmi.student_preference.{key}` | `cmi.learner_preference.{key}` |
| `getPreferences()` | Keys: `audio`, `language`, `speed`, `text` | Keys: `audio_level`, `language`, `delivery_speed`, `audio_captioning` |

## Objectives

Both versions use `cmi.objectives.{n}.*`. SCORM 2004 adds extra fields:

| Field | SCORM 1.2 | SCORM 2004 |
|-------|-----------|------------|
| `id` | Yes | Yes |
| `score.raw` | Yes | Yes |
| `score.min` | Yes | Yes |
| `score.max` | Yes | Yes |
| `score.scaled` | No | Yes |
| `status` | Yes | No (use `success_status` / `completion_status`) |
| `success_status` | No | Yes |
| `completion_status` | No | Yes |
| `progress_measure` | No | Yes |
| `description` | No | Yes |

## Interactions

Both versions use `cmi.interactions.{n}.*`. Key field differences:

| Field | SCORM 1.2 | SCORM 2004 |
|-------|-----------|------------|
| `id` | Yes | Yes |
| `type` | Yes | Yes |
| `time` / `timestamp` | `time` | `timestamp` |
| `student_response` / `learner_response` | `student_response` | `learner_response` |
| `result` | Yes | Yes |
| `weighting` | Yes | Yes |
| `latency` | Yes | Yes |
| `description` | No | Yes |
| `correct_responses.{m}.pattern` | Yes | Yes |
| `objectives.{m}.id` | Yes | Yes |

## Comments

| Feature | SCORM 1.2 | SCORM 2004 |
|---------|-----------|------------|
| Learner comments | `cmi.comments` (single string) | `cmi.comments_from_learner.{n}.comment/location/timestamp` |
| LMS comments | `cmi.comments_from_lms` (single string) | `cmi.comments_from_lms.{n}.comment/location/timestamp` |

## Navigation (2004 only)

| Method | SCORM 2004 Path |
|--------|-----------------|
| `setNavRequest(request)` | `adl.nav.request` |
| `getNavRequestValid('continue')` | `adl.nav.request_valid.continue` |
| `getNavRequestValid('previous')` | `adl.nav.request_valid.previous` |

/**
 * Format milliseconds as SCORM 1.2 session time: HHHH:MM:SS.SS
 *
 * Minutes are 0-59. Seconds are 0-59.99 with 2 decimal places. The SCORM 1.2
 * CMITimespan format caps hours at 4 digits (max `9999:99:99.99`); durations
 * beyond that are clamped to the maximum so the LMS does not reject the value.
 */
export function formatScorm12Time(milliseconds: number): string {
  if (milliseconds < 0) milliseconds = 0;

  const totalSeconds = milliseconds / 1000;
  const hours = Math.floor(totalSeconds / 3600);

  // CMITimespan hours field is at most 4 digits — clamp to the spec maximum.
  if (hours > 9999) return '9999:99:99.99';

  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = seconds.toFixed(2).padStart(5, '0');

  return `${hh}:${mm}:${ss}`;
}

/**
 * Format milliseconds as SCORM 2004 ISO 8601 duration: PT#H#M#S
 *
 * Examples: PT1H30M15S, PT0H2M30.5S, PT45S, PT0S
 * Always includes at least seconds to avoid empty "PT".
 */
export function formatScorm2004Time(milliseconds: number): string {
  if (milliseconds < 0) milliseconds = 0;

  const totalSeconds = milliseconds / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let duration = 'PT';
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;

  // Format seconds: use integer if whole number, 2 decimal places otherwise
  const secondsStr = seconds === Math.floor(seconds)
    ? String(seconds)
    : seconds.toFixed(2);
  duration += `${secondsStr}S`;

  return duration;
}

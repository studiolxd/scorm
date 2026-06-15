import { describe, it, expect } from 'vitest';
import { formatScorm12Time, formatScorm2004Time } from '../../src/api/time-format';

describe('formatScorm12Time', () => {
  it('formats 0 milliseconds', () => {
    expect(formatScorm12Time(0)).toBe('00:00:00.00');
  });

  it('formats 1 hour, 2 minutes, 3.46 seconds', () => {
    // 1h = 3600000, 2m = 120000, 3.46s = 3460
    expect(formatScorm12Time(3723460)).toBe('01:02:03.46');
  });

  it('formats exact minutes', () => {
    expect(formatScorm12Time(60000)).toBe('00:01:00.00');
  });

  it('formats 100+ hours', () => {
    expect(formatScorm12Time(360000000)).toBe('100:00:00.00');
  });

  it('formats fractional seconds', () => {
    expect(formatScorm12Time(1500)).toBe('00:00:01.50');
  });

  it('handles negative input as 0', () => {
    expect(formatScorm12Time(-1000)).toBe('00:00:00.00');
  });
});

describe('formatScorm2004Time', () => {
  it('formats 0 milliseconds', () => {
    expect(formatScorm2004Time(0)).toBe('PT0S');
  });

  it('formats 1 hour, 2 minutes, 3.46 seconds', () => {
    expect(formatScorm2004Time(3723460)).toBe('PT1H2M3.46S');
  });

  it('formats seconds only', () => {
    expect(formatScorm2004Time(45000)).toBe('PT45S');
  });

  it('formats exact hours', () => {
    expect(formatScorm2004Time(7200000)).toBe('PT2H0S');
  });

  it('formats minutes and seconds', () => {
    expect(formatScorm2004Time(150000)).toBe('PT2M30S');
  });

  it('handles negative input as 0', () => {
    expect(formatScorm2004Time(-1000)).toBe('PT0S');
  });

  it('formats fractional seconds with 2 decimals', () => {
    expect(formatScorm2004Time(1500)).toBe('PT1.50S');
  });
});

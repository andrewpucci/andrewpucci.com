import { describe, expect, it } from 'vite-plus/test';
import { formatMonthYear, toISODate } from './date';

describe('formatMonthYear', () => {
  it('formats a date string as "Month yyyy"', () => {
    expect(formatMonthYear('2022-03-01')).toBe('March 2022');
  });

  it('formats a Date instance the same way', () => {
    expect(formatMonthYear(new Date('2022-03-01T00:00:00.000Z'))).toBe('March 2022');
  });
});

describe('toISODate', () => {
  it('returns the yyyy-MM-dd portion of a date string', () => {
    expect(toISODate('2022-03-01')).toBe('2022-03-01');
  });
});

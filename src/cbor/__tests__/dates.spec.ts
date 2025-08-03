import {
  dateToDaysSinceEpoch,
  daysSinceEpochToDate,
  dateToRfc3339String,
  rfc3339StringToDate,
} from '../dates';

describe('CBOR Date Utilities', () => {
  describe('dateToDaysSinceEpoch', () => {
    test('epoch date (1970-01-01) returns 0', () => {
      const date = new Date(1970, 0, 1);
      expect(dateToDaysSinceEpoch(date)).toBe(0);
    });

    test('one day after epoch returns 1', () => {
      const date = new Date(1970, 0, 2);
      expect(dateToDaysSinceEpoch(date)).toBe(1);
    });

    test('one day before epoch returns -1', () => {
      const date = new Date(1969, 11, 31); // December 31, 1969
      expect(dateToDaysSinceEpoch(date)).toBe(-1);
    });

    test('examples from RFC 8943', () => {
      // October 9, 1940 should be -10676 days
      const johnLennonBirth = new Date(1940, 9, 9); // October 9, 1940
      expect(dateToDaysSinceEpoch(johnLennonBirth)).toBe(-10676);

      // December 8, 1980 should be 3994 days
      const johnLennonDeath = new Date(1980, 11, 8); // December 8, 1980
      expect(dateToDaysSinceEpoch(johnLennonDeath)).toBe(3994);
    });

    test('ignores time component', () => {
      const morning = new Date(1970, 0, 2, 8, 30, 0); // 8:30 AM
      const evening = new Date(1970, 0, 2, 20, 45, 30); // 8:45:30 PM
      expect(dateToDaysSinceEpoch(morning)).toBe(1);
      expect(dateToDaysSinceEpoch(evening)).toBe(1);
    });
  });

  describe('daysSinceEpochToDate', () => {
    test('0 days returns epoch date', () => {
      const result = daysSinceEpochToDate(0);
      expect(result.getFullYear()).toBe(1970);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(1);
    });

    test('positive days return future dates', () => {
      const result = daysSinceEpochToDate(1);
      expect(result.getFullYear()).toBe(1970);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(2);
    });

    test('negative days return past dates', () => {
      const result = daysSinceEpochToDate(-1);
      expect(result.getFullYear()).toBe(1969);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(31);
    });

    test('examples from RFC 8943', () => {
      // -10676 days should be October 9, 1940
      const johnLennonBirth = daysSinceEpochToDate(-10676);
      expect(johnLennonBirth.getFullYear()).toBe(1940);
      expect(johnLennonBirth.getMonth()).toBe(9); // October (0-indexed)
      expect(johnLennonBirth.getDate()).toBe(9);

      // 3994 days should be December 8, 1980
      const johnLennonDeath = daysSinceEpochToDate(3994);
      expect(johnLennonDeath.getFullYear()).toBe(1980);
      expect(johnLennonDeath.getMonth()).toBe(11); // December (0-indexed)
      expect(johnLennonDeath.getDate()).toBe(8);
    });
  });

  describe('dateToRfc3339String', () => {
    test('formats dates correctly', () => {
      const date = new Date(2023, 4, 15); // May 15, 2023
      expect(dateToRfc3339String(date)).toBe('2023-05-15');
    });

    test('pads single digit months and days', () => {
      const date = new Date(2023, 0, 5); // January 5, 2023
      expect(dateToRfc3339String(date)).toBe('2023-01-05');
    });

    test('examples from RFC 8943', () => {
      const johnLennonBirth = new Date(1940, 9, 9); // October 9, 1940
      expect(dateToRfc3339String(johnLennonBirth)).toBe('1940-10-09');

      const johnLennonDeath = new Date(1980, 11, 8); // December 8, 1980
      expect(dateToRfc3339String(johnLennonDeath)).toBe('1980-12-08');
    });

    test('handles leap years', () => {
      const leapDay = new Date(2020, 1, 29); // February 29, 2020
      expect(dateToRfc3339String(leapDay)).toBe('2020-02-29');
    });
  });

  describe('rfc3339StringToDate', () => {
    test('parses valid dates correctly', () => {
      const result = rfc3339StringToDate('2023-05-15');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(4); // May (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    test('examples from RFC 8943', () => {
      const johnLennonBirth = rfc3339StringToDate('1940-10-09');
      expect(johnLennonBirth.getFullYear()).toBe(1940);
      expect(johnLennonBirth.getMonth()).toBe(9); // October (0-indexed)
      expect(johnLennonBirth.getDate()).toBe(9);

      const johnLennonDeath = rfc3339StringToDate('1980-12-08');
      expect(johnLennonDeath.getFullYear()).toBe(1980);
      expect(johnLennonDeath.getMonth()).toBe(11); // December (0-indexed)
      expect(johnLennonDeath.getDate()).toBe(8);
    });

    test('throws error for invalid format', () => {
      expect(() => rfc3339StringToDate('2023/05/15')).toThrow('Invalid RFC 3339 date format');
      expect(() => rfc3339StringToDate('23-05-15')).toThrow('Invalid RFC 3339 date format');
      expect(() => rfc3339StringToDate('2023-5-15')).toThrow('Invalid RFC 3339 date format');
      expect(() => rfc3339StringToDate('not-a-date')).toThrow('Invalid RFC 3339 date format');
    });

    test('throws error for invalid dates', () => {
      expect(() => rfc3339StringToDate('2023-13-15')).toThrow('Invalid month in date');
      expect(() => rfc3339StringToDate('2023-02-30')).toThrow('Invalid date'); // February 30th doesn't exist
      expect(() => rfc3339StringToDate('2023-04-31')).toThrow('Invalid date'); // April 31st doesn't exist
    });

    test('handles leap years correctly', () => {
      const leapDay = rfc3339StringToDate('2020-02-29');
      expect(leapDay.getFullYear()).toBe(2020);
      expect(leapDay.getMonth()).toBe(1); // February (0-indexed)
      expect(leapDay.getDate()).toBe(29);

      // Non-leap year should throw
      expect(() => rfc3339StringToDate('2021-02-29')).toThrow('Invalid date');
    });
  });

  describe('round-trip conversion', () => {
    test('dateToDaysSinceEpoch -> daysSinceEpochToDate maintains date', () => {
      const originalDate = new Date(2023, 4, 15, 14, 30, 45); // May 15, 2023 with time
      const days = dateToDaysSinceEpoch(originalDate);
      const convertedDate = daysSinceEpochToDate(days);
      
      // Should maintain the date part but time should be midnight
      expect(convertedDate.getFullYear()).toBe(originalDate.getFullYear());
      expect(convertedDate.getMonth()).toBe(originalDate.getMonth());
      expect(convertedDate.getDate()).toBe(originalDate.getDate());
    });

    test('dateToRfc3339String -> rfc3339StringToDate maintains date', () => {
      const originalDate = new Date(2023, 4, 15, 14, 30, 45); // May 15, 2023 with time
      const dateString = dateToRfc3339String(originalDate);
      const convertedDate = rfc3339StringToDate(dateString);
      
      // Should maintain the date part
      expect(convertedDate.getFullYear()).toBe(originalDate.getFullYear());
      expect(convertedDate.getMonth()).toBe(originalDate.getMonth());
      expect(convertedDate.getDate()).toBe(originalDate.getDate());
    });
  });
});
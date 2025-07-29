import {CborEncoder} from '../CborEncoder';
import {CborDecoder} from '../CborDecoder';
import {JsonPackExtension} from '../../JsonPackExtension';
import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {Reader} from '@jsonjoy.com/util/lib/buffers/Reader';

describe('CBOR Date Tags (RFC 8943)', () => {
  let encoder: CborEncoder;
  let decoder: CborDecoder;

  beforeEach(() => {
    encoder = new CborEncoder(new Writer());
    decoder = new CborDecoder(new Reader());
  });

  describe('Date encoding', () => {
    test('encodes Date objects using tag 100 (days since epoch)', () => {
      const date = new Date(1970, 0, 1); // January 1, 1970 (epoch)
      const encoded = encoder.encode(date);
      
      // Manually verify the encoded structure
      // Tag 100 (0x64) should be encoded as 0xd8 0x64 followed by value 0
      expect(encoded[0]).toBe(0xd8); // Tag header for 1-byte tag
      expect(encoded[1]).toBe(0x64); // Tag 100
      expect(encoded[2]).toBe(0x00); // Value 0 (epoch date)
    });

    test('encodes date one day after epoch', () => {
      const date = new Date(1970, 0, 2); // January 2, 1970
      const encoded = encoder.encode(date);
      
      expect(encoded[0]).toBe(0xd8); // Tag header
      expect(encoded[1]).toBe(0x64); // Tag 100
      expect(encoded[2]).toBe(0x01); // Value 1
    });

    test('encodes date before epoch with negative value', () => {
      const date = new Date(1969, 11, 31); // December 31, 1969
      const encoded = encoder.encode(date);
      
      expect(encoded[0]).toBe(0xd8); // Tag header
      expect(encoded[1]).toBe(0x64); // Tag 100
      expect(encoded[2]).toBe(0x20); // Negative integer -1 (encoded as 0x20)
    });

    test('encodes RFC 8943 example dates correctly', () => {
      // October 9, 1940 should be -10676 days
      const johnLennonBirth = new Date(1940, 9, 9);
      const encoded1 = encoder.encode(johnLennonBirth);
      
      // December 8, 1980 should be 3994 days  
      const johnLennonDeath = new Date(1980, 11, 8);
      const encoded2 = encoder.encode(johnLennonDeath);

      // Both should use tag 100
      expect(encoded1[0]).toBe(0xd8); // Tag header
      expect(encoded1[1]).toBe(0x64); // Tag 100
      
      expect(encoded2[0]).toBe(0xd8); // Tag header
      expect(encoded2[1]).toBe(0x64); // Tag 100
    });

    test('throws error for invalid Date objects', () => {
      const invalidDate = new Date('invalid');
      expect(() => encoder.encode(invalidDate)).toThrow('Invalid Date object');
    });

    test('ignores time components when encoding', () => {
      const morning = new Date(1970, 0, 2, 8, 30, 0); // 8:30 AM
      const evening = new Date(1970, 0, 2, 20, 45, 30); // 8:45:30 PM
      
      const encoded1 = encoder.encode(morning);
      const encoded2 = encoder.encode(evening);
      
      // Both should encode to the same value (1 day after epoch)
      expect(encoded1).toEqual(encoded2);
      expect(encoded1[2]).toBe(0x01); // Value 1
    });
  });

  describe('Date decoding', () => {
    test('decodes tag 100 back to Date object', () => {
      const originalDate = new Date(1970, 0, 1); // Epoch
      const encoded = encoder.encode(originalDate);
      const decoded = decoder.decode(encoded);
      
      expect(decoded).toBeInstanceOf(Date);
      const decodedDate = decoded as Date;
      expect(decodedDate.getFullYear()).toBe(1970);
      expect(decodedDate.getMonth()).toBe(0); // January
      expect(decodedDate.getDate()).toBe(1);
    });

    test('decodes positive days correctly', () => {
      const originalDate = new Date(1970, 0, 10); // 9 days after epoch
      const encoded = encoder.encode(originalDate);
      const decoded = decoder.decode(encoded) as Date;
      
      expect(decoded.getFullYear()).toBe(1970);
      expect(decoded.getMonth()).toBe(0); // January
      expect(decoded.getDate()).toBe(10);
    });

    test('decodes negative days correctly', () => {
      const originalDate = new Date(1969, 11, 25); // Before epoch
      const encoded = encoder.encode(originalDate);
      const decoded = decoder.decode(encoded) as Date;
      
      expect(decoded.getFullYear()).toBe(1969);
      expect(decoded.getMonth()).toBe(11); // December
      expect(decoded.getDate()).toBe(25);
    });

    test('decodes RFC 8943 example dates correctly', () => {
      // Test John Lennon birth date
      const johnLennonBirth = new Date(1940, 9, 9);
      const encoded1 = encoder.encode(johnLennonBirth);
      const decoded1 = decoder.decode(encoded1) as Date;
      
      expect(decoded1.getFullYear()).toBe(1940);
      expect(decoded1.getMonth()).toBe(9); // October
      expect(decoded1.getDate()).toBe(9);

      // Test John Lennon death date
      const johnLennonDeath = new Date(1980, 11, 8);
      const encoded2 = encoder.encode(johnLennonDeath);
      const decoded2 = decoder.decode(encoded2) as Date;
      
      expect(decoded2.getFullYear()).toBe(1980);
      expect(decoded2.getMonth()).toBe(11); // December
      expect(decoded2.getDate()).toBe(8);
    });

    test('decodes tag 1004 (RFC 3339 string) back to Date object', () => {
      // Manually create a tag 1004 with RFC 3339 date string
      const dateExtension = new JsonPackExtension(1004, '1970-01-01');
      const encoded = encoder.encode(dateExtension);
      const decoded = decoder.decode(encoded);
      
      expect(decoded).toBeInstanceOf(Date);
      const decodedDate = decoded as Date;
      expect(decodedDate.getFullYear()).toBe(1970);
      expect(decodedDate.getMonth()).toBe(0); // January
      expect(decodedDate.getDate()).toBe(1);
    });

    test('decodes tag 1004 with RFC 8943 example dates', () => {
      // Test with "1940-10-09"
      const ext1 = new JsonPackExtension(1004, '1940-10-09');
      const encoded1 = encoder.encode(ext1);
      const decoded1 = decoder.decode(encoded1) as Date;
      
      expect(decoded1.getFullYear()).toBe(1940);
      expect(decoded1.getMonth()).toBe(9); // October
      expect(decoded1.getDate()).toBe(9);

      // Test with "1980-12-08"
      const ext2 = new JsonPackExtension(1004, '1980-12-08');
      const encoded2 = encoder.encode(ext2);
      const decoded2 = decoder.decode(encoded2) as Date;
      
      expect(decoded2.getFullYear()).toBe(1980);
      expect(decoded2.getMonth()).toBe(11); // December
      expect(decoded2.getDate()).toBe(8);
    });

    test('returns JsonPackExtension for invalid tag 100 values', () => {
      // Create tag 100 with non-numeric value
      const invalidExt = new JsonPackExtension(100, 'not-a-number');
      const encoded = encoder.encode(invalidExt);
      const decoded = decoder.decode(encoded);
      
      expect(decoded).toBeInstanceOf(JsonPackExtension);
      expect((decoded as JsonPackExtension).tag).toBe(100);
      expect((decoded as JsonPackExtension).val).toBe('not-a-number');
    });

    test('returns JsonPackExtension for invalid tag 1004 values', () => {
      // Create tag 1004 with invalid date string
      const invalidExt = new JsonPackExtension(1004, 'invalid-date');
      const encoded = encoder.encode(invalidExt);
      const decoded = decoder.decode(encoded);
      
      expect(decoded).toBeInstanceOf(JsonPackExtension);
      expect((decoded as JsonPackExtension).tag).toBe(1004);
      expect((decoded as JsonPackExtension).val).toBe('invalid-date');
    });

    test('returns JsonPackExtension for unknown tags', () => {
      // Test with a different tag number
      const unknownExt = new JsonPackExtension(999, 'some-value');
      const encoded = encoder.encode(unknownExt);
      const decoded = decoder.decode(encoded);
      
      expect(decoded).toBeInstanceOf(JsonPackExtension);
      expect((decoded as JsonPackExtension).tag).toBe(999);
      expect((decoded as JsonPackExtension).val).toBe('some-value');
    });
  });

  describe('Round-trip conversion', () => {
    test('maintains date accuracy through encode-decode cycle', () => {
      const testDates = [
        new Date(1970, 0, 1),    // Epoch
        new Date(2023, 4, 15),   // Modern date
        new Date(1940, 9, 9),    // Historical date
        new Date(1969, 11, 31),  // Before epoch
        new Date(2000, 1, 29),   // Leap year
      ];

      testDates.forEach(originalDate => {
        const encoded = encoder.encode(originalDate);
        const decoded = decoder.decode(encoded) as Date;
        
        expect(decoded).toBeInstanceOf(Date);
        expect(decoded.getFullYear()).toBe(originalDate.getFullYear());
        expect(decoded.getMonth()).toBe(originalDate.getMonth());
        expect(decoded.getDate()).toBe(originalDate.getDate());
      });
    });

    test('handles dates in nested structures', () => {
      const data = {
        event: 'Birthday',
        date: new Date(1940, 9, 9),
        participants: ['John', 'Paul'],
        metadata: {
          recorded: new Date(2023, 4, 15)
        }
      };

      const encoded = encoder.encode(data);
      const decoded = decoder.decode(encoded) as any;

      expect(decoded.event).toBe('Birthday');
      expect(decoded.date).toBeInstanceOf(Date);
      expect((decoded.date as Date).getFullYear()).toBe(1940);
      expect(decoded.participants).toEqual(['John', 'Paul']);
      expect(decoded.metadata.recorded).toBeInstanceOf(Date);
      expect((decoded.metadata.recorded as Date).getFullYear()).toBe(2023);
    });

    test('handles arrays of dates', () => {
      const dates = [
        new Date(1970, 0, 1),
        new Date(1980, 11, 8),
        new Date(2023, 4, 15)
      ];

      const encoded = encoder.encode(dates);
      const decoded = decoder.decode(encoded) as Date[];

      expect(Array.isArray(decoded)).toBe(true);
      expect(decoded.length).toBe(3);
      decoded.forEach((date, index) => {
        expect(date).toBeInstanceOf(Date);
        expect(date.getFullYear()).toBe(dates[index].getFullYear());
        expect(date.getMonth()).toBe(dates[index].getMonth());
        expect(date.getDate()).toBe(dates[index].getDate());
      });
    });
  });

  describe('Edge cases', () => {
    test('handles very old dates', () => {
      const ancientDate = new Date(100, 0, 1); // Year 100
      const encoded = encoder.encode(ancientDate);
      const decoded = decoder.decode(encoded) as Date;
      
      expect(decoded).toBeInstanceOf(Date);
      expect(decoded.getFullYear()).toBe(100);
    });

    test('handles future dates', () => {
      const futureDate = new Date(3000, 11, 31); // Year 3000
      const encoded = encoder.encode(futureDate);
      const decoded = decoder.decode(encoded) as Date;
      
      expect(decoded).toBeInstanceOf(Date);
      expect(decoded.getFullYear()).toBe(3000);
    });

    test('handles leap year edge cases', () => {
      // Leap day in a leap year
      const leapDay = new Date(2020, 1, 29); // February 29, 2020
      const encoded = encoder.encode(leapDay);
      const decoded = decoder.decode(encoded) as Date;
      
      expect(decoded).toBeInstanceOf(Date);
      expect(decoded.getFullYear()).toBe(2020);
      expect(decoded.getMonth()).toBe(1); // February
      expect(decoded.getDate()).toBe(29);
    });
  });
});
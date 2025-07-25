import {EjsonEncoder, EjsonDecoder} from '../index';
import {
  BsonBinary,
  BsonInt32,
  BsonInt64,
  BsonFloat,
  BsonObjectId,
  BsonJavascriptCode,
  BsonTimestamp,
} from '../../bson/values';

describe('EJSON v2 Codec Integration', () => {
  describe('Round-trip encoding and decoding', () => {
    const canonicalEncoder = new EjsonEncoder({canonical: true});
    const relaxedEncoder = new EjsonEncoder({canonical: false});
    const decoder = new EjsonDecoder();

    test('round-trip with primitive values', () => {
      const values = [null, true, false, 'hello', undefined];
      
      for (const value of values) {
        const canonicalJson = canonicalEncoder.encode(value);
        const relaxedJson = relaxedEncoder.encode(value);
        
        expect(decoder.decode(canonicalJson)).toEqual(value);
        expect(decoder.decode(relaxedJson)).toEqual(value);
      }

      // Numbers are handled specially
      const numberValue = 42;
      const canonicalJson = canonicalEncoder.encode(numberValue);
      const relaxedJson = relaxedEncoder.encode(numberValue);
      
      // Canonical format creates BsonInt32
      const canonicalResult = decoder.decode(canonicalJson) as BsonInt32;
      expect(canonicalResult).toBeInstanceOf(BsonInt32);
      expect(canonicalResult.value).toBe(42);
      
      // Relaxed format stays as number
      expect(decoder.decode(relaxedJson)).toBe(42);
    });

    test('round-trip with arrays', () => {
      const array = [1, 'hello', true, null, {nested: 42}];
      
      const canonicalJson = canonicalEncoder.encode(array);
      const relaxedJson = relaxedEncoder.encode(array);
      
      // For canonical, numbers become BsonInt32
      const canonicalResult = decoder.decode(canonicalJson) as unknown[];
      expect(canonicalResult[0]).toBeInstanceOf(BsonInt32);
      expect((canonicalResult[0] as BsonInt32).value).toBe(1);
      expect(canonicalResult[1]).toBe('hello');
      expect(canonicalResult[2]).toBe(true);
      expect(canonicalResult[3]).toBe(null);
      
      const nestedObj = canonicalResult[4] as Record<string, unknown>;
      expect(nestedObj.nested).toBeInstanceOf(BsonInt32);
      expect((nestedObj.nested as BsonInt32).value).toBe(42);
      
      // For relaxed, numbers stay as native JSON numbers
      const relaxedResult = decoder.decode(relaxedJson);
      expect(relaxedResult).toEqual(array);
    });

    test('round-trip with BSON types', () => {
      const objectId = new BsonObjectId(0x507f1f77, 0xbcf86cd799, 0x439011);
      const int32 = new BsonInt32(42);
      const int64 = new BsonInt64(1234567890123);
      const float = new BsonFloat(3.14159);
      const binary = new BsonBinary(0, new Uint8Array([1, 2, 3, 4]));
      const code = new BsonJavascriptCode('function() { return 42; }');
      const timestamp = new BsonTimestamp(12345, 1234567890);
      
      const values = [objectId, int32, int64, float, binary, code, timestamp];
      
      for (const value of values) {
        const canonicalJson = canonicalEncoder.encode(value);
        const relaxedJson = relaxedEncoder.encode(value);
        
        const canonicalResult = decoder.decode(canonicalJson);
        
        // Both should decode to equivalent objects for BSON types
        expect(canonicalResult).toEqual(value);
        
        // For relaxed mode, numbers may decode differently
        if (value instanceof BsonInt32 || value instanceof BsonInt64 || value instanceof BsonFloat) {
          // These are encoded as native JSON numbers in relaxed mode
          // When decoded from native JSON, they stay as native numbers
          const relaxedResult = decoder.decode(relaxedJson);
          expect(typeof relaxedResult === 'number').toBe(true);
          expect(relaxedResult).toBe(value.value);
        } else {
          const relaxedResult = decoder.decode(relaxedJson);
          expect(relaxedResult).toEqual(value);
        }
      }
    });

    test('round-trip with complex nested objects', () => {
      const complexObj = {
        metadata: {
          id: new BsonObjectId(0x507f1f77, 0xbcf86cd799, 0x439011),
          created: new Date('2023-01-01T00:00:00.000Z'),
          version: 1
        },
        data: {
          values: [1, 2, 3],
          settings: {
            enabled: true,
            threshold: 3.14
          }
        },
        binary: new BsonBinary(0, new Uint8Array([0xff, 0xee, 0xdd])),
        code: new BsonJavascriptCode('function validate() { return true; }')
      };
      
      const canonicalJson = canonicalEncoder.encode(complexObj);
      const relaxedJson = relaxedEncoder.encode(complexObj);
      
      const canonicalResult = decoder.decode(canonicalJson) as Record<string, unknown>;
      const relaxedResult = decoder.decode(relaxedJson) as Record<string, unknown>;
      
      // Check ObjectId
      expect((canonicalResult.metadata as any).id).toBeInstanceOf(BsonObjectId);
      expect((relaxedResult.metadata as any).id).toBeInstanceOf(BsonObjectId);
      
      // Check Date
      expect((canonicalResult.metadata as any).created).toBeInstanceOf(Date);
      expect((relaxedResult.metadata as any).created).toBeInstanceOf(Date);
      
      // Check numbers (canonical vs relaxed difference)
      expect((canonicalResult.metadata as any).version).toBeInstanceOf(BsonInt32);
      expect(typeof (relaxedResult.metadata as any).version).toBe('number');
      
      // Check Binary
      expect(canonicalResult.binary).toBeInstanceOf(BsonBinary);
      expect(relaxedResult.binary).toBeInstanceOf(BsonBinary);
      
      // Check Code
      expect(canonicalResult.code).toBeInstanceOf(BsonJavascriptCode);
      expect(relaxedResult.code).toBeInstanceOf(BsonJavascriptCode);
    });

    test('handles special numeric values', () => {
      const values = [Infinity, -Infinity, NaN];
      
      for (const value of values) {
        const canonicalJson = canonicalEncoder.encode(value);
        const relaxedJson = relaxedEncoder.encode(value);
        
        const canonicalResult = decoder.decode(canonicalJson) as BsonFloat;
        const relaxedResult = decoder.decode(relaxedJson) as BsonFloat;
        
        expect(canonicalResult).toBeInstanceOf(BsonFloat);
        expect(relaxedResult).toBeInstanceOf(BsonFloat);
        
        if (isNaN(value)) {
          expect(isNaN(canonicalResult.value)).toBe(true);
          expect(isNaN(relaxedResult.value)).toBe(true);
        } else {
          expect(canonicalResult.value).toBe(value);
          expect(relaxedResult.value).toBe(value);
        }
      }
    });

    test('handles regular expressions', () => {
      const regex = /test.*pattern/gim;
      
      const canonicalJson = canonicalEncoder.encode(regex);
      const relaxedJson = relaxedEncoder.encode(regex);
      
      const canonicalResult = decoder.decode(canonicalJson) as RegExp;
      const relaxedResult = decoder.decode(relaxedJson) as RegExp;
      
      expect(canonicalResult).toBeInstanceOf(RegExp);
      expect(relaxedResult).toBeInstanceOf(RegExp);
      expect(canonicalResult.source).toBe(regex.source);
      expect(relaxedResult.source).toBe(regex.source);
      expect(canonicalResult.flags).toBe(regex.flags);
      expect(relaxedResult.flags).toBe(regex.flags);
    });

    test('handles dates with different year ranges', () => {
      const dates = [
        new Date('1969-12-31T23:59:59.999Z'), // Before 1970
        new Date('1970-01-01T00:00:00.000Z'), // Start of range
        new Date('2023-06-15T12:30:45.123Z'), // Normal date
        new Date('9999-12-31T23:59:59.999Z'), // End of range
        new Date('3000-01-01T00:00:00.000Z'), // Future date (valid in JS)
      ];
      
      for (const date of dates) {
        // Skip invalid dates
        if (isNaN(date.getTime())) continue;
        
        const canonicalJson = canonicalEncoder.encode(date);
        const relaxedJson = relaxedEncoder.encode(date);
        
        const canonicalResult = decoder.decode(canonicalJson) as Date;
        const relaxedResult = decoder.decode(relaxedJson) as Date;
        
        expect(canonicalResult).toBeInstanceOf(Date);
        expect(relaxedResult).toBeInstanceOf(Date);
        expect(canonicalResult.getTime()).toBe(date.getTime());
        expect(relaxedResult.getTime()).toBe(date.getTime());
      }
    });
  });

  describe('Error handling', () => {
    const decoder = new EjsonDecoder();

    test('throws on malformed JSON', () => {
      expect(() => decoder.decode('{')).toThrow();
      expect(() => decoder.decode('invalid json')).toThrow();
    });

    test('throws on invalid type wrapper formats', () => {
      expect(() => decoder.decode('{"$oid": 123}')).toThrow();
      expect(() => decoder.decode('{"$numberInt": "invalid"}')).toThrow();
      expect(() => decoder.decode('{"$binary": "not an object"}')).toThrow();
    });

    test('throws on incomplete type wrappers', () => {
      expect(() => decoder.decode('{"$binary": {"base64": "data"}}')).toThrow(); // missing subType
      expect(() => decoder.decode('{"$timestamp": {"t": 123}}')).toThrow(); // missing i
    });

    test('throws on type wrappers with extra fields', () => {
      expect(() => decoder.decode('{"$oid": "507f1f77bcf86cd799439011", "extra": "field"}')).toThrow();
      expect(() => decoder.decode('{"$numberInt": "42", "invalid": true}')).toThrow();
    });
  });
});
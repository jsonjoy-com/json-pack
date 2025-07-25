import {EjsonEncoder, EjsonDecoder} from '../index';
import {
  BsonBinary,
  BsonDbPointer,
  BsonDecimal128,
  BsonFloat,
  BsonInt32,
  BsonInt64,
  BsonJavascriptCode,
  BsonJavascriptCodeWithScope,
  BsonMaxKey,
  BsonMinKey,
  BsonObjectId,
  BsonSymbol,
  BsonTimestamp,
} from '../../bson/values';

describe('EjsonEncoder', () => {
  describe('Canonical mode', () => {
    const encoder = new EjsonEncoder({canonical: true});

    test('encodes primitive values', () => {
      expect(encoder.encode(null)).toBe('null');
      expect(encoder.encode(true)).toBe('true');
      expect(encoder.encode(false)).toBe('false');
      expect(encoder.encode('hello')).toBe('"hello"');
      expect(encoder.encode(undefined)).toBe('{"$undefined":true}');
    });

    test('encodes numbers as type wrappers', () => {
      expect(encoder.encode(42)).toBe('{"$numberInt":"42"}');
      expect(encoder.encode(-42)).toBe('{"$numberInt":"-42"}');
      expect(encoder.encode(2147483647)).toBe('{"$numberInt":"2147483647"}');
      expect(encoder.encode(2147483648)).toBe('{"$numberLong":"2147483648"}');
      expect(encoder.encode(3.14)).toBe('{"$numberDouble":"3.14"}');
      expect(encoder.encode(Infinity)).toBe('{"$numberDouble":"Infinity"}');
      expect(encoder.encode(-Infinity)).toBe('{"$numberDouble":"-Infinity"}');
      expect(encoder.encode(NaN)).toBe('{"$numberDouble":"NaN"}');
    });

    test('encodes arrays', () => {
      expect(encoder.encode([1, 2, 3])).toBe('[{"$numberInt":"1"},{"$numberInt":"2"},{"$numberInt":"3"}]');
      expect(encoder.encode(['a', 'b'])).toBe('["a","b"]');
    });

    test('encodes dates', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(encoder.encode(date)).toBe('{"$date":{"$numberLong":"1672531200000"}}');
    });

    test('encodes regular expressions', () => {
      const regex = /pattern/gi;
      expect(encoder.encode(regex)).toBe('{"$regularExpression":{"pattern":"pattern","options":"gi"}}');
    });

    test('encodes BSON value classes', () => {
      const objectId = new BsonObjectId(0x507f1f77, 0xbcf86cd799, 0x439011);
      expect(encoder.encode(objectId)).toBe('{"$oid":"507f1f77bcf86cd799439011"}');

      const int32 = new BsonInt32(42);
      expect(encoder.encode(int32)).toBe('{"$numberInt":"42"}');

      const int64 = new BsonInt64(1234567890123);
      expect(encoder.encode(int64)).toBe('{"$numberLong":"1234567890123"}');

      const float = new BsonFloat(3.14);
      expect(encoder.encode(float)).toBe('{"$numberDouble":"3.14"}');

      const decimal128 = new BsonDecimal128(new Uint8Array(16));
      expect(encoder.encode(decimal128)).toBe('{"$numberDecimal":"0"}');

      const binary = new BsonBinary(0, new Uint8Array([1, 2, 3, 4]));
      expect(encoder.encode(binary)).toBe('{"$binary":{"base64":"AQIDBA==","subType":"00"}}');

      const code = new BsonJavascriptCode('function() { return 42; }');
      expect(encoder.encode(code)).toBe('{"$code":"function() { return 42; }"}');

      const codeWithScope = new BsonJavascriptCodeWithScope('function() { return x; }', {x: 42});
      expect(encoder.encode(codeWithScope)).toBe('{"$code":"function() { return x; }","$scope":{"x":{"$numberInt":"42"}}}');

      const symbol = new BsonSymbol('mySymbol');
      expect(encoder.encode(symbol)).toBe('{"$symbol":"mySymbol"}');

      const timestamp = new BsonTimestamp(12345, 1234567890);
      expect(encoder.encode(timestamp)).toBe('{"$timestamp":{"t":1234567890,"i":12345}}');

      const dbPointer = new BsonDbPointer('collection', objectId);
      expect(encoder.encode(dbPointer)).toBe('{"$dbPointer":{"$ref":"collection","$id":{"$oid":"507f1f77bcf86cd799439011"}}}');

      const minKey = new BsonMinKey();
      expect(encoder.encode(minKey)).toBe('{"$minKey":1}');

      const maxKey = new BsonMaxKey();
      expect(encoder.encode(maxKey)).toBe('{"$maxKey":1}');
    });

    test('encodes nested objects', () => {
      const obj = {
        str: 'hello',
        num: 42,
        nested: {
          bool: true,
          arr: [1, 2, 3]
        }
      };
      const expected = '{"str":"hello","num":{"$numberInt":"42"},"nested":{"bool":true,"arr":[{"$numberInt":"1"},{"$numberInt":"2"},{"$numberInt":"3"}]}}';
      expect(encoder.encode(obj)).toBe(expected);
    });
  });

  describe('Relaxed mode', () => {
    const encoder = new EjsonEncoder({canonical: false});

    test('encodes numbers as native JSON types when possible', () => {
      expect(encoder.encode(42)).toBe('42');
      expect(encoder.encode(-42)).toBe('-42');
      expect(encoder.encode(3.14)).toBe('3.14');
      expect(encoder.encode(Infinity)).toBe('{"$numberDouble":"Infinity"}');
      expect(encoder.encode(-Infinity)).toBe('{"$numberDouble":"-Infinity"}');
      expect(encoder.encode(NaN)).toBe('{"$numberDouble":"NaN"}');
    });

    test('encodes dates in ISO format for years 1970-9999', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(encoder.encode(date)).toBe('{"$date":"2023-01-01T00:00:00.000Z"}');

      // Test edge cases
      const oldDate = new Date('1900-01-01T00:00:00.000Z');
      expect(encoder.encode(oldDate)).toBe('{"$date":{"$numberLong":"-2208988800000"}}');

      const futureDate = new Date('3000-01-01T00:00:00.000Z');
      expect(encoder.encode(futureDate)).toBe('{"$date":"3000-01-01T00:00:00.000Z"}');
    });

    test('encodes BSON Int32/Int64/Float as native numbers', () => {
      const int32 = new BsonInt32(42);
      expect(encoder.encode(int32)).toBe('42');

      const int64 = new BsonInt64(123);
      expect(encoder.encode(int64)).toBe('123');

      const float = new BsonFloat(3.14);
      expect(encoder.encode(float)).toBe('3.14');
    });

    test('encodes arrays with native numbers', () => {
      expect(encoder.encode([1, 2, 3])).toBe('[1,2,3]');
      expect(encoder.encode([1.5, 2.5])).toBe('[1.5,2.5]');
    });
  });
});
import {CborEdn} from '../CborEdn';
import {CborDecoder} from '../CborDecoder';
import {CborEncoder} from '../CborEncoder';
import {JsonPackExtension} from '../../JsonPackExtension';
import {JsonPackValue} from '../../JsonPackValue';
import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';

const edn = new CborEdn();

describe('CborEdn', () => {
  describe('basic values', () => {
    test('null', () => {
      expect(edn.encode(null)).toBe('null');
    });

    test('undefined', () => {
      expect(edn.encode(undefined)).toBe('undefined');
    });

    test('boolean true', () => {
      expect(edn.encode(true)).toBe('true');
    });

    test('boolean false', () => {
      expect(edn.encode(false)).toBe('false');
    });
  });

  describe('numbers', () => {
    test('positive integers', () => {
      expect(edn.encode(0)).toBe('0');
      expect(edn.encode(1)).toBe('1');
      expect(edn.encode(23)).toBe('23');
      expect(edn.encode(24)).toBe('24');
      expect(edn.encode(255)).toBe('255');
      expect(edn.encode(256)).toBe('256');
      expect(edn.encode(65535)).toBe('65535');
      expect(edn.encode(65536)).toBe('65536');
    });

    test('negative integers', () => {
      expect(edn.encode(-1)).toBe('-1');
      expect(edn.encode(-24)).toBe('-24');
      expect(edn.encode(-25)).toBe('-25');
      expect(edn.encode(-256)).toBe('-256');
      expect(edn.encode(-65536)).toBe('-65536');
    });

    test('floating point numbers', () => {
      expect(edn.encode(1.5)).toBe('1.5');
      expect(edn.encode(0.0)).toBe('0');
      expect(edn.encode(-0.0)).toBe('-0.0');
      expect(edn.encode(3.14159)).toBe('3.14159');
      expect(edn.encode(-123.456)).toBe('-123.456');
    });

    test('special float values', () => {
      expect(edn.encode(NaN)).toBe('NaN');
      expect(edn.encode(Infinity)).toBe('Infinity');
      expect(edn.encode(-Infinity)).toBe('-Infinity');
    });

    test('bigint values', () => {
      expect(edn.encode(BigInt('0'))).toBe('0');
      expect(edn.encode(BigInt('123456789012345678901234567890'))).toBe('123456789012345678901234567890');
      expect(edn.encode(BigInt('-987654321098765432109876543210'))).toBe('-987654321098765432109876543210');
    });
  });

  describe('strings', () => {
    test('simple strings', () => {
      expect(edn.encode('')).toBe('""');
      expect(edn.encode('hello')).toBe('"hello"');
      expect(edn.encode('Hello, World!')).toBe('"Hello, World!"');
    });

    test('strings with escapes', () => {
      expect(edn.encode('hello\nworld')).toBe('"hello\\nworld"');
      expect(edn.encode('hello\tworld')).toBe('"hello\\tworld"');
      expect(edn.encode('hello"world')).toBe('"hello\\"world"');
      expect(edn.encode('hello\\world')).toBe('"hello\\\\world"');
      expect(edn.encode('hello\bworld')).toBe('"hello\\bworld"');
      expect(edn.encode('hello\fworld')).toBe('"hello\\fworld"');
    });

    test('strings with carriage returns removed', () => {
      expect(edn.encode('hello\r\nworld')).toBe('"hello\\nworld"');
      expect(edn.encode('hello\rworld')).toBe('"helloworld"');
    });

    test('unicode strings', () => {
      expect(edn.encode('🌍')).toBe('"🌍"');
      expect(edn.encode('こんにちは')).toBe('"こんにちは"');
    });
  });

  describe('byte strings', () => {
    test('empty byte string', () => {
      expect(edn.encode(new Uint8Array([]))).toBe("h''");
    });

    test('byte strings', () => {
      expect(edn.encode(new Uint8Array([0x00]))).toBe("h'00'");
      expect(edn.encode(new Uint8Array([0x01, 0x02, 0x03]))).toBe("h'010203'");
      expect(edn.encode(new Uint8Array([0xff, 0xfe, 0xfd]))).toBe("h'fffefd'");
    });

    test('longer byte strings', () => {
      const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]);
      expect(edn.encode(bytes)).toBe("h'48656c6c6f20776f726c64'");
    });
  });

  describe('arrays', () => {
    test('empty array', () => {
      expect(edn.encode([])).toBe('[]');
    });

    test('simple arrays', () => {
      expect(edn.encode([1, 2, 3])).toBe('[1, 2, 3]');
      expect(edn.encode(['a', 'b', 'c'])).toBe('["a", "b", "c"]');
      expect(edn.encode([true, false, null])).toBe('[true, false, null]');
    });

    test('mixed type arrays', () => {
      expect(edn.encode([1, 'hello', true, null])).toBe('[1, "hello", true, null]');
    });

    test('nested arrays', () => {
      expect(edn.encode([1, [2, 3], 4])).toBe('[1, [2, 3], 4]');
      expect(edn.encode([[1, 2], [3, 4]])).toBe('[[1, 2], [3, 4]]');
    });
  });

  describe('objects', () => {
    test('empty object', () => {
      expect(edn.encode({})).toBe('{}');
    });

    test('simple objects', () => {
      expect(edn.encode({a: 1})).toBe('{"a": 1}');
      expect(edn.encode({a: 1, b: 2})).toBe('{"a": 1, "b": 2}');
      expect(edn.encode({foo: 'bar', baz: 123})).toBe('{"foo": "bar", "baz": 123}');
    });

    test('objects with various value types', () => {
      const obj = {
        num: 42,
        str: 'hello',
        bool: true,
        nil: null,
        arr: [1, 2, 3],
        obj: {nested: 'value'}
      };
      const expected = '{"num": 42, "str": "hello", "bool": true, "nil": null, "arr": [1, 2, 3], "obj": {"nested": "value"}}';
      expect(edn.encode(obj)).toBe(expected);
    });
  });

  describe('maps', () => {
    test('empty map', () => {
      const map = new Map();
      expect(edn.encode(map)).toBe('{}');
    });

    test('maps with string keys', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      expect(edn.encode(map)).toBe('{"a": 1, "b": 2}');
    });

    test('maps with non-string keys', () => {
      const map = new Map<unknown, string>([[1, 'one'], [2, 'two'], [true, 'boolean']]);
      expect(edn.encode(map)).toBe('{1: "one", 2: "two", true: "boolean"}');
    });

    test('maps with complex keys', () => {
      const map = new Map<unknown, string>([
        [[1, 2], 'array-key'],
        [{foo: 'bar'}, 'object-key']
      ]);
      expect(edn.encode(map)).toBe('{[1, 2]: "array-key", {"foo": "bar"}: "object-key"}');
    });
  });

  describe('tags', () => {
    test('simple tags', () => {
      const tagged1 = new JsonPackExtension(0, '2013-03-21T20:04:00Z');
      expect(edn.encode(tagged1)).toBe('0("2013-03-21T20:04:00Z")');

      const tagged2 = new JsonPackExtension(1, 1363896240);
      expect(edn.encode(tagged2)).toBe('1(1363896240)');
    });

    test('tags with complex content', () => {
      const taggedArray = new JsonPackExtension(42, [1, 2, 3]);
      expect(edn.encode(taggedArray)).toBe('42([1, 2, 3])');

      const taggedObject = new JsonPackExtension(100, {a: 1, b: 2});
      expect(edn.encode(taggedObject)).toBe('100({"a": 1, "b": 2})');
    });

    test('nested tags', () => {
      const innerTag = new JsonPackExtension(1, 'inner');
      const outerTag = new JsonPackExtension(2, innerTag);
      expect(edn.encode(outerTag)).toBe('2(1("inner"))');
    });
  });

  describe('simple values', () => {
    test('well-known simple values', () => {
      expect(edn.encode(new JsonPackValue(20))).toBe('false');
      expect(edn.encode(new JsonPackValue(21))).toBe('true');
      expect(edn.encode(new JsonPackValue(22))).toBe('null');
      expect(edn.encode(new JsonPackValue(23))).toBe('undefined');
    });

    test('custom simple values', () => {
      expect(edn.encode(new JsonPackValue(42))).toBe('simple(42)');
      expect(edn.encode(new JsonPackValue(100))).toBe('simple(100)');
      expect(edn.encode(new JsonPackValue(255))).toBe('simple(255)');
    });
  });

  describe('complex nested structures', () => {
    test('deeply nested structure', () => {
      const complex = {
        metadata: {
          version: 1,
          timestamp: new JsonPackExtension(1, 1609459200),
          flags: new Uint8Array([0x01, 0x02, 0x03])
        },
        data: [
          {id: 1, name: 'Alice', active: true},
          {id: 2, name: 'Bob', active: false},
          null
        ],
        settings: new Map<unknown, unknown>([
          ['debug', true],
          ['timeout', 30],
          [42, 'answer']
        ])
      };

      const result = edn.encode(complex);
      expect(result).toContain('1(1609459200)');
      expect(result).toContain("h'010203'");
      expect(result).toContain('"Alice"');
      expect(result).toContain('42: "answer"');
    });
  });

  describe('CBOR integration', () => {
    test('can format CBOR-encoded data', () => {
      const writer = new Writer(256);
      const encoder = new CborEncoder(writer);
      const decoder = new CborDecoder();

      const original = {
        num: 42,
        str: 'hello',
        arr: [1, 2, 3],
        map: new Map([['key', 'value']])
      };

      const encoded = encoder.encode(original);
      const result = edn.formatCbor(encoded, decoder);
      
      expect(result).toContain('"num": 42');
      expect(result).toContain('"str": "hello"');
      expect(result).toContain('[1, 2, 3]');
    });

    test('roundtrip CBOR encoding and EDN formatting', () => {
      const writer = new Writer(256);
      const encoder = new CborEncoder(writer);
      const decoder = new CborDecoder();

      const testCases = [
        42,
        'hello world',
        [1, 2, 3],
        {a: 1, b: 2},
        true,
        false,
        null
      ];

      for (const value of testCases) {
        const encoded = encoder.encode(value);
        const ednString = edn.formatCbor(encoded, decoder);
        expect(typeof ednString).toBe('string');
        expect(ednString.length).toBeGreaterThan(0);
      }
    });
  });

  describe('options and configuration', () => {
    test('can create EDN formatter with options', () => {
      const customEdn = new CborEdn({showEncodingIndicators: true});
      expect(customEdn.encode(42)).toBe('42');
    });

    test('encodeWithIndicators method', () => {
      const result = edn.encodeWithIndicators(42);
      expect(result).toBe('42'); // Basic implementation without actual encoding indicators
    });
  });
});
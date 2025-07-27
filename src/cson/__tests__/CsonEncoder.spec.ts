import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {CsonEncoder} from '../CsonEncoder';
import {CsonDecoder} from '../CsonDecoder';

describe('CsonEncoder', () => {
  let encoder: CsonEncoder;
  let decoder: CsonDecoder;
  let writer: Writer;

  beforeEach(() => {
    writer = new Writer();
    encoder = new CsonEncoder(writer);
    decoder = new CsonDecoder();
  });

  describe('basic values', () => {
    it('should encode null', () => {
      const encoded = encoder.encode(null);
      const result = new TextDecoder().decode(encoded);
      expect(result).toBe('null');
    });

    it('should encode boolean values', () => {
      const trueEncoded = encoder.encode(true);
      const falseEncoded = encoder.encode(false);
      
      expect(new TextDecoder().decode(trueEncoded)).toBe('true');
      expect(new TextDecoder().decode(falseEncoded)).toBe('false');
    });

    it('should encode numbers', () => {
      const intEncoded = encoder.encode(42);
      const floatEncoded = encoder.encode(3.14);
      
      expect(new TextDecoder().decode(intEncoded)).toBe('42');
      expect(new TextDecoder().decode(floatEncoded)).toBe('3.14');
    });

    it('should encode strings', () => {
      const encoded = encoder.encode('hello world');
      const result = new TextDecoder().decode(encoded);
      expect(result).toBe("'hello world'");
    });

    it('should encode strings with escaped quotes', () => {
      const encoded = encoder.encode("it's working");
      const result = new TextDecoder().decode(encoded);
      expect(result).toBe("'it\\'s working'");
    });

    it('should encode binary data', () => {
      const binaryData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in UTF-8
      const encoded = encoder.encode(binaryData);
      const result = new TextDecoder().decode(encoded);
      expect(result).toContain("Buffer.from('");
      expect(result).toContain("', 'base64')");
    });
  });

  describe('arrays', () => {
    it('should encode empty array', () => {
      const encoded = encoder.encode([]);
      const result = new TextDecoder().decode(encoded);
      expect(result).toBe('[]');
    });

    it('should encode simple array', () => {
      const encoded = encoder.encode([1, 2, 3]);
      const result = new TextDecoder().decode(encoded);
      expect(result).toContain('[');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).toContain(']');
    });

    it('should encode mixed array', () => {
      const encoded = encoder.encode(['a', 1, true, null]);
      const result = new TextDecoder().decode(encoded);
      expect(result).toContain("'a'");
      expect(result).toContain('1');
      expect(result).toContain('true');
      expect(result).toContain('null');
    });
  });

  describe('objects', () => {
    it('should encode empty object', () => {
      const encoded = encoder.encode({});
      const result = new TextDecoder().decode(encoded);
      expect(result).toBe('{}');
    });

    it('should encode simple object', () => {
      const encoded = encoder.encode({a: 1, b: 'hello'});
      const result = new TextDecoder().decode(encoded);
      expect(result).toContain('a: 1');
      expect(result).toContain("b: 'hello'");
    });

    it('should encode object with identifier keys', () => {
      const encoded = encoder.encode({validKey: 'value', another_key: 123});
      const result = new TextDecoder().decode(encoded);
      expect(result).toContain('validKey: ');
      expect(result).toContain('another_key: ');
      // Should not quote valid identifiers
      expect(result).not.toContain("'validKey':");
      expect(result).not.toContain("'another_key':");
    });

    it('should quote invalid identifier keys', () => {
      const encoded = encoder.encode({'invalid-key': 'value', '123key': 'value2'});
      const result = new TextDecoder().decode(encoded);
      expect(result).toContain("'invalid-key':");
      expect(result).toContain("'123key':");
    });
  });

  describe('roundtrip encoding/decoding', () => {
    const testCases = [
      null,
      true,
      false,
      42,
      3.14,
      'hello',
      [],
      [1, 2, 3],
      ['a', 'b', 'c'],
      {},
      {a: 1},
      {a: 1, b: 'hello'},
      {nested: {obj: 'value'}},
      {arr: [1, 2, {inner: 'test'}]},
    ];

    testCases.forEach((testCase, index) => {
      it(`should roundtrip case ${index}: ${JSON.stringify(testCase)}`, () => {
        const encoded = encoder.encode(testCase);
        const decoded = decoder.decode(encoded);
        expect(decoded).toEqual(testCase);
      });
    });
  });

  describe('CSON-specific features', () => {
    it('should generate valid CSON for the README example', () => {
      const data = {
        abc: ['a', 'b', 'c'],
        a: {
          b: 'c'
        }
      };
      
      const encoded = encoder.encode(data);
      const result = new TextDecoder().decode(encoded);
      
      // Should be parseable by the decoder
      const decoded = decoder.decode(encoded);
      expect(decoded).toEqual(data);
      
      // Should contain CSON-style formatting
      expect(result).toContain('abc: [');
      expect(result).toContain('a: {');
    });
  });
});
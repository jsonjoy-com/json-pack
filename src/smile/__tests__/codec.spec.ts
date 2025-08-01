import {SmileEncoder} from '../SmileEncoder';
import {SmileDecoder} from '../SmileDecoder';

describe('Smile Codec', () => {
  describe('Basic round-trip', () => {
    it('null', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(null);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toBe(null);
    });

    it('boolean true', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(true);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toBe(true);
    });

    it('boolean false', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(false);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toBe(false);
    });

    it('empty string', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode('');
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toBe('');
    });

    it('short ASCII string', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode('hello');
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toBe('hello');
    });

    it('small positive integer', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(5);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toBe(5);
    });

    it('small negative integer', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(-5);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toBe(-5);
    });

    it('large integer', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(123456);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toBe(123456);
    });

    it('floating point number', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(3.14);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toBeCloseTo(3.14);
    });

    it('empty array', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode([]);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toEqual([]);
    });

    it('simple array', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode([1, 2, 3]);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toEqual([1, 2, 3]);
    });

    it('empty object', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode({});
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toEqual({});
    });

    it('simple object', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode({name: 'John', age: 30});
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toEqual({name: 'John', age: 30});
    });

    it('nested structure', () => {
      const data = {
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Anytown',
        },
        hobbies: ['reading', 'gaming'],
      };
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(data);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toEqual(data);
    });
  });

  describe('Header validation', () => {
    it('should have correct header bytes', () => {
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(null);
      
      // Check the header bytes
      expect(encoded[0]).toBe(0x3a); // ':'
      expect(encoded[1]).toBe(0x29); // ')'
      expect(encoded[2]).toBe(0x0a); // '\n'
      expect(encoded[3] & 0xf0).toBe(0x00); // Version 0
    });
  });

  describe('String encoding variations', () => {
    it('tiny ASCII strings (1-32 bytes)', () => {
      const strings = ['a', 'hello', 'this is a longer string but not'];
      for (const str of strings) {
        if (str.length <= 32) {
          const encoder = SmileEncoder.create();
          const encoded = encoder.encode(str);
          const decoder = SmileDecoder.create(encoded);
          const decoded = decoder.decode();
          expect(decoded).toBe(str);
        }
      }
    });

    it('Unicode strings', () => {
      const strings = ['🙂', '你好', 'café', 'naïve'];
      for (const str of strings) {
        const encoder = SmileEncoder.create();
        const encoded = encoder.encode(str);
        const decoder = SmileDecoder.create(encoded);
        const decoded = decoder.decode();
        expect(decoded).toBe(str);
      }
    });
  });

  describe('Binary data', () => {
    it('empty binary', () => {
      const data = new Uint8Array(0);
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(data);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode() as Uint8Array;
      expect(decoded).toEqual(data);
    });

    it('small binary data', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(data);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode() as Uint8Array;
      expect(decoded).toEqual(data);
    });
  });
});
import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {FlexBuffersEncoder} from '../FlexBuffersEncoder';

const writer = new Writer(8);
const encoder = new FlexBuffersEncoder(writer);

describe('FlexBuffersEncoder', () => {
  describe('null', () => {
    test('null', () => {
      const encoded = encoder.encode(null);
      expect(encoded.length).toBeGreaterThan(0);
    });
  });

  describe('boolean', () => {
    test('true', () => {
      const encoded = encoder.encode(true);
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('false', () => {
      const encoded = encoder.encode(false);
      expect(encoded.length).toBeGreaterThan(0);
    });
  });

  describe('number', () => {
    test('integer 0', () => {
      const encoded = encoder.encode(0);
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('integer 1', () => {
      const encoded = encoder.encode(1);
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('integer -1', () => {
      const encoded = encoder.encode(-1);
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('integer 123', () => {
      const encoded = encoder.encode(123);
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('floats', () => {
      const encoded = encoder.encode(123.456);
      expect(encoded.length).toBeGreaterThan(0);
    });
  });

  describe('string', () => {
    test('empty string', () => {
      const encoded = encoder.encode('');
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('short string', () => {
      const encoded = encoder.encode('hello');
      expect(encoded.length).toBeGreaterThan(0);
    });
  });

  describe('array', () => {
    test('empty array', () => {
      const encoded = encoder.encode([]);
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('array with one element', () => {
      const encoded = encoder.encode([1]);
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('array with multiple elements', () => {
      const encoded = encoder.encode([1, 'hello', true]);
      expect(encoded.length).toBeGreaterThan(0);
    });
  });

  describe('object', () => {
    test('empty object', () => {
      const encoded = encoder.encode({});
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('object with one key', () => {
      const encoded = encoder.encode({key: 'value'});
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('object with multiple keys', () => {
      const encoded = encoder.encode({a: 1, b: 'hello', c: true});
      expect(encoded.length).toBeGreaterThan(0);
    });
  });

  describe('known byte values (non-roundtrip)', () => {
    test('null encodes to [0, 0, 1]', () => {
      const encoded = encoder.encode(null);
      expect(Array.from(encoded)).toEqual([0, 0, 1]);
    });

    test('true encodes to [1, 108, 1]', () => {
      const encoded = encoder.encode(true);
      expect(Array.from(encoded)).toEqual([1, 108, 1]);
    });

    test('false encodes to [0, 108, 1]', () => {
      const encoded = encoder.encode(false);
      expect(Array.from(encoded)).toEqual([0, 108, 1]);
    });

    test('integer 0 encodes to [0, 8, 1]', () => {
      const encoded = encoder.encode(0);
      expect(Array.from(encoded)).toEqual([0, 8, 1]);
    });

    test('integer 1 encodes to [1, 8, 1]', () => {
      const encoded = encoder.encode(1);
      expect(Array.from(encoded)).toEqual([1, 8, 1]);
    });

    test('integer 42 encodes to [42, 8, 1]', () => {
      const encoded = encoder.encode(42);
      expect(Array.from(encoded)).toEqual([42, 8, 1]);
    });

    test('integer -1 encodes to [255, 4, 1]', () => {
      const encoded = encoder.encode(-1);
      expect(Array.from(encoded)).toEqual([255, 4, 1]);
    });

    test('float 123.5 encodes to [0, 0, 0, 0, 0, 224, 94, 64, 15, 8]', () => {
      const encoded = encoder.encode(123.5);
      expect(Array.from(encoded)).toEqual([0, 0, 0, 0, 0, 224, 94, 64, 15, 8]);
    });

    test('empty string encodes to [0, 0, 24, 1]', () => {
      const encoded = encoder.encode('');
      expect(Array.from(encoded)).toEqual([0, 0, 24, 1]);
    });

    test('string "hello" encodes to [104, 101, 108, 108, 111, 0, 5, 24, 1]', () => {
      const encoded = encoder.encode('hello');
      expect(Array.from(encoded)).toEqual([104, 101, 108, 108, 111, 0, 5, 24, 1]);
    });
  });
});
import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {FlexBuffersEncoder} from '../FlexBuffersEncoder';
import {FlexBuffersDecoder} from '../FlexBuffersDecoder';

const writer = new Writer(8);
const encoder = new FlexBuffersEncoder(writer);
const decoder = new FlexBuffersDecoder();

describe('FlexBuffersDecoder', () => {
  describe('null', () => {
    test('null', () => {
      const encoded = encoder.encode(null);
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe(null);
    });
  });

  describe('boolean', () => {
    test('true', () => {
      const encoded = encoder.encode(true);
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe(true);
    });

    test('false', () => {
      const encoded = encoder.encode(false);
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe(false);
    });
  });

  describe('number', () => {
    test('integer 0', () => {
      const encoded = encoder.encode(0);
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe(0);
    });

    test('integer 1', () => {
      const encoded = encoder.encode(1);
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe(1);
    });

    test('integer -1', () => {
      const encoded = encoder.encode(-1);
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe(-1);
    });

    test('integer 123', () => {
      const encoded = encoder.encode(123);
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe(123);
    });

    test('floats', () => {
      const encoded = encoder.encode(123.456);
      const decoded = decoder.decode(encoded);
      expect(decoded).toBeCloseTo(123.456);
    });
  });

  describe('string', () => {
    test('empty string', () => {
      const encoded = encoder.encode('');
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe('');
    });

    test('short string', () => {
      const encoded = encoder.encode('hello');
      const decoded = decoder.decode(encoded);
      expect(decoded).toBe('hello');
    });
  });

  describe('array', () => {
    test('empty array', () => {
      const encoded = encoder.encode([]);
      const decoded = decoder.decode(encoded);
      expect(decoded).toEqual([]);
    });

    test('array with one element', () => {
      const encoded = encoder.encode([1]);
      const decoded = decoder.decode(encoded);
      expect(decoded).toEqual([1]);
    });

    test('array with multiple elements', () => {
      const encoded = encoder.encode([1, 'hello', true]);
      const decoded = decoder.decode(encoded);
      expect(decoded).toEqual([1, 'hello', true]);
    });
  });

  describe('object', () => {
    test('empty object', () => {
      const encoded = encoder.encode({});
      const decoded = decoder.decode(encoded);
      expect(decoded).toEqual({});
    });

    test('object with one key', () => {
      const encoded = encoder.encode({key: 'value'});
      const decoded = decoder.decode(encoded);
      expect(decoded).toEqual({key: 'value'});
    });

    test('object with multiple keys', () => {
      const encoded = encoder.encode({a: 1, b: 'hello', c: true});
      const decoded = decoder.decode(encoded);
      expect(decoded).toEqual({a: 1, b: 'hello', c: true});
    });
  });
});
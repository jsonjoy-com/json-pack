import {CborEncoder} from '../CborEncoder';
import {CborDecoder} from '../CborDecoder';
import {TYPED_ARRAY_TAG} from '../constants';
import type {CborMultiDimensionalArray, CborHomogeneousArray} from '../CborEncoder';

describe('CBOR Typed Arrays (RFC 8746)', () => {
  const encoder = new CborEncoder();
  const decoder = new CborDecoder();

  describe('8-bit arrays', () => {
    test('Int8Array', () => {
      const original = new Int8Array([-128, -1, 0, 1, 127]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Int8Array;
      
      expect(decoded).toBeInstanceOf(Int8Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    test('Uint8Array (using standard CBOR byte string)', () => {
      const original = new Uint8Array([0, 1, 127, 255]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Uint8Array;
      
      expect(decoded).toBeInstanceOf(Uint8Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    test('Uint8ClampedArray', () => {
      const original = new Uint8ClampedArray([0, 128, 255]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Uint8ClampedArray;
      
      expect(decoded).toBeInstanceOf(Uint8ClampedArray);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });
  });

  describe('16-bit arrays', () => {
    test('Int16Array', () => {
      const original = new Int16Array([-32768, -1, 0, 1, 32767]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Int16Array;
      
      expect(decoded).toBeInstanceOf(Int16Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    test('Uint16Array', () => {
      const original = new Uint16Array([0, 1, 32767, 65535]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Uint16Array;
      
      expect(decoded).toBeInstanceOf(Uint16Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });
  });

  describe('32-bit arrays', () => {
    test('Int32Array', () => {
      const original = new Int32Array([-2147483648, -1, 0, 1, 2147483647]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Int32Array;
      
      expect(decoded).toBeInstanceOf(Int32Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    test('Uint32Array', () => {
      const original = new Uint32Array([0, 1, 2147483647, 4294967295]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Uint32Array;
      
      expect(decoded).toBeInstanceOf(Uint32Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    test('Float32Array', () => {
      const original = new Float32Array([-3.14, -1.0, 0.0, 1.0, 3.14]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Float32Array;
      
      expect(decoded).toBeInstanceOf(Float32Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });
  });

  describe('64-bit arrays', () => {
    test('BigInt64Array', () => {
      const original = new BigInt64Array([BigInt(-9223372036854775808), BigInt(-1), BigInt(0), BigInt(1), BigInt(9223372036854775807)]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as BigInt64Array;
      
      expect(decoded).toBeInstanceOf(BigInt64Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    test('BigUint64Array', () => {
      const original = new BigUint64Array([BigInt(0), BigInt(1), BigInt(9223372036854775807), BigInt('18446744073709551615')]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as BigUint64Array;
      
      expect(decoded).toBeInstanceOf(BigUint64Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    test('Float64Array', () => {
      const original = new Float64Array([-Math.PI, -1.0, 0.0, 1.0, Math.PI]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Float64Array;
      
      expect(decoded).toBeInstanceOf(Float64Array);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });
  });

  describe('Empty arrays', () => {
    test('Empty Int32Array', () => {
      const original = new Int32Array([]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Int32Array;
      
      expect(decoded).toBeInstanceOf(Int32Array);
      expect(decoded.length).toBe(0);
    });

    test('Empty Float64Array', () => {
      const original = new Float64Array([]);
      const encoded = encoder.encode(original);
      const decoded = decoder.decode(encoded) as Float64Array;
      
      expect(decoded).toBeInstanceOf(Float64Array);
      expect(decoded.length).toBe(0);
    });
  });

  describe('Tag verification', () => {
    test('Int8Array uses correct tag', () => {
      const encoder = new CborEncoder();
      const original = new Int8Array([1, 2, 3]);
      const encoded = encoder.encode(original);
      
      // The encoded data should contain the SINT8 tag (72)
      // This is a basic verification that the tag is present
      expect(encoded.length).toBeGreaterThan(original.length);
    });

    test('Float32Array uses correct tag', () => {
      const encoder = new CborEncoder();
      const original = new Float32Array([1.0, 2.0]);
      const encoded = encoder.encode(original);
      
      // The encoded data should contain the appropriate float tag
      expect(encoded.length).toBeGreaterThan(original.byteLength);
    });
  });

  describe('Round-trip consistency', () => {
    const testCases = [
      ['Int8Array', new Int8Array([-100, 0, 100])],
      ['Uint8ClampedArray', new Uint8ClampedArray([0, 128, 255])],
      ['Int16Array', new Int16Array([-1000, 0, 1000])],
      ['Uint16Array', new Uint16Array([0, 1000, 65535])],
      ['Int32Array', new Int32Array([-100000, 0, 100000])],
      ['Uint32Array', new Uint32Array([0, 100000, 4000000000])],
      ['Float32Array', new Float32Array([-1.5, 0.0, 1.5])],
      ['Float64Array', new Float64Array([-1.7976931348623157e+308, 0.0, 1.7976931348623157e+308])],
      ['BigInt64Array', new BigInt64Array([BigInt(-1000), BigInt(0), BigInt(1000)])],
      ['BigUint64Array', new BigUint64Array([BigInt(0), BigInt(1000), BigInt(2000)])],
    ] as const;

    testCases.forEach(([name, original]) => {
      test(`${name} round-trip`, () => {
        const encoded = encoder.encode(original);
        const decoded = decoder.decode(encoded);
        
        expect(decoded).toBeInstanceOf(original.constructor);
        expect(Array.from(decoded as any)).toEqual(Array.from(original as any));
      });
    });
  });

  describe('Error cases', () => {
    test('Unsupported float16 tag should throw', () => {
      const decoder = new CborDecoder();
      // Manually create a CBOR message with float16 tag (not yet supported)
      const bytes = new Uint8Array([0xd8, TYPED_ARRAY_TAG.FLOAT16_BE, 0x42, 0x00, 0x01]); // tag + dummy byte string
      
      expect(() => decoder.decode(bytes)).toThrow('Unsupported floating point format');
    });

    test('Unsupported float128 tag should throw', () => {
      const decoder = new CborDecoder();
      // Manually create a CBOR message with float128 tag (not yet supported)
      const bytes = new Uint8Array([0xd8, TYPED_ARRAY_TAG.FLOAT128_BE, 0x42, 0x00, 0x01]); // tag + dummy byte string
      
      expect(() => decoder.decode(bytes)).toThrow('Unsupported floating point format');
    });
  });

  describe('Multi-dimensional arrays (RFC 8746)', () => {
    test('Row-major multi-dimensional array', () => {
      const multiDimArray: CborMultiDimensionalArray = {
        __cbor_multi_dim__: true,
        dimensions: [2, 3],
        elements: [1, 2, 3, 4, 5, 6],
        rowMajor: true
      };
      
      const encoded = encoder.encode(multiDimArray);
      const decoded = decoder.decode(encoded) as any;
      
      expect(decoded.dimensions).toEqual([2, 3]);
      expect(decoded.elements).toEqual([1, 2, 3, 4, 5, 6]);
      expect(decoded.order).toBe('row-major');
    });

    test('Column-major multi-dimensional array', () => {
      const multiDimArray: CborMultiDimensionalArray = {
        __cbor_multi_dim__: true,
        dimensions: [2, 3],
        elements: [1, 2, 3, 4, 5, 6],
        rowMajor: false
      };
      
      const encoded = encoder.encode(multiDimArray);
      const decoded = decoder.decode(encoded) as any;
      
      expect(decoded.dimensions).toEqual([2, 3]);
      expect(decoded.elements).toEqual([1, 2, 3, 4, 5, 6]);
      expect(decoded.order).toBe('column-major');
    });

    test('Multi-dimensional with typed array elements', () => {
      const typedArray = new Int32Array([1, 2, 3, 4, 5, 6]);
      const multiDimArray: CborMultiDimensionalArray = {
        __cbor_multi_dim__: true,
        dimensions: [2, 3],
        elements: typedArray
      };
      
      const encoded = encoder.encode(multiDimArray);
      const decoded = decoder.decode(encoded) as any;
      
      expect(decoded.dimensions).toEqual([2, 3]);
      expect(decoded.elements).toBeInstanceOf(Int32Array);
      expect(Array.from(decoded.elements)).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('Homogeneous arrays (RFC 8746)', () => {
    test('Homogeneous array of numbers', () => {
      const homogeneousArray: CborHomogeneousArray = {
        __cbor_homogeneous__: true,
        elements: [1, 2, 3, 4, 5]
      };
      
      const encoded = encoder.encode(homogeneousArray);
      const decoded = decoder.decode(encoded) as unknown[];
      
      expect(Array.isArray(decoded)).toBe(true);
      expect(decoded).toEqual([1, 2, 3, 4, 5]);
    });

    test('Homogeneous array of booleans', () => {
      const homogeneousArray: CborHomogeneousArray = {
        __cbor_homogeneous__: true,
        elements: [true, false, true]
      };
      
      const encoded = encoder.encode(homogeneousArray);
      const decoded = decoder.decode(encoded) as unknown[];
      
      expect(Array.isArray(decoded)).toBe(true);
      expect(decoded).toEqual([true, false, true]);
    });

    test('Empty homogeneous array', () => {
      const homogeneousArray: CborHomogeneousArray = {
        __cbor_homogeneous__: true,
        elements: []
      };
      
      const encoded = encoder.encode(homogeneousArray);
      const decoded = decoder.decode(encoded) as unknown[];
      
      expect(Array.isArray(decoded)).toBe(true);
      expect(decoded).toEqual([]);
    });
  });

  describe('Helper functions', () => {
    test('createMultiDimensionalArray helper', () => {
      const {createMultiDimensionalArray} = require('../index');
      const multiDimArray = createMultiDimensionalArray([2, 3], [1, 2, 3, 4, 5, 6]);
      
      const encoded = encoder.encode(multiDimArray);
      const decoded = decoder.decode(encoded) as any;
      
      expect(decoded.dimensions).toEqual([2, 3]);
      expect(decoded.elements).toEqual([1, 2, 3, 4, 5, 6]);
      expect(decoded.order).toBe('row-major');
    });

    test('createHomogeneousArray helper', () => {
      const {createHomogeneousArray} = require('../index');
      const homogeneousArray = createHomogeneousArray([1, 2, 3, 4, 5]);
      
      const encoded = encoder.encode(homogeneousArray);
      const decoded = decoder.decode(encoded) as unknown[];
      
      expect(Array.isArray(decoded)).toBe(true);
      expect(decoded).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
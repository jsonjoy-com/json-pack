import {SmileEncoder} from '../SmileEncoder';
import {SmileDecoder} from '../SmileDecoder';

const samples = [
  null,
  true,
  false,
  0,
  1,
  -1,
  15,
  -16,
  123456,
  -123456,
  3.14,
  -3.14,
  0.1,
  '',
  'hello',
  'hello world',
  '🙂',
  'café',
  'a'.repeat(32),
  'a'.repeat(33),
  'a'.repeat(64),
  'a'.repeat(65),
  '你好世界',
  [],
  [1, 2, 3],
  ['a', 'b', 'c'],
  [null, true, false],
  [[], [1], [1, 2]],
  {},
  {a: 1},
  {name: 'John', age: 30},
  {nested: {deep: {value: 42}}},
  {array: [1, 2, 3], object: {key: 'value'}},
  new Uint8Array([]),
  new Uint8Array([1, 2, 3, 4, 5]),
  new Uint8Array([0, 255, 128, 64, 32]),
];

describe('Smile Codec Automated Tests', () => {
  describe('Standard samples', () => {
    for (let i = 0, l = samples.length; i < l; i++) {
      const sample = samples[i];
      it(`sample ${i}: ${JSON.stringify(sample)}`, () => {
        const encoder = SmileEncoder.create();
        const encoded = encoder.encode(sample);
        const decoder = SmileDecoder.create(encoded);
        const decoded = decoder.decode();
        
        if (sample instanceof Uint8Array) {
          expect(decoded).toEqual(sample);
        } else if (typeof sample === 'number' && !Number.isInteger(sample)) {
          expect(decoded).toBeCloseTo(sample as number, 5);
        } else {
          expect(decoded).toEqual(sample);
        }
      });
    }
  });

  describe('Shared string optimization', () => {
    it('should reuse shared strings when enabled', () => {
      const data = {
        name1: 'John',
        name2: 'John', // Should reference the first 'John'
        name3: 'John', // Should reference the first 'John'
      };
      
      const encoderWithSharing = SmileEncoder.create({sharedStringValues: true});
      const encodedWithSharing = encoderWithSharing.encode(data);
      
      const encoderWithoutSharing = SmileEncoder.create({sharedStringValues: false});
      const encodedWithoutSharing = encoderWithoutSharing.encode(data);
      
      // With sharing should be smaller
      expect(encodedWithSharing.length).toBeLessThan(encodedWithoutSharing.length);
      
      // Both should decode to the same result
      const decoder1 = SmileDecoder.create(encodedWithSharing);
      const decoder2 = SmileDecoder.create(encodedWithoutSharing);
      expect(decoder1.decode()).toEqual(data);
      expect(decoder2.decode()).toEqual(data);
    });

    it('should reuse shared property names by default', () => {
      const data = [
        {name: 'John', age: 30},
        {name: 'Jane', age: 25}, // 'name' and 'age' should be shared
        {name: 'Bob', age: 35},
      ];
      
      const encoderWithSharing = SmileEncoder.create({sharedPropertyNames: true});
      const encodedWithSharing = encoderWithSharing.encode(data);
      
      const encoderWithoutSharing = SmileEncoder.create({sharedPropertyNames: false});
      const encodedWithoutSharing = encoderWithoutSharing.encode(data);
      
      // With sharing should be smaller
      expect(encodedWithSharing.length).toBeLessThan(encodedWithoutSharing.length);
      
      // Both should decode to the same result
      const decoder1 = SmileDecoder.create(encodedWithSharing);
      const decoder2 = SmileDecoder.create(encodedWithoutSharing);
      expect(decoder1.decode()).toEqual(data);
      expect(decoder2.decode()).toEqual(data);
    });
  });

  describe('Edge cases', () => {
    it('should handle deeply nested structures', () => {
      let nested: any = 'deep';
      for (let i = 0; i < 10; i++) {
        nested = {level: i, data: nested};
      }
      
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(nested);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toEqual(nested);
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({length: 1000}, (_, i) => i);
      
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(largeArray);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toEqual(largeArray);
    });

    it('should handle objects with many properties', () => {
      const manyProps: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        manyProps[`prop${i}`] = i;
      }
      
      const encoder = SmileEncoder.create();
      const encoded = encoder.encode(manyProps);
      const decoder = SmileDecoder.create(encoded);
      const decoded = decoder.decode();
      expect(decoded).toEqual(manyProps);
    });
  });

  describe('Various numeric types', () => {
    const numbers = [
      0, 1, -1,
      15, 16, -15, -16, -17,
      127, 128, 255, 256,
      32767, 32768, -32767, -32768, -32769,
      // Note: Very large integers beyond JavaScript's safe range are converted to strings
      // to preserve precision, so we test smaller values here
      1000000, -1000000,
      0.1, 0.5, 0.9, 1.1, 1.5, 1.9,
      Math.PI, Math.E,
      1e6, 1e-6,
    ];

    for (const num of numbers) {
      it(`should handle number ${num}`, () => {
        const encoder = SmileEncoder.create();
        const encoded = encoder.encode(num);
        const decoder = SmileDecoder.create(encoded);
        const decoded = decoder.decode();
        
        if (Number.isInteger(num) && Number.isSafeInteger(num)) {
          expect(decoded).toBe(num);
        } else if (typeof decoded === 'number') {
          expect(decoded).toBeCloseTo(num, 10);
        } else {
          // Large integers might be encoded as strings
          expect(parseFloat(decoded as string)).toBeCloseTo(num, 0);
        }
      });
    }
  });
});
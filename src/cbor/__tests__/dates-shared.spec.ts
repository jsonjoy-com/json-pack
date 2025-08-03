import {encode, decode} from '../shared';

describe('CBOR Shared Encoder/Decoder with Dates', () => {
  test('shared encoder/decoder handles Date objects correctly', () => {
    const testDate = new Date(1980, 11, 8); // December 8, 1980
    
    const encoded = encode(testDate);
    const decoded = decode(encoded) as Date;
    
    expect(decoded).toBeInstanceOf(Date);
    expect(decoded.getFullYear()).toBe(1980);
    expect(decoded.getMonth()).toBe(11); // December
    expect(decoded.getDate()).toBe(8);
  });

  test('handles complex objects with dates', () => {
    const data = {
      name: 'John Lennon',
      birth: new Date(1940, 9, 9),
      death: new Date(1980, 11, 8),
      albums: ['Imagine', 'Double Fantasy']
    };

    const encoded = encode(data);
    const decoded = decode(encoded) as typeof data;

    expect(decoded.name).toBe('John Lennon');
    expect(decoded.birth).toBeInstanceOf(Date);
    expect(decoded.birth.getFullYear()).toBe(1940);
    expect(decoded.death).toBeInstanceOf(Date);
    expect(decoded.death.getFullYear()).toBe(1980);
    expect(decoded.albums).toEqual(['Imagine', 'Double Fantasy']);
  });
});
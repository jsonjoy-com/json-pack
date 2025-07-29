import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {FlexBuffersEncoder} from '../FlexBuffersEncoder';
import {FlexBuffersDecoder} from '../FlexBuffersDecoder';

const writer = new Writer(8);
const encoder = new FlexBuffersEncoder(writer);
const decoder = new FlexBuffersDecoder();

test('debug integer 0', () => {
  const encoded = encoder.encode(0);
  console.log('Encoded bytes:', Array.from(encoded).map(b => b.toString(16)).join(' '));
  console.log('Encoded length:', encoded.length);
  
  // Try to decode
  try {
    const decoded = decoder.decode(encoded);
    console.log('Decoded:', decoded);
    expect(decoded).toBe(0);
  } catch (error) {
    console.error('Decode error:', (error as Error).message);
    throw error;
  }
});
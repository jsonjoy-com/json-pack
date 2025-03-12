import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {BsonEncoder, BsonDecoder} from '.';

// Initialize encoder and decoder
const writer = new Writer();
const encoder = new BsonEncoder(writer);
const decoder = new BsonDecoder();

// Test with a simple object
const testObject = { hello: 'world' };
console.log('Original:', testObject);

// Encode
const encoded = encoder.encode(testObject);
console.log('Encoded buffer length:', encoded.length);
console.log('Encoded buffer first 10 bytes:', Array.from(encoded.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));

// Try to decode
try {
  const decoded = decoder.decode(encoded);
  console.log('Decoded:', decoded);
  console.log('Roundtrip successful:', JSON.stringify(testObject) === JSON.stringify(decoded));
} catch (err) {
  console.error('Decoding error:', err);
  
  // Debug format issues
  console.log('Full encoded buffer:', Array.from(encoded).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  // Check document size
  const size = encoded[0] | (encoded[1] << 8) | (encoded[2] << 16) | (encoded[3] << 24);
  console.log('Document size from buffer:', size, 'Actual buffer size:', encoded.length);
}

// Test with a primitive
console.log('\nTesting with primitive:');
const testPrimitive = 42;
console.log('Original:', testPrimitive);

// Encode
const encodedPrimitive = encoder.encode(testPrimitive);
console.log('Encoded buffer length:', encodedPrimitive.length);
console.log('Encoded buffer first 10 bytes:', Array.from(encodedPrimitive.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));

// Try to decode
try {
  const decodedPrimitive = decoder.decode(encodedPrimitive);
  console.log('Decoded:', decodedPrimitive);
  console.log('Roundtrip successful:', testPrimitive === decodedPrimitive);
} catch (err) {
  console.error('Decoding error:', err);
  
  // Debug format issues
  console.log('Full encoded buffer:', Array.from(encodedPrimitive).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  // Check document size
  const size = encodedPrimitive[0] | (encodedPrimitive[1] << 8) | (encodedPrimitive[2] << 16) | (encodedPrimitive[3] << 24);
  console.log('Document size from buffer:', size, 'Actual buffer size:', encodedPrimitive.length);
}
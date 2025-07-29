import {SmileEncoder, SmileDecoder} from './src/smile';

const encoder = SmileEncoder.create();
const encoded = encoder.encode("a");

console.log('Encoded bytes:', Array.from(encoded).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

const decoder = SmileDecoder.create(encoded);
const decoded = decoder.decode();

console.log('Decoded:', JSON.stringify(decoded));
console.log('Expected:', JSON.stringify("a"));
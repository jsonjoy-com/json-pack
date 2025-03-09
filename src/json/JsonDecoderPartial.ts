import {JsonDecoder, readKey} from './JsonDecoder';
import type {PackValue} from '../types';

/**
 * This class parses JSON which is correct but not necessarily complete.
 * It can be used to parse JSON that is being streamed in chunks. If the end
 * of the JSON is missing, this parser will return the initial, correct, parsed
 * part of the JSON, until the point where the JSON is no longer valid.
 * 
 * Examples:
 * 
 * ```js
 * // Missing closing brace
 * decoder.readAny('[1, 2, 3'); // [1, 2, 3]
 * 
 * // Trailing comma and missing closing brace
 * decoder.readAny('[1, 2, '); // [1, 2]
 * 
 * // Corrupt second element and missing closing brace
 * decoder.readAny('{"foo": 1, "bar":'); // {"foo": 1}
 * ```
 */
export class JsonDecoderPartial extends JsonDecoder {
  public readArr(): unknown[] {
    const reader = this.reader;
    reader.u8(); /* [ */
    const arr: unknown[] = [];
    const uint8 = reader.uint8;
    while (true) {
      this.skipWhitespace();
      const char = uint8[reader.x];
      if (char === 0x5d /* ] */) return reader.x++, arr;
      if (char === 0x2c /* , */) {
        reader.x++;
        continue;
      }
      try {
        arr.push(this.readAny());
      } catch (error) {
        if (error instanceof Error && error.message === 'Invalid JSON') return arr;
        throw error;
      }
    }
  }

  public readObj(): PackValue | Record<string, unknown> | unknown {
    const reader = this.reader;
    if (reader.u8() !== 0x7b /* { */) throw new Error('Invalid JSON');
    const obj: Record<string, unknown> = {};
    const uint8 = reader.uint8;
    while (true) {
      this.skipWhitespace();
      let char = uint8[reader.x];
      if (char === 0x7d /* } */) return reader.x++, obj;
      if (char === 0x2c /* , */) {
        reader.x++;
        continue;
      }
      try {
        char = uint8[reader.x++];
        if (char !== 0x22 /* " */) throw new Error('Invalid JSON');
        const key = readKey(reader);
        if (key === '__proto__') throw new Error('Invalid JSON');
        this.skipWhitespace();
        if (reader.u8() !== 0x3a /* : */) throw new Error('Invalid JSON');
        this.skipWhitespace();
        obj[key] = this.readAny();
      } catch (error) {
        if (error instanceof Error && error.message === 'Invalid JSON') return obj;
        throw error;
      }
    }
  }
}

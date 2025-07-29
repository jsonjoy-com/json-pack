import {Reader} from '@jsonjoy.com/util/lib/buffers/Reader';
import {JsonPackValue} from '../JsonPackValue';
import {HEADER, VALUE_MODE, KEY_MODE, SHARED, ERROR} from './constants';
import {
  zigzagDecode,
  readVInt,
  decodeSafeBinary,
  decodeFloat32,
  decodeFloat64,
  shouldAvoidReference,
} from './util';
import type {IReader, IReaderResettable} from '@jsonjoy.com/util/lib/buffers';

export interface SmileDecoderOptions {
  /**
   * Maximum size for shared string tables.
   * Default: 1024
   */
  maxSharedReferences?: number;
}

export interface SmileHeader {
  version: number;
  sharedStringValues: boolean;
  sharedPropertyNames: boolean;
  rawBinaryEnabled: boolean;
}

export type SmileReader = IReader & IReaderResettable;

export class SmileDecoder<R extends SmileReader = SmileReader> {
  protected reader: R;
  protected options: Required<SmileDecoderOptions>;
  protected header!: SmileHeader;
  
  // Shared string tables
  protected sharedValues: string[] = [];
  protected sharedKeys: string[] = [];

  constructor(reader: R, options: SmileDecoderOptions = {}) {
    this.reader = reader;
    this.options = {
      maxSharedReferences: options.maxSharedReferences ?? SHARED.MAX_REFERENCES,
    };
    this.readHeader();
  }

  /**
   * Creates a new SmileDecoder with a fresh reader.
   */
  public static create(data: Uint8Array, options?: SmileDecoderOptions): SmileDecoder {
    const reader = new Reader() as SmileReader;
    reader.reset(data);
    return new SmileDecoder(reader, options);
  }

  /**
   * Decodes a Smile-encoded value from the current reader position.
   */
  public decode(): unknown {
    return this.readValue();
  }

  /**
   * Reads and validates the 4-byte Smile header.
   */
  protected readHeader(): void {
    if (this.reader.u8() !== HEADER.BYTE_0 ||
        this.reader.u8() !== HEADER.BYTE_1 ||
        this.reader.u8() !== HEADER.BYTE_2) {
      throw new Error(ERROR.INVALID_HEADER);
    }

    const headerByte = this.reader.u8();
    const version = (headerByte & HEADER.VERSION_MASK) >> 4;
    
    if (version !== 0) {
      throw new Error(ERROR.UNSUPPORTED_VERSION);
    }

    this.header = {
      version,
      rawBinaryEnabled: (headerByte & HEADER.RAW_BINARY_ENABLED) !== 0,
      sharedStringValues: (headerByte & HEADER.SHARED_STRING_VALUES) !== 0,
      sharedPropertyNames: (headerByte & HEADER.SHARED_PROPERTY_NAMES) !== 0,
    };
  }

  /**
   * Reads a value in value mode.
   */
  protected readValue(): unknown {
    const token = this.reader.u8();

    // Short shared value string reference (0x01 - 0x1F)
    if (token >= VALUE_MODE.SHORT_SHARED_VALUE_MIN && token <= VALUE_MODE.SHORT_SHARED_VALUE_MAX) {
      return this.readSharedValueReference(token - VALUE_MODE.SHORT_SHARED_VALUE_MIN);
    }

    // Simple literals and numbers (0x20 - 0x3F)  
    if (token >= 0x20 && token <= 0x3f) {
      switch (token) {
        case VALUE_MODE.EMPTY_STRING:
          return '';
        case VALUE_MODE.NULL:
          return null;
        case VALUE_MODE.FALSE:
          return false;
        case VALUE_MODE.TRUE:
          return true;
        case VALUE_MODE.INT_32:
          return this.readSignedVInt();
        case VALUE_MODE.INT_64:
          return this.readSignedVInt();
        case VALUE_MODE.BIG_INTEGER:
          return this.readBigInteger();
        case VALUE_MODE.FLOAT_32:
          return this.readFloat32();
        case VALUE_MODE.FLOAT_64:
          return this.readFloat64();
        case VALUE_MODE.BIG_DECIMAL:
          return this.readBigDecimal();
        default:
          throw new Error(`${ERROR.INVALID_TOKEN}: 0x${token.toString(16)}`);
      }
    }

    // Tiny ASCII (0x40 - 0x5F)
    if (token >= VALUE_MODE.TINY_ASCII_MIN && token <= VALUE_MODE.TINY_ASCII_MAX) {
      const length = (token & 0x1f) + 1;
      return this.readString(length, true);
    }

    // Short ASCII (0x60 - 0x7F)
    if (token >= VALUE_MODE.SHORT_ASCII_MIN && token <= VALUE_MODE.SHORT_ASCII_MAX) {
      const length = (token & 0x1f) + 33;
      return this.readString(length, true);
    }

    // Tiny Unicode (0x80 - 0x9F)
    if (token >= VALUE_MODE.TINY_UNICODE_MIN && token <= VALUE_MODE.TINY_UNICODE_MAX) {
      const length = (token & 0x1f) + 2;
      return this.readString(length, false);
    }

    // Short Unicode (0xA0 - 0xBF)
    if (token >= VALUE_MODE.SHORT_UNICODE_MIN && token <= VALUE_MODE.SHORT_UNICODE_MAX) {
      const length = (token & 0x1f) + 34;
      return this.readString(length, false);
    }

    // Small integers (0xC0 - 0xDF)
    if (token >= VALUE_MODE.SMALL_INT_MIN && token <= VALUE_MODE.SMALL_INT_MAX) {
      return (token & 0x1f) - 16;
    }

    // Binary / text / structure markers (0xE0 - 0xFF)
    switch (token) {
      case VALUE_MODE.LONG_ASCII_TEXT:
        return this.readLongString(true);
      case VALUE_MODE.LONG_UNICODE_TEXT:
        return this.readLongString(false);
      case VALUE_MODE.BINARY_7BIT:
        return this.readSafeBinary();
      case VALUE_MODE.BINARY_RAW:
        return this.readRawBinary();
      case VALUE_MODE.SHARED_STRING_LONG:
      case VALUE_MODE.SHARED_STRING_LONG + 1:
      case VALUE_MODE.SHARED_STRING_LONG + 2:
      case VALUE_MODE.SHARED_STRING_LONG + 3:
        return this.readLongSharedValueReference(token);
      case VALUE_MODE.START_ARRAY:
        return this.readArray();
      case VALUE_MODE.START_OBJECT:
        return this.readObject();
      case VALUE_MODE.END_CONTENT:
        throw new Error(ERROR.UNEXPECTED_END);
      default:
        throw new Error(`${ERROR.INVALID_TOKEN}: 0x${token.toString(16)}`);
    }
  }

  /**
   * Reads a string of given length.
   */
  protected readString(length: number, isAscii: boolean): string {
    const bytes = this.reader.buf(length);
    const result = new TextDecoder('utf-8').decode(bytes);
    
    // Add to shared reference if applicable and shareable
    if (this.header.sharedStringValues && length <= SHARED.MAX_STRING_LENGTH) {
      this.addSharedValue(result);
    }
    
    return result;
  }

  /**
   * Reads a long string terminated by END_STRING_MARKER.
   */
  protected readLongString(isAscii: boolean): string {
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const byte = this.reader.u8();
      if (byte === VALUE_MODE.END_STRING_MARKER) {
        break;
      }
      // Put the byte back and read it as part of content
      this.reader.x--;
      
      // Read in chunks to avoid large allocations
      const chunk = new Uint8Array(64);
      let chunkLength = 0;
      
      while (chunkLength < 64) {
        const nextByte = this.reader.u8();
        if (nextByte === VALUE_MODE.END_STRING_MARKER) {
          break;
        }
        chunk[chunkLength++] = nextByte;
      }
      
      if (chunkLength > 0) {
        chunks.push(chunk.slice(0, chunkLength));
        totalLength += chunkLength;
      }
      
      if (chunkLength < 64) break; // Hit end marker
    }

    // Combine chunks
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder('utf-8').decode(combined);
  }

  /**
   * Reads a signed VInt using zigzag decoding.
   */
  protected readSignedVInt(): number {
    const unsigned = readVInt(this.reader);
    return zigzagDecode(unsigned);
  }

  /**
   * Reads a 32-bit float.
   */
  protected readFloat32(): number {
    const encodedBytes = this.reader.buf(5);
    return decodeFloat32(encodedBytes);
  }

  /**
   * Reads a 64-bit double.
   */
  protected readFloat64(): number {
    const encodedBytes = this.reader.buf(10);
    return decodeFloat64(encodedBytes);
  }

  /**
   * Reads a BigInteger (not fully implemented - returns number for now).
   */
  protected readBigInteger(): number {
    const length = readVInt(this.reader);
    const bytes = this.reader.buf(length);
    
    // Simple implementation - convert to number (loses precision for very large values)
    let result = 0;
    for (let i = 0; i < bytes.length; i++) {
      result = result * 256 + bytes[i];
    }
    return result;
  }

  /**
   * Reads a BigDecimal (not fully implemented - returns number for now).
   */
  protected readBigDecimal(): number {
    const scale = zigzagDecode(readVInt(this.reader));
    const magnitudeLength = readVInt(this.reader);
    const magnitudeBytes = this.reader.buf(magnitudeLength);
    
    // Simple implementation - convert to number
    let magnitude = 0;
    for (let i = 0; i < magnitudeBytes.length; i++) {
      magnitude = magnitude * 256 + magnitudeBytes[i];
    }
    
    return magnitude / Math.pow(10, scale);
  }

  /**
   * Reads safe 7-bit encoded binary data.
   */
  protected readSafeBinary(): Uint8Array {
    const originalLength = readVInt(this.reader);
    const encodedLength = Math.ceil((originalLength * 8) / 7);
    const encodedBytes = this.reader.buf(encodedLength);
    return decodeSafeBinary(encodedBytes, originalLength);
  }

  /**
   * Reads raw binary data.
   */
  protected readRawBinary(): Uint8Array {
    if (!this.header.rawBinaryEnabled) {
      throw new Error('Raw binary data not enabled in header');
    }
    const length = readVInt(this.reader);
    const bytes = this.reader.buf(length);
    return bytes;
  }

  /**
   * Reads an array.
   */
  protected readArray(): unknown[] {
    const result: unknown[] = [];
    
    while (true) {
      const nextByte = this.reader.peak();
      if (nextByte === VALUE_MODE.END_ARRAY) {
        this.reader.u8(); // consume the END_ARRAY token
        break;
      }
      result.push(this.readValue());
    }
    
    return result;
  }

  /**
   * Reads an object.
   */
  protected readObject(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    while (true) {
      const nextByte = this.reader.peak();
      if (nextByte === KEY_MODE.END_OBJECT) {
        this.reader.u8(); // consume the END_OBJECT token
        break;
      }
      
      const key = this.readKey();
      const value = this.readValue();
      result[key] = value;
    }
    
    return result;
  }

  /**
   * Reads a property name in key mode.
   */
  protected readKey(): string {
    const token = this.reader.u8();

    // Empty string
    if (token === KEY_MODE.EMPTY_STRING) {
      return '';
    }

    // Short shared key name reference (0x40 - 0x7F)
    if (token >= KEY_MODE.SHORT_SHARED_MIN && token <= KEY_MODE.SHORT_SHARED_MAX) {
      const index = token - KEY_MODE.SHORT_SHARED_MIN;
      return this.readSharedKeyReference(index);
    }

    // Long shared key name reference (0x30 - 0x33)
    if (token >= KEY_MODE.LONG_SHARED_MIN && token <= KEY_MODE.LONG_SHARED_MAX) {
      const highBits = (token & 0x03) << 8;
      const lowBits = this.reader.u8();
      const index = highBits | lowBits;
      return this.readSharedKeyReference(index);
    }

    // Short ASCII names (0x80 - 0xBF)
    if (token >= KEY_MODE.SHORT_ASCII_MIN && token <= KEY_MODE.SHORT_ASCII_MAX) {
      const length = (token & 0x3f) + 1;
      return this.readKeyString(length);
    }

    // Short Unicode names (0xC0 - 0xF7)
    if (token >= KEY_MODE.SHORT_UNICODE_MIN && token <= KEY_MODE.SHORT_UNICODE_MAX) {
      const length = (token & 0x3f) + 2;
      return this.readKeyString(length);
    }

    // Long Unicode name
    if (token === KEY_MODE.LONG_UNICODE_NAME) {
      return this.readLongKeyString();
    }

    throw new Error(`${ERROR.INVALID_TOKEN} in key mode: 0x${token.toString(16)}`);
  }

  /**
   * Reads a key string of given length.
   */
  protected readKeyString(length: number): string {
    const bytes = this.reader.buf(length);
    const result = new TextDecoder('utf-8').decode(bytes);
    
    // Add to shared reference if applicable
    if (this.header.sharedPropertyNames) {
      this.addSharedKey(result);
    }
    
    return result;
  }

  /**
   * Reads a long key string terminated by END_STRING_MARKER.
   */
  protected readLongKeyString(): string {
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const byte = this.reader.u8();
      if (byte === VALUE_MODE.END_STRING_MARKER) {
        break;
      }
      // Put the byte back and read it as part of content
      this.reader.x--;
      
      // Read in chunks
      const chunk = new Uint8Array(64);
      let chunkLength = 0;
      
      while (chunkLength < 64) {
        const nextByte = this.reader.u8();
        if (nextByte === VALUE_MODE.END_STRING_MARKER) {
          break;
        }
        chunk[chunkLength++] = nextByte;
      }
      
      if (chunkLength > 0) {
        chunks.push(chunk.slice(0, chunkLength));
        totalLength += chunkLength;
      }
      
      if (chunkLength < 64) break;
    }

    // Combine chunks
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const result = new TextDecoder('utf-8').decode(combined);
    
    // Add to shared reference if applicable
    if (this.header.sharedPropertyNames) {
      this.addSharedKey(result);
    }
    
    return result;
  }

  /**
   * Reads a shared value string reference.
   */
  protected readSharedValueReference(index: number): string {
    if (index >= this.sharedValues.length) {
      throw new Error(`${ERROR.INVALID_REFERENCE}: value index ${index}`);
    }
    return this.sharedValues[index];
  }

  /**
   * Reads a long shared value string reference.
   */
  protected readLongSharedValueReference(token: number): string {
    const highBits = (token & 0x03) << 8;
    const lowBits = this.reader.u8();
    const adjustedIndex = highBits | lowBits;
    const index = adjustedIndex + SHARED.MIN_LONG_REFERENCE; // Add offset for long references
    return this.readSharedValueReference(index);
  }

  /**
   * Reads a shared key string reference.
   */
  protected readSharedKeyReference(index: number): string {
    if (index >= this.sharedKeys.length) {
      throw new Error(`${ERROR.INVALID_REFERENCE}: key index ${index}`);
    }
    return this.sharedKeys[index];
  }

  /**
   * Adds a string to the shared value reference table.
   */
  protected addSharedValue(value: string): void {
    if (this.sharedValues.length >= this.options.maxSharedReferences) {
      // Clear and restart
      this.sharedValues.length = 0;
    }

    const index = this.sharedValues.length;
    if (!shouldAvoidReference(index)) {
      this.sharedValues.push(value);
    }
  }

  /**
   * Adds a key to the shared key reference table.
   */
  protected addSharedKey(key: string): void {
    if (this.sharedKeys.length >= this.options.maxSharedReferences) {
      // Clear and restart
      this.sharedKeys.length = 0;
    }

    const index = this.sharedKeys.length;
    if (!shouldAvoidReference(index)) {
      this.sharedKeys.push(key);
    }
  }
}
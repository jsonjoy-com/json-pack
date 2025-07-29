import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {JsonPackExtension} from '../JsonPackExtension';
import {JsonPackValue} from '../JsonPackValue';
import {HEADER, VALUE_MODE, KEY_MODE, SHARED, ENCODING, ERROR} from './constants';
import {
  zigzagEncode,
  writeVInt,
  encodeSafeBinary,
  encodeFloat32,
  encodeFloat64,
  shouldAvoidReference,
  isStringShareable,
} from './util';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';

export interface SmileEncoderOptions {
  /**
   * Whether to enable shared string value checking during encoding.
   * When enabled, the encoder will track string values and create back-references
   * to previously seen strings to reduce output size.
   * Default: false
   */
  sharedStringValues?: boolean;

  /**
   * Whether to enable shared property name checking during encoding.
   * When enabled, the encoder will track object property names and create
   * back-references to previously seen names to reduce output size.
   * Default: true
   */
  sharedPropertyNames?: boolean;

  /**
   * Whether to allow raw binary data in the output.
   * When enabled, binary data can contain any byte values including reserved ones.
   * Default: false
   */
  rawBinaryEnabled?: boolean;
}

export type SmileWriter = IWriter & IWriterGrowable;

export class SmileEncoder<W extends SmileWriter = SmileWriter> {
  protected writer: W;
  protected options: Required<SmileEncoderOptions>;
  
  // Shared string tables
  protected sharedValues: string[] = [];
  protected sharedValueMap: Map<string, number> = new Map();
  protected sharedKeys: string[] = [];
  protected sharedKeyMap: Map<string, number> = new Map();

  constructor(writer: W, options: SmileEncoderOptions = {}) {
    this.writer = writer;
    this.options = {
      sharedStringValues: options.sharedStringValues ?? false,
      sharedPropertyNames: options.sharedPropertyNames ?? true,
      rawBinaryEnabled: options.rawBinaryEnabled ?? false,
    };
    this.writeHeader();
  }

  /**
   * Creates a new SmileEncoder with a fresh writer.
   */
  public static create(options?: SmileEncoderOptions): SmileEncoder {
    return new SmileEncoder(new Writer() as SmileWriter, options);
  }

  /**
   * Encodes a value and returns the result as Uint8Array.
   */
  public encode(value: unknown): Uint8Array {
    this.writeAny(value);
    return this.writer.flush();
  }

  /**
   * Writes the 4-byte Smile header.
   */
  protected writeHeader(): void {
    this.writer.u8(HEADER.BYTE_0);
    this.writer.u8(HEADER.BYTE_1);
    this.writer.u8(HEADER.BYTE_2);
    
    let headerByte = HEADER.VERSION_CURRENT;
    if (this.options.rawBinaryEnabled) headerByte |= HEADER.RAW_BINARY_ENABLED;
    if (this.options.sharedStringValues) headerByte |= HEADER.SHARED_STRING_VALUES;
    if (this.options.sharedPropertyNames) headerByte |= HEADER.SHARED_PROPERTY_NAMES;
    
    this.writer.u8(headerByte);
  }

  /**
   * Writes any JavaScript value in value mode.
   */
  public writeAny(value: unknown): void {
    switch (typeof value) {
      case 'number':
        return this.writeNumber(value);
      case 'string':
        return this.writeString(value);
      case 'boolean':
        return this.writeBoolean(value);
      case 'object': {
        if (value === null) return this.writeNull();
        const constructor = value.constructor;
        switch (constructor) {
          case Object:
            return this.writeObject(value as Record<string, unknown>);
          case Array:
            return this.writeArray(value as unknown[]);
          case Uint8Array:
            return this.writeBinary(value as Uint8Array);
          case JsonPackExtension:
            return this.writeExtension(value as JsonPackExtension);
          case JsonPackValue:
            const buf = (value as JsonPackValue).val;
            return this.writer.buf(buf, buf.length);
          default:
            if (value instanceof Uint8Array) return this.writeBinary(value);
            if (Array.isArray(value)) return this.writeArray(value);
            if (typeof value === 'object') return this.writeObject(value as Record<string, unknown>);
            return this.writeNull();
        }
      }
      case 'undefined':
        return this.writeNull();
      default:
        return this.writeNull();
    }
  }

  /**
   * Writes null value.
   */
  protected writeNull(): void {
    this.writer.u8(VALUE_MODE.NULL);
  }

  /**
   * Writes boolean value.
   */
  protected writeBoolean(value: boolean): void {
    this.writer.u8(value ? VALUE_MODE.TRUE : VALUE_MODE.FALSE);
  }

  /**
   * Writes number value.
   */
  protected writeNumber(value: number): void {
    if (Number.isInteger(value)) {
      return this.writeInteger(value);
    } else {
      return this.writeFloat(value);
    }
  }

  /**
   * Writes integer value using appropriate encoding.
   */
  protected writeInteger(value: number): void {
    // Small integers (-16 to +15) use single byte encoding 
    if (value >= -16 && value <= 15) {
      this.writer.u8(VALUE_MODE.SMALL_INT_MIN + value + ENCODING.SMALL_INT_BIAS);
      return;
    }

    // Check if it fits in 32-bit signed integer
    if (value >= -0x80000000 && value <= 0x7fffffff) {
      this.writer.u8(VALUE_MODE.INT_32);
      writeVInt(this.writer, zigzagEncode(value));
    } else if (Number.isSafeInteger(value)) {
      // Use 64-bit encoding for safe integers beyond 32-bit range
      this.writer.u8(VALUE_MODE.INT_64);
      writeVInt(this.writer, zigzagEncode(value));
    } else {
      // For unsafe integers, convert to string representation to avoid precision loss
      // This is not strictly according to Smile spec but handles JavaScript limitations
      this.writeString(value.toString());
    }
  }

  /**
   * Writes floating point value.
   */
  protected writeFloat(value: number): void {
    // Check if it can be represented as 32-bit float without precision loss
    const float32 = Math.fround(value);
    if (float32 === value) {
      this.writer.u8(VALUE_MODE.FLOAT_32);
      const encoded = encodeFloat32(value);
      this.writer.buf(encoded, encoded.length);
    } else {
      this.writer.u8(VALUE_MODE.FLOAT_64);
      const encoded = encodeFloat64(value);
      this.writer.buf(encoded, encoded.length);
    }
  }

  /**
   * Writes string value with shared reference optimization.
   */
  protected writeString(value: string): void {
    if (value === '') {
      this.writer.u8(VALUE_MODE.EMPTY_STRING);
      return;
    }

    // Check for shared reference if enabled
    if (this.options.sharedStringValues && isStringShareable(value)) {
      const existingIndex = this.sharedValueMap.get(value);
      if (existingIndex !== undefined) {
        return this.writeSharedValueReference(existingIndex);
      }
    }

    const utf8Bytes = new TextEncoder().encode(value);
    const byteLength = utf8Bytes.length;

    // Determine if all characters are ASCII
    const isAscii = this.isAsciiString(value);

    if (isAscii) {
      // ASCII string encoding
      if (byteLength >= 1 && byteLength <= 32) {
        // Tiny ASCII
        this.writer.u8(VALUE_MODE.TINY_ASCII_MIN + byteLength - 1);
        this.writer.buf(utf8Bytes, byteLength);
      } else if (byteLength >= 33 && byteLength <= 64) {
        // Short ASCII  
        this.writer.u8(VALUE_MODE.SHORT_ASCII_MIN + byteLength - 33);
        this.writer.buf(utf8Bytes, byteLength);
      } else {
        // Long ASCII
        this.writer.u8(VALUE_MODE.LONG_ASCII_TEXT);
        this.writer.buf(utf8Bytes, byteLength);
        this.writer.u8(VALUE_MODE.END_STRING_MARKER);
      }
    } else {
      // Unicode string encoding
      if (byteLength >= 2 && byteLength <= 33) {
        // Tiny Unicode (note: length 1 not allowed for Unicode)
        this.writer.u8(VALUE_MODE.TINY_UNICODE_MIN + byteLength - 2);
        this.writer.buf(utf8Bytes, byteLength);
      } else if (byteLength >= 34 && byteLength <= 65) {
        // Short Unicode
        this.writer.u8(VALUE_MODE.SHORT_UNICODE_MIN + byteLength - 34);
        this.writer.buf(utf8Bytes, byteLength);
      } else {
        // Long Unicode
        this.writer.u8(VALUE_MODE.LONG_UNICODE_TEXT);
        this.writer.buf(utf8Bytes, byteLength);
        this.writer.u8(VALUE_MODE.END_STRING_MARKER);
      }
    }

    // Add to shared reference table if applicable
    if (this.options.sharedStringValues && isStringShareable(value)) {
      this.addSharedValue(value);
    }
  }

  /**
   * Writes a shared value string reference.
   */
  protected writeSharedValueReference(index: number): void {
    if (index < SHARED.MAX_SHORT_REFERENCE) {
      // Short reference (1 byte) - indices 0-30 map to tokens 0x01-0x1F
      this.writer.u8(VALUE_MODE.SHORT_SHARED_VALUE_MIN + index);
    } else {
      // Long reference (2 bytes) - for indices 31 and above
      const adjustedIndex = index - SHARED.MIN_LONG_REFERENCE; // Adjust for offset
      const highBits = (adjustedIndex >> 8) & 0x03;
      const lowBits = adjustedIndex & 0xff;
      this.writer.u8(VALUE_MODE.SHARED_STRING_LONG + highBits);
      this.writer.u8(lowBits);
    }
  }

  /**
   * Writes binary data using 7-bit safe encoding.
   */
  protected writeBinary(data: Uint8Array): void {
    if (this.options.rawBinaryEnabled) {
      this.writer.u8(VALUE_MODE.BINARY_RAW);
      writeVInt(this.writer, data.length);
      this.writer.buf(data, data.length);
    } else {
      this.writer.u8(VALUE_MODE.BINARY_7BIT);
      writeVInt(this.writer, data.length);
      const encoded = encodeSafeBinary(data);
      this.writer.buf(encoded, encoded.length);
    }
  }

  /**
   * Writes array value.
   */
  protected writeArray(arr: unknown[]): void {
    this.writer.u8(VALUE_MODE.START_ARRAY);
    for (const item of arr) {
      this.writeAny(item);
    }
    this.writer.u8(VALUE_MODE.END_ARRAY);
  }

  /**
   * Writes object value with key mode for property names.
   */
  protected writeObject(obj: Record<string, unknown>): void {
    this.writer.u8(VALUE_MODE.START_OBJECT);
    for (const [key, value] of Object.entries(obj)) {
      this.writeKey(key);
      this.writeAny(value);
    }
    this.writer.u8(KEY_MODE.END_OBJECT);
  }

  /**
   * Writes object property name in key mode.
   */
  protected writeKey(key: string): void {
    if (key === '') {
      this.writer.u8(KEY_MODE.EMPTY_STRING);
      return;
    }

    // Check for shared reference if enabled
    if (this.options.sharedPropertyNames) {
      const existingIndex = this.sharedKeyMap.get(key);
      if (existingIndex !== undefined) {
        return this.writeSharedKeyReference(existingIndex);
      }
    }

    const utf8Bytes = new TextEncoder().encode(key);
    const byteLength = utf8Bytes.length;
    const isAscii = this.isAsciiString(key);

    if (isAscii && byteLength >= 1 && byteLength <= 64) {
      // Short ASCII names
      this.writer.u8(KEY_MODE.SHORT_ASCII_MIN + byteLength - 1);
      this.writer.buf(utf8Bytes, byteLength);
    } else if (!isAscii && byteLength >= 2 && byteLength <= 57) {
      // Short Unicode names
      this.writer.u8(KEY_MODE.SHORT_UNICODE_MIN + byteLength - 2);
      this.writer.buf(utf8Bytes, byteLength);
    } else {
      // Long Unicode name
      this.writer.u8(KEY_MODE.LONG_UNICODE_NAME);
      this.writer.buf(utf8Bytes, byteLength);
      this.writer.u8(VALUE_MODE.END_STRING_MARKER);
    }

    // Add to shared reference table if applicable
    if (this.options.sharedPropertyNames) {
      this.addSharedKey(key);
    }
  }

  /**
   * Writes a shared key name reference.
   */
  protected writeSharedKeyReference(index: number): void {
    if (index <= 63) {
      // Short reference (1 byte)
      this.writer.u8(KEY_MODE.SHORT_SHARED_MIN + index);
    } else {
      // Long reference (2 bytes)
      const highBits = (index >> 8) & 0x03;
      const lowBits = index & 0xff;
      this.writer.u8(KEY_MODE.LONG_SHARED_MIN + highBits);
      this.writer.u8(lowBits);
    }
  }

  /**
   * Writes JsonPackExtension (not part of Smile spec, but for compatibility).
   */
  protected writeExtension(ext: JsonPackExtension): void {
    // Treat extensions as regular objects for Smile format
    this.writeObject({tag: ext.tag, val: ext.val});
  }

  /**
   * Adds a string to the shared value reference table.
   */
  protected addSharedValue(value: string): void {
    if (this.sharedValues.length >= SHARED.MAX_REFERENCES) {
      // Clear and restart
      this.sharedValues.length = 0;
      this.sharedValueMap.clear();
    }

    const index = this.sharedValues.length;
    if (!shouldAvoidReference(index)) {
      this.sharedValues.push(value);
      this.sharedValueMap.set(value, index);
    }
  }

  /**
   * Adds a key to the shared key reference table.
   */
  protected addSharedKey(key: string): void {
    if (this.sharedKeys.length >= SHARED.MAX_REFERENCES) {
      // Clear and restart
      this.sharedKeys.length = 0;
      this.sharedKeyMap.clear();
    }

    const index = this.sharedKeys.length;
    if (!shouldAvoidReference(index)) {
      this.sharedKeys.push(key);
      this.sharedKeyMap.set(key, index);
    }
  }

  /**
   * Checks if a string contains only ASCII characters.
   */
  protected isAsciiString(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 127) return false;
    }
    return true;
  }
}
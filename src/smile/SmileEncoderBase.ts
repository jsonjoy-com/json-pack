import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {JsonPackExtension} from '../JsonPackExtension';
import {JsonPackValue} from '../JsonPackValue';
import {HEADER, VALUE_MODE, KEY_MODE, SHARED, ENCODING} from './constants';
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
import type {BinaryJsonEncoder, StreamingBinaryJsonEncoder} from '../types';

export interface SmileEncoderOptions {
  sharedStringValues?: boolean;
  sharedPropertyNames?: boolean;
  rawBinaryEnabled?: boolean;
}

export type SmileWriter = IWriter & IWriterGrowable;

export class SmileEncoderBase<W extends SmileWriter = SmileWriter>
  implements BinaryJsonEncoder, StreamingBinaryJsonEncoder
{
  protected options: Required<SmileEncoderOptions>;
  protected sharedValues: string[] = [];
  protected sharedValueMap: Map<string, number> = new Map();
  protected sharedKeys: string[] = [];
  protected sharedKeyMap: Map<string, number> = new Map();

  constructor(public readonly writer: W = new Writer() as any, options: SmileEncoderOptions = {}) {
    this.options = {
      sharedStringValues: options.sharedStringValues ?? false,
      sharedPropertyNames: options.sharedPropertyNames ?? true,
      rawBinaryEnabled: options.rawBinaryEnabled ?? false,
    };
    this.writeHeader();
  }

  public encode(value: unknown): Uint8Array {
    this.writeAny(value);
    return this.writer.flush();
  }

  public writeHeader(): void {
    this.writer.u8(HEADER.BYTE_0);
    this.writer.u8(HEADER.BYTE_1);
    this.writer.u8(HEADER.BYTE_2);
    let flags = HEADER.VERSION_CURRENT;
    if (this.options.rawBinaryEnabled) flags |= HEADER.RAW_BINARY_ENABLED;
    if (this.options.sharedStringValues) flags |= HEADER.SHARED_STRING_VALUES;
    if (this.options.sharedPropertyNames) flags |= HEADER.SHARED_PROPERTY_NAMES;
    this.writer.u8(flags);
  }

  public writeAny(value: unknown): void {
    switch (typeof value) {
      case 'number':
        return this.writeNumber(value);
      case 'string':
        return this.writeStr(value);
      case 'boolean':
        return this.writeBoolean(value);
      case 'object': {
        if (value === null) return this.writeNull();
        const constructor = value.constructor;
        switch (constructor) {
          case Array:
            return this.writeArr(value as unknown[]);
          case Object:
            return this.writeObj(value as Record<string, unknown>);
          case Uint8Array:
            return this.writeBin(value as Uint8Array);
          case JsonPackExtension:
            return this.writeAny((value as JsonPackExtension).val);
          case JsonPackValue:
            const buf = (value as JsonPackValue).val;
            return this.writer.buf(buf, buf.length);
          default:
            if (value instanceof Uint8Array) return this.writeBin(value);
            if (Array.isArray(value)) return this.writeArr(value);
            return this.writeObj(value as Record<string, unknown>);
        }
      }
      case 'undefined':
        return this.writeNull();
      default:
        return this.writeNull();
    }
  }

  public writeNull(): void {
    this.writer.u8(VALUE_MODE.NULL);
  }

  public writeBoolean(bool: boolean): void {
    this.writer.u8(bool ? VALUE_MODE.TRUE : VALUE_MODE.FALSE);
  }

  public writeNumber(num: number): void {
    if (Number.isInteger(num)) {
      return this.writeInteger(num);
    } else {
      return this.writeFloat(num);
    }
  }

  public writeInteger(int: number): void {
    if (int >= -16 && int <= 15) {
      this.writer.u8(VALUE_MODE.SMALL_INT_MIN + (int + ENCODING.SMALL_INT_BIAS));
    } else if (Number.isSafeInteger(int)) {
      this.writer.u8(VALUE_MODE.INT_32);
      writeVInt(this.writer, zigzagEncode(int));
    } else {
      this.writeStr(int.toString());
    }
  }

  public writeUInteger(uint: number): void {
    this.writeInteger(uint);
  }

  public writeFloat(float: number): void {
    const float32 = Math.fround(float);
    if (float32 === float) {
      this.writer.u8(VALUE_MODE.FLOAT_32);
      const encoded = encodeFloat32(float32);
      this.writer.buf(encoded, encoded.length);
    } else {
      this.writer.u8(VALUE_MODE.FLOAT_64);
      const encoded = encodeFloat64(float);
      this.writer.buf(encoded, encoded.length);
    }
  }

  public writeBin(buf: Uint8Array): void {
    if (this.options.rawBinaryEnabled) {
      this.writer.u8(VALUE_MODE.BINARY_RAW);
      writeVInt(this.writer, buf.length);
      this.writer.buf(buf, buf.length);
    } else {
      this.writer.u8(VALUE_MODE.BINARY_7BIT);
      const encoded = encodeSafeBinary(buf);
      writeVInt(this.writer, encoded.length);
      this.writer.buf(encoded, encoded.length);
    }
  }

  public writeAsciiStr(str: string): void {
    this.writeStr(str);
  }

  public writeStr(str: string): void {
    if (str.length === 0) {
      this.writer.u8(VALUE_MODE.EMPTY_STRING);
      return;
    }
    if (this.options.sharedStringValues && this.tryWriteSharedString(str)) {
      return;
    }
    const utf8 = new TextEncoder().encode(str);
    const isAscii = utf8.length === str.length;
    if (isAscii) {
      if (str.length <= 31) {
        if (str.length === 1 && utf8[0] >= 0x20 && utf8[0] <= 0x5f) {
          this.writer.u8(VALUE_MODE.TINY_ASCII_MIN + utf8[0] - 0x20);
        } else {
          this.writer.u8(VALUE_MODE.SHORT_ASCII_MIN + str.length - 2);
          this.writer.buf(utf8, utf8.length);
        }
      } else {
          this.writer.u8(VALUE_MODE.SHORT_ASCII_MIN + str.length - 2);
          this.writer.buf(utf8, utf8.length);
        }
      } else {
        this.writer.u8(VALUE_MODE.LONG_ASCII_TEXT);
        writeVInt(this.writer, utf8.length);
        this.writer.buf(utf8, utf8.length);
        this.writer.u8(VALUE_MODE.END_STRING_MARKER);
      }
    } else {
      if (str.length <= 33) {
        if (str.length === 1) {
          this.writer.u8(VALUE_MODE.TINY_UNICODE_MIN + (utf8.length - 2));
          this.writer.buf(utf8, utf8.length);
        } else {
          this.writer.u8(VALUE_MODE.SHORT_UNICODE_MIN + str.length - 2);
          this.writer.buf(utf8, utf8.length);
        }
      } else {
        this.writer.u8(VALUE_MODE.LONG_UNICODE_TEXT);
        writeVInt(this.writer, utf8.length);
        this.writer.buf(utf8, utf8.length);
        this.writer.u8(VALUE_MODE.END_STRING_MARKER);
      }
    }
    if (this.options.sharedStringValues && isStringShareable(str)) {
      this.addSharedString(str);
    }
  }

  public writeArr(arr: unknown[]): void {
    this.writer.u8(VALUE_MODE.START_ARRAY);
    for (const item of arr) {
      this.writeAny(item);
    }
    this.writer.u8(VALUE_MODE.END_ARRAY);
  }

  public writeObj(obj: Record<string, unknown>): void {
    this.writer.u8(VALUE_MODE.START_OBJECT);
    for (const [key, value] of Object.entries(obj)) {
      this.writeKey(key);
      this.writeAny(value);
    }
    this.writer.u8(KEY_MODE.END_OBJECT);
  }

  protected writeKey(key: string): void {
    if (key.length === 0) {
      this.writer.u8(KEY_MODE.EMPTY_STRING);
      return;
    }
    if (this.options.sharedPropertyNames && this.tryWriteSharedKey(key)) {
      return;
    }
    const utf8 = new TextEncoder().encode(key);
    const isAscii = utf8.length === key.length;
    if (isAscii && key.length <= 63) {
      this.writer.u8(KEY_MODE.SHORT_ASCII_MIN + key.length - 1);
      this.writer.buf(utf8, utf8.length);
    } else if (key.length <= 56) {
      this.writer.u8(KEY_MODE.SHORT_UNICODE_MIN + key.length - 1);
      this.writer.buf(utf8, utf8.length);
    } else {
      this.writer.u8(KEY_MODE.LONG_UNICODE_NAME);
      writeVInt(this.writer, utf8.length);
      this.writer.buf(utf8, utf8.length);
      this.writer.u8(VALUE_MODE.END_STRING_MARKER);
    }
    if (this.options.sharedPropertyNames && isStringShareable(key)) {
      this.addSharedKey(key);
    }
  }

  protected tryWriteSharedString(str: string): boolean {
    const index = this.sharedValueMap.get(str);
    if (index === undefined) return false;
    if (index <= SHARED.MAX_SHORT_REFERENCE) {
      this.writer.u8(VALUE_MODE.SHORT_SHARED_VALUE_MIN + index);
    } else {
      this.writer.u8(VALUE_MODE.SHARED_STRING_LONG);
      writeVInt(this.writer, index - SHARED.MIN_LONG_REFERENCE);
    }
    return true;
  }

  protected tryWriteSharedKey(key: string): boolean {
    const index = this.sharedKeyMap.get(key);
    if (index === undefined) return false;
    if (index <= 63) {
      this.writer.u8(KEY_MODE.SHORT_SHARED_MIN + index);
    } else {
      this.writer.u8(KEY_MODE.LONG_SHARED_MIN + ((index - 64) >> 8));
      this.writer.u8((index - 64) & 0xff);
    }
    return true;
  }

  protected addSharedString(str: string): void {
    if (this.sharedValues.length >= SHARED.MAX_REFERENCES) {
      this.sharedValues.shift();
      this.sharedValueMap.clear();
      for (let i = 0; i < this.sharedValues.length; i++) {
        this.sharedValueMap.set(this.sharedValues[i], i);
      }
    }
    const index = this.sharedValues.length;
    this.sharedValues.push(str);
    this.sharedValueMap.set(str, index);
  }

  protected addSharedKey(key: string): void {
    if (this.sharedKeys.length >= SHARED.MAX_REFERENCES) {
      this.sharedKeys.shift();
      this.sharedKeyMap.clear();
      for (let i = 0; i < this.sharedKeys.length; i++) {
        this.sharedKeyMap.set(this.sharedKeys[i], i);
      }
    }
    const index = this.sharedKeys.length;
    this.sharedKeys.push(key);
    this.sharedKeyMap.set(key, index);
  }

  // StreamingBinaryJsonEncoder methods
  public writeStartStr(): void {
    this.writer.u8(VALUE_MODE.LONG_ASCII_TEXT);
  }

  public writeStrChunk(str: string): void {
    const utf8 = new TextEncoder().encode(str);
    this.writer.buf(utf8, utf8.length);
  }

  public writeEndStr(): void {
    this.writer.u8(VALUE_MODE.END_STRING_MARKER);
  }

  public writeStartBin(): void {
    this.writer.u8(VALUE_MODE.BINARY_7BIT);
  }

  public writeBinChunk(buf: Uint8Array): void {
    const encoded = encodeSafeBinary(buf);
    this.writer.buf(encoded, encoded.length);
  }

  public writeEndBin(): void {
    // No end marker needed for binary
  }

  public writeStartArr(): void {
    this.writer.u8(VALUE_MODE.START_ARRAY);
  }

  public writeArrChunk(item: unknown): void {
    this.writeAny(item);
  }

  public writeEndArr(): void {
    this.writer.u8(VALUE_MODE.END_ARRAY);
  }

  public writeStartObj(): void {
    this.writer.u8(VALUE_MODE.START_OBJECT);
  }

  public writeObjChunk(key: string, value: unknown): void {
    this.writeKey(key);
    this.writeAny(value);
  }

  public writeEndObj(): void {
    this.writer.u8(KEY_MODE.END_OBJECT);
  }
}
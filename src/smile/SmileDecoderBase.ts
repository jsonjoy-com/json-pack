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
import type {BinaryJsonDecoder, PackValue} from '../types';

export interface SmileDecoderOptions {
  maxSharedReferences?: number;
}

export interface SmileHeader {
  version: number;
  sharedStringValues: boolean;
  sharedPropertyNames: boolean;
  rawBinaryEnabled: boolean;
}

export type SmileReader = IReader & IReaderResettable;

export class SmileDecoderBase<R extends SmileReader = SmileReader>
  implements BinaryJsonDecoder
{
  protected options: Required<SmileDecoderOptions>;
  protected header!: SmileHeader;
  protected sharedValues: string[] = [];
  protected sharedKeys: string[] = [];

  constructor(
    public reader: R = new Reader() as any,
    options: SmileDecoderOptions = {}
  ) {
    this.options = {
      maxSharedReferences: options.maxSharedReferences ?? SHARED.MAX_REFERENCES,
    };
  }

  public read(uint8: Uint8Array): PackValue {
    this.reader.reset(uint8);
    this.readHeader();
    return this.val() as PackValue;
  }

  public decode(uint8: Uint8Array): unknown {
    this.reader.reset(uint8);
    this.readHeader();
    return this.val();
  }

  public readHeader(): void {
    if (this.reader.u8() !== HEADER.BYTE_0 ||
        this.reader.u8() !== HEADER.BYTE_1 ||
        this.reader.u8() !== HEADER.BYTE_2) {
      throw new Error(ERROR.INVALID_HEADER);
    }
    const flags = this.reader.u8();
    const version = (flags & HEADER.VERSION_MASK) >> 4;
    if (version !== 0) {
      throw new Error(ERROR.UNSUPPORTED_VERSION);
    }
    this.header = {
      version,
      sharedStringValues: (flags & HEADER.SHARED_STRING_VALUES) !== 0,
      sharedPropertyNames: (flags & HEADER.SHARED_PROPERTY_NAMES) !== 0,
      rawBinaryEnabled: (flags & HEADER.RAW_BINARY_ENABLED) !== 0,
    };
  }

  public val(): unknown {
    const token = this.reader.u8();
    return this.readValueByToken(token);
  }

  protected readValueByToken(token: number): unknown {
    if (token >= VALUE_MODE.SHORT_SHARED_VALUE_MIN && token <= VALUE_MODE.SHORT_SHARED_VALUE_MAX) {
      return this.readSharedString(token - VALUE_MODE.SHORT_SHARED_VALUE_MIN);
    }
    
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
        return zigzagDecode(readVInt(this.reader));
      case VALUE_MODE.INT_64:
        return zigzagDecode(readVInt(this.reader));
      case VALUE_MODE.BIG_INTEGER:
        return this.readString();
      case VALUE_MODE.FLOAT_32:
        return this.readFloat32();
      case VALUE_MODE.FLOAT_64:
        return this.readFloat64();
      case VALUE_MODE.LONG_ASCII_TEXT:
        return this.readLongString();
      case VALUE_MODE.LONG_UNICODE_TEXT:
        return this.readLongString();
      case VALUE_MODE.BINARY_7BIT:
        return this.readBinary();
      case VALUE_MODE.BINARY_RAW:
        return this.readRawBinary();
      case VALUE_MODE.SHARED_STRING_LONG:
        return this.readLongSharedString();
      case VALUE_MODE.START_ARRAY:
        return this.readArray();
      case VALUE_MODE.START_OBJECT:
        return this.readObject();
      default:
        return this.readByTokenRange(token);
    }
  }

  protected readByTokenRange(token: number): unknown {
    if (token >= VALUE_MODE.TINY_ASCII_MIN && token <= VALUE_MODE.TINY_ASCII_MAX) {
      return String.fromCharCode(token - VALUE_MODE.TINY_ASCII_MIN + 0x20);
    }
    if (token >= VALUE_MODE.SHORT_ASCII_MIN && token <= VALUE_MODE.SHORT_ASCII_MAX) {
      const length = token - VALUE_MODE.SHORT_ASCII_MIN + 2;
      return this.readFixedString(length);
    }
    if (token >= VALUE_MODE.TINY_UNICODE_MIN && token <= VALUE_MODE.TINY_UNICODE_MAX) {
      const byteLength = token - VALUE_MODE.TINY_UNICODE_MIN + 2;
      return this.readFixedUtf8String(byteLength);
    }
    if (token >= VALUE_MODE.SHORT_UNICODE_MIN && token <= VALUE_MODE.SHORT_UNICODE_MAX) {
      const charLength = token - VALUE_MODE.SHORT_UNICODE_MIN + 2;
      return this.readVariableUtf8String(charLength);
    }
    if (token >= VALUE_MODE.SMALL_INT_MIN && token <= VALUE_MODE.SMALL_INT_MAX) {
      return token - VALUE_MODE.SMALL_INT_MIN - 16;
    }
    throw new Error(ERROR.INVALID_TOKEN);
  }

  protected readString(): string {
    const length = readVInt(this.reader);
    const bytes = this.reader.buf(length);
    const str = new TextDecoder().decode(bytes);
    this.addSharedString(str);
    return str;
  }

  protected readFixedString(length: number): string {
    const bytes = this.reader.buf(length);
    const str = new TextDecoder().decode(bytes);
    this.addSharedString(str);
    return str;
  }

  protected readFixedUtf8String(byteLength: number): string {
    const bytes = this.reader.buf(byteLength);
    const str = new TextDecoder().decode(bytes);
    this.addSharedString(str);
    return str;
  }

  protected readVariableUtf8String(charLength: number): string {
    const bytes: number[] = [];
    for (let i = 0; i < charLength; i++) {
      const byte = this.reader.u8();
      bytes.push(byte);
    }
    const str = new TextDecoder().decode(new Uint8Array(bytes));
    this.addSharedString(str);
    return str;
  }

  protected readLongString(): string {
    const length = readVInt(this.reader);
    const bytes = this.reader.buf(length);
    const endMarker = this.reader.u8();
    if (endMarker !== VALUE_MODE.END_STRING_MARKER) {
      throw new Error(ERROR.INVALID_TOKEN);
    }
    const str = new TextDecoder().decode(bytes);
    this.addSharedString(str);
    return str;
  }

  protected readFloat32(): number {
    const bytes = this.reader.buf(5);
    return decodeFloat32(bytes);
  }

  protected readFloat64(): number {
    const bytes = this.reader.buf(10);
    return decodeFloat64(bytes);
  }

  protected readBinary(): Uint8Array {
    const encodedLength = readVInt(this.reader);
    const encoded = this.reader.buf(encodedLength);
    // Calculate original length: each 7 bits of encoded data represents 8 bits of original data
    const originalLength = Math.floor((encodedLength * 7) / 8);
    return decodeSafeBinary(encoded, originalLength);
  }

  protected readRawBinary(): Uint8Array {
    const length = readVInt(this.reader);
    const bytes = this.reader.buf(length);
    return bytes;
  }

  protected readSharedString(index: number): string {
    if (index >= this.sharedValues.length) {
      throw new Error(ERROR.INVALID_REFERENCE);
    }
    return this.sharedValues[index];
  }

  protected readLongSharedString(): string {
    const offset = readVInt(this.reader);
    const index = offset + SHARED.MIN_LONG_REFERENCE;
    if (index >= this.sharedValues.length) {
      throw new Error(ERROR.INVALID_REFERENCE);
    }
    return this.sharedValues[index];
  }

  protected readArray(): unknown[] {
    const arr: unknown[] = [];
    while (true) {
      const token = this.reader.u8();
      if (token === VALUE_MODE.END_ARRAY) break;
      arr.push(this.readValueByToken(token));
    }
    return arr;
  }

  protected readObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    while (true) {
      const keyToken = this.reader.u8();
      if (keyToken === KEY_MODE.END_OBJECT) break;
      const key = this.readKeyByToken(keyToken);
      const value = this.val();
      obj[key] = value;
    }
    return obj;
  }

  protected readKeyByToken(token: number): string {
    if (token === KEY_MODE.EMPTY_STRING) {
      return '';
    }
    if (token >= KEY_MODE.SHORT_SHARED_MIN && token <= KEY_MODE.SHORT_SHARED_MAX) {
      const index = token - KEY_MODE.SHORT_SHARED_MIN;
      return this.readSharedKey(index);
    }
    if (token >= KEY_MODE.LONG_SHARED_MIN && token <= KEY_MODE.LONG_SHARED_MAX) {
      const highByte = token - KEY_MODE.LONG_SHARED_MIN;
      const lowByte = this.reader.u8();
      const index = (highByte << 8) | lowByte + 64;
      return this.readSharedKey(index);
    }
    if (token >= KEY_MODE.SHORT_ASCII_MIN && token <= KEY_MODE.SHORT_ASCII_MAX) {
      const length = token - KEY_MODE.SHORT_ASCII_MIN + 1;
      return this.readFixedKey(length);
    }
    if (token >= KEY_MODE.SHORT_UNICODE_MIN && token <= KEY_MODE.SHORT_UNICODE_MAX) {
      const length = token - KEY_MODE.SHORT_UNICODE_MIN + 1;
      return this.readVariableKey(length);
    }
    if (token === KEY_MODE.LONG_UNICODE_NAME) {
      return this.readLongKey();
    }
    throw new Error(ERROR.INVALID_TOKEN);
  }

  protected readFixedKey(length: number): string {
    const bytes = this.reader.buf(length);
    const key = new TextDecoder().decode(bytes);
    this.addSharedKey(key);
    return key;
  }

  protected readVariableKey(length: number): string {
    const bytes: number[] = [];
    for (let i = 0; i < length; i++) {
      bytes.push(this.reader.u8());
    }
    const key = new TextDecoder().decode(new Uint8Array(bytes));
    this.addSharedKey(key);
    return key;
  }

  protected readLongKey(): string {
    const length = readVInt(this.reader);
    const bytes = this.reader.buf(length);
    const endMarker = this.reader.u8();
    if (endMarker !== VALUE_MODE.END_STRING_MARKER) {
      throw new Error(ERROR.INVALID_TOKEN);
    }
    const key = new TextDecoder().decode(bytes);
    this.addSharedKey(key);
    return key;
  }

  protected readSharedKey(index: number): string {
    if (index >= this.sharedKeys.length) {
      throw new Error(ERROR.INVALID_REFERENCE);
    }
    return this.sharedKeys[index];
  }

  protected addSharedString(str: string): void {
    if (!this.header.sharedStringValues) return;
    if (this.sharedValues.length >= this.options.maxSharedReferences) {
      this.sharedValues.shift();
    }
    this.sharedValues.push(str);
  }

  protected addSharedKey(key: string): void {
    if (!this.header.sharedPropertyNames) return;
    if (this.sharedKeys.length >= this.options.maxSharedReferences) {
      this.sharedKeys.shift();
    }
    this.sharedKeys.push(key);
  }
}
import {toBase64Bin} from '@jsonjoy.com/base64/lib/toBase64Bin';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';
import type {BinaryJsonEncoder} from '../types';
import type {CsonEncoderOptions} from './types';

export class CsonEncoder implements BinaryJsonEncoder {
  public readonly options: Required<CsonEncoderOptions>;

  constructor(
    public readonly writer: IWriter & IWriterGrowable,
    options: CsonEncoderOptions = {}
  ) {
    this.options = {
      indent: options.indent ?? 2,
      includeComments: options.includeComments ?? false,
    };
  }

  public encode(value: unknown): Uint8Array {
    const writer = this.writer;
    writer.reset();
    this.writeAny(value, 0);
    return writer.flush();
  }

  /**
   * Called when the encoder encounters a value that it does not know how to encode.
   *
   * @param value Some JavaScript value.
   */
  public writeUnknown(value: unknown): void {
    this.writeNull();
  }

  public writeAny(value: unknown, depth: number = 0): void {
    switch (typeof value) {
      case 'boolean':
        return this.writeBoolean(value);
      case 'number':
        return this.writeNumber(value as number);
      case 'string':
        return this.writeStr(value);
      case 'object': {
        if (value === null) return this.writeNull();
        const constructor = value.constructor;
        switch (constructor) {
          case Object:
            return this.writeObj(value as Record<string, unknown>, depth);
          case Array:
            return this.writeArr(value as unknown[], depth);
          case Uint8Array:
            return this.writeBin(value as Uint8Array);
          default:
            if (value instanceof Uint8Array) return this.writeBin(value);
            if (Array.isArray(value)) return this.writeArr(value, depth);
            return this.writeUnknown(value);
        }
      }
      case 'undefined': {
        return this.writeUndef();
      }
      default:
        return this.writeUnknown(value);
    }
  }

  public writeNull(): void {
    this.writer.ascii('null');
  }

  public writeUndef(): void {
    this.writer.ascii('undefined');
  }

  public writeBoolean(bool: boolean): void {
    this.writer.ascii(bool ? 'true' : 'false');
  }

  public writeNumber(num: number): void {
    const str = num.toString();
    this.writer.ascii(str);
  }

  public writeInteger(int: number): void {
    this.writeNumber(int >> 0 === int ? int : Math.trunc(int));
  }

  public writeUInteger(uint: number): void {
    this.writeInteger(uint < 0 ? -uint : uint);
  }

  public writeFloat(float: number): void {
    this.writeNumber(float);
  }

  public writeBin(buf: Uint8Array): void {
    // Convert binary data to base64 string in CSON format  
    const writer = this.writer;
    const length = buf.length;
    
    writer.ascii("Buffer.from('");
    
    // Use the existing base64 utility from the json-pack library
    const tempBuffer = new ArrayBuffer(((length + 2) / 3) * 4);
    const tempView = new DataView(tempBuffer);
    const base64Length = toBase64Bin(buf, 0, length, tempView, 0);
    const base64Array = new Uint8Array(tempBuffer, 0, base64Length);
    const base64String = new TextDecoder().decode(base64Array);
    
    writer.ascii(base64String);
    writer.ascii("', 'base64')");
  }

  public writeStr(str: string): void {
    if (this.isMultilineString(str)) {
      this.writeMultilineStr(str);
    } else {
      this.writeSingleQuotedStr(str);
    }
  }

  private isMultilineString(str: string): boolean {
    return str.includes('\n') && str.length > 40;
  }

  private writeMultilineStr(str: string): void {
    this.writer.ascii("'''");
    this.writer.ascii('\n');
    this.writer.ascii(str);
    this.writer.ascii('\n');
    this.writer.ascii("'''");
  }

  private writeSingleQuotedStr(str: string): void {
    this.writer.ascii("'");
    // Escape single quotes within the string
    const escaped = str.replace(/'/g, "\\'");
    this.writer.ascii(escaped);
    this.writer.ascii("'");
  }

  public writeAsciiStr(str: string): void {
    this.writeStr(str);
  }

  public writeArr(arr: unknown[], depth: number = 0): void {
    const writer = this.writer;
    if (arr.length === 0) {
      writer.ascii('[]');
      return;
    }

    writer.ascii('[');
    writer.ascii('\n');

    const nextDepth = depth + 1;
    const indentStr = ' '.repeat(nextDepth * this.options.indent);

    for (let i = 0; i < arr.length; i++) {
      writer.ascii(indentStr);
      this.writeAny(arr[i], nextDepth);
      if (i < arr.length - 1) {
        // No comma needed in CSON arrays
      }
      writer.ascii('\n');
    }

    const currentIndentStr = ' '.repeat(depth * this.options.indent);
    writer.ascii(currentIndentStr);
    writer.ascii(']');
  }

  public writeObj(obj: Record<string, unknown>, depth: number = 0): void {
    const writer = this.writer;
    const keys = Object.keys(obj);
    const length = keys.length;

    if (length === 0) {
      writer.ascii('{}');
      return;
    }

    // For root level objects, we can omit the braces
    const isRootLevel = depth === 0;
    const currentIndentStr = ' '.repeat(depth * this.options.indent);
    const nextDepth = depth + 1;
    const nextIndentStr = ' '.repeat(nextDepth * this.options.indent);

    if (!isRootLevel) {
      writer.ascii('{\n');
    }

    for (let i = 0; i < length; i++) {
      const key = keys[i];
      const value = obj[key];

      if (!isRootLevel) {
        writer.ascii(nextIndentStr);
      }

      // Write key without quotes if it's a valid identifier
      if (this.isValidIdentifier(key)) {
        writer.ascii(key);
      } else {
        this.writeSingleQuotedStr(key);
      }

      writer.ascii(': ');
      this.writeAny(value, nextDepth);

      if (i < length - 1 || !isRootLevel) {
        writer.ascii('\n');
      }
    }

    if (!isRootLevel) {
      writer.ascii(currentIndentStr);
      writer.ascii('}');
    }
  }

  private isValidIdentifier(key: string): boolean {
    // Check if key is a valid CoffeeScript identifier
    if (!key || /^\d/.test(key)) {
      return false;
    }
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
  }
}
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/buffers/lib';
import type {BinaryJsonEncoder} from '../types';

/**
 * XDR (External Data Representation) binary encoder for basic value encoding.
 * Implements XDR binary encoding according to RFC 4506.
 * 
 * Key XDR encoding principles:
 * - All data types are aligned to 4-byte boundaries
 * - Multi-byte quantities are transmitted in big-endian byte order
 * - Strings and opaque data are padded to 4-byte boundaries
 * - Variable-length arrays and strings are preceded by their length
 */
export class XdrEncoder implements BinaryJsonEncoder {
  constructor(public readonly writer: IWriter & IWriterGrowable) {}

  public encode(value: unknown): Uint8Array {
    const writer = this.writer;
    writer.reset();
    this.writeAny(value);
    return writer.flush();
  }

  /**
   * Called when the encoder encounters a value that it does not know how to encode.
   */
  public writeUnknown(value: unknown): void {
    this.writeVoid();
  }

  public writeAny(value: unknown): void {
    switch (typeof value) {
      case 'boolean':
        return this.writeBoolean(value);
      case 'number':
        return this.writeNumber(value);
      case 'string':
        return this.writeStr(value);
      case 'object': {
        if (value === null) return this.writeVoid();
        const constructor = value.constructor;
        switch (constructor) {
          case Object:
            return this.writeObj(value as Record<string, unknown>);
          case Array:
            return this.writeArr(value as unknown[]);
          case Uint8Array:
            return this.writeBin(value as Uint8Array);
          default:
            return this.writeUnknown(value);
        }
      }
      case 'bigint':
        return this.writeHyper(value);
      case 'undefined':
        return this.writeVoid();
      default:
        return this.writeUnknown(value);
    }
  }

  /**
   * Writes an XDR void value (no data is actually written).
   */
  public writeVoid(): void {
    // Void values are encoded as no data
  }

  /**
   * Writes an XDR null value (for interface compatibility).
   */
  public writeNull(): void {
    this.writeVoid();
  }

  /**
   * Writes an XDR boolean value as a 4-byte integer.
   */
  public writeBoolean(bool: boolean): void {
    this.writeInt(bool ? 1 : 0);
  }

  /**
   * Writes an XDR signed 32-bit integer in big-endian format.
   */
  public writeInt(int: number): void {
    const writer = this.writer;
    writer.ensureCapacity(4);
    writer.view.setInt32(writer.x, Math.trunc(int), false); // big-endian
    writer.move(4);
  }

  /**
   * Writes an XDR unsigned 32-bit integer in big-endian format.
   */
  public writeUnsignedInt(uint: number): void {
    const writer = this.writer;
    writer.ensureCapacity(4);
    writer.view.setUint32(writer.x, Math.trunc(uint) >>> 0, false); // big-endian
    writer.move(4);
  }

  /**
   * Writes an XDR signed 64-bit integer (hyper) in big-endian format.
   */
  public writeHyper(hyper: number | bigint): void {
    const writer = this.writer;
    writer.ensureCapacity(8);
    
    if (typeof hyper === 'bigint') {
      // Convert bigint to two 32-bit values for big-endian encoding
      const high = Number((hyper >> BigInt(32)) & BigInt(0xFFFFFFFF));
      const low = Number(hyper & BigInt(0xFFFFFFFF));
      writer.view.setInt32(writer.x, high, false); // high 32 bits
      writer.view.setUint32(writer.x + 4, low, false); // low 32 bits
    } else {
      const truncated = Math.trunc(hyper);
      const high = Math.floor(truncated / 0x100000000);
      const low = truncated >>> 0;
      writer.view.setInt32(writer.x, high, false); // high 32 bits
      writer.view.setUint32(writer.x + 4, low, false); // low 32 bits
    }
    writer.move(8);
  }

  /**
   * Writes an XDR unsigned 64-bit integer (unsigned hyper) in big-endian format.
   */
  public writeUnsignedHyper(uhyper: number | bigint): void {
    const writer = this.writer;
    writer.ensureCapacity(8);
    
    if (typeof uhyper === 'bigint') {
      // Convert bigint to two 32-bit values for big-endian encoding
      const high = Number((uhyper >> BigInt(32)) & BigInt(0xFFFFFFFF));
      const low = Number(uhyper & BigInt(0xFFFFFFFF));
      writer.view.setUint32(writer.x, high, false); // high 32 bits
      writer.view.setUint32(writer.x + 4, low, false); // low 32 bits
    } else {
      const truncated = Math.trunc(Math.abs(uhyper));
      const high = Math.floor(truncated / 0x100000000);
      const low = truncated >>> 0;
      writer.view.setUint32(writer.x, high, false); // high 32 bits
      writer.view.setUint32(writer.x + 4, low, false); // low 32 bits
    }
    writer.move(8);
  }

  /**
   * Writes an XDR float value using IEEE 754 single-precision in big-endian format.
   */
  public writeFloat(float: number): void {
    const writer = this.writer;
    writer.ensureCapacity(4);
    writer.view.setFloat32(writer.x, float, false); // big-endian
    writer.move(4);
  }

  /**
   * Writes an XDR double value using IEEE 754 double-precision in big-endian format.
   */
  public writeDouble(double: number): void {
    const writer = this.writer;
    writer.ensureCapacity(8);
    writer.view.setFloat64(writer.x, double, false); // big-endian
    writer.move(8);
  }

  /**
   * Writes an XDR quadruple value (128-bit float).
   * Note: JavaScript doesn't have native 128-bit float support, so this is a placeholder.
   */
  public writeQuadruple(quad: number): void {
    // Write as two doubles for now (this is not standard XDR)
    this.writeDouble(quad);
    this.writeDouble(0); // padding
  }

  /**
   * Writes XDR opaque data with fixed length.
   * Data is padded to 4-byte boundary.
   */
  public writeOpaque(data: Uint8Array, size: number): void {
    if (data.length !== size) {
      throw new Error(`Opaque data length ${data.length} does not match expected size ${size}`);
    }
    
    const writer = this.writer;
    const paddedSize = this.getPaddedSize(size);
    writer.ensureCapacity(paddedSize);
    
    // Write data
    writer.buf(data, size);
    
    // Write padding bytes
    const padding = paddedSize - size;
    for (let i = 0; i < padding; i++) {
      writer.u8(0);
    }
  }

  /**
   * Writes XDR variable-length opaque data.
   * Length is written first, followed by data padded to 4-byte boundary.
   */
  public writeVarlenOpaque(data: Uint8Array): void {
    this.writeUnsignedInt(data.length);
    
    const writer = this.writer;
    const paddedSize = this.getPaddedSize(data.length);
    writer.ensureCapacity(paddedSize);
    
    // Write data
    writer.buf(data, data.length);
    
    // Write padding bytes
    const padding = paddedSize - data.length;
    for (let i = 0; i < padding; i++) {
      writer.u8(0);
    }
  }

  /**
   * Writes an XDR string with UTF-8 encoding.
   * Length is written first, followed by UTF-8 bytes padded to 4-byte boundary.
   */
  public writeStr(str: string): void {
    const writer = this.writer;
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(str);
    
    // Write length
    this.writeUnsignedInt(utf8Bytes.length);
    
    // Write string data with padding
    const paddedSize = this.getPaddedSize(utf8Bytes.length);
    writer.ensureCapacity(paddedSize);
    
    // Write UTF-8 bytes
    writer.buf(utf8Bytes, utf8Bytes.length);
    
    // Write padding bytes
    const padding = paddedSize - utf8Bytes.length;
    for (let i = 0; i < padding; i++) {
      writer.u8(0);
    }
  }

  /**
   * Writes XDR variable-length array.
   * Length is written first, followed by array elements.
   */
  public writeArr(arr: unknown[]): void {
    this.writeUnsignedInt(arr.length);
    for (const item of arr) {
      this.writeAny(item);
    }
  }

  /**
   * Writes XDR structure as a simple mapping (not standard XDR, for compatibility).
   */
  public writeObj(obj: Record<string, unknown>): void {
    const entries = Object.entries(obj);
    this.writeUnsignedInt(entries.length);
    for (const [key, value] of entries) {
      this.writeStr(key);
      this.writeAny(value);
    }
  }

  // BinaryJsonEncoder interface methods

  /**
   * Generic number writing - determines type based on value
   */
  public writeNumber(num: number): void {
    if (Number.isInteger(num)) {
      if (num >= -2147483648 && num <= 2147483647) {
        this.writeInt(num);
      } else {
        this.writeHyper(num);
      }
    } else {
      this.writeDouble(num);
    }
  }

  /**
   * Writes an integer value
   */
  public writeInteger(int: number): void {
    this.writeInt(int);
  }

  /**
   * Writes an unsigned integer value
   */
  public writeUInteger(uint: number): void {
    this.writeUnsignedInt(uint);
  }

  /**
   * Writes binary data
   */
  public writeBin(buf: Uint8Array): void {
    this.writeVarlenOpaque(buf);
  }

  /**
   * Writes an ASCII string (same as regular string in XDR)
   */
  public writeAsciiStr(str: string): void {
    this.writeStr(str);
  }

  /**
   * Calculates the padded size for 4-byte alignment.
   */
  private getPaddedSize(size: number): number {
    return Math.ceil(size / 4) * 4;
  }
}
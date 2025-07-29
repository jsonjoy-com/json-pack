import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';
import type {BinaryJsonEncoder, StreamingBinaryJsonEncoder} from '../types';
import {
  FlexBufferType,
  BitWidth,
  packType,
  bitWidthToByteSize,
} from './constants';

export class FlexBuffersEncoder implements BinaryJsonEncoder, StreamingBinaryJsonEncoder {
  constructor(public readonly writer: IWriter & IWriterGrowable) {}

  public encode(value: unknown): Uint8Array {
    const writer = this.writer;
    writer.reset();
    
    // Encode the value and get its type info
    const {type, bitWidth} = this.encodeValue(value);
    
    // Write root type and bit width at the end
    writer.u8(packType(type, bitWidth));
    writer.u8(bitWidthToByteSize(bitWidth));
    
    return writer.flush();
  }

  private encodeValue(value: unknown): {type: FlexBufferType; bitWidth: BitWidth} {
    switch (typeof value) {
      case 'boolean':
        return this.encodeBoolean(value);
      case 'number':
        return this.encodeNumber(value);
      case 'string':
        return this.encodeString(value);
      case 'object':
        if (value === null) return this.encodeNull();
        if (Array.isArray(value)) return this.encodeArray(value);
        if (value instanceof Uint8Array) return this.encodeBlob(value);
        return this.encodeObject(value as Record<string, unknown>);
      case 'undefined':
        return this.encodeNull();
      default:
        return this.encodeNull();
    }
  }

  private encodeNull(): {type: FlexBufferType; bitWidth: BitWidth} {
    // For null, we don't write any data, just return type info
    return {type: FlexBufferType.NULL, bitWidth: BitWidth.W8};
  }

  private encodeBoolean(value: boolean): {type: FlexBufferType; bitWidth: BitWidth} {
    this.writer.u8(value ? 1 : 0);
    return {type: FlexBufferType.BOOL, bitWidth: BitWidth.W8};
  }

  private encodeNumber(value: number): {type: FlexBufferType; bitWidth: BitWidth} {
    if (Number.isInteger(value)) {
      return this.encodeInteger(value);
    } else {
      return this.encodeFloat(value);
    }
  }

  private encodeInteger(value: number): {type: FlexBufferType; bitWidth: BitWidth} {
    const writer = this.writer;
    
    if (value >= 0) {
      // Unsigned integer
      if (value <= 255) {
        writer.u8(value);
        return {type: FlexBufferType.UINT, bitWidth: BitWidth.W8};
      } else if (value <= 65535) {
        writer.ensureCapacity(2);
        writer.view.setUint16(writer.x, value, true);
        writer.x += 2;
        return {type: FlexBufferType.UINT, bitWidth: BitWidth.W16};
      } else if (value <= 4294967295) {
        writer.ensureCapacity(4);
        writer.view.setUint32(writer.x, value, true);
        writer.x += 4;
        return {type: FlexBufferType.UINT, bitWidth: BitWidth.W32};
      } else {
        writer.ensureCapacity(8);
        writer.view.setBigUint64(writer.x, BigInt(value), true);
        writer.x += 8;
        return {type: FlexBufferType.UINT, bitWidth: BitWidth.W64};
      }
    } else {
      // Signed integer
      if (value >= -128 && value <= 127) {
        writer.ensureCapacity(1);
        writer.view.setInt8(writer.x, value);
        writer.x += 1;
        return {type: FlexBufferType.INT, bitWidth: BitWidth.W8};
      } else if (value >= -32768 && value <= 32767) {
        writer.ensureCapacity(2);
        writer.view.setInt16(writer.x, value, true);
        writer.x += 2;
        return {type: FlexBufferType.INT, bitWidth: BitWidth.W16};
      } else if (value >= -2147483648 && value <= 2147483647) {
        writer.ensureCapacity(4);
        writer.view.setInt32(writer.x, value, true);
        writer.x += 4;
        return {type: FlexBufferType.INT, bitWidth: BitWidth.W32};
      } else {
        writer.ensureCapacity(8);
        writer.view.setBigInt64(writer.x, BigInt(value), true);
        writer.x += 8;
        return {type: FlexBufferType.INT, bitWidth: BitWidth.W64};
      }
    }
  }

  private encodeFloat(value: number): {type: FlexBufferType; bitWidth: BitWidth} {
    // Use 64-bit float for precision
    const writer = this.writer;
    writer.ensureCapacity(8);
    writer.view.setFloat64(writer.x, value, true);
    writer.x += 8;
    return {type: FlexBufferType.FLOAT, bitWidth: BitWidth.W64};
  }

  private encodeString(value: string): {type: FlexBufferType; bitWidth: BitWidth} {
    const writer = this.writer;
    const encoded = new TextEncoder().encode(value);
    
    // Write string data
    writer.buf(encoded, encoded.length);
    // Write null terminator
    writer.u8(0);
    // Write size
    writer.u8(encoded.length);
    
    return {type: FlexBufferType.STRING, bitWidth: BitWidth.W8};
  }

  private encodeBlob(value: Uint8Array): {type: FlexBufferType; bitWidth: BitWidth} {
    const writer = this.writer;
    
    // Write blob data
    writer.buf(value, value.length);
    // Write size
    writer.u8(value.length);
    
    return {type: FlexBufferType.BLOB, bitWidth: BitWidth.W8};
  }

  private encodeArray(value: unknown[]): {type: FlexBufferType; bitWidth: BitWidth} {
    const writer = this.writer;
    const elementTypes: number[] = [];
    
    // Encode elements first
    for (const element of value) {
      const {type, bitWidth} = this.encodeValue(element);
      elementTypes.push(packType(type, bitWidth));
    }
    
    // Write size
    writer.u8(value.length);
    
    // Write type bytes (after elements in FlexBuffers)
    for (const typeInfo of elementTypes) {
      writer.u8(typeInfo);
    }
    
    return {type: FlexBufferType.VECTOR, bitWidth: BitWidth.W8};
  }

  private encodeObject(value: Record<string, unknown>): {type: FlexBufferType; bitWidth: BitWidth} {
    const writer = this.writer;
    const keys = Object.keys(value).sort(); // FlexBuffers requires sorted keys
    const keyTypes: number[] = [];
    const valueTypes: number[] = [];
    
    // Encode keys first (as a typed vector)
    for (const key of keys) {
      const {type, bitWidth} = this.encodeString(key);
      keyTypes.push(packType(FlexBufferType.KEY, bitWidth));
    }
    
    // Encode key vector size
    writer.u8(keys.length);
    
    // Encode values
    for (const key of keys) {
      const {type, bitWidth} = this.encodeValue(value[key]);
      valueTypes.push(packType(type, bitWidth));
    }
    
    // Write key vector offset (simplified - just write 0)
    writer.u8(0);
    // Write key vector bit width
    writer.u8(1);
    
    // Write size
    writer.u8(keys.length);
    
    // Write value type bytes
    for (const typeInfo of valueTypes) {
      writer.u8(typeInfo);
    }
    
    return {type: FlexBufferType.MAP, bitWidth: BitWidth.W8};
  }

  // Required interface methods - basic implementations
  public writeAny(value: unknown): void {
    this.encodeValue(value);
  }

  public writeNull(): void {
    this.encodeNull();
  }

  public writeBoolean(bool: boolean): void {
    this.encodeBoolean(bool);
  }

  public writeNumber(num: number): void {
    this.encodeNumber(num);
  }

  public writeInteger(int: number): void {
    this.encodeInteger(int);
  }

  public writeUInteger(uint: number): void {
    if (uint <= 255) {
      this.writer.u8(uint);
    } else if (uint <= 65535) {
      this.writer.u16(uint);
    } else if (uint <= 4294967295) {
      this.writer.u32(uint);
    } else {
      this.writer.u64(BigInt(uint));
    }
  }

  public writeFloat(float: number): void {
    this.encodeFloat(float);
  }

  public writeBin(buf: Uint8Array): void {
    this.encodeBlob(buf);
  }

  public writeStr(str: string): void {
    this.encodeString(str);
  }

  public writeAsciiStr(str: string): void {
    this.encodeString(str);
  }

  public writeArr(arr: unknown[]): void {
    this.encodeArray(arr);
  }

  public writeObj(obj: Record<string, unknown>): void {
    this.encodeObject(obj);
  }

  // Streaming methods - not implemented for FlexBuffers
  public writeStartStr(): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeStrChunk(str: string): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeEndStr(): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeStartBin(): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeBinChunk(buf: Uint8Array): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeEndBin(): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeStartArr(): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeArrChunk(item: unknown): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeEndArr(): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeStartObj(): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeObjChunk(key: string, value: unknown): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }

  public writeEndObj(): void {
    throw new Error('Streaming not implemented for FlexBuffers');
  }
}
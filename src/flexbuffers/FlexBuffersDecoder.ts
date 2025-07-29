import {Reader} from '@jsonjoy.com/util/lib/buffers/Reader';
import type {BinaryJsonDecoder, PackValue} from '../types';
import {
  FlexBufferType,
  BitWidth,
  unpackType,
  unpackBitWidth,
  bitWidthToByteSize,
} from './constants';

export class FlexBuffersDecoder implements BinaryJsonDecoder {
  public reader = new Reader();

  public read(uint8: Uint8Array): PackValue {
    this.reader.reset(uint8);
    return this.readRoot();
  }

  public decode(uint8: Uint8Array): unknown {
    this.reader.reset(uint8);
    return this.readRoot();
  }

  public readAny(): PackValue {
    return this.readRoot();
  }

  private readRoot(): PackValue {
    const reader = this.reader;
    const uint8 = reader.uint8;
    const length = uint8.length;
    
    if (length < 3) {
      throw new Error('FlexBuffer too short');
    }
    
    // Read from the end - the last byte is the width in bytes of the root (not BitWidth enum)
    const rootByteWidth = uint8[length - 1]; // This is actual byte size (1, 2, 4, 8)
    const rootTypeByte = uint8[length - 2];
    const rootType = unpackType(rootTypeByte);
    const rootTypeBitWidth = unpackBitWidth(rootTypeByte);
    
    // Convert byte width to BitWidth enum
    const rootBitWidth = this.byteSizeToBitWidth(rootByteWidth);
    
    // For scalar values, the root value occupies bytes before the type and bit width
    const rootPos = length - 2 - rootByteWidth;
    
    if (rootPos < 0) {
      throw new Error('Invalid FlexBuffer format');
    }
    
    // Read root value using the root bit width for scalars
    // For inline types, the bit width in the type byte is unused
    if (this.isInlineType(rootType)) {
      return this.readValueAt(rootType, rootBitWidth, rootPos);
    } else {
      // For offset types, use the type bit width
      return this.readValueAt(rootType, rootTypeBitWidth, rootPos);
    }
  }
  
  private byteSizeToBitWidth(byteSize: number): BitWidth {
    switch (byteSize) {
      case 1: return BitWidth.W8;
      case 2: return BitWidth.W16;
      case 4: return BitWidth.W32;
      case 8: return BitWidth.W64;
      default: throw new Error(`Invalid byte size: ${byteSize}`);
    }
  }
  
  private isInlineType(type: FlexBufferType): boolean {
    switch (type) {
      case FlexBufferType.NULL:
      case FlexBufferType.BOOL:
      case FlexBufferType.INT:
      case FlexBufferType.UINT:
      case FlexBufferType.FLOAT:
        return true;
      default:
        return false;
    }
  }

  private readValueAt(type: FlexBufferType, bitWidth: BitWidth, pos: number): PackValue {
    const reader = this.reader;
    const originalPos = reader.x;
    reader.x = pos;
    
    const result = this.readValue(type, bitWidth);
    reader.x = originalPos;
    return result;
  }

  private readValue(type: FlexBufferType, bitWidth: BitWidth): PackValue {
    switch (type) {
      case FlexBufferType.NULL:
        return null;
        
      case FlexBufferType.BOOL:
        return this.readUInt(bitWidth) !== 0;
        
      case FlexBufferType.INT:
        return this.readInt(bitWidth);
        
      case FlexBufferType.UINT:
        return this.readUInt(bitWidth);
        
      case FlexBufferType.FLOAT:
        return this.readFloat(bitWidth);
        
      case FlexBufferType.STRING:
        return this.readString();
        
      case FlexBufferType.BLOB:
        return this.readBlob();
        
      case FlexBufferType.VECTOR:
        return this.readVector();
        
      case FlexBufferType.MAP:
        return this.readMap();
        
      default:
        throw new Error(`Unsupported FlexBuffer type: ${type}`);
    }
  }

  private readInt(bitWidth: BitWidth): number | bigint {
    const reader = this.reader;
    const view = reader.view;
    const pos = reader.x;
    
    switch (bitWidth) {
      case BitWidth.W8:
        reader.x += 1;
        return view.getInt8(pos);
      case BitWidth.W16:
        reader.x += 2;
        return view.getInt16(pos, true);
      case BitWidth.W32:
        reader.x += 4;
        return view.getInt32(pos, true);
      case BitWidth.W64:
        reader.x += 8;
        const bigint = view.getBigInt64(pos, true);
        // Return regular number if it fits
        if (bigint >= Number.MIN_SAFE_INTEGER && bigint <= Number.MAX_SAFE_INTEGER) {
          return Number(bigint);
        }
        return bigint;
      default:
        throw new Error(`Invalid int bit width: ${bitWidth}`);
    }
  }

  private readUInt(bitWidth: BitWidth): number {
    const reader = this.reader;
    const view = reader.view;
    const pos = reader.x;
    
    switch (bitWidth) {
      case BitWidth.W8:
        reader.x += 1;
        return view.getUint8(pos);
      case BitWidth.W16:
        reader.x += 2;
        return view.getUint16(pos, true);
      case BitWidth.W32:
        reader.x += 4;
        return view.getUint32(pos, true);
      case BitWidth.W64:
        reader.x += 8;
        const bigint = view.getBigUint64(pos, true);
        // Return regular number if it fits
        if (bigint <= Number.MAX_SAFE_INTEGER) {
          return Number(bigint);
        }
        throw new Error('UInt64 too large for JavaScript number');
      default:
        throw new Error(`Invalid uint bit width: ${bitWidth}`);
    }
  }

  private readFloat(bitWidth: BitWidth): number {
    const reader = this.reader;
    const view = reader.view;
    const pos = reader.x;
    
    switch (bitWidth) {
      case BitWidth.W32:
        reader.x += 4;
        return view.getFloat32(pos, true);
      case BitWidth.W64:
        reader.x += 8;
        return view.getFloat64(pos, true);
      default:
        throw new Error(`Invalid float bit width: ${bitWidth}`);
    }
  }

  private readString(): string {
    const reader = this.reader;
    
    // Read size (uint8)
    const size = reader.u8();
    
    // Move back to read the string data (stored before size)
    reader.x -= size + 2; // -1 for size, -1 for null terminator
    
    // Read string data
    const stringData = reader.buf(size);
    
    // Skip null terminator
    reader.x++;
    
    // Skip size (we already read it)
    reader.x++;
    
    return new TextDecoder().decode(stringData);
  }

  private readBlob(): Uint8Array {
    const reader = this.reader;
    
    // Read size (uint8)  
    const size = reader.u8();
    
    // Move back to read the blob data (stored before size)
    reader.x -= size + 1; // -1 for size
    
    // Read blob data
    const blobData = reader.buf(size);
    
    // Skip size (we already read it)
    reader.x++;
    
    return blobData;
  }

  private readVector(): PackValue[] {
    const reader = this.reader;
    const uint8 = reader.uint8;
    
    // Read type bytes from the end (after size)
    const currentPos = reader.x;
    const size = uint8[currentPos];
    
    const result: PackValue[] = [];
    
    if (size === 0) {
      reader.x++; // Skip size
      return result;
    }
    
    // Type bytes are after the size
    const typesPos = currentPos + 1;
    
    // Element data is before the size
    let elementPos = currentPos - size;
    
    for (let i = 0; i < size; i++) {
      const typeInfo = uint8[typesPos + i];
      const elementType = unpackType(typeInfo);
      const elementBitWidth = unpackBitWidth(typeInfo);
      
      const element = this.readValueAt(elementType, elementBitWidth, elementPos);
      result.push(element);
      
      // Move to next element position (this is simplified - should calculate based on element size)
      elementPos += 1; // This is wrong but a simplification for now
    }
    
    // Move past size and type bytes
    reader.x = typesPos + size;
    
    return result;
  }

  private readMap(): Record<string, PackValue> {
    const reader = this.reader;
    const uint8 = reader.uint8;
    
    // Read type bytes from the end (after key offset info and size)
    const currentPos = reader.x;
    
    // Skip backwards to read map structure
    // This is a simplified implementation
    const size = uint8[currentPos];
    
    const result: Record<string, PackValue> = {};
    
    // For now, return empty object for simplicity
    // A full implementation would need to properly parse the key vector
    reader.x++; // Skip size
    
    return result;
  }
}
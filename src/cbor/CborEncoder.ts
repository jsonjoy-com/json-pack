import {isFloat32} from '@jsonjoy.com/util/lib/buffers/isFloat32';
import {JsonPackExtension} from '../JsonPackExtension';
import {CborEncoderFast} from './CborEncoderFast';
import {JsonPackValue} from '../JsonPackValue';
import {TYPED_ARRAY_TAG} from './constants';
import {isLittleEndian} from './shared';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';

export class CborEncoder<W extends IWriter & IWriterGrowable = IWriter & IWriterGrowable> extends CborEncoderFast<W> {
  /**
   * Called when the encoder encounters a value that it does not know how to encode.
   *
   * @param value Some JavaScript value.
   */
  public writeUnknown(value: unknown): void {
    this.writeNull();
  }

  public writeAny(value: unknown): void {
    switch (typeof value) {
      case 'number':
        return this.writeNumber(value as number);
      case 'string':
        return this.writeStr(value);
      case 'boolean':
        return this.writer.u8(0xf4 + +value);
      case 'object': {
        if (!value) return this.writer.u8(0xf6);
        const constructor = value.constructor;
        switch (constructor) {
          case Object:
            return this.writeObj(value as Record<string, unknown>);
          case Array:
            return this.writeArr(value as unknown[]);
          case Uint8Array:
            return this.writeBin(value as Uint8Array);
          case Int8Array:
            return this.writeTypedArray(value as Int8Array);
          case Uint8ClampedArray:
            return this.writeTypedArray(value as Uint8ClampedArray);
          case Int16Array:
            return this.writeTypedArray(value as Int16Array);
          case Uint16Array:
            return this.writeTypedArray(value as Uint16Array);
          case Int32Array:
            return this.writeTypedArray(value as Int32Array);
          case Uint32Array:
            return this.writeTypedArray(value as Uint32Array);
          case Float32Array:
            return this.writeTypedArray(value as Float32Array);
          case Float64Array:
            return this.writeTypedArray(value as Float64Array);
          case BigInt64Array:
            return this.writeTypedArray(value as BigInt64Array);
          case BigUint64Array:
            return this.writeTypedArray(value as BigUint64Array);
          case Map:
            return this.writeMap(value as Map<unknown, unknown>);
          case JsonPackExtension:
            return this.writeTag((<JsonPackExtension>value).tag, (<JsonPackExtension>value).val);
          case JsonPackValue:
            const buf = (value as JsonPackValue).val;
            return this.writer.buf(buf, buf.length);
          default:
            if (value instanceof Uint8Array) return this.writeBin(value);
            if (Array.isArray(value)) return this.writeArr(value);
            if (value instanceof Map) return this.writeMap(value);
            return this.writeUnknown(value);
        }
      }
      case 'undefined':
        return this.writeUndef();
      case 'bigint':
        return this.writeBigInt(value as bigint);
      default:
        return this.writeUnknown(value);
    }
  }

  public writeFloat(float: number): void {
    if (isFloat32(float)) this.writer.u8f32(0xfa, float);
    else this.writer.u8f64(0xfb, float);
  }

  public writeMap(map: Map<unknown, unknown>): void {
    this.writeMapHdr(map.size);
    map.forEach((value, key) => {
      this.writeAny(key);
      this.writeAny(value);
    });
  }

  public writeUndef(): void {
    this.writer.u8(0xf7);
  }

  /**
   * Write a typed array using RFC 8746 CBOR typed array tags
   */
  public writeTypedArray(value: ArrayBufferView): void {
    const tag = this.getTypedArrayTag(value);
    const buffer = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    this.writeTag(tag, buffer);
  }

  /**
   * Determine the appropriate CBOR tag for a typed array
   */
  private getTypedArrayTag(value: ArrayBufferView): number {
    const constructor = value.constructor;
    
    switch (constructor) {
      case Int8Array:
        return TYPED_ARRAY_TAG.SINT8;
      case Uint8ClampedArray:
        return TYPED_ARRAY_TAG.UINT8_CLAMPED;
      case Int16Array:
        return isLittleEndian ? TYPED_ARRAY_TAG.SINT16_LE : TYPED_ARRAY_TAG.SINT16_BE;
      case Uint16Array:
        return isLittleEndian ? TYPED_ARRAY_TAG.UINT16_LE : TYPED_ARRAY_TAG.UINT16_BE;
      case Int32Array:
        return isLittleEndian ? TYPED_ARRAY_TAG.SINT32_LE : TYPED_ARRAY_TAG.SINT32_BE;
      case Uint32Array:
        return isLittleEndian ? TYPED_ARRAY_TAG.UINT32_LE : TYPED_ARRAY_TAG.UINT32_BE;
      case Float32Array:
        return isLittleEndian ? TYPED_ARRAY_TAG.FLOAT32_LE : TYPED_ARRAY_TAG.FLOAT32_BE;
      case Float64Array:
        return isLittleEndian ? TYPED_ARRAY_TAG.FLOAT64_LE : TYPED_ARRAY_TAG.FLOAT64_BE;
      case BigInt64Array:
        return isLittleEndian ? TYPED_ARRAY_TAG.SINT64_LE : TYPED_ARRAY_TAG.SINT64_BE;
      case BigUint64Array:
        return isLittleEndian ? TYPED_ARRAY_TAG.UINT64_LE : TYPED_ARRAY_TAG.UINT64_BE;
      default:
        throw new Error(`Unsupported typed array type: ${constructor.name}`);
    }
  }
}

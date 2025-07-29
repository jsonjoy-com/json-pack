import {ENCODING} from './constants';

/**
 * ZigZag encodes a signed integer to make small negative numbers encode efficiently.
 * Maps signed integers to unsigned integers by moving the sign bit to the LSB.
 * Positive numbers are multiplied by 2, negative numbers are multiplied by 2 and subtracted by 1.
 */
export function zigzagEncode(value: number): number {
  return value >= 0 ? value * 2 : (-value * 2) - 1;
}

/**
 * ZigZag decodes an unsigned integer back to a signed integer.
 */
export function zigzagDecode(value: number): number {
  return (value & 1) === 0 ? value / 2 : -(value + 1) / 2;
}

/**
 * Calculates the number of bytes needed to encode a VInt.
 */
export function vintSize(value: number): number {
  if (value === 0) return 1;
  
  let bytes = 0;
  let remaining = Math.abs(value);
  
  // All but the last byte contribute 7 bits
  while (remaining >= 0x40) { // 64 = 2^6, last byte has 6 bits
    remaining >>= 7;
    bytes++;
  }
  
  // Add the final byte
  return bytes + 1;
}

/**
 * Writes a variable-length integer (VInt) using the Smile format.
 * All bytes except the last have MSB clear (0xxxxxxx).
 * The last byte has MSB set but bit 6 clear (10xxxxxx) to avoid 0xFF.
 */
export function writeVInt(writer: {u8(value: number): void}, value: number): void {
  if (value === 0) {
    writer.u8(0x80); // Single byte: 10000000
    return;
  }

  const bytes: number[] = [];
  let remaining = value;

  // First, collect 6 bits for the last byte (since last byte can only hold 6 bits)
  const lastBits = remaining & 0x3f; // 6 bits
  remaining >>= 6;
  
  // Then collect 7-bit chunks for the remaining bytes
  while (remaining > 0) {
    bytes.push(remaining & 0x7f);
    remaining >>= 7;
  }

  // Write continuation bytes (7 bits each) in reverse order
  for (let i = bytes.length - 1; i >= 0; i--) {
    writer.u8(bytes[i]); // MSB = 0 for continuation bytes
  }

  // Write the last byte with MSB set but bit 6 clear
  writer.u8(0x80 | lastBits); // 0x80 = 10000000
}

/**
 * Reads a variable-length integer (VInt) from the reader.
 */
export function readVInt(reader: {u8(): number}): number {
  let result = 0;
  let byte = reader.u8();

  // If MSB is set, this is the last (and only) byte
  if ((byte & 0x80) !== 0) {
    return byte & 0x3f; // Extract 6 bits
  }

  // This is a continuation byte, start accumulating
  result = byte & 0x7f; // Extract 7 bits
  
  while (true) {
    byte = reader.u8();
    if ((byte & 0x80) !== 0) {
      // Last byte - shift result left by 6 bits and add the 6 bits from this byte
      result = (result << 6) | (byte & 0x3f);
      break;
    } else {
      // Continuation byte - shift result left by 7 bits and add the 7 bits from this byte
      result = (result << 7) | (byte & 0x7f);
    }
  }

  return result;
}

/**
 * Encodes binary data using "safe" 7-bit encoding.
 * Every 7 input bytes are encoded into 8 output bytes, using only the lower 7 bits of each output byte.
 */
export function encodeSafeBinary(data: Uint8Array): Uint8Array {
  if (data.length === 0) return new Uint8Array(0);

  const outputSize = Math.ceil((data.length * 8) / 7);
  const output = new Uint8Array(outputSize);
  
  let inputBitIndex = 0;
  let outputIndex = 0;

  while (outputIndex < outputSize) {
    let value = 0;
    
    // Collect up to 7 bits for this output byte
    for (let bit = 0; bit < 7; bit++) {
      const inputByteIndex = Math.floor(inputBitIndex / 8);
      const inputBitOffset = inputBitIndex % 8;
      
      if (inputByteIndex >= data.length) {
        // Pad with zeros if we run out of input
        value <<= 1;
      } else {
        const inputByte = data[inputByteIndex];
        const sourceBit = (inputByte >> (7 - inputBitOffset)) & 1;
        value = (value << 1) | sourceBit;
      }
      
      inputBitIndex++;
    }
    
    output[outputIndex++] = value;
  }

  return output;
}

/**
 * Decodes "safe" 7-bit encoded binary data back to original bytes.
 */
export function decodeSafeBinary(encodedData: Uint8Array, originalLength: number): Uint8Array {
  if (originalLength === 0) return new Uint8Array(0);

  const output = new Uint8Array(originalLength);
  let outputBitIndex = 0;

  for (let i = 0; i < encodedData.length; i++) {
    const encoded = encodedData[i] & 0x7f;
    
    // Extract 7 bits from this encoded byte
    for (let bit = 6; bit >= 0; bit--) {
      const outputByteIndex = Math.floor(outputBitIndex / 8);
      const outputBitOffset = outputBitIndex % 8;
      
      if (outputByteIndex >= originalLength) break;
      
      const sourceBit = (encoded >> bit) & 1;
      
      if (outputBitOffset === 0) {
        output[outputByteIndex] = 0;
      }
      
      output[outputByteIndex] |= sourceBit << (7 - outputBitOffset);
      outputBitIndex++;
    }
  }

  return output;
}

/**
 * Checks if a byte should be avoided in long shared references.
 */
export function shouldAvoidReference(index: number): boolean {
  const lowByte = index & 0xff;
  return lowByte === 0xfe || lowByte === 0xff;
}

/**
 * Checks if a string is eligible for shared reference (length <= 64 bytes).
 */
export function isStringShareable(str: string): boolean {
  return new TextEncoder().encode(str).length <= 64;
}

/**
 * Encodes a 32-bit float using Smile's 7-bit encoding.
 * IEEE 754 32-bit representation is split into 7-bit chunks, right-aligned.
 */
export function encodeFloat32(value: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, value, false); // big-endian
  
  const uint32 = view.getUint32(0, false);
  const output = new Uint8Array(5);
  
  // Split 32 bits into 5 chunks of 7, 7, 7, 7, 4 bits
  // Process from MSB to LSB
  output[0] = (uint32 >>> 25) & 0x7f; // bits 31-25 (7 bits)
  output[1] = (uint32 >>> 18) & 0x7f; // bits 24-18 (7 bits) 
  output[2] = (uint32 >>> 11) & 0x7f; // bits 17-11 (7 bits)
  output[3] = (uint32 >>> 4) & 0x7f;  // bits 10-4 (7 bits)
  output[4] = (uint32 & 0x0f) << 3;   // bits 3-0 (4 bits), left-padded to fill 7-bit space
  
  return output;
}

/**
 * Decodes a 32-bit float from Smile's 7-bit encoding.
 */
export function decodeFloat32(encodedBytes: Uint8Array): number {
  if (encodedBytes.length !== 5) {
    throw new Error('Float32 encoding must be 5 bytes');
  }
  
  // Reconstruct the 32-bit value from 7-bit chunks
  const uint32 = 
    ((encodedBytes[0] & 0x7f) << 25) |  // bits 31-25
    ((encodedBytes[1] & 0x7f) << 18) |  // bits 24-18
    ((encodedBytes[2] & 0x7f) << 11) |  // bits 17-11
    ((encodedBytes[3] & 0x7f) << 4) |   // bits 10-4
    ((encodedBytes[4] & 0x78) >>> 3);   // bits 3-0 (extract from left-padded position)
  
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, uint32, false); // big-endian
  return view.getFloat32(0, false);
}

/**
 * Encodes a 64-bit double using Smile's 7-bit encoding.
 * IEEE 754 64-bit representation is split into 7-bit chunks, right-aligned.
 */
export function encodeFloat64(value: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false); // big-endian
  
  const output = new Uint8Array(10);
  
  // Split 64 bits into 10 chunks
  // We need to handle this carefully due to JavaScript's 32-bit bitwise operations
  const high = view.getUint32(0, false);
  const low = view.getUint32(4, false);
  
  // Process high 32 bits first (bits 63-32)
  output[0] = (high >>> 25) & 0x7f; // bits 63-57 (7 bits)
  output[1] = (high >>> 18) & 0x7f; // bits 56-50 (7 bits)
  output[2] = (high >>> 11) & 0x7f; // bits 49-43 (7 bits)
  output[3] = (high >>> 4) & 0x7f;  // bits 42-36 (7 bits)
  output[4] = ((high & 0x0f) << 3) | ((low >>> 29) & 0x07); // bits 35-32 + 31-29 (4+3=7 bits)
  
  // Process low 32 bits (bits 31-0)
  output[5] = (low >>> 22) & 0x7f; // bits 28-22 (7 bits)
  output[6] = (low >>> 15) & 0x7f; // bits 21-15 (7 bits)
  output[7] = (low >>> 8) & 0x7f;  // bits 14-8 (7 bits)
  output[8] = (low >>> 1) & 0x7f;  // bits 7-1 (7 bits)
  output[9] = (low & 0x01) << 6;   // bit 0 (1 bit), left-padded
  
  return output;
}

/**
 * Decodes a 64-bit double from Smile's 7-bit encoding.
 */
export function decodeFloat64(encodedBytes: Uint8Array): number {
  if (encodedBytes.length !== 10) {
    throw new Error('Float64 encoding must be 10 bytes');
  }
  
  // Reconstruct the high 32 bits
  const high = 
    ((encodedBytes[0] & 0x7f) << 25) |  // bits 63-57
    ((encodedBytes[1] & 0x7f) << 18) |  // bits 56-50
    ((encodedBytes[2] & 0x7f) << 11) |  // bits 49-43
    ((encodedBytes[3] & 0x7f) << 4) |   // bits 42-36
    ((encodedBytes[4] & 0x78) >>> 3);   // bits 35-32
  
  // Reconstruct the low 32 bits  
  const low = 
    ((encodedBytes[4] & 0x07) << 29) |  // bits 31-29
    ((encodedBytes[5] & 0x7f) << 22) |  // bits 28-22
    ((encodedBytes[6] & 0x7f) << 15) |  // bits 21-15
    ((encodedBytes[7] & 0x7f) << 8) |   // bits 14-8
    ((encodedBytes[8] & 0x7f) << 1) |   // bits 7-1
    ((encodedBytes[9] & 0x40) >>> 6);   // bit 0
  
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, high, false);
  view.setUint32(4, low, false);
  return view.getFloat64(0, false);
}
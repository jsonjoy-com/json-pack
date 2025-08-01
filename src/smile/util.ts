import {ENCODING} from './constants';

export function zigzagEncode(value: number): number {
  return value >= 0 ? value * 2 : (-value * 2) - 1;
}

export function zigzagDecode(value: number): number {
  return (value & 1) === 0 ? value / 2 : -(value + 1) / 2;
}

export function vintSize(value: number): number {
  if (value === 0) return 1;
  let bytes = 0;
  let remaining = Math.abs(value);
  while (remaining >= 0x40) {
    remaining >>= 7;
    bytes++;
  }
  return bytes + 1;
}

export function writeVInt(writer: {u8(value: number): void}, value: number): void {
  if (value === 0) {
    writer.u8(0x80);
    return;
  }
  const bytes: number[] = [];
  let remaining = value;
  const lastBits = remaining & 0x3f;
  remaining >>= 6;
  while (remaining > 0) {
    bytes.push(remaining & 0x7f);
    remaining >>= 7;
  }
  for (let i = bytes.length - 1; i >= 0; i--) {
    writer.u8(bytes[i]);
  }
  writer.u8(0x80 | lastBits);
}

export function readVInt(reader: {u8(): number}): number {
  let result = 0;
  let byte = reader.u8();

  if ((byte & 0x80) !== 0) {
    return byte & 0x3f; // Extract 6 bits
  }

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

export function shouldAvoidReference(index: number): boolean {
  const lowByte = index & 0xff;
  return lowByte === 0xfe || lowByte === 0xff;
}

export function isStringShareable(str: string): boolean {
  return new TextEncoder().encode(str).length <= 64;
}

export function encodeFloat32(value: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, value, false); // big-endian
  
  const uint32 = view.getUint32(0, false);
  const output = new Uint8Array(5);
  
  output[0] = (uint32 >>> 25) & 0x7f; // bits 31-25 (7 bits)
  output[1] = (uint32 >>> 18) & 0x7f; // bits 24-18 (7 bits) 
  output[2] = (uint32 >>> 11) & 0x7f; // bits 17-11 (7 bits)
  output[3] = (uint32 >>> 4) & 0x7f;  // bits 10-4 (7 bits)
  output[4] = (uint32 & 0x0f) << 3;   // bits 3-0 (4 bits), left-padded to fill 7-bit space
  
  return output;
}

export function decodeFloat32(encodedBytes: Uint8Array): number {
  if (encodedBytes.length !== 5) {
    throw new Error('Float32 encoding must be 5 bytes');
  }
  
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

export function encodeFloat64(value: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false); // big-endian
  
  const output = new Uint8Array(10);
  
  const high = view.getUint32(0, false);
  const low = view.getUint32(4, false);
  
  output[0] = (high >>> 25) & 0x7f; // bits 63-57 (7 bits)
  output[1] = (high >>> 18) & 0x7f; // bits 56-50 (7 bits)
  output[2] = (high >>> 11) & 0x7f; // bits 49-43 (7 bits)
  output[3] = (high >>> 4) & 0x7f;  // bits 42-36 (7 bits)
  output[4] = ((high & 0x0f) << 3) | ((low >>> 29) & 0x07); // bits 35-32 + 31-29 (4+3=7 bits)
  
  output[5] = (low >>> 22) & 0x7f; // bits 28-22 (7 bits)
  output[6] = (low >>> 15) & 0x7f; // bits 21-15 (7 bits)
  output[7] = (low >>> 8) & 0x7f;  // bits 14-8 (7 bits)
  output[8] = (low >>> 1) & 0x7f;  // bits 7-1 (7 bits)
  output[9] = (low & 0x01) << 6;   // bit 0 (1 bit), left-padded
  
  return output;
}

export function decodeFloat64(encodedBytes: Uint8Array): number {
  if (encodedBytes.length !== 10) {
    throw new Error('Float64 encoding must be 10 bytes');
  }
  
  const high = 
    ((encodedBytes[0] & 0x7f) << 25) |  // bits 63-57
    ((encodedBytes[1] & 0x7f) << 18) |  // bits 56-50
    ((encodedBytes[2] & 0x7f) << 11) |  // bits 49-43
    ((encodedBytes[3] & 0x7f) << 4) |   // bits 42-36
    ((encodedBytes[4] & 0x78) >>> 3);   // bits 35-32
  
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
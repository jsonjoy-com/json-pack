import {zigzagEncode, zigzagDecode, writeVInt, readVInt, encodeFloat32, decodeFloat32, encodeFloat64, decodeFloat64, encodeSafeBinary, decodeSafeBinary} from '../util';

describe('Utility functions', () => {
  describe('ZigZag encoding', () => {
    it('encodes positive numbers correctly', () => {
      expect(zigzagEncode(0)).toBe(0);
      expect(zigzagEncode(1)).toBe(2);
      expect(zigzagEncode(2)).toBe(4);
      expect(zigzagEncode(123456)).toBe(246912);
    });

    it('encodes negative numbers correctly', () => {
      expect(zigzagEncode(-1)).toBe(1);
      expect(zigzagEncode(-2)).toBe(3);
      expect(zigzagEncode(-123456)).toBe(246911);
    });

    it('round-trip encoding/decoding', () => {
      const values = [0, 1, -1, 2, -2, 123456, -123456, 1000000, -1000000];
      for (const value of values) {
        const encoded = zigzagEncode(value);
        const decoded = zigzagDecode(encoded);
        expect(decoded).toBe(value);
      }
    });
  });

  describe('VInt encoding', () => {
    it('encodes and decodes single byte values', () => {
      const writer = {bytes: [] as number[], u8(value: number) { this.bytes.push(value); }};
      const reader = {pos: 0, u8() { return this.writer.bytes[this.pos++]; }, writer};
      
      writeVInt(writer, 0);
      expect(writer.bytes).toEqual([0x80]);
      
      reader.pos = 0;
      expect(readVInt(reader)).toBe(0);
    });

    it('encodes and decodes small values', () => {
      const values = [0, 1, 32, 63];
      for (const value of values) {
        const writer = {bytes: [] as number[], u8(value: number) { this.bytes.push(value); }};
        const reader = {pos: 0, u8() { return this.writer.bytes[this.pos++]; }, writer};
        
        writeVInt(writer, value);
        reader.pos = 0;
        const decoded = readVInt(reader);
        expect(decoded).toBe(value);
      }
    });

    it('encodes and decodes larger values', () => {
      const values = [64, 128, 1000, 123456, 246912];
      for (const value of values) {
        const writer = {bytes: [] as number[], u8(value: number) { this.bytes.push(value); }};
        const reader = {pos: 0, u8() { return this.writer.bytes[this.pos++]; }, writer};
        
        writeVInt(writer, value);
        reader.pos = 0;
        const decoded = readVInt(reader);
        expect(decoded).toBe(value);
      }
    });
  });

  describe('Float32 encoding', () => {
    it('encodes and decodes simple floats', () => {
      const values = [0.0, 1.0, -1.0, 3.14, -3.14, 100.5];
      for (const value of values) {
        const encoded = encodeFloat32(value);
        expect(encoded.length).toBe(5);
        const decoded = decodeFloat32(encoded);
        expect(decoded).toBeCloseTo(value, 5);
      }
    });
  });

  describe('Float64 encoding', () => {
    it('encodes and decodes simple doubles', () => {
      const values = [0.0, 1.0, -1.0, 3.14159265359, -3.14159265359, 100.123456789];
      for (const value of values) {
        const encoded = encodeFloat64(value);
        expect(encoded.length).toBe(10);
        const decoded = decodeFloat64(encoded);
        expect(decoded).toBeCloseTo(value, 10);
      }
    });
  });

  describe('Safe binary encoding', () => {
    it('encodes and decodes empty data', () => {
      const data = new Uint8Array(0);
      const encoded = encodeSafeBinary(data);
      const decoded = decodeSafeBinary(encoded, 0);
      expect(decoded).toEqual(data);
    });

    it('encodes and decodes simple data', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const encoded = encodeSafeBinary(data);
      const decoded = decodeSafeBinary(encoded, data.length);
      expect(decoded).toEqual(data);
    });

    it('encodes and decodes complex data', () => {
      const data = new Uint8Array([0, 255, 128, 64, 32, 16, 8, 4, 2, 1]);
      const encoded = encodeSafeBinary(data);
      const decoded = decodeSafeBinary(encoded, data.length);
      expect(decoded).toEqual(data);
    });
  });
});
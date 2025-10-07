import {StreamingOctetReader} from '@jsonjoy.com/util/lib/buffers/StreamingOctetReader';

export class RmRecordDecoder {
  public readonly reader = new StreamingOctetReader();
  protected fragments: Uint8Array[] = [];

  public push(uint8: Uint8Array): void {
    this.reader.push(uint8);
  }

  public readRecord(): Uint8Array | undefined {
    try {
      const reader = this.reader;
      const header = reader.u32();
      const fin = (header & 0b10000000_00000000_00000000_00000000) !== 0;
      const len = header & 0b01111111_11111111_11111111_11111111;

    } catch (err) {
      if (err instanceof RangeError) return undefined;
      throw err;
    }
  }
}

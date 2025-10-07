import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';

export class RmRecordEncoder<W extends IWriter & IWriterGrowable = IWriter & IWriterGrowable> {
  constructor(public readonly writer: W = new Writer() as any) {}

  public encodeHdr(fin: 0 | 1, length: number): Uint8Array {
    this.writeHdr(fin, length);
    return this.writer.flush();
  }

  public encodeRecord(record: Uint8Array): Uint8Array {
    this.writeRecord(record);
    return this.writer.flush();
  }

  public writeHdr(fin: 0 | 1, length: number): void {
    this.writer.u32((fin ? 0b10000000_00000000_00000000_00000000 : 0) + length);
  }

  public writeRecord(record: Uint8Array): void {
    const length = record.length;
    if (length <= 2147483647) {
      const writer = this.writer;
      writer.u32(0b10000000_00000000_00000000_00000000 + length);
      writer.buf(record, length);
      return;
    }
    let offset = 0;
    while (offset < length) {
      const fragmentLength = Math.min(length - offset, 0x7fffffff);
      const fin = fragmentLength + offset >= length ? 1 : 0;
      this.writeFragment(record, offset, fragmentLength, fin);
      offset += fragmentLength;
    }
  }

  public writeFragment(record: Uint8Array, offset: number, length: number, fin: 0 | 1): void {
    this.writeHdr(fin, length);
    const fragment = record.subarray(offset, offset + length);
    this.writer.buf(fragment, length);
  }
}

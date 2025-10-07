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
    // ...
  }

  public writeRecord(record: Uint8Array): void {
    // ..
  }
}

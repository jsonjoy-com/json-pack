import {StreamingReader} from '@jsonjoy.com/buffers/lib/StreamingReader';
import {concatList} from '@jsonjoy.com/buffers/lib/concat';

export class RmRecordDecoder {
  public readonly reader = new StreamingReader();
  protected fragments: Uint8Array[] = [];

  public push(uint8: Uint8Array): void {
    this.reader.push(uint8);
  }

  /**
   * @todo PERF: Make it return Slice instead of Uint8Array
   */
  public readRecord(): Uint8Array | undefined {
    const reader = this.reader;
    let size = reader.size();
    if (size < 4) return undefined;
    const x = reader.x;
    READ_FRAGMENT: {
      try {
        const header = reader.u32();
        size -= 4;
        const fin = !!(header & 0b10000000_00000000_00000000_00000000);
        const len = header & 0b01111111_11111111_11111111_11111111;
        if (size < len) break READ_FRAGMENT;
        const currentFragment = reader.buf(len);
        reader.consume();
        const fragments = this.fragments;
        if (fin) {
          if (!fragments.length) return currentFragment;
          fragments.push(currentFragment);
          const record = concatList(fragments);
          this.fragments = [];
          return record.length ? record : undefined;
        } else {
          fragments.push(currentFragment);
          return undefined;
        }
      } catch (err) {
        reader.x = x;
        if (err instanceof RangeError) return undefined;
        else throw err;
      }
    }
    reader.x = x;
    return undefined;
  }
}

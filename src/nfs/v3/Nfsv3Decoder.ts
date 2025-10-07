import {Reader} from '@jsonjoy.com/buffers/lib/Reader';
import {Nfsv3Message} from './messages';

export class Nfsv3Decoder {
  public decodeMessage(reader: Reader): Nfsv3Message | undefined {
    const startPos = reader.x;
    try {
      throw new Error('Not implemented');
    } catch (err) {
      if (err instanceof RangeError) {
        reader.x = startPos;
        return undefined;
      }
      throw err;
    }
  }
}

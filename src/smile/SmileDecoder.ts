import {Reader} from '@jsonjoy.com/util/lib/buffers/Reader';
import {SmileDecoderBase} from './SmileDecoderBase';
import type {SmileDecoderOptions, SmileReader} from './SmileDecoderBase';

export class SmileDecoder<R extends SmileReader = SmileReader> extends SmileDecoderBase<R> {
  public static create(data: Uint8Array, options?: SmileDecoderOptions): SmileDecoder {
    const reader = new Reader() as SmileReader;
    reader.reset(data);
    const decoder = new SmileDecoder(reader as any, options);
    decoder.readHeader();
    return decoder;
  }

  public decode(): unknown {
    return this.val();
  }

  public readHeader(): void {
    super.readHeader();
  }
}

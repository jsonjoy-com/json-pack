import {SmileEncoderBase} from './SmileEncoderBase';
import type {SmileEncoderOptions, SmileWriter} from './SmileEncoderBase';

export class SmileEncoder<W extends SmileWriter = SmileWriter> extends SmileEncoderBase<W> {
  public static create(options?: SmileEncoderOptions): SmileEncoder {
    return new SmileEncoder(undefined as any, options);
  }

  public writeUnknown(value: unknown): void {
    this.writeNull();
  }
}
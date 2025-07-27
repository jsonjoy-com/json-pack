import {Reader} from '@jsonjoy.com/util/lib/buffers/Reader';
import type {BinaryJsonDecoder, PackValue} from '../types';
import {CsonParser} from './CsonParser';

export class CsonDecoder implements BinaryJsonDecoder {
  public reader = new Reader();
  private parser = new CsonParser();

  public read(uint8: Uint8Array): unknown {
    this.reader.reset(uint8);
    return this.readAny();
  }

  public decode(uint8: Uint8Array): unknown {
    // Convert Uint8Array to string
    const csonText = new TextDecoder().decode(uint8);

    try {
      // Use our custom CSON parser
      return this.parser.parse(csonText);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`CSON parsing error: ${errorMessage}`);
    }
  }

  private readAny(): unknown {
    // This method is for compatibility with the BinaryJsonDecoder interface
    // but for CSON, we'll primarily use the decode method
    const remainingBytes = this.reader.uint8.slice(this.reader.x);
    return this.decode(remainingBytes);
  }
}

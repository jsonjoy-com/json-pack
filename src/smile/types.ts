import type {IReader, IReaderResettable, IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';

export interface SmileEncoderOptions {
  /**
   * Whether to enable shared string value checking during encoding.
   * When enabled, the encoder will track string values and create back-references
   * to previously seen strings to reduce output size.
   * Default: false
   */
  sharedStringValues?: boolean;

  /**
   * Whether to enable shared property name checking during encoding.
   * When enabled, the encoder will track object property names and create
   * back-references to previously seen names to reduce output size.
   * Default: true
   */
  sharedPropertyNames?: boolean;

  /**
   * Whether to allow raw binary data in the output.
   * When enabled, binary data can contain any byte values including reserved ones.
   * Default: false
   */
  rawBinaryEnabled?: boolean;
}

export interface SmileDecoderOptions {
  /**
   * Maximum size for shared string tables.
   * Default: 1024
   */
  maxSharedReferences?: number;
}

export interface SmileHeader {
  version: number;
  sharedStringValues: boolean;
  sharedPropertyNames: boolean;
  rawBinaryEnabled: boolean;
}

export type SmileReader = IReader & IReaderResettable;
export type SmileWriter = IWriter & IWriterGrowable;
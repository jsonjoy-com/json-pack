import type {IWriter, IWriterGrowable} from '../util/buffers';

export type MsgPack<T> = Uint8Array & {__BRAND__: 'msgpack'; __TYPE__: T};

/** @deprecated */
export interface IMessagePackEncoder {
  writer: IWriter & IWriterGrowable;
  encodeAny(value: unknown): void;
  encodeNumber(num: number): void;
  encodeString(str: string): void;
  encodeArray(arr: unknown[]): void;
  encodeArrayHeader(length: number): void;
  encodeObject(obj: Record<string, unknown>): void;
  encodeObjectHeader(length: number): void;
}

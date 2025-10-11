/**
 * @module File handle (FH) operations for NFS v4 server.
*/

import {encode} from '@jsonjoy.com/buffers/lib/utf8/encode'
import {decodeUtf8} from '@jsonjoy.com/buffers/lib/utf8/decodeUtf8'
import {randomBytes} from 'node:crypto';

export const ROOT_FH = new Uint8Array([0]);

export const enum FH_TYPE {
  /** Root file handle. */
  ROOT = 0,
  /** Path file handle: the full path is encoded in the file handle. */
  PATH = 1,
  /** ID file handle: server stores the mapping between the ID and the file path. */
  ID = 2,
}

export const enum FH {
  MAX_SIZE = 128,
}

/**
 * Encodes a file path as a Type 1 file handle (path-based).
 * Format: `[FH_TYPE.PATH, ...utf8PathBytes]`
 * 
 * @returns The encoded file handle, or undefined if the path is too long.
 */
export const encodePathFh = (absolutePath: string): Uint8Array | undefined => {
  const length = absolutePath.length;
  const maxUtf8Bytes = length * 4; // UTF-8 can be up to 4 bytes per char
  const maxAllocSize = maxUtf8Bytes + 1; // UTF-8 can be up to 4 bytes per char, plus 1 byte for FH_TYPE
  if (maxAllocSize > FH.MAX_SIZE) return undefined;
  const u8 = new Uint8Array(maxAllocSize);
  u8[0] = FH_TYPE.PATH;
  encode(u8, absolutePath, 1, maxUtf8Bytes);
  return u8
};

export const decodePathFh = (fh: Uint8Array): string | undefined => {
  const length = fh.length;
  if (length < 2) return undefined;
  if (fh[0] !== FH_TYPE.PATH) return undefined;
  return decodeUtf8(fh, 1, length - 1);
};

export class FileHandleMapper {
  /** 16-bit unsigned int which identifies this server instance. */
  protected readonly stamp: number;

  /** Map from random ID (40 bits) to absolute file path for Type 2 file handles. */
  protected map: Map<number, string> = new Map();

  constructor (
    stamp: number,
    /** Root directory for all file handles. */
    protected readonly dir: string
  ) {
    this.stamp = stamp & 0xffff;
  }

  /**
   * Decodes a file handle to an absolute file path.
   * Returns `undefined` if the file handle could not be decoded.
   */
  protected decode(fh: Uint8Array): string | undefined {
    const length = fh.length;
    if (fh.length === 0) return this.dir;
    const type = fh[0];
    if (type === FH_TYPE.ROOT) return this.dir;
    if (type === FH_TYPE.PATH) return decodePathFh(fh);
    if (type === FH_TYPE.ID) {
      if (length !== 8) return undefined;
      const stamp = (fh[1] << 8) | fh[2];
      if (stamp !== this.stamp) return undefined;
      const id = (fh[3] * 0x100000000) + (fh[4] * 0x1000000) + (fh[5] << 16) + (fh[6] << 8) + fh[7];
      return this.map.get(id);
    }
    return;
  }

  /**
   * Encodes a file path as a file handle. Uses Type 1 (path-based) if the path
   * fits, otherwise uses Type 2 (ID-based).
   * 
   * Type-2 Format:
   * 
   * - 1 byte: FH_TYPE.ID
   * - 2 bytes: boot stamp (server instance ID)
   * - 5 bytes: random ID (unique per file handle)
   */
  protected encode(path: string): Uint8Array {
    if (path === this.dir) return ROOT_FH;
    let fh = encodePathFh(path);
    if (fh) return fh;
    fh = randomBytes(8);
    fh[0] = FH_TYPE.ID;
    fh[1] = (this.stamp >> 8) & 0xff;
    fh[2] = this.stamp & 0xff;
    const id = (fh[3] * 0x100000000) + (fh[4] * 0x1000000) + (fh[5] << 16) + (fh[6] << 8) + fh[7];
    this.map.set(id, path);
    return fh;
  }

  public validate(fh: Uint8Array): boolean {
    if (fh.length === 0) return true;
    const type = fh[0];
    if (type === FH_TYPE.ROOT) return true;
    if (type === FH_TYPE.PATH) return true;
    if (type === FH_TYPE.ID) return true;
    return false;
  }
}

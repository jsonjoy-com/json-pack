/**
 * Attribute encoding utilities for NFSv4 server operations.
 */

import type {Stats} from 'node:fs';
import {Writer} from '@jsonjoy.com/buffers/lib/Writer';
import {XdrEncoder} from '../../../../../xdr/XdrEncoder';
import {Nfsv4Attr, Nfsv4FType} from '../../../constants';
import * as struct from '../../../structs';

const setBit = (mask: number[], attrNum: number): void => {
  const wordIndex = Math.floor(attrNum / 32);
  const bitIndex = attrNum % 32;
  while (mask.length <= wordIndex) mask.push(0);
  mask[wordIndex] |= 1 << bitIndex;
};

/**
 * Encodes file attributes based on the requested bitmap.
 * Returns the attributes as a Nfsv4Fattr structure.
 */
export const encodeAttrs = (
  requestedAttrs: struct.Nfsv4Bitmap,
  stats: Stats,
  path: string,
  fh?: Uint8Array,
): struct.Nfsv4Fattr => {
  const writer = new Writer(512);
  const xdr = new XdrEncoder(writer);
  const supportedMask: number[] = [];
  const requested = requestedAttrs.mask;
  for (let i = 0; i < requested.length; i++) {
    const word = requested[i];
    if (!word) continue;
    const wordIndex = i;
    for (let bit = 0; bit < 32; bit++) {
      if (!(word & (1 << bit))) continue;
      const attrNum = wordIndex * 32 + bit;
      switch (attrNum) {
        case Nfsv4Attr.FATTR4_TYPE: {
          let type: Nfsv4FType;
          if (stats.isFile()) type = Nfsv4FType.NF4REG;
          else if (stats.isDirectory()) type = Nfsv4FType.NF4DIR;
          else if (stats.isSymbolicLink()) type = Nfsv4FType.NF4LNK;
          else if (stats.isBlockDevice()) type = Nfsv4FType.NF4BLK;
          else if (stats.isCharacterDevice()) type = Nfsv4FType.NF4CHR;
          else if (stats.isFIFO()) type = Nfsv4FType.NF4FIFO;
          else if (stats.isSocket()) type = Nfsv4FType.NF4SOCK;
          else type = Nfsv4FType.NF4REG;
          xdr.writeUnsignedInt(type);
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_SIZE: {
          xdr.writeUnsignedHyper(BigInt(stats.size));
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_FILEID: {
          xdr.writeUnsignedHyper(BigInt(stats.ino));
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_MODE: {
          xdr.writeUnsignedInt(stats.mode & 0o7777);
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_NUMLINKS: {
          xdr.writeUnsignedInt(stats.nlink);
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_SPACE_USED: {
          xdr.writeUnsignedHyper(BigInt(stats.blocks * 512));
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_TIME_ACCESS: {
          const atime = stats.atimeMs;
          const seconds = Math.floor(atime / 1000);
          const nseconds = Math.floor((atime % 1000) * 1000000);
          xdr.writeHyper(BigInt(seconds));
          xdr.writeUnsignedInt(nseconds);
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_TIME_MODIFY: {
          const mtime = stats.mtimeMs;
          const seconds = Math.floor(mtime / 1000);
          const nseconds = Math.floor((mtime % 1000) * 1000000);
          xdr.writeHyper(BigInt(seconds));
          xdr.writeUnsignedInt(nseconds);
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_TIME_METADATA: {
          const ctime = stats.ctimeMs;
          const seconds = Math.floor(ctime / 1000);
          const nseconds = Math.floor((ctime % 1000) * 1000000);
          xdr.writeHyper(BigInt(seconds));
          xdr.writeUnsignedInt(nseconds);
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_CHANGE: {
          const changeTime = BigInt(Math.floor(stats.mtimeMs * 1000000));
          xdr.writeUnsignedHyper(changeTime);
          setBit(supportedMask, attrNum);
          break;
        }
        case Nfsv4Attr.FATTR4_FILEHANDLE: {
          if (fh) {
            xdr.writeVarlenOpaque(fh);
            setBit(supportedMask, attrNum);
          }
          break;
        }
      }
    }
  }
  const attrVals = writer.flush();
  return new struct.Nfsv4Fattr(new struct.Nfsv4Bitmap(supportedMask), attrVals);
};

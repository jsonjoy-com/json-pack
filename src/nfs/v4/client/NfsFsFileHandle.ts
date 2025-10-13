import type * as misc from 'memfs/lib/node/types/misc';
import type * as opts from 'memfs/lib/node/types/options';
import type {Nfsv4Client} from './types';
import {EventEmitter} from 'events';
import * as msg from '../messages';
import * as structs from '../structs';
import {Nfsv4Stat, Nfsv4Attr} from '../constants';
import {Reader} from '@jsonjoy.com/buffers/lib/Reader';
import {XdrDecoder} from '../../../xdr/XdrDecoder';
import {NfsFsStats} from './NfsFsStats';

/**
 * Implements Node.js-like FileHandle interface for NFS v4 file operations.
 */
export class NfsFsFileHandle extends EventEmitter implements misc.IFileHandle {
  public readonly fd: number;
  private closed: boolean = false;

  constructor(
    fd: number,
    public readonly path: string,
    private readonly nfs: Nfsv4Client,
    private readonly stateid: structs.Nfsv4Stateid,
    private readonly operations: msg.Nfsv4Request[],
  ) {
    super();
    this.fd = fd;
  }

  getAsyncId(): number {
    return this.fd;
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    const {nfs} = require('../builder');
    const closeOps: msg.Nfsv4Request[] = [nfs.CLOSE(0, this.stateid)];
    const response = await this.nfs.compound(closeOps);
    if (response.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to close file: ${response.status}`);
    }
    this.emit('close');
  }

  async stat(options?: opts.IStatOptions): Promise<misc.IStats> {
    if (this.closed) throw new Error('File handle is closed');
    const {nfs} = require('../builder');
    const operations = [...this.operations];
    const attrNums = [
      Nfsv4Attr.FATTR4_TYPE,
      Nfsv4Attr.FATTR4_SIZE,
      Nfsv4Attr.FATTR4_FILEID,
      Nfsv4Attr.FATTR4_MODE,
      Nfsv4Attr.FATTR4_NUMLINKS,
      Nfsv4Attr.FATTR4_SPACE_USED,
      Nfsv4Attr.FATTR4_TIME_ACCESS,
      Nfsv4Attr.FATTR4_TIME_MODIFY,
      Nfsv4Attr.FATTR4_TIME_METADATA,
    ];
    const attrMask: number[] = [];
    for (const attrNum of attrNums) {
      const wordIndex = Math.floor(attrNum / 32);
      const bitIndex = attrNum % 32;
      while (attrMask.length <= wordIndex) attrMask.push(0);
      attrMask[wordIndex] |= 1 << bitIndex;
    }
    operations.push(nfs.GETATTR(attrMask));
    const response = await this.nfs.compound(operations);
    if (response.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to stat file: ${response.status}`);
    }
    const getattrRes = response.resarray[response.resarray.length - 1] as msg.Nfsv4GetattrResponse;
    if (getattrRes.status !== Nfsv4Stat.NFS4_OK || !getattrRes.resok) {
      throw new Error(`Failed to get attributes: ${getattrRes.status}`);
    }
    const fattr = getattrRes.resok.objAttributes;
    const reader = new Reader();
    reader.reset(fattr.attrVals);
    const xdr = new XdrDecoder(reader);
    const returnedMask = fattr.attrmask.mask;
    let fileType = 1;
    let size = 0;
    let fileid = 0;
    let mode = 0;
    let nlink = 1;
    let spaceUsed = 0;
    let atime = new Date(0);
    let mtime = new Date(0);
    let ctime = new Date(0);
    for (let i = 0; i < returnedMask.length; i++) {
      const word = returnedMask[i];
      if (!word) continue;
      for (let bit = 0; bit < 32; bit++) {
        if (!(word & (1 << bit))) continue;
        const attrNum = i * 32 + bit;
        switch (attrNum) {
          case Nfsv4Attr.FATTR4_TYPE:
            fileType = xdr.readUnsignedInt();
            break;
          case Nfsv4Attr.FATTR4_SIZE:
            size = Number(xdr.readUnsignedHyper());
            break;
          case Nfsv4Attr.FATTR4_FILEID:
            fileid = Number(xdr.readUnsignedHyper());
            break;
          case Nfsv4Attr.FATTR4_MODE:
            mode = xdr.readUnsignedInt();
            break;
          case Nfsv4Attr.FATTR4_NUMLINKS:
            nlink = xdr.readUnsignedInt();
            break;
          case Nfsv4Attr.FATTR4_SPACE_USED:
            spaceUsed = Number(xdr.readUnsignedHyper());
            break;
          case Nfsv4Attr.FATTR4_TIME_ACCESS: {
            const seconds = Number(xdr.readHyper());
            const nseconds = xdr.readUnsignedInt();
            atime = new Date(seconds * 1000 + nseconds / 1000000);
            break;
          }
          case Nfsv4Attr.FATTR4_TIME_MODIFY: {
            const seconds = Number(xdr.readHyper());
            const nseconds = xdr.readUnsignedInt();
            mtime = new Date(seconds * 1000 + nseconds / 1000000);
            break;
          }
          case Nfsv4Attr.FATTR4_TIME_METADATA: {
            const seconds = Number(xdr.readHyper());
            const nseconds = xdr.readUnsignedInt();
            ctime = new Date(seconds * 1000 + nseconds / 1000000);
            break;
          }
        }
      }
    }
    const blocks = Math.ceil(spaceUsed / 512);
    return new NfsFsStats(
      0,
      0,
      0,
      4096,
      fileid,
      size,
      blocks,
      atime,
      mtime,
      ctime,
      mtime,
      atime.getTime(),
      mtime.getTime(),
      ctime.getTime(),
      mtime.getTime(),
      0,
      mode,
      nlink,
      fileType,
    );
  }

  appendFile(data: misc.TData, options?: opts.IAppendFileOptions | string): Promise<void> {
    throw new Error('Not implemented');
  }

  chmod(mode: misc.TMode): Promise<void> {
    throw new Error('Not implemented');
  }

  chown(uid: number, gid: number): Promise<void> {
    throw new Error('Not implemented');
  }

  createReadStream(options?: opts.IFileHandleReadStreamOptions): misc.IReadStream {
    throw new Error('Not implemented');
  }

  createWriteStream(options?: opts.IFileHandleWriteStreamOptions): misc.IWriteStream {
    throw new Error('Not implemented');
  }

  datasync(): Promise<void> {
    throw new Error('Not implemented');
  }

  readableWebStream(options?: opts.IReadableWebStreamOptions): ReadableStream {
    throw new Error('Not implemented');
  }

  read(
    buffer: Buffer | Uint8Array,
    offset: number,
    length: number,
    position?: number | null,
  ): Promise<misc.TFileHandleReadResult> {
    throw new Error('Not implemented');
  }

  readv(buffers: ArrayBufferView[], position?: number | null): Promise<misc.TFileHandleReadvResult> {
    throw new Error('Not implemented');
  }

  readFile(options?: opts.IReadFileOptions | string): Promise<misc.TDataOut> {
    throw new Error('Not implemented');
  }

  truncate(len?: number): Promise<void> {
    throw new Error('Not implemented');
  }

  utimes(atime: misc.TTime, mtime: misc.TTime): Promise<void> {
    throw new Error('Not implemented');
  }

  write(
    buffer: Buffer | ArrayBufferView | DataView,
    offset?: number,
    length?: number,
    position?: number | null,
  ): Promise<misc.TFileHandleWriteResult> {
    throw new Error('Not implemented');
  }

  writev(buffers: ArrayBufferView[], position?: number | null): Promise<misc.TFileHandleWritevResult> {
    throw new Error('Not implemented');
  }

  writeFile(data: misc.TData, options?: opts.IWriteFileOptions): Promise<void> {
    throw new Error('Not implemented');
  }
}

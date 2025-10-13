import type {NfsFsClient, Nfsv4Client} from './types';
import * as misc from 'memfs/lib/node/types/misc';
import * as opts from 'memfs/lib/node/types/options';
import {nfs} from '../builder';
import * as msg from '../messages';
import {Nfsv4Stat, Nfsv4OpenAccess, Nfsv4OpenDeny, Nfsv4StableHow, Nfsv4Attr, Nfsv4OpenFlags, Nfsv4FType} from '../constants';
import {Writer} from '@jsonjoy.com/buffers/lib/Writer';
import {Reader} from '@jsonjoy.com/buffers/lib/Reader';
import {XdrEncoder} from '../../../xdr/XdrEncoder';
import {XdrDecoder} from '../../../xdr/XdrDecoder';
import {NfsFsStats} from './NfsFsStats';

export class Nfsv4FsClient implements NfsFsClient {
  constructor(public readonly nfs: Nfsv4Client) {}

  private attrNumsToBitmap(attrNums: number[]): number[] {
    const bitmap: number[] = [];
    for (const attrNum of attrNums) {
      const wordIndex = Math.floor(attrNum / 32);
      const bitIndex = attrNum % 32;
      while (bitmap.length <= wordIndex) {
        bitmap.push(0);
      }
      bitmap[wordIndex] |= (1 << bitIndex);
    }
    return bitmap;
  }

  private parsePath(path: string): string[] {
    const normalized = path.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!normalized) return [];
    return normalized.split('/').filter((part) => part.length > 0);
  }

  private encodeData(data: misc.TPromisesData): Uint8Array {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (typeof data === 'string') return new TextEncoder().encode(data);
    if (Buffer.isBuffer(data)) return new Uint8Array(data);
    throw new Error('Unsupported data type');
  }

  private decodeData(data: Uint8Array, encoding?: string): misc.TDataOut {
    if (!encoding || encoding === 'buffer') return Buffer.from(data);
    return new TextDecoder(encoding).decode(data);
  }

  public async readFile(id: misc.TFileHandle, options?: opts.IReadFileOptions | string): Promise<misc.TDataOut> {
    const encoding = typeof options === 'string' ? options : options?.encoding;
    const path = typeof id === 'string' ? id : id.toString();
    const parts = this.parsePath(path);
    const operations: msg.Nfsv4Request[] = [nfs.PUTROOTFH()];
    for (const part of parts.slice(0, -1)) {
      operations.push(nfs.LOOKUP(part));
    }
    const filename = parts[parts.length - 1];
    const openOwner = nfs.OpenOwner(BigInt(1), new Uint8Array([1, 2, 3, 4]));
    const claim = nfs.OpenClaimNull(filename);
    operations.push(
      nfs.OPEN(0, Nfsv4OpenAccess.OPEN4_SHARE_ACCESS_READ, Nfsv4OpenDeny.OPEN4_SHARE_DENY_NONE, openOwner, 0, claim),
    );
    const openResponse = await this.nfs.compound(operations);
    if (openResponse.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to open file: ${openResponse.status}`);
    }
    const openRes = openResponse.resarray[openResponse.resarray.length - 1] as msg.Nfsv4OpenResponse;
    if (openRes.status !== Nfsv4Stat.NFS4_OK || !openRes.resok) {
      throw new Error(`Failed to open file: ${openRes.status}`);
    }
    const stateid = openRes.resok.stateid;
    const chunks: Uint8Array[] = [];
    let offset = BigInt(0);
    const chunkSize = 65536;
    try {
      while (true) {
        const readResponse = await this.nfs.compound([nfs.READ(offset, chunkSize, stateid)]);
        if (readResponse.status !== Nfsv4Stat.NFS4_OK) {
          throw new Error(`Failed to read file: ${readResponse.status}`);
        }
        const readRes = readResponse.resarray[0] as msg.Nfsv4ReadResponse;
        if (readRes.status !== Nfsv4Stat.NFS4_OK || !readRes.resok) {
          throw new Error(`Failed to read file: ${readRes.status}`);
        }
        if (readRes.resok.data.length > 0) {
          chunks.push(readRes.resok.data);
          offset += BigInt(readRes.resok.data.length);
        }
        if (readRes.resok.eof) break;
      }
    } finally {
      await this.nfs.compound([nfs.CLOSE(0, stateid)]);
    }
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let position = 0;
    for (const chunk of chunks) {
      result.set(chunk, position);
      position += chunk.length;
    }
    return this.decodeData(result, encoding);
  }

  public async writeFile(
    id: misc.TFileHandle,
    data: misc.TPromisesData,
    options?: opts.IWriteFileOptions,
  ): Promise<void> {
    const path = typeof id === 'string' ? id : id.toString();
    const parts = this.parsePath(path);
    const operations: msg.Nfsv4Request[] = [nfs.PUTROOTFH()];
    for (const part of parts.slice(0, -1)) {
      operations.push(nfs.LOOKUP(part));
    }
    const filename = parts[parts.length - 1];
    const openOwner = nfs.OpenOwner(BigInt(1), new Uint8Array([1, 2, 3, 4]));
    const claim = nfs.OpenClaimNull(filename);
    operations.push(
      nfs.OPEN(
        0,
        Nfsv4OpenAccess.OPEN4_SHARE_ACCESS_WRITE,
        Nfsv4OpenDeny.OPEN4_SHARE_DENY_NONE,
        openOwner,
        Nfsv4OpenFlags.OPEN4_CREATE,
        claim,
      ),
    );
    const writer = new Writer(16);
    const xdr = new XdrEncoder(writer);
    xdr.writeUnsignedHyper(BigInt(0));
    const attrVals = writer.flush();
    const truncateAttrs = nfs.Fattr([Nfsv4Attr.FATTR4_SIZE], attrVals);
    const stateid = nfs.Stateid(0, new Uint8Array(12));
    operations.push(nfs.SETATTR(stateid, truncateAttrs));
    const openResponse = await this.nfs.compound(operations);
    if (openResponse.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to open file: ${openResponse.status}`);
    }
    const openRes = openResponse.resarray[openResponse.resarray.length - 2] as msg.Nfsv4OpenResponse;
    if (openRes.status !== Nfsv4Stat.NFS4_OK || !openRes.resok) {
      throw new Error(`Failed to open file: ${openRes.status}`);
    }
    const openStateid = openRes.resok.stateid;
    const buffer = this.encodeData(data);
    const chunkSize = 65536;
    try {
      let offset = BigInt(0);
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));
        const writeResponse = await this.nfs.compound([
          nfs.WRITE(openStateid, offset, Nfsv4StableHow.FILE_SYNC4, chunk),
        ]);
        if (writeResponse.status !== Nfsv4Stat.NFS4_OK) {
          throw new Error(`Failed to write file: ${writeResponse.status}`);
        }
        const writeRes = writeResponse.resarray[0] as msg.Nfsv4WriteResponse;
        if (writeRes.status !== Nfsv4Stat.NFS4_OK || !writeRes.resok) {
          throw new Error(`Failed to write file: ${writeRes.status}`);
        }
        offset += BigInt(writeRes.resok.count);
      }
    } finally {
      await this.nfs.compound([nfs.CLOSE(0, openStateid)]);
    }
  }

  public async stat(path: misc.PathLike, options?: opts.IStatOptions): Promise<misc.IStats> {
    const pathStr = typeof path === 'string' ? path : path.toString();
    const parts = this.parsePath(pathStr);
    const operations: msg.Nfsv4Request[] = [nfs.PUTROOTFH()];
    for (const part of parts) {
      operations.push(nfs.LOOKUP(part));
    }
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
    const attrMask = this.attrNumsToBitmap(attrNums);
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
    let fileType = Nfsv4FType.NF4REG;
    let size = 0;
    let fileid = 0;
    let mode = 0;
    let nlink = 1;
    let spaceUsed = 0;
    let atime = new Date(0);
    let mtime = new Date(0);
    let ctime = new Date(0);
    const returnedMask = fattr.attrmask.mask;
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

  public async mkdir(path: misc.PathLike, options?: misc.TMode | opts.IMkdirOptions): Promise<string | undefined> {
    const pathStr = typeof path === 'string' ? path : path.toString();
    const parts = this.parsePath(pathStr);
    if (parts.length === 0) {
      throw new Error('Cannot create root directory');
    }
    const operations: msg.Nfsv4Request[] = [nfs.PUTROOTFH()];
    for (const part of parts.slice(0, -1)) {
      operations.push(nfs.LOOKUP(part));
    }
    const dirname = parts[parts.length - 1];
    const createType = nfs.CreateTypeDir();
    const emptyAttrs = nfs.Fattr([], new Uint8Array(0));
    operations.push(nfs.CREATE(createType, dirname, emptyAttrs));
    const response = await this.nfs.compound(operations);
    if (response.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to create directory: ${response.status}`);
    }
    const createRes = response.resarray[response.resarray.length - 1] as msg.Nfsv4CreateResponse;
    if (createRes.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to create directory: ${createRes.status}`);
    }
    return undefined;
  }

  public async readdir(path: misc.PathLike, options?: opts.IReaddirOptions | string): Promise<misc.TDataOut[] | misc.IDirent[]> {
    const pathStr = typeof path === 'string' ? path : path.toString();
    const withFileTypes = typeof options === 'object' && options?.withFileTypes;
    const encoding = typeof options === 'string' ? options : options?.encoding;
    const parts = this.parsePath(pathStr);
    const operations: msg.Nfsv4Request[] = [nfs.PUTROOTFH()];
    for (const part of parts) {
      operations.push(nfs.LOOKUP(part));
    }
    const attrNums = withFileTypes ? [Nfsv4Attr.FATTR4_TYPE] : [];
    const attrMask = this.attrNumsToBitmap(attrNums);
    operations.push(nfs.READDIR(attrMask));
    const response = await this.nfs.compound(operations);
    if (response.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to read directory: ${response.status}`);
    }
    const readdirRes = response.resarray[response.resarray.length - 1] as msg.Nfsv4ReaddirResponse;
    if (readdirRes.status !== Nfsv4Stat.NFS4_OK || !readdirRes.resok) {
      throw new Error(`Failed to read directory: ${readdirRes.status}`);
    }
    const entries: string[] = [];
    const dirents: misc.IDirent[] = [];
    const entryList = readdirRes.resok.entries;
    for (let i = 0; i < entryList.length; i++) {
      const entry = entryList[i];
      const name = entry.name;
      if (withFileTypes) {
        const fattr = entry.attrs;
        const reader = new Reader();
        reader.reset(fattr.attrVals);
        const xdr = new XdrDecoder(reader);
        let fileType = Nfsv4FType.NF4REG;
        const returnedMask = fattr.attrmask.mask;
        for (let i = 0; i < returnedMask.length; i++) {
          const word = returnedMask[i];
          if (!word) continue;
          for (let bit = 0; bit < 32; bit++) {
            if (!(word & (1 << bit))) continue;
            const attrNum = i * 32 + bit;
            if (attrNum === Nfsv4Attr.FATTR4_TYPE) {
              fileType = xdr.readUnsignedInt();
            }
          }
        }
        const isDirectory = fileType === Nfsv4FType.NF4DIR;
        const isFile = fileType === Nfsv4FType.NF4REG;
        const isBlockDevice = fileType === Nfsv4FType.NF4BLK;
        const isCharacterDevice = fileType === Nfsv4FType.NF4CHR;
        const isSymbolicLink = fileType === Nfsv4FType.NF4LNK;
        const isFIFO = fileType === Nfsv4FType.NF4FIFO;
        const isSocket = fileType === Nfsv4FType.NF4SOCK;
        dirents.push({
          name,
          isDirectory: () => isDirectory,
          isFile: () => isFile,
          isBlockDevice: () => isBlockDevice,
          isCharacterDevice: () => isCharacterDevice,
          isSymbolicLink: () => isSymbolicLink,
          isFIFO: () => isFIFO,
          isSocket: () => isSocket,
        });
      } else {
        entries.push(name);
      }
    }
    if (withFileTypes) {
      return dirents;
    }
    if (encoding && encoding !== 'utf8') {
      return entries.map(name => Buffer.from(name, 'utf8'));
    }
    return entries;
  }

  public async appendFile(path: misc.TFileHandle, data: misc.TData, options?: opts.IAppendFileOptions | string): Promise<void> {
    const pathStr = typeof path === 'string' ? path : path.toString();
    const parts = this.parsePath(pathStr);
    const operations: msg.Nfsv4Request[] = [nfs.PUTROOTFH()];
    for (const part of parts.slice(0, -1)) {
      operations.push(nfs.LOOKUP(part));
    }
    const filename = parts[parts.length - 1];
    const openOwner = nfs.OpenOwner(BigInt(1), new Uint8Array([1, 2, 3, 4]));
    const claim = nfs.OpenClaimNull(filename);
    operations.push(
      nfs.OPEN(
        0,
        Nfsv4OpenAccess.OPEN4_SHARE_ACCESS_WRITE,
        Nfsv4OpenDeny.OPEN4_SHARE_DENY_NONE,
        openOwner,
        0,
        claim,
      ),
    );
    const attrNums = [Nfsv4Attr.FATTR4_SIZE];
    const attrMask = this.attrNumsToBitmap(attrNums);
    operations.push(nfs.GETATTR(attrMask));
    const openResponse = await this.nfs.compound(operations);
    if (openResponse.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to open file: ${openResponse.status}`);
    }
    const openRes = openResponse.resarray[openResponse.resarray.length - 2] as msg.Nfsv4OpenResponse;
    if (openRes.status !== Nfsv4Stat.NFS4_OK || !openRes.resok) {
      throw new Error(`Failed to open file: ${openRes.status}`);
    }
    const getattrRes = openResponse.resarray[openResponse.resarray.length - 1] as msg.Nfsv4GetattrResponse;
    if (getattrRes.status !== Nfsv4Stat.NFS4_OK || !getattrRes.resok) {
      throw new Error(`Failed to get attributes: ${getattrRes.status}`);
    }
    const fattr = getattrRes.resok.objAttributes;
    const reader = new Reader();
    reader.reset(fattr.attrVals);
    const xdr = new XdrDecoder(reader);
    const currentSize = Number(xdr.readUnsignedHyper());
    const openStateid = openRes.resok.stateid;
    const buffer = this.encodeData(data);
    const chunkSize = 65536;
    try {
      let offset = BigInt(currentSize);
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));
        const writeResponse = await this.nfs.compound([
          nfs.WRITE(openStateid, offset, Nfsv4StableHow.FILE_SYNC4, chunk),
        ]);
        if (writeResponse.status !== Nfsv4Stat.NFS4_OK) {
          throw new Error(`Failed to write file: ${writeResponse.status}`);
        }
        const writeRes = writeResponse.resarray[0] as msg.Nfsv4WriteResponse;
        if (writeRes.status !== Nfsv4Stat.NFS4_OK || !writeRes.resok) {
          throw new Error(`Failed to write file: ${writeRes.status}`);
        }
        offset += BigInt(writeRes.resok.count);
      }
    } finally {
      await this.nfs.compound([nfs.CLOSE(0, openStateid)]);
    }
  }

  public async truncate(path: misc.PathLike, len: number = 0): Promise<void> {
    const pathStr = typeof path === 'string' ? path : path.toString();
    const parts = this.parsePath(pathStr);
    const operations: msg.Nfsv4Request[] = [nfs.PUTROOTFH()];
    for (const part of parts) {
      operations.push(nfs.LOOKUP(part));
    }
    const writer = new Writer(16);
    const xdr = new XdrEncoder(writer);
    xdr.writeUnsignedHyper(BigInt(len));
    const attrVals = writer.flush();
    const sizeAttrs = nfs.Fattr([Nfsv4Attr.FATTR4_SIZE], attrVals);
    const stateid = nfs.Stateid(0, new Uint8Array(12));
    operations.push(nfs.SETATTR(stateid, sizeAttrs));
    const response = await this.nfs.compound(operations);
    if (response.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to truncate file: ${response.status}`);
    }
    const setattrRes = response.resarray[response.resarray.length - 1] as msg.Nfsv4SetattrResponse;
    if (setattrRes.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to truncate file: ${setattrRes.status}`);
    }
  }

  public async unlink(path: misc.PathLike): Promise<void> {
    const pathStr = typeof path === 'string' ? path : path.toString();
    const parts = this.parsePath(pathStr);
    if (parts.length === 0) {
      throw new Error('Cannot unlink root directory');
    }
    const operations: msg.Nfsv4Request[] = [nfs.PUTROOTFH()];
    for (const part of parts.slice(0, -1)) {
      operations.push(nfs.LOOKUP(part));
    }
    const filename = parts[parts.length - 1];
    operations.push(nfs.REMOVE(filename));
    const response = await this.nfs.compound(operations);
    if (response.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to unlink file: ${response.status}`);
    }
    const removeRes = response.resarray[response.resarray.length - 1] as msg.Nfsv4RemoveResponse;
    if (removeRes.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to unlink file: ${removeRes.status}`);
    }
  }

  public async rmdir(path: misc.PathLike, options?: opts.IRmdirOptions): Promise<void> {
    const pathStr = typeof path === 'string' ? path : path.toString();
    const parts = this.parsePath(pathStr);
    if (parts.length === 0) {
      throw new Error('Cannot remove root directory');
    }
    const operations: msg.Nfsv4Request[] = [nfs.PUTROOTFH()];
    for (const part of parts.slice(0, -1)) {
      operations.push(nfs.LOOKUP(part));
    }
    const dirname = parts[parts.length - 1];
    operations.push(nfs.REMOVE(dirname));
    const response = await this.nfs.compound(operations);
    if (response.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to remove directory: ${response.status}`);
    }
    const removeRes = response.resarray[response.resarray.length - 1] as msg.Nfsv4RemoveResponse;
    if (removeRes.status !== Nfsv4Stat.NFS4_OK) {
      throw new Error(`Failed to remove directory: ${removeRes.status}`);
    }
  }

  public readonly access = (path: misc.PathLike, mode?: number): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly rename = (oldPath: misc.PathLike, newPath: misc.PathLike): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly copyFile = (src: misc.PathLike, dest: misc.PathLike, flags?: misc.TFlagsCopy): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly realpath = (path: misc.PathLike, options?: opts.IRealpathOptions | string): Promise<misc.TDataOut> => {
    throw new Error('Not implemented.');
  };

  public readonly link = (existingPath: misc.PathLike, newPath: misc.PathLike): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly symlink = (target: misc.PathLike, path: misc.PathLike, type?: misc.symlink.Type): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly utimes = (path: misc.PathLike, atime: misc.TTime, mtime: misc.TTime): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly readlink = (path: misc.PathLike, options?: opts.IOptions): Promise<misc.TDataOut> => {
    throw new Error('Not implemented.');
  };

  public readonly opendir = (path: misc.PathLike, options?: opts.IOpendirOptions): Promise<misc.IDir> => {
    throw new Error('Not implemented.');
  };

  public readonly open = (path: misc.PathLike, flags?: misc.TFlags, mode?: misc.TMode): Promise<misc.IFileHandle> => {
    throw new Error('Not implemented.');
  };

  public readonly chmod = (path: misc.PathLike, mode: misc.TMode): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly rm = (path: misc.PathLike, options?: opts.IRmOptions): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly chown = (path: misc.PathLike, uid: number, gid: number): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly lchmod = (path: misc.PathLike, mode: misc.TMode): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly lchown = (path: misc.PathLike, uid: number, gid: number): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly lutimes = (path: misc.PathLike, atime: misc.TTime, mtime: misc.TTime): Promise<void> => {
    throw new Error('Not implemented.');
  };

  public readonly lstat = (path: misc.PathLike, options?: opts.IStatOptions): Promise<misc.IStats> => {
    throw new Error('Not implemented.');
  };

  public readonly mkdtemp = (prefix: string, options?: opts.IOptions): Promise<misc.TDataOut> => {
    throw new Error('Not implemented.');
  };

  public readonly statfs = (path: misc.PathLike, options?: opts.IStatOptions): Promise<misc.IStatFs> => {
    throw new Error('Not implemented.');
  };

  public readonly watch = (filename: misc.PathLike, options?: opts.IWatchOptions): AsyncIterableIterator<{
      eventType: string;
      filename: string | Buffer;
  }> => {
    throw new Error('Not implemented.');
  };

  public readonly glob = (pattern: string, options?: opts.IGlobOptions): Promise<string[]> => {
    throw new Error('Not implemented.');
  };
}

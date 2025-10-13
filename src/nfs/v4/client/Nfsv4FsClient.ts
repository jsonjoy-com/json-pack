import type {NfsFsClient, Nfsv4Client} from './types';
import * as misc from 'memfs/lib/node/types/misc';
import * as opts from 'memfs/lib/node/types/options';
import {nfs} from '../builder';
import * as msg from '../messages';
import {Nfsv4Stat, Nfsv4OpenAccess, Nfsv4OpenDeny, Nfsv4StableHow, Nfsv4Attr} from '../constants';
import {Writer} from '@jsonjoy.com/buffers/lib/Writer';
import {XdrEncoder} from '../../../xdr/XdrEncoder';

export class Nfsv4FsClient implements NfsFsClient {
  constructor(public readonly nfs: Nfsv4Client) {}

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
      nfs.OPEN(0, Nfsv4OpenAccess.OPEN4_SHARE_ACCESS_WRITE, Nfsv4OpenDeny.OPEN4_SHARE_DENY_NONE, openOwner, 0, claim),
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
}

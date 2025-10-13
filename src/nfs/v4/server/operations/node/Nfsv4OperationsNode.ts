import type {Stats, Dirent} from 'node:fs';
import * as NodePath from 'node:path';
import {randomBytes} from 'node:crypto';
import {
  Nfsv4Access,
  Nfsv4Const,
  Nfsv4Stat,
  Nfsv4OpenAccess,
  Nfsv4OpenClaimType,
  Nfsv4DelegType,
  Nfsv4LockType,
} from '../../../constants';
import {Nfsv4OperationCtx, Nfsv4Operations} from '../Nfsv4Operations';
import * as msg from '../../../messages';
import * as struct from '../../../structs';
import {cmpUint8Array} from '@jsonjoy.com/buffers/lib/cmpUint8Array';
import {ClientRecord} from '../ClientRecord';
import {OpenFileState} from '../OpenFileState';
import {OpenOwnerState} from '../OpenOwnerState';
import {LockOwnerState} from '../LockOwnerState';
import {ByteRangeLock} from '../ByteRangeLock';
import {FileHandleMapper, ROOT_FH} from './fh';
import {isErrCode, normalizeNodeFsError} from './util';
import {Nfsv4StableHow} from '../../../constants';
import {encodeAttrs} from './attrs';
import {parseBitmask, requiresLstat} from '../../../attributes';

export interface Nfsv4OperationsNodeOpts {
  /** Node.js `fs` module. */
  fs: typeof import('node:fs');

  /**
   * Absolute path to the root directory to serve. This is some directory on the
   * host filesystem that the NFS server will use as its root.
   */
  dir: string;

  /**
   * Maximum number of confirmed clients to allow.
   * @default 1000
   */
  maxClients?: number;

  /**
   * Maximum number of pending clients to allow.
   * @default 1000
   */
  maxPendingClients?: number;
}

/**
 * NFS v4 Operations implementation for Node.js `fs` filesystem.
 */
export class Nfsv4OperationsNode implements Nfsv4Operations {
  protected readonly fs: typeof import('node:fs');
  protected readonly promises: (typeof import('node:fs'))['promises'];
  protected dir: string;

  /** Confirmed clients. */
  protected clients: Map<bigint, ClientRecord> = new Map();
  /** Clients pending SETCLIENTID_CONFIRM confirmation. */
  protected pendingClients: Map<bigint, ClientRecord> = new Map();
  /** Maximum number of client records to keep. */
  protected maxClients;
  /** Maximum number of pending client records to keep. */
  protected maxPendingClients;
  /** Next client ID to assign. */
  protected nextClientId = 1n;

  /** Boot stamp, identifies server instance, 16 bits. */
  protected bootStamp: number = Math.round(Math.random() * 0xffff);

  protected readonly fh: FileHandleMapper;

  /** Next stateid sequence number. */
  protected nextStateidSeqid = 1;
  /** Map from stateid (as string key) to open file state. */
  protected openFiles: Map<string, OpenFileState> = new Map();
  /** Map from open-owner key to owner state. */
  protected openOwners: Map<string, OpenOwnerState> = new Map();

  /** Map from lock key to byte-range lock. */
  protected locks: Map<string, ByteRangeLock> = new Map();
  /** Map from lock-owner key to lock-owner state. */
  protected lockOwners: Map<string, LockOwnerState> = new Map();

  constructor(opts: Nfsv4OperationsNodeOpts) {
    this.fs = opts.fs;
    this.promises = this.fs.promises;
    this.dir = opts.dir;
    this.fh = new FileHandleMapper(this.bootStamp, this.dir);
    this.maxClients = opts.maxClients ?? 1000;
    this.maxPendingClients = opts.maxPendingClients ?? 1000;
  }

  protected findClientByIdString(
    map: Map<bigint, ClientRecord>,
    clientIdString: Uint8Array,
  ): [bigint, ClientRecord] | undefined {
    for (const entry of map.entries()) if (cmpUint8Array(entry[1].clientIdString, clientIdString)) return entry;
    return;
  }

  protected enforceClientLimit(): void {
    if (this.clients.size <= this.maxClients) return;
    const firstKey = this.clients.keys().next().value;
    if (firstKey !== undefined) this.clients.delete(firstKey);
  }

  protected enforcePendingClientLimit(): void {
    if (this.pendingClients.size < this.maxPendingClients) return;
    const firstKey = this.pendingClients.keys().next().value;
    if (firstKey !== undefined) this.pendingClients.delete(firstKey);
  }

  protected makeOpenOwnerKey(clientid: bigint, owner: Uint8Array): string {
    return `${clientid}:${Buffer.from(owner).toString('hex')}`;
  }

  protected makeStateidKey(stateid: struct.Nfsv4Stateid): string {
    return `${stateid.seqid}:${Buffer.from(stateid.other).toString('hex')}`;
  }

  protected createStateid(): struct.Nfsv4Stateid {
    const seqid = this.nextStateidSeqid++;
    const other = randomBytes(12);
    return new struct.Nfsv4Stateid(seqid, other);
  }

  protected canAccessFile(path: string, shareAccess: number, shareDeny: number): boolean {
    for (const openFile of this.openFiles.values()) {
      if (openFile.path !== path) continue;
      if ((openFile.shareDeny & shareAccess) !== 0) return false;
      if ((shareDeny & openFile.shareAccess) !== 0) return false;
    }
    return true;
  }

  protected makeLockOwnerKey(clientid: bigint, owner: Uint8Array): string {
    return `${clientid}:${Buffer.from(owner).toString('hex')}`;
  }

  protected makeLockKey(stateid: struct.Nfsv4Stateid, offset: bigint, length: bigint): string {
    return `${this.makeStateidKey(stateid)}:${offset}:${length}`;
  }

  protected hasConflictingLock(
    path: string,
    locktype: number,
    offset: bigint,
    length: bigint,
    ownerKey: string,
  ): boolean {
    const isWriteLock = locktype === Nfsv4LockType.WRITE_LT;
    for (const lock of this.locks.values()) {
      if (lock.path !== path) continue;
      if (!lock.overlaps(offset, length)) continue;
      if (lock.lockOwnerKey === ownerKey) continue;
      if (isWriteLock || lock.locktype === Nfsv4LockType.WRITE_LT) return true;
    }
    return false;
  }

  /**
   * Establishes client ID or updates callback information.
   * Returns a client ID and confirmation verifier for SETCLIENTID_CONFIRM.
   */
  public async SETCLIENTID(
    request: msg.Nfsv4SetclientidRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4SetclientidResponse> {
    const principal = ctx.getPrincipal();
    const verifier = request.client.verifier.data;
    const clientIdString = request.client.id;
    const callback = request.callback;
    const callbackIdent = request.callbackIdent;
    const confirmedClientEntry = this.findClientByIdString(this.clients, clientIdString);
    let clientid: bigint = 0n;
    if (confirmedClientEntry) {
      const existingRecord = confirmedClientEntry[1];
      if (existingRecord.principal !== principal) return new msg.Nfsv4SetclientidResponse(Nfsv4Stat.NFS4ERR_CLID_INUSE);
      this.pendingClients.delete(clientid);
      clientid = confirmedClientEntry[0];
      const verifierMatch = cmpUint8Array(existingRecord.verifier, verifier);
      if (verifierMatch) {
        // The client is re-registering with the same ID string and verifier.
        // Update callback information, return existing client ID and issue
        // new confirm verifier.
      } else {
        // The client is re-registering with the same ID string but different verifier.
        clientid = this.nextClientId++;
      }
    } else {
      const pendingClientEntry = this.findClientByIdString(this.pendingClients, clientIdString);
      if (pendingClientEntry) {
        const existingRecord = pendingClientEntry[1];
        if (existingRecord.principal !== principal)
          return new msg.Nfsv4SetclientidResponse(Nfsv4Stat.NFS4ERR_CLID_INUSE);
        const verifierMatch = cmpUint8Array(existingRecord.verifier, verifier);
        if (verifierMatch && existingRecord.cache) {
          // The client is re-registering with the same ID string and verifier.
          // Return cached response.
          return existingRecord.cache;
        }
      }
      // New client ID string. Create new client record.
      clientid = this.nextClientId++;
    }
    const setclientidConfirm = randomBytes(8);
    const verifierStruct = new struct.Nfsv4Verifier(setclientidConfirm);
    const body = new msg.Nfsv4SetclientidResOk(clientid, verifierStruct);
    const response = new msg.Nfsv4SetclientidResponse(Nfsv4Stat.NFS4_OK, body);
    const newRecord = new ClientRecord(
      principal,
      verifier,
      clientIdString,
      callback,
      callbackIdent,
      setclientidConfirm,
      response,
    );

    // Remove any existing pending records with same ID string.
    for (const [id, entry] of this.pendingClients.entries())
      if (cmpUint8Array(entry.clientIdString, clientIdString)) this.pendingClients.delete(id);
    this.enforcePendingClientLimit();
    this.pendingClients.set(clientid, newRecord);

    return response;
  }

  /**
   * Confirms a client ID established by SETCLIENTID.
   * Transitions unconfirmed client record to confirmed state.
   */
  public async SETCLIENTID_CONFIRM(
    request: msg.Nfsv4SetclientidConfirmRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4SetclientidConfirmResponse> {
    const {clients, pendingClients} = this;
    const clientid = request.clientid;
    const setclientidConfirm = request.setclientidConfirm.data;
    const pendingRecord = pendingClients.get(clientid);
    if (!pendingRecord) {
      const confirmedRecord = this.clients.get(clientid);
      if (confirmedRecord && cmpUint8Array(confirmedRecord.setclientidConfirm, setclientidConfirm))
        return new msg.Nfsv4SetclientidConfirmResponse(Nfsv4Stat.NFS4_OK);
      return new msg.Nfsv4SetclientidConfirmResponse(Nfsv4Stat.NFS4ERR_STALE_CLIENTID);
    }
    const principal = ctx.getPrincipal();
    if (pendingRecord.principal !== principal)
      return new msg.Nfsv4SetclientidConfirmResponse(Nfsv4Stat.NFS4ERR_CLID_INUSE);
    if (!cmpUint8Array(pendingRecord.setclientidConfirm, setclientidConfirm))
      return new msg.Nfsv4SetclientidConfirmResponse(Nfsv4Stat.NFS4ERR_STALE_CLIENTID);
    const oldConfirmed = this.findClientByIdString(this.clients, pendingRecord.clientIdString);
    if (oldConfirmed) {
      const clientid2 = oldConfirmed[0];
      this.clients.delete(clientid2);
      pendingClients.delete(clientid2);
    }
    this.clients.delete(clientid);
    pendingClients.delete(clientid);

    // Remove any existing pending records with same ID string.
    const clientIdString = pendingRecord.clientIdString;
    for (const [id, entry] of pendingClients.entries())
      if (cmpUint8Array(entry.clientIdString, clientIdString)) pendingClients.delete(id);
    for (const [id, entry] of clients.entries())
      if (cmpUint8Array(entry.clientIdString, clientIdString)) clients.delete(id);

    this.enforceClientLimit();
    clients.set(clientid, pendingRecord);
    return new msg.Nfsv4SetclientidConfirmResponse(Nfsv4Stat.NFS4_OK);
  }

  public async ILLEGAL(request: msg.Nfsv4IllegalRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4IllegalResponse> {
    ctx.connection.logger.log('ILLEGAL', request);
    return new msg.Nfsv4IllegalResponse(Nfsv4Stat.NFS4ERR_OP_ILLEGAL);
  }

  public async PUTROOTFH(
    request: msg.Nfsv4PutrootfhRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4PutrootfhResponse> {
    ctx.cfh = ROOT_FH;
    return new msg.Nfsv4PutrootfhResponse(Nfsv4Stat.NFS4_OK);
  }

  public async PUTPUBFH(request: msg.Nfsv4PutpubfhRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4PutpubfhResponse> {
    ctx.cfh = ROOT_FH;
    return new msg.Nfsv4PutpubfhResponse(Nfsv4Stat.NFS4_OK);
  }

  public async PUTFH(request: msg.Nfsv4PutfhRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4PutfhResponse> {
    const fh = request.object.data;
    if (fh.length > Nfsv4Const.FHSIZE) throw Nfsv4Stat.NFS4ERR_BADHANDLE;
    const valid = this.fh.validate(fh);
    if (!valid) throw Nfsv4Stat.NFS4ERR_BADHANDLE;
    ctx.cfh = fh;
    return new msg.Nfsv4PutfhResponse(Nfsv4Stat.NFS4_OK);
  }

  public async GETFH(request: msg.Nfsv4GetfhRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4GetfhResponse> {
    const cfh = ctx.cfh;
    if (!cfh) throw Nfsv4Stat.NFS4ERR_NOFILEHANDLE;
    const fh = new struct.Nfsv4Fh(cfh);
    const body = new msg.Nfsv4GetfhResOk(fh);
    return new msg.Nfsv4GetfhResponse(Nfsv4Stat.NFS4_OK, body);
  }

  public async RESTOREFH(
    request: msg.Nfsv4RestorefhRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4RestorefhResponse> {
    if (!ctx.sfh) throw Nfsv4Stat.NFS4ERR_RESTOREFH;
    ctx.cfh = ctx.sfh;
    return new msg.Nfsv4RestorefhResponse(Nfsv4Stat.NFS4_OK);
  }

  public async SAVEFH(request: msg.Nfsv4SavefhRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4SavefhResponse> {
    if (!ctx.cfh) throw Nfsv4Stat.NFS4ERR_NOFILEHANDLE;
    ctx.sfh = ctx.cfh;
    return new msg.Nfsv4SavefhResponse(Nfsv4Stat.NFS4_OK);
  }

  private absolutePath(path: string): string {
    const dir = this.dir;
    if (path === dir) return dir;
    if (path.startsWith(dir + NodePath.sep) || path.startsWith(dir + '/')) return path;
    const absolutePath = NodePath.join(dir, path);
    if (absolutePath.length < dir.length) throw Nfsv4Stat.NFS4ERR_NOENT;
    if (!absolutePath.startsWith(dir)) throw Nfsv4Stat.NFS4ERR_NOENT;
    return absolutePath;
  }

  public async LOOKUP(request: msg.Nfsv4LookupRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LookupResponse> {
    const fh = this.fh;
    const currentPath = fh.currentPath(ctx);
    const dirAbsolutePath = this.absolutePath(currentPath);
    const component = request.objname;
    if (component.length === 0) throw Nfsv4Stat.NFS4ERR_INVAL;
    const promises = this.promises;
    let stats: Stats;
    try {
      stats = await promises.stat(dirAbsolutePath);
    } catch (err: unknown) {
      if (isErrCode('ENOENT', err)) throw Nfsv4Stat.NFS4ERR_NOENT;
      throw Nfsv4Stat.NFS4ERR_IO;
    }
    if (stats.isSymbolicLink()) throw Nfsv4Stat.NFS4ERR_SYMLINK;
    if (!stats.isDirectory()) throw Nfsv4Stat.NFS4ERR_NOTDIR;
    const targetAbsolutePath = NodePath.join(dirAbsolutePath, component);
    try {
      const targetStats = await promises.stat(targetAbsolutePath);
      if (!targetStats) throw Nfsv4Stat.NFS4ERR_NOENT;
    } catch (err: any) {
      if (isErrCode('ENOENT', err)) throw Nfsv4Stat.NFS4ERR_NOENT;
      if (isErrCode('EACCES', err)) throw Nfsv4Stat.NFS4ERR_ACCESS;
      throw Nfsv4Stat.NFS4ERR_IO;
    }
    fh.setCfh(ctx, targetAbsolutePath);
    return new msg.Nfsv4LookupResponse(Nfsv4Stat.NFS4_OK);
  }

  public async LOOKUPP(request: msg.Nfsv4LookuppRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LookuppResponse> {
    const fh = this.fh;
    const currentPath = fh.currentPath(ctx);
    const absolutePath = this.absolutePath(currentPath);
    const promises = this.promises;
    let stats: Stats;
    try {
      stats = await promises.stat(absolutePath);
    } catch (err: any) {
      if (isErrCode('ENOENT', err)) throw Nfsv4Stat.NFS4ERR_NOENT;
      throw Nfsv4Stat.NFS4ERR_IO;
    }
    if (!stats.isDirectory()) throw Nfsv4Stat.NFS4ERR_NOTDIR;
    const parentAbsolutePath = NodePath.dirname(absolutePath);
    if (parentAbsolutePath.length < this.dir.length) throw Nfsv4Stat.NFS4ERR_NOENT;
    fh.setCfh(ctx, parentAbsolutePath);
    return new msg.Nfsv4LookuppResponse(Nfsv4Stat.NFS4_OK);
  }

  public async GETATTR(request: msg.Nfsv4GetattrRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4GetattrResponse> {
    const path = this.fh.currentPath(ctx);
    const absolutePath = this.absolutePath(path);
    const requestedAttrNums = parseBitmask(request.attrRequest.mask);
    let stats: Stats | undefined;
    if (requiresLstat(requestedAttrNums)) {
      try {
        if (ctx.connection.debug) ctx.connection.logger.log('lstat', absolutePath);
        stats = await this.promises.lstat(absolutePath);
      } catch (error: unknown) {
        throw normalizeNodeFsError(error, ctx.connection.logger);
      }
    }
    const attrs = encodeAttrs(request.attrRequest, stats, path, ctx.cfh!);
    return new msg.Nfsv4GetattrResponse(Nfsv4Stat.NFS4_OK, new msg.Nfsv4GetattrResOk(attrs));
  }

  public async ACCESS(request: msg.Nfsv4AccessRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4AccessResponse> {
    const path = this.fh.currentPath(ctx);
    const absolutePath = this.absolutePath(path);
    const promises = this.promises;
    let stats: Stats;
    try {
      stats = await promises.lstat(absolutePath);
    } catch (error: unknown) {
      throw normalizeNodeFsError(error, ctx.connection.logger);
    }
    const requestedAccess = request.access;
    const isDirectory = stats.isDirectory();
    const mode = stats.mode;
    let supported = 0;
    let access = 0;
    if (requestedAccess & Nfsv4Access.ACCESS4_READ) {
      supported |= Nfsv4Access.ACCESS4_READ;
      if (mode & 0o444) access |= Nfsv4Access.ACCESS4_READ;
    }
    if (requestedAccess & Nfsv4Access.ACCESS4_LOOKUP) {
      supported |= Nfsv4Access.ACCESS4_LOOKUP;
      if (isDirectory && mode & 0o111) access |= Nfsv4Access.ACCESS4_LOOKUP;
    }
    if (requestedAccess & Nfsv4Access.ACCESS4_MODIFY) {
      supported |= Nfsv4Access.ACCESS4_MODIFY;
      if (mode & 0o222) access |= Nfsv4Access.ACCESS4_MODIFY;
    }
    if (requestedAccess & Nfsv4Access.ACCESS4_EXTEND) {
      supported |= Nfsv4Access.ACCESS4_EXTEND;
      if (mode & 0o222) access |= Nfsv4Access.ACCESS4_EXTEND;
    }
    if (requestedAccess & Nfsv4Access.ACCESS4_DELETE) {
      if (!isDirectory) {
        supported |= 0;
      } else {
        supported |= Nfsv4Access.ACCESS4_DELETE;
        if (mode & 0o222) access |= Nfsv4Access.ACCESS4_DELETE;
      }
    }
    if (requestedAccess & Nfsv4Access.ACCESS4_EXECUTE) {
      supported |= Nfsv4Access.ACCESS4_EXECUTE;
      if (!isDirectory && mode & 0o111) access |= Nfsv4Access.ACCESS4_EXECUTE;
    }
    const body = new msg.Nfsv4AccessResOk(supported, access);
    return new msg.Nfsv4AccessResponse(Nfsv4Stat.NFS4_OK, body);
  }

  public async READDIR(request: msg.Nfsv4ReaddirRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4ReaddirResponse> {
    const fh = this.fh;
    const currentPath = fh.currentPath(ctx);
    const absolutePath = this.absolutePath(currentPath);
    const promises = this.promises;
    let stats: Stats;
    try {
      stats = await promises.lstat(absolutePath);
    } catch (error: unknown) {
      throw normalizeNodeFsError(error, ctx.connection.logger);
    }
    if (!stats.isDirectory()) throw Nfsv4Stat.NFS4ERR_NOTDIR;
    const cookie = request.cookie;
    const requestedCookieverf = request.cookieverf.data;
    const maxcount = request.maxcount;
    const attrRequest = request.attrRequest;
    let cookieverf: Uint8Array;
    if (cookie === 0n) {
      cookieverf = new Uint8Array(8);
      const changeTime = BigInt(Math.floor(stats.mtimeMs * 1000000));
      const view = new DataView(cookieverf.buffer);
      view.setBigUint64(0, changeTime, false);
    } else {
      cookieverf = new Uint8Array(8);
      const changeTime = BigInt(Math.floor(stats.mtimeMs * 1000000));
      const view = new DataView(cookieverf.buffer);
      view.setBigUint64(0, changeTime, false);
      if (!cmpUint8Array(requestedCookieverf, cookieverf)) throw Nfsv4Stat.NFS4ERR_NOT_SAME;
    }
    let dirents: Dirent[];
    try {
      dirents = await promises.readdir(absolutePath, {withFileTypes: true});
    } catch (error: unknown) {
      throw normalizeNodeFsError(error, ctx.connection.logger);
    }
    const entries: struct.Nfsv4Entry[] = [];
    let totalBytes = 0;
    const overheadPerEntry = 32;
    let startIndex = 0;
    if (cookie > 0n) {
      startIndex = Number(cookie) - 2;
      if (startIndex < 0) startIndex = 0;
      if (startIndex > dirents.length) startIndex = dirents.length;
    }
    let eof = true;
    for (let i = startIndex; i < dirents.length; i++) {
      const dirent = dirents[i];
      const name = dirent.name;
      const entryCookie = BigInt(i + 3);
      const entryPath = NodePath.join(absolutePath, name);
      let entryStats: Stats | undefined;
      try {
        entryStats = await promises.lstat(entryPath);
      } catch (error: unknown) {
        continue;
      }
      const entryFh = fh.encode(entryPath);
      const attrs = encodeAttrs(attrRequest, entryStats, entryPath, entryFh);
      const nameBytes = Buffer.byteLength(name, 'utf8');
      const attrBytes = attrs.attrVals.length;
      const entryBytes = overheadPerEntry + nameBytes + attrBytes;
      if (totalBytes + entryBytes > maxcount && entries.length > 0) {
        eof = false;
        break;
      }
      const entry = new struct.Nfsv4Entry(entryCookie, name, attrs);
      entries.push(entry);
      totalBytes += entryBytes;
    }
    const cookieverf2 = new struct.Nfsv4Verifier(cookieverf);
    const body = new msg.Nfsv4ReaddirResOk(cookieverf2, entries, eof);
    return new msg.Nfsv4ReaddirResponse(Nfsv4Stat.NFS4_OK, body);
  }

  public async OPEN(request: msg.Nfsv4OpenRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4OpenResponse> {
    const cfh = ctx.cfh;
    if (!cfh) throw Nfsv4Stat.NFS4ERR_NOFILEHANDLE;
    const dirPath = this.fh.decode(cfh);
    const ownerKey = this.makeOpenOwnerKey(request.owner.clientid, request.owner.owner);
    let ownerState = this.openOwners.get(ownerKey);
    if (!ownerState) {
      ownerState = new OpenOwnerState(request.owner.clientid, request.owner.owner, request.seqid);
      this.openOwners.set(ownerKey, ownerState);
    }
    if (request.claim.claimType !== Nfsv4OpenClaimType.CLAIM_NULL) {
      return new msg.Nfsv4OpenResponse(Nfsv4Stat.NFS4ERR_NOTSUPP);
    }
    const claimNull = request.claim.claim as struct.Nfsv4OpenClaimNull;
    const filename = claimNull.file;
    const filePath = this.absolutePath(NodePath.join(dirPath, filename));
    try {
      const stats = await this.promises.lstat(filePath);
      if (!stats.isFile()) {
        return new msg.Nfsv4OpenResponse(Nfsv4Stat.NFS4ERR_ISDIR);
      }
    } catch (err) {
      if (isErrCode(err, 'ENOENT')) {
        return new msg.Nfsv4OpenResponse(Nfsv4Stat.NFS4ERR_NOENT);
      }
      const status = normalizeNodeFsError(err, ctx.connection.logger);
      return new msg.Nfsv4OpenResponse(status);
    }
    if (!this.canAccessFile(filePath, request.shareAccess, request.shareDeny)) {
      return new msg.Nfsv4OpenResponse(Nfsv4Stat.NFS4ERR_SHARE_DENIED);
    }
    let flags = 0;
    const isWrite = (request.shareAccess & Nfsv4OpenAccess.OPEN4_SHARE_ACCESS_WRITE) !== 0;
    const isRead = (request.shareAccess & Nfsv4OpenAccess.OPEN4_SHARE_ACCESS_READ) !== 0;
    if (isRead && isWrite) {
      flags = this.fs.constants.O_RDWR;
    } else if (isWrite) {
      flags = this.fs.constants.O_WRONLY;
    } else {
      flags = this.fs.constants.O_RDONLY;
    }
    try {
      const fd = await this.promises.open(filePath, flags);
      const stateid = this.createStateid();
      const stateidKey = this.makeStateidKey(stateid);
      const openFile = new OpenFileState(
        stateid,
        filePath,
        fd,
        request.shareAccess,
        request.shareDeny,
        ownerKey,
        request.seqid,
        false,
      );
      this.openFiles.set(stateidKey, openFile);
      ownerState.opens.add(stateidKey);
      const fh = this.fh.encode(filePath);
      ctx.cfh = fh;
      const cinfo = new struct.Nfsv4ChangeInfo(true, 0n, 0n);
      const attrset = new struct.Nfsv4Bitmap([]);
      const delegation = new struct.Nfsv4OpenDelegation(Nfsv4DelegType.OPEN_DELEGATE_NONE);
      const resok = new msg.Nfsv4OpenResOk(stateid, cinfo, 0, attrset, delegation);
      return new msg.Nfsv4OpenResponse(Nfsv4Stat.NFS4_OK, resok);
    } catch (err) {
      const status = normalizeNodeFsError(err, ctx.connection.logger);
      return new msg.Nfsv4OpenResponse(status);
    }
  }

  public async OPENATTR(request: msg.Nfsv4OpenattrRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4OpenattrResponse> {
    return new msg.Nfsv4OpenattrResponse(Nfsv4Stat.NFS4ERR_NOTSUPP);
  }

  public async OPEN_CONFIRM(
    request: msg.Nfsv4OpenConfirmRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4OpenConfirmResponse> {
    const stateidKey = this.makeStateidKey(request.openStateid);
    const openFile = this.openFiles.get(stateidKey);
    if (!openFile) {
      return new msg.Nfsv4OpenConfirmResponse(Nfsv4Stat.NFS4ERR_BAD_STATEID);
    }
    if (openFile.seqid !== request.seqid) {
      return new msg.Nfsv4OpenConfirmResponse(Nfsv4Stat.NFS4ERR_BAD_SEQID);
    }
    openFile.confirmed = true;
    openFile.seqid++;
    const newStateid = new struct.Nfsv4Stateid(openFile.seqid, openFile.stateid.other);
    const resok = new msg.Nfsv4OpenConfirmResOk(newStateid);
    return new msg.Nfsv4OpenConfirmResponse(Nfsv4Stat.NFS4_OK, resok);
  }

  public async OPEN_DOWNGRADE(
    request: msg.Nfsv4OpenDowngradeRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4OpenDowngradeResponse> {
    const stateidKey = this.makeStateidKey(request.openStateid);
    const openFile = this.openFiles.get(stateidKey);
    if (!openFile) {
      return new msg.Nfsv4OpenDowngradeResponse(Nfsv4Stat.NFS4ERR_BAD_STATEID);
    }
    if (openFile.seqid !== request.seqid) {
      return new msg.Nfsv4OpenDowngradeResponse(Nfsv4Stat.NFS4ERR_BAD_SEQID);
    }
    if ((request.shareAccess & ~openFile.shareAccess) !== 0) {
      return new msg.Nfsv4OpenDowngradeResponse(Nfsv4Stat.NFS4ERR_INVAL);
    }
    if ((request.shareDeny & ~openFile.shareDeny) !== 0) {
      return new msg.Nfsv4OpenDowngradeResponse(Nfsv4Stat.NFS4ERR_INVAL);
    }
    openFile.shareAccess = request.shareAccess;
    openFile.shareDeny = request.shareDeny;
    openFile.seqid++;
    const newStateid = new struct.Nfsv4Stateid(openFile.seqid, openFile.stateid.other);
    const resok = new msg.Nfsv4OpenDowngradeResOk(newStateid);
    return new msg.Nfsv4OpenDowngradeResponse(Nfsv4Stat.NFS4_OK, resok);
  }

  public async CLOSE(request: msg.Nfsv4CloseRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4CloseResponse> {
    const stateidKey = this.makeStateidKey(request.openStateid);
    const openFile = this.openFiles.get(stateidKey);
    if (!openFile) {
      return new msg.Nfsv4CloseResponse(Nfsv4Stat.NFS4_OK, new msg.Nfsv4CloseResOk(request.openStateid));
    }
    if (openFile.seqid !== request.seqid) {
      return new msg.Nfsv4CloseResponse(Nfsv4Stat.NFS4ERR_BAD_SEQID);
    }
    try {
      const handle = openFile.fd as any;
      if (handle && typeof handle.close === 'function') {
        await handle.close();
      }
    } catch (err) {
      const status = normalizeNodeFsError(err, ctx.connection.logger);
      if (status !== Nfsv4Stat.NFS4ERR_NOENT) {
        return new msg.Nfsv4CloseResponse(status);
      }
    }
    const ownerState = this.openOwners.get(openFile.openOwnerKey);
    if (ownerState) {
      ownerState.opens.delete(stateidKey);
      if (ownerState.opens.size === 0) {
        this.openOwners.delete(openFile.openOwnerKey);
      }
    }
    this.openFiles.delete(stateidKey);
    openFile.seqid++;
    const newStateid = new struct.Nfsv4Stateid(openFile.seqid, openFile.stateid.other);
    const resok = new msg.Nfsv4CloseResOk(newStateid);
    return new msg.Nfsv4CloseResponse(Nfsv4Stat.NFS4_OK, resok);
  }

  public async SECINFO(request: msg.Nfsv4SecinfoRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4SecinfoResponse> {
    const cfh = ctx.cfh;
    if (!cfh) throw Nfsv4Stat.NFS4ERR_NOFILEHANDLE;
    const dirPath = this.fh.decode(cfh);
    const filename = request.name;
    const filePath = this.absolutePath(NodePath.join(dirPath, filename));
    try {
      await this.promises.lstat(filePath);
    } catch (err) {
      if (isErrCode(err, 'ENOENT')) {
        return new msg.Nfsv4SecinfoResponse(Nfsv4Stat.NFS4ERR_NOENT);
      }
      const status = normalizeNodeFsError(err, ctx.connection.logger);
      return new msg.Nfsv4SecinfoResponse(status);
    }
    const flavors: struct.Nfsv4SecInfoFlavor[] = [new struct.Nfsv4SecInfoFlavor(1)];
    const resok = new msg.Nfsv4SecinfoResOk(flavors);
    return new msg.Nfsv4SecinfoResponse(Nfsv4Stat.NFS4_OK, resok);
  }

  public async LOCK(request: msg.Nfsv4LockRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LockResponse> {
    const cfh = ctx.cfh;
    if (!cfh) throw Nfsv4Stat.NFS4ERR_NOFILEHANDLE;
    const filePath = this.fh.decode(cfh);
    const {locktype, offset, length, locker} = request;
    if (!locker.newLockOwner) {
      const existingOwner = locker.owner as struct.Nfsv4LockExistingOwner;
      const stateidKey = this.makeStateidKey(existingOwner.lockStateid);
      const existingLock = this.locks.get(stateidKey);
      if (!existingLock) {
        return new msg.Nfsv4LockResponse(Nfsv4Stat.NFS4ERR_BAD_STATEID);
      }
      if (this.hasConflictingLock(filePath, locktype, offset, length, existingLock.lockOwnerKey)) {
        const conflictOwner = new struct.Nfsv4LockOwner(BigInt(0), new Uint8Array());
        const denied = new msg.Nfsv4LockResDenied(offset, length, locktype, conflictOwner);
        return new msg.Nfsv4LockResponse(Nfsv4Stat.NFS4ERR_LOCKED, undefined, denied);
      }
      const stateid = this.createStateid();
      const lock = new ByteRangeLock(stateid, filePath, locktype, offset, length, existingLock.lockOwnerKey);
      const lockKey = this.makeLockKey(stateid, offset, length);
      this.locks.set(lockKey, lock);
      const lockOwner = this.lockOwners.get(existingLock.lockOwnerKey);
      if (lockOwner) lockOwner.locks.add(lockKey);
      const resok = new msg.Nfsv4LockResOk(stateid);
      return new msg.Nfsv4LockResponse(Nfsv4Stat.NFS4_OK, resok);
    }
    const newOwner = locker.owner as struct.Nfsv4LockNewOwner;
    const openToLock = newOwner.openToLockOwner;
    const lockOwnerData = openToLock.lockOwner;
    const ownerKey = this.makeLockOwnerKey(lockOwnerData.clientid, lockOwnerData.owner);
    if (this.hasConflictingLock(filePath, locktype, offset, length, ownerKey)) {
      const conflictOwner = new struct.Nfsv4LockOwner(BigInt(0), new Uint8Array());
      const denied = new msg.Nfsv4LockResDenied(offset, length, locktype, conflictOwner);
      return new msg.Nfsv4LockResponse(Nfsv4Stat.NFS4ERR_LOCKED, undefined, denied);
    }
    let lockOwnerState = this.lockOwners.get(ownerKey);
    if (!lockOwnerState) {
      lockOwnerState = new LockOwnerState(lockOwnerData.clientid, lockOwnerData.owner, openToLock.lockSeqid);
      this.lockOwners.set(ownerKey, lockOwnerState);
    }
    const stateid = this.createStateid();
    const lock = new ByteRangeLock(stateid, filePath, locktype, offset, length, ownerKey);
    const lockKey = this.makeLockKey(stateid, offset, length);
    this.locks.set(lockKey, lock);
    lockOwnerState.locks.add(lockKey);
    const resok = new msg.Nfsv4LockResOk(stateid);
    return new msg.Nfsv4LockResponse(Nfsv4Stat.NFS4_OK, resok);
  }

  public async LOCKT(request: msg.Nfsv4LocktRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LocktResponse> {
    const cfh = ctx.cfh;
    if (!cfh) throw Nfsv4Stat.NFS4ERR_NOFILEHANDLE;
    const filePath = this.fh.decode(cfh);
    const {locktype, offset, length, owner} = request;
    const ownerKey = this.makeLockOwnerKey(owner.clientid, owner.owner);
    if (this.hasConflictingLock(filePath, locktype, offset, length, ownerKey)) {
      const conflictOwner = new struct.Nfsv4LockOwner(BigInt(0), new Uint8Array());
      const denied = new msg.Nfsv4LocktResDenied(offset, length, locktype, conflictOwner);
      return new msg.Nfsv4LocktResponse(Nfsv4Stat.NFS4ERR_LOCKED, denied);
    }
    return new msg.Nfsv4LocktResponse(Nfsv4Stat.NFS4_OK);
  }

  public async LOCKU(request: msg.Nfsv4LockuRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LockuResponse> {
    const {lockStateid, offset, length} = request;
    const lockKey = this.makeLockKey(lockStateid, offset, length);
    const lock = this.locks.get(lockKey);
    if (!lock) {
      return new msg.Nfsv4LockuResponse(Nfsv4Stat.NFS4ERR_BAD_STATEID);
    }
    this.locks.delete(lockKey);
    const lockOwner = this.lockOwners.get(lock.lockOwnerKey);
    if (lockOwner) {
      lockOwner.locks.delete(lockKey);
      if (lockOwner.locks.size === 0) {
        this.lockOwners.delete(lock.lockOwnerKey);
      }
    }
    const stateid = this.createStateid();
    const resok = new msg.Nfsv4LockuResOk(stateid);
    return new msg.Nfsv4LockuResponse(Nfsv4Stat.NFS4_OK, resok);
  }

  public async RELEASE_LOCKOWNER(
    request: msg.Nfsv4ReleaseLockOwnerRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4ReleaseLockOwnerResponse> {
    const {lockOwner} = request;
    const ownerKey = this.makeLockOwnerKey(lockOwner.clientid, lockOwner.owner);
    const lockOwnerState = this.lockOwners.get(ownerKey);
    if (!lockOwnerState) {
      return new msg.Nfsv4ReleaseLockOwnerResponse(Nfsv4Stat.NFS4ERR_BAD_STATEID);
    }
    for (const lockKey of lockOwnerState.locks) {
      this.locks.delete(lockKey);
    }
    this.lockOwners.delete(ownerKey);
    return new msg.Nfsv4ReleaseLockOwnerResponse(Nfsv4Stat.NFS4_OK);
  }

  public async RENEW(request: msg.Nfsv4RenewRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4RenewResponse> {
    const clientid = request.clientid;
    const client = this.clients.get(clientid);
    if (!client) {
      return new msg.Nfsv4RenewResponse(Nfsv4Stat.NFS4ERR_STALE_CLIENTID);
    }
    return new msg.Nfsv4RenewResponse(Nfsv4Stat.NFS4_OK);
  }

  public async READ(request: msg.Nfsv4ReadRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4ReadResponse> {
    const stateidKey = this.makeStateidKey(request.stateid);
    const openFile = this.openFiles.get(stateidKey);
    if (!openFile) return new msg.Nfsv4ReadResponse(Nfsv4Stat.NFS4ERR_BAD_STATEID);
    const fdHandle = openFile.fd as any;
    // If we have an fd-like handle, use its .read; otherwise open the path
    let fd: any = undefined;
    let openedHere = false;
    try {
      if (fdHandle && typeof fdHandle.read === 'function') {
        fd = fdHandle;
      } else {
        fd = await this.promises.open(openFile.path, this.fs.constants.O_RDONLY);
        openedHere = true;
      }
      const buf = Buffer.alloc(request.count);
      const {bytesRead} = await fd.read(buf, 0, request.count, Number(request.offset));
      const eof = bytesRead < request.count;
      const data = buf.slice(0, bytesRead);
      const resok = new msg.Nfsv4ReadResOk(eof, data);
      return new msg.Nfsv4ReadResponse(Nfsv4Stat.NFS4_OK, resok);
    } catch (err: unknown) {
      const status = normalizeNodeFsError(err, ctx.connection.logger);
      return new msg.Nfsv4ReadResponse(status);
    } finally {
      try {
        if (openedHere && fd && typeof fd.close === 'function') await fd.close();
      } catch (e) {
        /* ignore close errors */
      }
    }
  }

  public async READLINK(request: msg.Nfsv4ReadlinkRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4ReadlinkResponse> {
    const cfh = ctx.cfh;
    if (!cfh) throw Nfsv4Stat.NFS4ERR_NOFILEHANDLE;
    const path = this.fh.decode(cfh);
    try {
      const target = await this.promises.readlink(path);
      const resok = new msg.Nfsv4ReadlinkResOk(target);
      return new msg.Nfsv4ReadlinkResponse(Nfsv4Stat.NFS4_OK, resok);
    } catch (err: unknown) {
      const status = normalizeNodeFsError(err, ctx.connection.logger);
      return new msg.Nfsv4ReadlinkResponse(status);
    }
  }

  public async REMOVE(request: msg.Nfsv4RemoveRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4RemoveResponse> {
    const cfh = ctx.cfh;
    if (!cfh) throw Nfsv4Stat.NFS4ERR_NOFILEHANDLE;
    const dirPath = this.fh.decode(cfh);
  const targetFull = NodePath.resolve(NodePath.join(dirPath, request.target));
  const targetPath = this.absolutePath(targetFull);
    try {
      const stats = await this.promises.lstat(targetPath);
      if (stats.isDirectory()) {
        // For now, use rmdir semantics (only remove empty dirs)
        await this.promises.rmdir(targetPath);
      } else {
        await this.promises.unlink(targetPath);
      }
      return new msg.Nfsv4RemoveResponse(Nfsv4Stat.NFS4_OK);
    } catch (err: unknown) {
      const status = normalizeNodeFsError(err, ctx.connection.logger);
      return new msg.Nfsv4RemoveResponse(status);
    }
  }

  public async RENAME(request: msg.Nfsv4RenameRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4RenameResponse> {
    const cfh = ctx.cfh;
    if (!cfh) throw Nfsv4Stat.NFS4ERR_NOFILEHANDLE;
    const dirPath = this.fh.decode(cfh);
    const oldFull = NodePath.resolve(NodePath.join(dirPath, request.oldname));
    const newFull = NodePath.resolve(NodePath.join(dirPath, request.newname));
    // Ensure both paths are inside the server root. If target escapes, return XDEV.
    if (!(oldFull === this.dir || oldFull.startsWith(this.dir + NodePath.sep)))
      return new msg.Nfsv4RenameResponse(Nfsv4Stat.NFS4ERR_XDEV);
    if (!(newFull === this.dir || newFull.startsWith(this.dir + NodePath.sep)))
      return new msg.Nfsv4RenameResponse(Nfsv4Stat.NFS4ERR_XDEV);
    // Now map to absolute paths (this.absolutePath will validate existence and path)
    let oldPath: string;
    let newPath: string;
    try {
      oldPath = this.absolutePath(oldFull);
      newPath = this.absolutePath(newFull);
    } catch (e: any) {
      const status = typeof e === 'number' ? e : Nfsv4Stat.NFS4ERR_NOENT;
      return new msg.Nfsv4RenameResponse(status);
    }
    try {
      await this.promises.rename(oldPath, newPath);
      return new msg.Nfsv4RenameResponse(Nfsv4Stat.NFS4_OK);
    } catch (err: unknown) {
      if (isErrCode('EXDEV', err)) return new msg.Nfsv4RenameResponse(Nfsv4Stat.NFS4ERR_XDEV);
      const status = normalizeNodeFsError(err, ctx.connection.logger);
      return new msg.Nfsv4RenameResponse(status);
    }
  }

  public async WRITE(request: msg.Nfsv4WriteRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4WriteResponse> {
    const stateidKey = this.makeStateidKey(request.stateid);
    const openFile = this.openFiles.get(stateidKey);
    if (!openFile) return new msg.Nfsv4WriteResponse(Nfsv4Stat.NFS4ERR_BAD_STATEID);
    const fdHandle = openFile.fd as any;
    let fd: any = undefined;
    let openedHere = false;
    try {
      if (fdHandle && typeof fdHandle.write === 'function') {
        fd = fdHandle;
      } else {
        fd = await this.promises.open(openFile.path, this.fs.constants.O_RDWR);
        openedHere = true;
      }
      const buffer = Buffer.from(request.data);
      const {bytesWritten} = await fd.write(buffer, 0, buffer.length, Number(request.offset));
      // Handle stable flag
      const committed = request.stable === Nfsv4StableHow.UNSTABLE4 ? Nfsv4StableHow.UNSTABLE4 : Nfsv4StableHow.FILE_SYNC4;
      if (request.stable === Nfsv4StableHow.FILE_SYNC4 || request.stable === Nfsv4StableHow.DATA_SYNC4) {
        // fd.datasync or fd.sync
        if (typeof fd.datasync === 'function') await fd.datasync();
        else if (typeof fd.sync === 'function') await fd.sync();
      }
      const verifier = new struct.Nfsv4Verifier(randomBytes(8));
      const resok = new msg.Nfsv4WriteResOk(bytesWritten, committed, verifier);
      return new msg.Nfsv4WriteResponse(Nfsv4Stat.NFS4_OK, resok);
    } catch (err: unknown) {
      const status = normalizeNodeFsError(err, ctx.connection.logger);
      return new msg.Nfsv4WriteResponse(status);
    } finally {
      try {
        if (openedHere && fd && typeof fd.close === 'function') await fd.close();
      } catch (e) {
        /* ignore close errors */
      }
    }
  }

  public async DELEGPURGE(
    request: msg.Nfsv4DelegpurgeRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4DelegpurgeResponse> {
    return new msg.Nfsv4DelegpurgeResponse(Nfsv4Stat.NFS4ERR_NOTSUPP);
  }

  public async DELEGRETURN(
    request: msg.Nfsv4DelegreturnRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4DelegreturnResponse> {
    return new msg.Nfsv4DelegreturnResponse(Nfsv4Stat.NFS4ERR_NOTSUPP);
  }

  // ----------------------------------------------- Stub implementations below

  public async COMMIT(request: msg.Nfsv4CommitRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4CommitResponse> {
    ctx.connection.logger.log('COMMIT', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4CommitResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async CREATE(request: msg.Nfsv4CreateRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4CreateResponse> {
    ctx.connection.logger.log('CREATE', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4CreateResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async LINK(request: msg.Nfsv4LinkRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LinkResponse> {
    ctx.connection.logger.log('LINK', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4LinkResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async NVERIFY(request: msg.Nfsv4NverifyRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4NverifyResponse> {
    ctx.connection.logger.log('NVERIFY', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4NverifyResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async SETATTR(request: msg.Nfsv4SetattrRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4SetattrResponse> {
    ctx.connection.logger.log('SETATTR', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4SetattrResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async VERIFY(request: msg.Nfsv4VerifyRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4VerifyResponse> {
    ctx.connection.logger.log('VERIFY', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4VerifyResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }
}

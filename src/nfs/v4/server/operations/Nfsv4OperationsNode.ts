import {Nfsv4Stat} from '../../constants';
import {Nfsv4OperationCtx, Nfsv4Operations} from './Nfsv4Operations';
import * as msg from '../../messages';
import * as struct from '../../structs';
import {randomBytes} from 'node:crypto';
import {cmpUint8Array} from '@jsonjoy.com/buffers/lib/cmpUint8Array';
import {ClientRecord} from './ClientRecord';

export interface Nfsv4OperationsNodeOpts {
  /** Node.js `fs` module. */
  fs: typeof import('node:fs');
  /** Absolute path to the root directory to serve. */
  dir: string;
}

/**
 * NFS v4 Operations implementation for Node.js `fs` filesystem.
 */
export class Nfsv4OperationsNode implements Nfsv4Operations {
  protected fs: typeof import('node:fs');
  protected dir: string;

  /** Map of client records keyed by "confirmed-<hex>" or "unconfirmed-<hex>". */
  protected clients: Map<string, ClientRecord> = new Map();
  /** Maximum number of client records to keep. */
  protected maxClientRecords = 1000;
  /** Next client ID to assign. */
  protected nextClientId = 1n;

  constructor(opts: Nfsv4OperationsNodeOpts) {
    this.fs = opts.fs;
    this.dir = opts.dir;
  }

  /**
   * Establishes client ID or updates callback information.
   * Returns a client ID and confirmation verifier for SETCLIENTID_CONFIRM.
   */
  public async SETCLIENTID(
    request: msg.Nfsv4SetclientidRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4SetclientidResponse> {
    const verifier = request.client.verifier.data;
    const clientIdString = request.client.id;
    const callback = request.callback;
    const callbackIdent = request.callbackIdent;
    const clientIdStringKey = Buffer.from(clientIdString).toString('hex');
    const existingConfirmed = Array.from(this.clients.values()).find(
      (record) => record.confirmed && Buffer.from(record.clientIdString).toString('hex') === clientIdStringKey,
    );
    if (existingConfirmed) {
      const verifierMatch = cmpUint8Array(existingConfirmed.verifier, verifier);
      if (verifierMatch) {
        const unconfirmedKey = `unconfirmed-${clientIdStringKey}`;
        const setclientidConfirm = randomBytes(8);
        const newRecord = new ClientRecord(
          verifier,
          clientIdString,
          existingConfirmed.clientid,
          callback,
          callbackIdent,
          setclientidConfirm,
          false,
        );
        this.clients.set(unconfirmedKey, newRecord);
        const verifierStruct = new struct.Nfsv4Verifier(setclientidConfirm);
        const body = new msg.Nfsv4SetclientidResOk(existingConfirmed.clientid, verifierStruct);
        return new msg.Nfsv4SetclientidResponse(Nfsv4Stat.NFS4_OK, body);
      } else {
        const clientid = this.nextClientId++;
        const setclientidConfirm = randomBytes(8);
        const unconfirmedKey = `unconfirmed-${clientIdStringKey}`;
        const newRecord = new ClientRecord(
          verifier,
          clientIdString,
          clientid,
          callback,
          callbackIdent,
          setclientidConfirm,
          false,
        );
        this.clients.set(unconfirmedKey, newRecord);
        const verifierStruct = new struct.Nfsv4Verifier(setclientidConfirm);
        const body = new msg.Nfsv4SetclientidResOk(clientid, verifierStruct);
        return new msg.Nfsv4SetclientidResponse(Nfsv4Stat.NFS4_OK, body);
      }
    } else {
      const clientid = this.nextClientId++;
      const setclientidConfirm = randomBytes(8);
      const unconfirmedKey = `unconfirmed-${clientIdStringKey}`;
      const newRecord = new ClientRecord(
        verifier,
        clientIdString,
        clientid,
        callback,
        callbackIdent,
        setclientidConfirm,
        false,
      );
      this.clients.set(unconfirmedKey, newRecord);
      const verifierStruct = new struct.Nfsv4Verifier(setclientidConfirm);
      const body = new msg.Nfsv4SetclientidResOk(clientid, verifierStruct);
      return new msg.Nfsv4SetclientidResponse(Nfsv4Stat.NFS4_OK, body);
    }
  }

  /**
   * Confirms a client ID established by SETCLIENTID.
   * Transitions unconfirmed client record to confirmed state.
   */
  public async SETCLIENTID_CONFIRM(
    request: msg.Nfsv4SetclientidConfirmRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4SetclientidConfirmResponse> {
    const clientid = request.clientid;
    const setclientidConfirm = request.setclientidConfirm.data;
    const unconfirmedRecord = Array.from(this.clients.entries()).find(
      ([key, record]) => !record.confirmed && record.clientid === clientid,
    );
    if (!unconfirmedRecord) {
      const confirmedRecord = Array.from(this.clients.values()).find(
        (record) =>
          record.confirmed &&
          record.clientid === clientid &&
          cmpUint8Array(record.setclientidConfirm, setclientidConfirm),
      );
      if (confirmedRecord) {
        return new msg.Nfsv4SetclientidConfirmResponse(Nfsv4Stat.NFS4_OK);
      }
      return new msg.Nfsv4SetclientidConfirmResponse(Nfsv4Stat.NFS4ERR_STALE_CLIENTID);
    }
    const [unconfirmedKey, record] = unconfirmedRecord;
    if (!cmpUint8Array(record.setclientidConfirm, setclientidConfirm)) {
      return new msg.Nfsv4SetclientidConfirmResponse(Nfsv4Stat.NFS4ERR_STALE_CLIENTID);
    }
    const clientIdStringKey = Buffer.from(record.clientIdString).toString('hex');
    const confirmedKey = `confirmed-${clientIdStringKey}`;
    const oldConfirmed = Array.from(this.clients.entries()).find(
      ([key, r]) => r.confirmed && Buffer.from(r.clientIdString).toString('hex') === clientIdStringKey,
    );
    if (oldConfirmed) {
      this.clients.delete(oldConfirmed[0]);
    }
    const confirmedRecord = new ClientRecord(
      record.verifier,
      record.clientIdString,
      record.clientid,
      record.callback,
      record.callbackIdent,
      record.setclientidConfirm,
      true,
    );
    this.clients.delete(unconfirmedKey);
    this.clients.set(confirmedKey, confirmedRecord);
    return new msg.Nfsv4SetclientidConfirmResponse(Nfsv4Stat.NFS4_OK);
  }

  public async ILLEGAL(request: msg.Nfsv4IllegalRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4IllegalResponse> {
    ctx.connection.logger.log('ILLEGAL', request);
    return new msg.Nfsv4IllegalResponse(Nfsv4Stat.NFS4ERR_OP_ILLEGAL);
  }

  // ----------------------------------------------- Stub implementations below

  public async ACCESS(request: msg.Nfsv4AccessRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4AccessResponse> {
    ctx.connection.logger.log('ACCESS', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4AccessResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async CLOSE(request: msg.Nfsv4CloseRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4CloseResponse> {
    ctx.connection.logger.log('CLOSE', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4CloseResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

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

  public async DELEGPURGE(
    request: msg.Nfsv4DelegpurgeRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4DelegpurgeResponse> {
    ctx.connection.logger.log('DELEGPURGE', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4DelegpurgeResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async DELEGRETURN(
    request: msg.Nfsv4DelegreturnRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4DelegreturnResponse> {
    ctx.connection.logger.log('DELEGRETURN', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4DelegreturnResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async GETATTR(request: msg.Nfsv4GetattrRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4GetattrResponse> {
    ctx.connection.logger.log('GETATTR', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4GetattrResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async GETFH(request: msg.Nfsv4GetfhRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4GetfhResponse> {
    ctx.connection.logger.log('GETFH', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4GetfhResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async LINK(request: msg.Nfsv4LinkRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LinkResponse> {
    ctx.connection.logger.log('LINK', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4LinkResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async LOCK(request: msg.Nfsv4LockRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LockResponse> {
    ctx.connection.logger.log('LOCK', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4LockResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async LOCKT(request: msg.Nfsv4LocktRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LocktResponse> {
    ctx.connection.logger.log('LOCKT', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4LocktResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async LOCKU(request: msg.Nfsv4LockuRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LockuResponse> {
    ctx.connection.logger.log('LOCKU', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4LockuResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async LOOKUP(request: msg.Nfsv4LookupRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LookupResponse> {
    ctx.connection.logger.log('LOOKUP', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4LookupResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async LOOKUPP(request: msg.Nfsv4LookuppRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4LookuppResponse> {
    ctx.connection.logger.log('LOOKUPP', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4LookuppResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async NVERIFY(request: msg.Nfsv4NverifyRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4NverifyResponse> {
    ctx.connection.logger.log('NVERIFY', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4NverifyResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async OPEN(request: msg.Nfsv4OpenRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4OpenResponse> {
    ctx.connection.logger.log('OPEN', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4OpenResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async OPENATTR(request: msg.Nfsv4OpenattrRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4OpenattrResponse> {
    ctx.connection.logger.log('OPENATTR', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4OpenattrResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async OPEN_CONFIRM(
    request: msg.Nfsv4OpenConfirmRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4OpenConfirmResponse> {
    ctx.connection.logger.log('OPEN_CONFIRM', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4OpenConfirmResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async OPEN_DOWNGRADE(
    request: msg.Nfsv4OpenDowngradeRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4OpenDowngradeResponse> {
    ctx.connection.logger.log('OPEN_DOWNGRADE', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4OpenDowngradeResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async PUTFH(request: msg.Nfsv4PutfhRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4PutfhResponse> {
    ctx.connection.logger.log('PUTFH', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4PutfhResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async PUTPUBFH(request: msg.Nfsv4PutpubfhRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4PutpubfhResponse> {
    ctx.connection.logger.log('PUTPUBFH', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4PutpubfhResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async PUTROOTFH(
    request: msg.Nfsv4PutrootfhRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4PutrootfhResponse> {
    ctx.connection.logger.log('PUTROOTFH', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4PutrootfhResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async READ(request: msg.Nfsv4ReadRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4ReadResponse> {
    ctx.connection.logger.log('READ', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4ReadResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async READDIR(request: msg.Nfsv4ReaddirRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4ReaddirResponse> {
    ctx.connection.logger.log('READDIR', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4ReaddirResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async READLINK(request: msg.Nfsv4ReadlinkRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4ReadlinkResponse> {
    ctx.connection.logger.log('READLINK', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4ReadlinkResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async REMOVE(request: msg.Nfsv4RemoveRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4RemoveResponse> {
    ctx.connection.logger.log('REMOVE', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4RemoveResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async RENAME(request: msg.Nfsv4RenameRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4RenameResponse> {
    ctx.connection.logger.log('RENAME', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4RenameResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async RENEW(request: msg.Nfsv4RenewRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4RenewResponse> {
    ctx.connection.logger.log('RENEW', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4RenewResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async RESTOREFH(
    request: msg.Nfsv4RestorefhRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4RestorefhResponse> {
    ctx.connection.logger.log('RESTOREFH', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4RestorefhResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async SAVEFH(request: msg.Nfsv4SavefhRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4SavefhResponse> {
    ctx.connection.logger.log('SAVEFH', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4SavefhResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async SECINFO(request: msg.Nfsv4SecinfoRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4SecinfoResponse> {
    ctx.connection.logger.log('SECINFO', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4SecinfoResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
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

  public async WRITE(request: msg.Nfsv4WriteRequest, ctx: Nfsv4OperationCtx): Promise<msg.Nfsv4WriteResponse> {
    ctx.connection.logger.log('WRITE', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4WriteResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }

  public async RELEASE_LOCKOWNER(
    request: msg.Nfsv4ReleaseLockOwnerRequest,
    ctx: Nfsv4OperationCtx,
  ): Promise<msg.Nfsv4ReleaseLockOwnerResponse> {
    ctx.connection.logger.log('RELEASE_LOCKOWNER', request);
    throw new Error('Not implemented');
    return new msg.Nfsv4ReleaseLockOwnerResponse(Nfsv4Stat.NFS4ERR_SERVERFAULT);
  }
}

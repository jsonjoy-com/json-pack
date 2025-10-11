import {Nfsv4Stat} from "../constants";
import {Nfsv4OperationFn} from "./Nfsv4Operations";
import * as msg from "../messages";
import {Nfsv4Connection} from "./Nfsv4Connection";

/**
 * NFS v4 COMPOUND Procedure Context, holds state for a single COMPOUND procedure
 * call. This state is injected into each operation handler called as part of
 * the COMPOUND procedure.
 */
export class Nfsv4CompoundProcCtx {
  /** Current file handle */
  cfh: Uint8Array | null = null;
  /** Saved file handle */
  sfh: Uint8Array | null = null;

  protected status: Nfsv4Stat = Nfsv4Stat.NFS4_OK;
  protected resarray: msg.Nfsv4Response[] = [];

  constructor(
    protected readonly connection: Nfsv4Connection,
    public readonly req: msg.Nfsv4CompoundRequest,
  ) {}

  public async exec(): Promise<msg.Nfsv4CompoundResponse> {
    const {req, connection} = this;
    const {ops} = connection;
    const {argarray, tag} = req;
    const length = argarray.length;
    OPS_LOOP: for (let i = 0; i < length; i++) {
      const op = argarray[i];
      if (op instanceof msg.Nfsv4AccessRequest) await this.execOp(op, ops.ACCESS, msg.Nfsv4AccessResponse);
      else if (op instanceof msg.Nfsv4PutrootfhRequest) await this.execOp(op, ops.PUTROOTFH, msg.Nfsv4PutrootfhResponse);
      else if (op instanceof msg.Nfsv4PutpubfhRequest) await this.execOp(op, ops.PUTPUBFH, msg.Nfsv4PutpubfhResponse);
      else if (op instanceof msg.Nfsv4PutfhRequest) await this.execOp(op, ops.PUTFH, msg.Nfsv4PutfhResponse);
      else if (op instanceof msg.Nfsv4GetfhRequest) await this.execOp(op, ops.GETFH, msg.Nfsv4GetfhResponse);
      else if (op instanceof msg.Nfsv4SavefhRequest) await this.execOp(op, ops.SAVEFH, msg.Nfsv4SavefhResponse);
      else if (op instanceof msg.Nfsv4ReadRequest) await this.execOp(op, ops.READ, msg.Nfsv4ReadResponse);
      else if (op instanceof msg.Nfsv4ReaddirRequest) await this.execOp(op, ops.READDIR, msg.Nfsv4ReaddirResponse);
      else if (op instanceof msg.Nfsv4ReadlinkRequest) await this.execOp(op, ops.READLINK, msg.Nfsv4ReadlinkResponse);
      else if (op instanceof msg.Nfsv4WriteRequest) await this.execOp(op, ops.WRITE, msg.Nfsv4WriteResponse);
      else if (op instanceof msg.Nfsv4OpenRequest) await this.execOp(op, ops.OPEN, msg.Nfsv4OpenResponse);
      else if (op instanceof msg.Nfsv4CloseRequest) await this.execOp(op, ops.CLOSE, msg.Nfsv4CloseResponse);
      else if (op instanceof msg.Nfsv4RemoveRequest) await this.execOp(op, ops.REMOVE, msg.Nfsv4RemoveResponse);
      else if (op instanceof msg.Nfsv4RenameRequest) await this.execOp(op, ops.RENAME, msg.Nfsv4RenameResponse);
      else if (op instanceof msg.Nfsv4OpenattrRequest) await this.execOp(op, ops.OPENATTR, msg.Nfsv4OpenattrResponse);
      else if (op instanceof msg.Nfsv4GetattrRequest) await this.execOp(op, ops.GETATTR, msg.Nfsv4GetattrResponse);
      else if (op instanceof msg.Nfsv4SetattrRequest) await this.execOp(op, ops.SETATTR, msg.Nfsv4SetattrResponse);
      else if (op instanceof msg.Nfsv4CreateRequest) await this.execOp(op, ops.CREATE, msg.Nfsv4CreateResponse);
      else if (op instanceof msg.Nfsv4SetclientidRequest) await this.execOp(op, ops.SETCLIENTID, msg.Nfsv4SetclientidResponse);
      else if (op instanceof msg.Nfsv4SetclientidConfirmRequest) await this.execOp(op, ops.SETCLIENTID_CONFIRM, msg.Nfsv4SetclientidConfirmResponse);
      else if (op instanceof msg.Nfsv4OpenConfirmRequest) await this.execOp(op, ops.OPEN_CONFIRM, msg.Nfsv4OpenConfirmResponse);
      else if (op instanceof msg.Nfsv4OpenDowngradeRequest) await this.execOp(op, ops.OPEN_DOWNGRADE, msg.Nfsv4OpenDowngradeResponse);
      else if (op instanceof msg.Nfsv4CommitRequest) await this.execOp(op, ops.COMMIT, msg.Nfsv4CommitResponse);
      else if (op instanceof msg.Nfsv4LinkRequest) await this.execOp(op, ops.LINK, msg.Nfsv4LinkResponse);
      else if (op instanceof msg.Nfsv4RenewRequest) await this.execOp(op, ops.RENEW, msg.Nfsv4RenewResponse);
      else if (op instanceof msg.Nfsv4DelegpurgeRequest) await this.execOp(op, ops.DELEGPURGE, msg.Nfsv4DelegpurgeResponse);
      else if (op instanceof msg.Nfsv4DelegreturnRequest) await this.execOp(op, ops.DELEGRETURN, msg.Nfsv4DelegreturnResponse);
      else if (op instanceof msg.Nfsv4RestorefhRequest) await this.execOp(op, ops.RESTOREFH, msg.Nfsv4RestorefhResponse);
      else if (op instanceof msg.Nfsv4SecinfoRequest) await this.execOp(op, ops.SECINFO, msg.Nfsv4SecinfoResponse);
      else if (op instanceof msg.Nfsv4VerifyRequest) await this.execOp(op, ops.VERIFY, msg.Nfsv4VerifyResponse);
      else if (op instanceof msg.Nfsv4LockRequest) await this.execOp(op, ops.LOCK, msg.Nfsv4LockResponse);
      else if (op instanceof msg.Nfsv4LocktRequest) await this.execOp(op, ops.LOCKT, msg.Nfsv4LocktResponse);
      else if (op instanceof msg.Nfsv4LockuRequest) await this.execOp(op, ops.LOCKU, msg.Nfsv4LockuResponse);
      else if (op instanceof msg.Nfsv4LookupRequest) await this.execOp(op, ops.LOOKUP, msg.Nfsv4LookupResponse);
      else if (op instanceof msg.Nfsv4LookuppRequest) await this.execOp(op, ops.LOOKUPP, msg.Nfsv4LookuppResponse);
      else if (op instanceof msg.Nfsv4NverifyRequest) await this.execOp(op, ops.NVERIFY, msg.Nfsv4NverifyResponse);
      else if (op instanceof msg.Nfsv4ReleaseLockOwnerRequest) await this.execOp(op, ops.RELEASE_LOCKOWNER, msg.Nfsv4ReleaseLockOwnerResponse);
      else if (op instanceof msg.Nfsv4IllegalRequest) await this.execOp(op, ops.ILLEGAL, msg.Nfsv4IllegalResponse);
      else return new msg.Nfsv4CompoundResponse(Nfsv4Stat.NFS4ERR_OP_ILLEGAL, tag, this.resarray);
      if (this.status !== Nfsv4Stat.NFS4_OK) break OPS_LOOP;
    }
    return new msg.Nfsv4CompoundResponse(this.status, tag, this.resarray);
  }

  private async execOp<Req extends msg.Nfsv4Request, Res extends msg.Nfsv4Response>(
    opReq: Req,
    fn: Nfsv4OperationFn<Req, Res>,
    Response: new (status: Nfsv4Stat) => Res
  ): Promise<void> {
    try {
      const opResponse = await fn(opReq, this);
      this.status = opResponse.status;
      this.resarray.push(opResponse);
      return;
    } catch (err) {
      if (err instanceof Response) {
        if (err.status !== Nfsv4Stat.NFS4_OK) {
          this.status = err.status;
          this.resarray.push(err);
          return;
        } else {
          this.connection.logger.error('Operation [' + fn.name + '] threw response with NFS4_OK');
          err = Nfsv4Stat.NFS4ERR_SERVERFAULT;
        }
      }
      FIND_STATUS_CODE: {
        if (typeof err === 'number') {
          if (err > Nfsv4Stat.NFS4_OK && err <= 0x00_FF_FF_FF) {
            this.status = err;
            break FIND_STATUS_CODE;
          }
          this.status = Nfsv4Stat.NFS4ERR_SERVERFAULT;
          this.connection.logger.error('Invalid status [code = ' + err + '], using NFS4ERR_SERVERFAULT, [fn = ' + fn.name + ']');
          break FIND_STATUS_CODE;
        }
        this.status = Nfsv4Stat.NFS4ERR_SERVERFAULT;
        this.connection.logger.error(err);
      }
      const opResponse = new Response(this.status);
      this.resarray.push(opResponse);
    }
  }
}

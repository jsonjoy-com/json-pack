import {Reader} from '@jsonjoy.com/buffers/lib/Reader';
import {XdrDecoder} from '../../xdr/XdrDecoder';
import {Nfsv4Op, Nfsv4FType, Nfsv4DelegType} from './constants';
import {Nfsv4DecodingError} from './errors';
import * as msg from './messages';
import * as structs from './structs';

export class Nfsv4Decoder {
  protected readonly xdr: XdrDecoder;

  constructor(reader: Reader = new Reader()) {
    this.xdr = new XdrDecoder(reader);
  }

  public decodeCompound(
    reader: Reader,
    isRequest: boolean,
  ): msg.Nfsv4CompoundRequest | msg.Nfsv4CompoundResponse | undefined {
    this.xdr.reader = reader;
    const startPos = reader.x;
    try {
      if (isRequest) {
        return this.decodeCompoundRequest();
      } else {
        return this.decodeCompoundResponse();
      }
    } catch (err) {
      if (err instanceof RangeError) {
        reader.x = startPos;
        return undefined;
      }
      throw err;
    }
  }

  private decodeCompoundRequest(): msg.Nfsv4CompoundRequest {
    const xdr = this.xdr;
    const tag = xdr.readString();
    const minorversion = xdr.readUnsignedInt();
    const argarray: msg.Nfsv4Request[] = [];
    const count = xdr.readUnsignedInt();
    for (let i = 0; i < count; i++) {
      const op = xdr.readUnsignedInt() as Nfsv4Op;
      const request = this.decodeRequest(op);
      if (request) argarray.push(request);
    }
    return new msg.Nfsv4CompoundRequest(tag, minorversion, argarray);
  }

  private decodeCompoundResponse(): msg.Nfsv4CompoundResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    const tag = xdr.readString();
    const resarray: msg.Nfsv4Response[] = [];
    const count = xdr.readUnsignedInt();
    for (let i = 0; i < count; i++) {
      const op = xdr.readUnsignedInt() as Nfsv4Op;
      const response = this.decodeResponse(op);
      if (response) resarray.push(response);
    }
    return new msg.Nfsv4CompoundResponse(status, tag, resarray);
  }

  private decodeRequest(op: Nfsv4Op): msg.Nfsv4Request | undefined {
    switch (op) {
      case Nfsv4Op.ACCESS:
        return this.decodeAccessRequest();
      case Nfsv4Op.CLOSE:
        return this.decodeCloseRequest();
      case Nfsv4Op.COMMIT:
        return this.decodeCommitRequest();
      case Nfsv4Op.CREATE:
        return this.decodeCreateRequest();
      case Nfsv4Op.DELEGPURGE:
        return this.decodeDelegpurgeRequest();
      case Nfsv4Op.DELEGRETURN:
        return this.decodeDelegreturnRequest();
      case Nfsv4Op.GETATTR:
        return this.decodeGetattrRequest();
      case Nfsv4Op.GETFH:
        return this.decodeGetfhRequest();
      case Nfsv4Op.LINK:
        return this.decodeLinkRequest();
      case Nfsv4Op.LOCK:
        return this.decodeLockRequest();
      case Nfsv4Op.LOCKT:
        return this.decodeLocktRequest();
      case Nfsv4Op.LOCKU:
        return this.decodeLockuRequest();
      case Nfsv4Op.LOOKUP:
        return this.decodeLookupRequest();
      case Nfsv4Op.LOOKUPP:
        return this.decodeLookuppRequest();
      case Nfsv4Op.NVERIFY:
        return this.decodeNverifyRequest();
      case Nfsv4Op.OPEN:
        return this.decodeOpenRequest();
      case Nfsv4Op.OPENATTR:
        return this.decodeOpenattrRequest();
      case Nfsv4Op.OPEN_CONFIRM:
        return this.decodeOpenConfirmRequest();
      case Nfsv4Op.OPEN_DOWNGRADE:
        return this.decodeOpenDowngradeRequest();
      case Nfsv4Op.PUTFH:
        return this.decodePutfhRequest();
      case Nfsv4Op.PUTPUBFH:
        return this.decodePutpubfhRequest();
      case Nfsv4Op.PUTROOTFH:
        return this.decodePutrootfhRequest();
      case Nfsv4Op.READ:
        return this.decodeReadRequest();
      case Nfsv4Op.READDIR:
        return this.decodeReaddirRequest();
      case Nfsv4Op.READLINK:
        return this.decodeReadlinkRequest();
      case Nfsv4Op.REMOVE:
        return this.decodeRemoveRequest();
      case Nfsv4Op.RENAME:
        return this.decodeRenameRequest();
      case Nfsv4Op.RENEW:
        return this.decodeRenewRequest();
      case Nfsv4Op.RESTOREFH:
        return this.decodeRestorefhRequest();
      case Nfsv4Op.SAVEFH:
        return this.decodeSavefhRequest();
      case Nfsv4Op.SECINFO:
        return this.decodeSecinfoRequest();
      case Nfsv4Op.SETATTR:
        return this.decodeSetattrRequest();
      case Nfsv4Op.SETCLIENTID:
        return this.decodeSetclientidRequest();
      case Nfsv4Op.SETCLIENTID_CONFIRM:
        return this.decodeSetclientidConfirmRequest();
      case Nfsv4Op.VERIFY:
        return this.decodeVerifyRequest();
      case Nfsv4Op.WRITE:
        return this.decodeWriteRequest();
      case Nfsv4Op.RELEASE_LOCKOWNER:
        return this.decodeReleaseLockOwnerRequest();
      case Nfsv4Op.ILLEGAL:
        return this.decodeIllegalRequest();
      default:
        throw new Nfsv4DecodingError(`Unknown operation: ${op}`);
    }
  }

  private decodeResponse(op: Nfsv4Op): msg.Nfsv4Response | undefined {
    switch (op) {
      case Nfsv4Op.ACCESS:
        return this.decodeAccessResponse();
      case Nfsv4Op.CLOSE:
        return this.decodeCloseResponse();
      case Nfsv4Op.COMMIT:
        return this.decodeCommitResponse();
      case Nfsv4Op.CREATE:
        return this.decodeCreateResponse();
      case Nfsv4Op.DELEGPURGE:
        return this.decodeDelegpurgeResponse();
      case Nfsv4Op.DELEGRETURN:
        return this.decodeDelegreturnResponse();
      case Nfsv4Op.GETATTR:
        return this.decodeGetattrResponse();
      case Nfsv4Op.GETFH:
        return this.decodeGetfhResponse();
      case Nfsv4Op.LINK:
        return this.decodeLinkResponse();
      case Nfsv4Op.LOCK:
        return this.decodeLockResponse();
      case Nfsv4Op.LOCKT:
        return this.decodeLocktResponse();
      case Nfsv4Op.LOCKU:
        return this.decodeLockuResponse();
      case Nfsv4Op.LOOKUP:
        return this.decodeLookupResponse();
      case Nfsv4Op.LOOKUPP:
        return this.decodeLookuppResponse();
      case Nfsv4Op.NVERIFY:
        return this.decodeNverifyResponse();
      case Nfsv4Op.OPEN:
        return this.decodeOpenResponse();
      case Nfsv4Op.OPENATTR:
        return this.decodeOpenattrResponse();
      case Nfsv4Op.OPEN_CONFIRM:
        return this.decodeOpenConfirmResponse();
      case Nfsv4Op.OPEN_DOWNGRADE:
        return this.decodeOpenDowngradeResponse();
      case Nfsv4Op.PUTFH:
        return this.decodePutfhResponse();
      case Nfsv4Op.PUTPUBFH:
        return this.decodePutpubfhResponse();
      case Nfsv4Op.PUTROOTFH:
        return this.decodePutrootfhResponse();
      case Nfsv4Op.READ:
        return this.decodeReadResponse();
      case Nfsv4Op.READDIR:
        return this.decodeReaddirResponse();
      case Nfsv4Op.READLINK:
        return this.decodeReadlinkResponse();
      case Nfsv4Op.REMOVE:
        return this.decodeRemoveResponse();
      case Nfsv4Op.RENAME:
        return this.decodeRenameResponse();
      case Nfsv4Op.RENEW:
        return this.decodeRenewResponse();
      case Nfsv4Op.RESTOREFH:
        return this.decodeRestorefhResponse();
      case Nfsv4Op.SAVEFH:
        return this.decodeSavefhResponse();
      case Nfsv4Op.SECINFO:
        return this.decodeSecinfoResponse();
      case Nfsv4Op.SETATTR:
        return this.decodeSetattrResponse();
      case Nfsv4Op.SETCLIENTID:
        return this.decodeSetclientidResponse();
      case Nfsv4Op.SETCLIENTID_CONFIRM:
        return this.decodeSetclientidConfirmResponse();
      case Nfsv4Op.VERIFY:
        return this.decodeVerifyResponse();
      case Nfsv4Op.WRITE:
        return this.decodeWriteResponse();
      case Nfsv4Op.RELEASE_LOCKOWNER:
        return this.decodeReleaseLockOwnerResponse();
      case Nfsv4Op.ILLEGAL:
        return this.decodeIllegalResponse();
      default:
        throw new Nfsv4DecodingError(`Unknown operation: ${op}`);
    }
  }

  private readFh(): structs.Nfsv4Fh {
    const data = this.xdr.readVarlenOpaque();
    return new structs.Nfsv4Fh(data);
  }

  private readVerifier(): structs.Nfsv4Verifier {
    const data = this.xdr.readOpaque(8);
    return new structs.Nfsv4Verifier(data);
  }

  // TODO: Why is this not used?
  private readTime(): structs.Nfsv4Time {
    const xdr = this.xdr;
    const seconds = xdr.readHyper();
    const nseconds = xdr.readUnsignedInt();
    return new structs.Nfsv4Time(seconds, nseconds);
  }

  private readStateid(): structs.Nfsv4Stateid {
    const xdr = this.xdr;
    const seqid = xdr.readUnsignedInt();
    const other = xdr.readOpaque(12);
    return new structs.Nfsv4Stateid(seqid, other);
  }

  private readBitmap(): structs.Nfsv4Bitmap {
    const xdr = this.xdr;
    const count = xdr.readUnsignedInt();
    const mask: number[] = [];
    for (let i = 0; i < count; i++) mask.push(xdr.readUnsignedInt());
    return new structs.Nfsv4Bitmap(mask);
  }

  private readFattr(): structs.Nfsv4Fattr {
    const attrmask = this.readBitmap();
    const attrVals = this.xdr.readVarlenOpaque();
    return new structs.Nfsv4Fattr(attrmask, attrVals);
  }

  private readChangeInfo(): structs.Nfsv4ChangeInfo {
    const xdr = this.xdr;
    const atomic = xdr.readBoolean();
    const before = xdr.readUnsignedHyper();
    const after = xdr.readUnsignedHyper();
    return new structs.Nfsv4ChangeInfo(atomic, before, after);
  }

  private readClientAddr(): structs.Nfsv4ClientAddr {
    const xdr = this.xdr;
    const rNetid = xdr.readString();
    const rAddr = xdr.readString();
    return new structs.Nfsv4ClientAddr(rNetid, rAddr);
  }

  private readCbClient(): structs.Nfsv4CbClient {
    const cbProgram = this.xdr.readUnsignedInt();
    const cbLocation = this.readClientAddr();
    return new structs.Nfsv4CbClient(cbProgram, cbLocation);
  }

  private readClientId(): structs.Nfsv4ClientId {
    const verifier = this.readVerifier();
    const id = this.xdr.readVarlenOpaque();
    return new structs.Nfsv4ClientId(verifier, id);
  }

  private readOpenOwner(): structs.Nfsv4OpenOwner {
    const xdr = this.xdr;
    const clientid = xdr.readUnsignedHyper();
    const owner = xdr.readVarlenOpaque();
    return new structs.Nfsv4OpenOwner(clientid, owner);
  }

  private readLockOwner(): structs.Nfsv4LockOwner {
    const xdr = this.xdr;
    const clientid = xdr.readUnsignedHyper();
    const owner = xdr.readVarlenOpaque();
    return new structs.Nfsv4LockOwner(clientid, owner);
  }

  private readOpenToLockOwner(): structs.Nfsv4OpenToLockOwner {
    const xdr = this.xdr;
    const openSeqid = xdr.readUnsignedInt();
    const openStateid = this.readStateid();
    const lockSeqid = xdr.readUnsignedInt();
    const lockOwner = this.readLockOwner();
    return new structs.Nfsv4OpenToLockOwner(openSeqid, openStateid, lockSeqid, lockOwner);
  }

  private readLockOwnerInfo(): structs.Nfsv4LockOwnerInfo {
    const xdr = this.xdr;
    const newLockOwner = xdr.readBoolean();
    if (newLockOwner) {
      const openToLockOwner = this.readOpenToLockOwner();
      return new structs.Nfsv4LockOwnerInfo(true, new structs.Nfsv4LockNewOwner(openToLockOwner));
    } else {
      const lockStateid = this.readStateid();
      const lockSeqid = xdr.readUnsignedInt();
      return new structs.Nfsv4LockOwnerInfo(false, new structs.Nfsv4LockExistingOwner(lockStateid, lockSeqid));
    }
  }

  private readOpenClaim(): structs.Nfsv4OpenClaim {
    const xdr = this.xdr;
    const claimType = xdr.readUnsignedInt();
    switch (claimType) {
      case 0: {
        const file = xdr.readString();
        return new structs.Nfsv4OpenClaim(claimType, new structs.Nfsv4OpenClaimNull(file));
      }
      case 1: {
        const delegateType = xdr.readUnsignedInt() as Nfsv4DelegType;
        return new structs.Nfsv4OpenClaim(claimType, new structs.Nfsv4OpenClaimPrevious(delegateType));
      }
      case 2: {
        const delegateStateid = this.readStateid();
        const file = xdr.readString();
        return new structs.Nfsv4OpenClaim(claimType, new structs.Nfsv4OpenClaimDelegateCur(delegateStateid, file));
      }
      case 3: {
        const file = xdr.readString();
        return new structs.Nfsv4OpenClaim(claimType, new structs.Nfsv4OpenClaimDelegatePrev(file));
      }
      default:
        throw new Nfsv4DecodingError(`Unknown open claim type: ${claimType}`);
    }
  }

  private readOpenDelegation(): structs.Nfsv4OpenDelegation {
    const xdr = this.xdr;
    const delegationType = xdr.readUnsignedInt() as Nfsv4DelegType;
    switch (delegationType) {
      case Nfsv4DelegType.OPEN_DELEGATE_NONE:
        return new structs.Nfsv4OpenDelegation(delegationType);
      case Nfsv4DelegType.OPEN_DELEGATE_READ: {
        const stateid = this.readStateid();
        const recall = xdr.readBoolean();
        const aceCount = xdr.readUnsignedInt();
        const permissions: structs.Nfsv4Ace[] = [];
        for (let i = 0; i < aceCount; i++) {
          permissions.push(this.readAce());
        }
        return new structs.Nfsv4OpenDelegation(
          delegationType,
          new structs.Nfsv4OpenReadDelegation(stateid, recall, permissions),
        );
      }
      case Nfsv4DelegType.OPEN_DELEGATE_WRITE: {
        const stateid = this.readStateid();
        const recall = xdr.readBoolean();
        const spaceLimit = xdr.readUnsignedHyper();
        const aceCount = xdr.readUnsignedInt();
        const permissions: structs.Nfsv4Ace[] = [];
        for (let i = 0; i < aceCount; i++) {
          permissions.push(this.readAce());
        }
        return new structs.Nfsv4OpenDelegation(
          delegationType,
          new structs.Nfsv4OpenWriteDelegation(stateid, recall, spaceLimit, permissions),
        );
      }
      default:
        throw new Nfsv4DecodingError(`Unknown delegation type: ${delegationType}`);
    }
  }

  private readAce(): structs.Nfsv4Ace {
    const xdr = this.xdr;
    const type = xdr.readUnsignedInt();
    const flag = xdr.readUnsignedInt();
    const accessMask = xdr.readUnsignedInt();
    const who = xdr.readString();
    return new structs.Nfsv4Ace(type, flag, accessMask, who);
  }

  private readSecInfoFlavor(): structs.Nfsv4SecInfoFlavor {
    const xdr = this.xdr;
    const flavor = xdr.readUnsignedInt();
    if (flavor === 6) {
      const oid = xdr.readVarlenOpaque();
      const qop = xdr.readUnsignedInt();
      const service = xdr.readUnsignedInt();
      const flavorInfo = new structs.Nfsv4RpcSecGssInfo(oid, qop, service);
      return new structs.Nfsv4SecInfoFlavor(flavor, flavorInfo);
    }
    return new structs.Nfsv4SecInfoFlavor(flavor);
  }

  private decodeAccessRequest(): msg.Nfsv4AccessRequest {
    const access = this.xdr.readUnsignedInt();
    return new msg.Nfsv4AccessRequest(access);
  }

  private decodeAccessResponse(): msg.Nfsv4AccessResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const supported = xdr.readUnsignedInt();
      const access = xdr.readUnsignedInt();
      return new msg.Nfsv4AccessResponse(status, new msg.Nfsv4AccessResOk(supported, access));
    }
    return new msg.Nfsv4AccessResponse(status);
  }

  private decodeCloseRequest(): msg.Nfsv4CloseRequest {
    const xdr = this.xdr;
    const seqid = xdr.readUnsignedInt();
    const openStateid = this.readStateid();
    return new msg.Nfsv4CloseRequest(seqid, openStateid);
  }

  private decodeCloseResponse(): msg.Nfsv4CloseResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const openStateid = this.readStateid();
      return new msg.Nfsv4CloseResponse(status, new msg.Nfsv4CloseResOk(openStateid));
    }
    return new msg.Nfsv4CloseResponse(status);
  }

  private decodeCommitRequest(): msg.Nfsv4CommitRequest {
    const xdr = this.xdr;
    const offset = xdr.readUnsignedHyper();
    const count = xdr.readUnsignedInt();
    return new msg.Nfsv4CommitRequest(offset, count);
  }

  private decodeCommitResponse(): msg.Nfsv4CommitResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const writeverf = this.readVerifier();
      return new msg.Nfsv4CommitResponse(status, new msg.Nfsv4CommitResOk(writeverf));
    }
    return new msg.Nfsv4CommitResponse(status);
  }

  private decodeCreateRequest(): msg.Nfsv4CreateRequest {
    const xdr = this.xdr;
    const type = xdr.readUnsignedInt() as Nfsv4FType;
    let objtype: structs.Nfsv4CreateType;
    switch (type) {
      case Nfsv4FType.NF4LNK: {
        const linkdata = xdr.readString();
        objtype = new structs.Nfsv4CreateType(type, new structs.Nfsv4CreateTypeLink(linkdata));
        break;
      }
      case Nfsv4FType.NF4BLK:
      case Nfsv4FType.NF4CHR: {
        const specdata1 = xdr.readUnsignedInt();
        const specdata2 = xdr.readUnsignedInt();
        const devdata = new structs.Nfsv4SpecData(specdata1, specdata2);
        objtype = new structs.Nfsv4CreateType(type, new structs.Nfsv4CreateTypeDevice(devdata));
        break;
      }
      default: {
        objtype = new structs.Nfsv4CreateType(type, new structs.Nfsv4CreateTypeVoid());
        break;
      }
    }
    const objname = xdr.readString();
    const createattrs = this.readFattr();
    return new msg.Nfsv4CreateRequest(objtype, objname, createattrs);
  }

  private decodeCreateResponse(): msg.Nfsv4CreateResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const cinfo = this.readChangeInfo();
      const attrset = this.readBitmap();
      return new msg.Nfsv4CreateResponse(status, new msg.Nfsv4CreateResOk(cinfo, attrset));
    }
    return new msg.Nfsv4CreateResponse(status);
  }

  private decodeDelegpurgeRequest(): msg.Nfsv4DelegpurgeRequest {
    const clientid = this.xdr.readUnsignedHyper();
    return new msg.Nfsv4DelegpurgeRequest(clientid);
  }

  private decodeDelegpurgeResponse(): msg.Nfsv4DelegpurgeResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4DelegpurgeResponse(status);
  }

  private decodeDelegreturnRequest(): msg.Nfsv4DelegreturnRequest {
    const delegStateid = this.readStateid();
    return new msg.Nfsv4DelegreturnRequest(delegStateid);
  }

  private decodeDelegreturnResponse(): msg.Nfsv4DelegreturnResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4DelegreturnResponse(status);
  }

  private decodeGetattrRequest(): msg.Nfsv4GetattrRequest {
    const attrRequest = this.readBitmap();
    return new msg.Nfsv4GetattrRequest(attrRequest);
  }

  private decodeGetattrResponse(): msg.Nfsv4GetattrResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const objAttributes = this.readFattr();
      return new msg.Nfsv4GetattrResponse(status, new msg.Nfsv4GetattrResOk(objAttributes));
    }
    return new msg.Nfsv4GetattrResponse(status);
  }

  private decodeGetfhRequest(): msg.Nfsv4GetfhRequest {
    return new msg.Nfsv4GetfhRequest();
  }

  private decodeGetfhResponse(): msg.Nfsv4GetfhResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const object = this.readFh();
      return new msg.Nfsv4GetfhResponse(status, new msg.Nfsv4GetfhResOk(object));
    }
    return new msg.Nfsv4GetfhResponse(status);
  }

  private decodeLinkRequest(): msg.Nfsv4LinkRequest {
    const newname = this.xdr.readString();
    return new msg.Nfsv4LinkRequest(newname);
  }

  private decodeLinkResponse(): msg.Nfsv4LinkResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const cinfo = this.readChangeInfo();
      return new msg.Nfsv4LinkResponse(status, new msg.Nfsv4LinkResOk(cinfo));
    }
    return new msg.Nfsv4LinkResponse(status);
  }

  private decodeLockRequest(): msg.Nfsv4LockRequest {
    const xdr = this.xdr;
    const locktype = xdr.readUnsignedInt();
    const reclaim = xdr.readBoolean();
    const offset = xdr.readUnsignedHyper();
    const length = xdr.readUnsignedHyper();
    const locker = this.readLockOwnerInfo();
    return new msg.Nfsv4LockRequest(locktype, reclaim, offset, length, locker);
  }

  private decodeLockResponse(): msg.Nfsv4LockResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const lockStateid = this.readStateid();
      return new msg.Nfsv4LockResponse(status, new msg.Nfsv4LockResOk(lockStateid));
    } else if (status === 10010) {
      const offset = xdr.readUnsignedHyper();
      const length = xdr.readUnsignedHyper();
      const locktype = xdr.readUnsignedInt();
      const owner = this.readLockOwner();
      return new msg.Nfsv4LockResponse(status, undefined, new msg.Nfsv4LockResDenied(offset, length, locktype, owner));
    }
    return new msg.Nfsv4LockResponse(status);
  }

  private decodeLocktRequest(): msg.Nfsv4LocktRequest {
    const xdr = this.xdr;
    const locktype = xdr.readUnsignedInt();
    const offset = xdr.readUnsignedHyper();
    const length = xdr.readUnsignedHyper();
    const owner = this.readLockOwner();
    return new msg.Nfsv4LocktRequest(locktype, offset, length, owner);
  }

  private decodeLocktResponse(): msg.Nfsv4LocktResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 10010) {
      const offset = xdr.readUnsignedHyper();
      const length = xdr.readUnsignedHyper();
      const locktype = xdr.readUnsignedInt();
      const owner = this.readLockOwner();
      return new msg.Nfsv4LocktResponse(status, new msg.Nfsv4LocktResDenied(offset, length, locktype, owner));
    }
    return new msg.Nfsv4LocktResponse(status);
  }

  private decodeLockuRequest(): msg.Nfsv4LockuRequest {
    const xdr = this.xdr;
    const locktype = xdr.readUnsignedInt();
    const seqid = xdr.readUnsignedInt();
    const lockStateid = this.readStateid();
    const offset = xdr.readUnsignedHyper();
    const length = xdr.readUnsignedHyper();
    return new msg.Nfsv4LockuRequest(locktype, seqid, lockStateid, offset, length);
  }

  private decodeLockuResponse(): msg.Nfsv4LockuResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const lockStateid = this.readStateid();
      return new msg.Nfsv4LockuResponse(status, new msg.Nfsv4LockuResOk(lockStateid));
    }
    return new msg.Nfsv4LockuResponse(status);
  }

  private decodeLookupRequest(): msg.Nfsv4LookupRequest {
    const objname = this.xdr.readString();
    return new msg.Nfsv4LookupRequest(objname);
  }

  private decodeLookupResponse(): msg.Nfsv4LookupResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4LookupResponse(status);
  }

  private decodeLookuppRequest(): msg.Nfsv4LookuppRequest {
    return new msg.Nfsv4LookuppRequest();
  }

  private decodeLookuppResponse(): msg.Nfsv4LookuppResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4LookuppResponse(status);
  }

  private decodeNverifyRequest(): msg.Nfsv4NverifyRequest {
    const objAttributes = this.readFattr();
    return new msg.Nfsv4NverifyRequest(objAttributes);
  }

  private decodeNverifyResponse(): msg.Nfsv4NverifyResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4NverifyResponse(status);
  }

  private decodeOpenRequest(): msg.Nfsv4OpenRequest {
    const xdr = this.xdr;
    const seqid = xdr.readUnsignedInt();
    const shareAccess = xdr.readUnsignedInt();
    const shareDeny = xdr.readUnsignedInt();
    const owner = this.readOpenOwner();
    const openhow = xdr.readUnsignedInt();
    const claim = this.readOpenClaim();
    return new msg.Nfsv4OpenRequest(seqid, shareAccess, shareDeny, owner, openhow, claim);
  }

  private decodeOpenResponse(): msg.Nfsv4OpenResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const stateid = this.readStateid();
      const cinfo = this.readChangeInfo();
      const rflags = xdr.readUnsignedInt();
      const attrset = this.readBitmap();
      const delegation = this.readOpenDelegation();
      return new msg.Nfsv4OpenResponse(status, new msg.Nfsv4OpenResOk(stateid, cinfo, rflags, attrset, delegation));
    }
    return new msg.Nfsv4OpenResponse(status);
  }

  private decodeOpenattrRequest(): msg.Nfsv4OpenattrRequest {
    const createdir = this.xdr.readBoolean();
    return new msg.Nfsv4OpenattrRequest(createdir);
  }

  private decodeOpenattrResponse(): msg.Nfsv4OpenattrResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4OpenattrResponse(status);
  }

  private decodeOpenConfirmRequest(): msg.Nfsv4OpenConfirmRequest {
    const openStateid = this.readStateid();
    const seqid = this.xdr.readUnsignedInt();
    return new msg.Nfsv4OpenConfirmRequest(openStateid, seqid);
  }

  private decodeOpenConfirmResponse(): msg.Nfsv4OpenConfirmResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const openStateid = this.readStateid();
      return new msg.Nfsv4OpenConfirmResponse(status, new msg.Nfsv4OpenConfirmResOk(openStateid));
    }
    return new msg.Nfsv4OpenConfirmResponse(status);
  }

  private decodeOpenDowngradeRequest(): msg.Nfsv4OpenDowngradeRequest {
    const xdr = this.xdr;
    const openStateid = this.readStateid();
    const seqid = xdr.readUnsignedInt();
    const shareAccess = xdr.readUnsignedInt();
    const shareDeny = xdr.readUnsignedInt();
    return new msg.Nfsv4OpenDowngradeRequest(openStateid, seqid, shareAccess, shareDeny);
  }

  private decodeOpenDowngradeResponse(): msg.Nfsv4OpenDowngradeResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const openStateid = this.readStateid();
      return new msg.Nfsv4OpenDowngradeResponse(status, new msg.Nfsv4OpenDowngradeResOk(openStateid));
    }
    return new msg.Nfsv4OpenDowngradeResponse(status);
  }

  private decodePutfhRequest(): msg.Nfsv4PutfhRequest {
    const object = this.readFh();
    return new msg.Nfsv4PutfhRequest(object);
  }

  private decodePutfhResponse(): msg.Nfsv4PutfhResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4PutfhResponse(status);
  }

  private decodePutpubfhRequest(): msg.Nfsv4PutpubfhRequest {
    return new msg.Nfsv4PutpubfhRequest();
  }

  private decodePutpubfhResponse(): msg.Nfsv4PutpubfhResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4PutpubfhResponse(status);
  }

  private decodePutrootfhRequest(): msg.Nfsv4PutrootfhRequest {
    return new msg.Nfsv4PutrootfhRequest();
  }

  private decodePutrootfhResponse(): msg.Nfsv4PutrootfhResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4PutrootfhResponse(status);
  }

  private decodeReadRequest(): msg.Nfsv4ReadRequest {
    const xdr = this.xdr;
    const stateid = this.readStateid();
    const offset = xdr.readUnsignedHyper();
    const count = xdr.readUnsignedInt();
    return new msg.Nfsv4ReadRequest(stateid, offset, count);
  }

  private decodeReadResponse(): msg.Nfsv4ReadResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const eof = xdr.readBoolean();
      const data = xdr.readVarlenOpaque();
      return new msg.Nfsv4ReadResponse(status, new msg.Nfsv4ReadResOk(eof, data));
    }
    return new msg.Nfsv4ReadResponse(status);
  }

  private decodeReaddirRequest(): msg.Nfsv4ReaddirRequest {
    const xdr = this.xdr;
    const cookie = xdr.readUnsignedHyper();
    const cookieverf = this.readVerifier();
    const dircount = xdr.readUnsignedInt();
    const maxcount = xdr.readUnsignedInt();
    const attrRequest = this.readBitmap();
    return new msg.Nfsv4ReaddirRequest(cookie, cookieverf, dircount, maxcount, attrRequest);
  }

  private decodeReaddirResponse(): msg.Nfsv4ReaddirResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const cookieverf = this.readVerifier();
      const entries: structs.Nfsv4Entry[] = [];
      while (xdr.readBoolean()) {
        const cookie = xdr.readUnsignedHyper();
        const name = xdr.readString();
        const attrs = this.readFattr();
        entries.push(new structs.Nfsv4Entry(cookie, name, attrs));
      }
      const eof = xdr.readBoolean();
      return new msg.Nfsv4ReaddirResponse(status, new msg.Nfsv4ReaddirResOk(cookieverf, entries, eof));
    }
    return new msg.Nfsv4ReaddirResponse(status);
  }

  private decodeReadlinkRequest(): msg.Nfsv4ReadlinkRequest {
    return new msg.Nfsv4ReadlinkRequest();
  }

  private decodeReadlinkResponse(): msg.Nfsv4ReadlinkResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const link = xdr.readString();
      return new msg.Nfsv4ReadlinkResponse(status, new msg.Nfsv4ReadlinkResOk(link));
    }
    return new msg.Nfsv4ReadlinkResponse(status);
  }

  private decodeRemoveRequest(): msg.Nfsv4RemoveRequest {
    const target = this.xdr.readString();
    return new msg.Nfsv4RemoveRequest(target);
  }

  private decodeRemoveResponse(): msg.Nfsv4RemoveResponse {
    const status = this.xdr.readUnsignedInt();
    if (status === 0) {
      const cinfo = this.readChangeInfo();
      return new msg.Nfsv4RemoveResponse(status, new msg.Nfsv4RemoveResOk(cinfo));
    }
    return new msg.Nfsv4RemoveResponse(status);
  }

  private decodeRenameRequest(): msg.Nfsv4RenameRequest {
    const xdr = this.xdr;
    const oldname = xdr.readString();
    const newname = xdr.readString();
    return new msg.Nfsv4RenameRequest(oldname, newname);
  }

  private decodeRenameResponse(): msg.Nfsv4RenameResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const sourceCinfo = this.readChangeInfo();
      const targetCinfo = this.readChangeInfo();
      return new msg.Nfsv4RenameResponse(status, new msg.Nfsv4RenameResOk(sourceCinfo, targetCinfo));
    }
    return new msg.Nfsv4RenameResponse(status);
  }

  private decodeRenewRequest(): msg.Nfsv4RenewRequest {
    const clientid = this.xdr.readUnsignedHyper();
    return new msg.Nfsv4RenewRequest(clientid);
  }

  private decodeRenewResponse(): msg.Nfsv4RenewResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4RenewResponse(status);
  }

  private decodeRestorefhRequest(): msg.Nfsv4RestorefhRequest {
    return new msg.Nfsv4RestorefhRequest();
  }

  private decodeRestorefhResponse(): msg.Nfsv4RestorefhResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4RestorefhResponse(status);
  }

  private decodeSavefhRequest(): msg.Nfsv4SavefhRequest {
    return new msg.Nfsv4SavefhRequest();
  }

  private decodeSavefhResponse(): msg.Nfsv4SavefhResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4SavefhResponse(status);
  }

  private decodeSecinfoRequest(): msg.Nfsv4SecinfoRequest {
    const name = this.xdr.readString();
    return new msg.Nfsv4SecinfoRequest(name);
  }

  private decodeSecinfoResponse(): msg.Nfsv4SecinfoResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const count = xdr.readUnsignedInt();
      const flavors: structs.Nfsv4SecInfoFlavor[] = [];
      for (let i = 0; i < count; i++) flavors.push(this.readSecInfoFlavor());
      return new msg.Nfsv4SecinfoResponse(status, new msg.Nfsv4SecinfoResOk(flavors));
    }
    return new msg.Nfsv4SecinfoResponse(status);
  }

  private decodeSetattrRequest(): msg.Nfsv4SetattrRequest {
    const stateid = this.readStateid();
    const objAttributes = this.readFattr();
    return new msg.Nfsv4SetattrRequest(stateid, objAttributes);
  }

  private decodeSetattrResponse(): msg.Nfsv4SetattrResponse {
    const status = this.xdr.readUnsignedInt();
    const attrset = this.readBitmap();
    return new msg.Nfsv4SetattrResponse(status, new msg.Nfsv4SetattrResOk(attrset));
  }

  private decodeSetclientidRequest(): msg.Nfsv4SetclientidRequest {
    const client = this.readClientId();
    const callback = this.readCbClient();
    const callbackIdent = this.xdr.readUnsignedInt();
    return new msg.Nfsv4SetclientidRequest(client, callback, callbackIdent);
  }

  private decodeSetclientidResponse(): msg.Nfsv4SetclientidResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const clientid = xdr.readUnsignedHyper();
      const setclientidConfirm = this.readVerifier();
      return new msg.Nfsv4SetclientidResponse(status, new msg.Nfsv4SetclientidResOk(clientid, setclientidConfirm));
    }
    return new msg.Nfsv4SetclientidResponse(status);
  }

  private decodeSetclientidConfirmRequest(): msg.Nfsv4SetclientidConfirmRequest {
    const clientid = this.xdr.readUnsignedHyper();
    const setclientidConfirm = this.readVerifier();
    return new msg.Nfsv4SetclientidConfirmRequest(clientid, setclientidConfirm);
  }

  private decodeSetclientidConfirmResponse(): msg.Nfsv4SetclientidConfirmResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4SetclientidConfirmResponse(status);
  }

  private decodeVerifyRequest(): msg.Nfsv4VerifyRequest {
    const objAttributes = this.readFattr();
    return new msg.Nfsv4VerifyRequest(objAttributes);
  }

  private decodeVerifyResponse(): msg.Nfsv4VerifyResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4VerifyResponse(status);
  }

  private decodeWriteRequest(): msg.Nfsv4WriteRequest {
    const xdr = this.xdr;
    const stateid = this.readStateid();
    const offset = xdr.readUnsignedHyper();
    const stable = xdr.readUnsignedInt();
    const data = xdr.readVarlenOpaque();
    return new msg.Nfsv4WriteRequest(stateid, offset, stable, data);
  }

  private decodeWriteResponse(): msg.Nfsv4WriteResponse {
    const xdr = this.xdr;
    const status = xdr.readUnsignedInt();
    if (status === 0) {
      const count = xdr.readUnsignedInt();
      const committed = xdr.readUnsignedInt();
      const writeverf = this.readVerifier();
      return new msg.Nfsv4WriteResponse(status, new msg.Nfsv4WriteResOk(count, committed, writeverf));
    }
    return new msg.Nfsv4WriteResponse(status);
  }

  private decodeReleaseLockOwnerRequest(): msg.Nfsv4ReleaseLockOwnerRequest {
    const lockOwner = this.readLockOwner();
    return new msg.Nfsv4ReleaseLockOwnerRequest(lockOwner);
  }

  private decodeReleaseLockOwnerResponse(): msg.Nfsv4ReleaseLockOwnerResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4ReleaseLockOwnerResponse(status);
  }

  private decodeIllegalRequest(): msg.Nfsv4IllegalRequest {
    return new msg.Nfsv4IllegalRequest();
  }

  private decodeIllegalResponse(): msg.Nfsv4IllegalResponse {
    const status = this.xdr.readUnsignedInt();
    return new msg.Nfsv4IllegalResponse(status);
  }
}

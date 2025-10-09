import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {XdrEncoder} from '../../xdr/XdrEncoder';
import {Nfsv4Op} from './constants';
import {Nfsv4EncodingError} from './errors';
import * as msg from './messages';
import * as structs from './structs';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';

export class Nfsv4Encoder<W extends IWriter & IWriterGrowable = IWriter & IWriterGrowable> {
  protected readonly xdr: XdrEncoder;

  constructor(public readonly writer: W = new Writer() as any) {
    this.xdr = new XdrEncoder(writer);
  }

  public encodeCompound(
    compound: msg.Nfsv4CompoundRequest | msg.Nfsv4CompoundResponse,
    isRequest: boolean,
  ): Uint8Array {
    if (isRequest) this.writeCompoundRequest(compound as msg.Nfsv4CompoundRequest);
    else this.writeCompoundResponse(compound as msg.Nfsv4CompoundResponse);
    return this.writer.flush();
  }

  public writeCompound(compound: msg.Nfsv4CompoundRequest | msg.Nfsv4CompoundResponse, isRequest: boolean): void {
    if (isRequest) this.writeCompoundRequest(compound as msg.Nfsv4CompoundRequest);
    else this.writeCompoundResponse(compound as msg.Nfsv4CompoundResponse);
  }

  private writeCompoundRequest(request: msg.Nfsv4CompoundRequest): void {
    const xdr = this.xdr;
    xdr.writeStr(request.tag);
    xdr.writeUnsignedInt(request.minorversion);
    xdr.writeUnsignedInt(request.argarray.length);
    for (const arg of request.argarray) {
      this.writeRequest(arg);
    }
  }

  private writeCompoundResponse(response: msg.Nfsv4CompoundResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(response.status);
    xdr.writeStr(response.tag);
    xdr.writeUnsignedInt(response.resarray.length);
    for (const res of response.resarray) {
      this.writeResponse(res);
    }
  }

  private writeRequest(request: msg.Nfsv4Request): void {
    const xdr = this.xdr; 
    if (request instanceof msg.Nfsv4AccessRequest) {
      request.encode(xdr);
    } else if (request instanceof msg.Nfsv4CloseRequest) {
      // TODO: Add tests for this encoding branch
      request.encode(xdr);
    } else if (request instanceof msg.Nfsv4CommitRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.COMMIT);
      this.writeCommitRequest(request);
    } else if (request instanceof msg.Nfsv4CreateRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.CREATE);
      this.writeCreateRequest(request);
    } else if (request instanceof msg.Nfsv4DelegreturnRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.DELEGRETURN);
      this.writeDelegreturnRequest(request);
    } else if (request instanceof msg.Nfsv4GetattrRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.GETATTR);
      this.writeGetattrRequest(request);
    } else if (request instanceof msg.Nfsv4GetfhRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.GETFH);
      this.writeGetfhRequest(request);
    } else if (request instanceof msg.Nfsv4LinkRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LINK);
      this.writeLinkRequest(request);
    } else if (request instanceof msg.Nfsv4LockRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOCK);
      this.writeLockRequest(request);
    } else if (request instanceof msg.Nfsv4LocktRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOCKT);
      this.writeLocktRequest(request);
    } else if (request instanceof msg.Nfsv4LockuRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOCKU);
      this.writeLockuRequest(request);
    } else if (request instanceof msg.Nfsv4LookupRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOOKUP);
      this.writeLookupRequest(request);
    } else if (request instanceof msg.Nfsv4LookuppRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOOKUPP);
      this.writeLookuppRequest(request);
    } else if (request instanceof msg.Nfsv4NverifyRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.NVERIFY);
      this.writeNverifyRequest(request);
    } else if (request instanceof msg.Nfsv4OpenRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.OPEN);
      this.writeOpenRequest(request);
    } else if (request instanceof msg.Nfsv4OpenConfirmRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.OPEN_CONFIRM);
      this.writeOpenConfirmRequest(request);
    } else if (request instanceof msg.Nfsv4OpenDowngradeRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.OPEN_DOWNGRADE);
      this.writeOpenDowngradeRequest(request);
    } else if (request instanceof msg.Nfsv4PutfhRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.PUTFH);
      this.writePutfhRequest(request);
    } else if (request instanceof msg.Nfsv4PutpubfhRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.PUTPUBFH);
      this.writePutpubfhRequest(request);
    } else if (request instanceof msg.Nfsv4PutrootfhRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.PUTROOTFH);
      this.writePutrootfhRequest(request);
    } else if (request instanceof msg.Nfsv4ReadRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.READ);
      this.writeReadRequest(request);
    } else if (request instanceof msg.Nfsv4ReaddirRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.READDIR);
      this.writeReaddirRequest(request);
    } else if (request instanceof msg.Nfsv4ReadlinkRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.READLINK);
      this.writeReadlinkRequest(request);
    } else if (request instanceof msg.Nfsv4RemoveRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.REMOVE);
      this.writeRemoveRequest(request);
    } else if (request instanceof msg.Nfsv4RenameRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.RENAME);
      this.writeRenameRequest(request);
    } else if (request instanceof msg.Nfsv4RenewRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.RENEW);
      this.writeRenewRequest(request);
    } else if (request instanceof msg.Nfsv4RestorefhRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.RESTOREFH);
      this.writeRestorefhRequest(request);
    } else if (request instanceof msg.Nfsv4SavefhRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SAVEFH);
      this.writeSavefhRequest(request);
    } else if (request instanceof msg.Nfsv4SecinfoRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SECINFO);
      this.writeSecinfoRequest(request);
    } else if (request instanceof msg.Nfsv4SetattrRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SETATTR);
      this.writeSetattrRequest(request);
    } else if (request instanceof msg.Nfsv4SetclientidRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SETCLIENTID);
      this.writeSetclientidRequest(request);
    } else if (request instanceof msg.Nfsv4SetclientidConfirmRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SETCLIENTID_CONFIRM);
      this.writeSetclientidConfirmRequest(request);
    } else if (request instanceof msg.Nfsv4VerifyRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.VERIFY);
      this.writeVerifyRequest(request);
    } else if (request instanceof msg.Nfsv4WriteRequest) {
      this.xdr.writeUnsignedInt(Nfsv4Op.WRITE);
      this.writeWriteRequest(request);
    } else {
      throw new Nfsv4EncodingError(`Unknown request type: ${request.constructor.name}`);
    }
  }

  private writeResponse(response: msg.Nfsv4Response): void {
    if (response instanceof msg.Nfsv4AccessResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.ACCESS);
      this.writeAccessResponse(response);
    } else if (response instanceof msg.Nfsv4CloseResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.CLOSE);
      this.writeCloseResponse(response);
    } else if (response instanceof msg.Nfsv4CommitResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.COMMIT);
      this.writeCommitResponse(response);
    } else if (response instanceof msg.Nfsv4CreateResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.CREATE);
      this.writeCreateResponse(response);
    } else if (response instanceof msg.Nfsv4DelegreturnResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.DELEGRETURN);
      this.writeDelegreturnResponse(response);
    } else if (response instanceof msg.Nfsv4GetattrResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.GETATTR);
      this.writeGetattrResponse(response);
    } else if (response instanceof msg.Nfsv4GetfhResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.GETFH);
      this.writeGetfhResponse(response);
    } else if (response instanceof msg.Nfsv4LinkResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LINK);
      this.writeLinkResponse(response);
    } else if (response instanceof msg.Nfsv4LockResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOCK);
      this.writeLockResponse(response);
    } else if (response instanceof msg.Nfsv4LocktResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOCKT);
      this.writeLocktResponse(response);
    } else if (response instanceof msg.Nfsv4LockuResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOCKU);
      this.writeLockuResponse(response);
    } else if (response instanceof msg.Nfsv4LookupResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOOKUP);
      this.writeLookupResponse(response);
    } else if (response instanceof msg.Nfsv4LookuppResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.LOOKUPP);
      this.writeLookuppResponse(response);
    } else if (response instanceof msg.Nfsv4NverifyResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.NVERIFY);
      this.writeNverifyResponse(response);
    } else if (response instanceof msg.Nfsv4OpenResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.OPEN);
      this.writeOpenResponse(response);
    } else if (response instanceof msg.Nfsv4OpenConfirmResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.OPEN_CONFIRM);
      this.writeOpenConfirmResponse(response);
    } else if (response instanceof msg.Nfsv4OpenDowngradeResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.OPEN_DOWNGRADE);
      this.writeOpenDowngradeResponse(response);
    } else if (response instanceof msg.Nfsv4PutfhResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.PUTFH);
      this.writePutfhResponse(response);
    } else if (response instanceof msg.Nfsv4PutpubfhResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.PUTPUBFH);
      this.writePutpubfhResponse(response);
    } else if (response instanceof msg.Nfsv4PutrootfhResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.PUTROOTFH);
      this.writePutrootfhResponse(response);
    } else if (response instanceof msg.Nfsv4ReadResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.READ);
      this.writeReadResponse(response);
    } else if (response instanceof msg.Nfsv4ReaddirResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.READDIR);
      this.writeReaddirResponse(response);
    } else if (response instanceof msg.Nfsv4ReadlinkResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.READLINK);
      this.writeReadlinkResponse(response);
    } else if (response instanceof msg.Nfsv4RemoveResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.REMOVE);
      this.writeRemoveResponse(response);
    } else if (response instanceof msg.Nfsv4RenameResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.RENAME);
      this.writeRenameResponse(response);
    } else if (response instanceof msg.Nfsv4RenewResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.RENEW);
      this.writeRenewResponse(response);
    } else if (response instanceof msg.Nfsv4RestorefhResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.RESTOREFH);
      this.writeRestorefhResponse(response);
    } else if (response instanceof msg.Nfsv4SavefhResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SAVEFH);
      this.writeSavefhResponse(response);
    } else if (response instanceof msg.Nfsv4SecinfoResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SECINFO);
      this.writeSecinfoResponse(response);
    } else if (response instanceof msg.Nfsv4SetattrResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SETATTR);
      this.writeSetattrResponse(response);
    } else if (response instanceof msg.Nfsv4SetclientidResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SETCLIENTID);
      this.writeSetclientidResponse(response);
    } else if (response instanceof msg.Nfsv4SetclientidConfirmResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.SETCLIENTID_CONFIRM);
      this.writeSetclientidConfirmResponse(response);
    } else if (response instanceof msg.Nfsv4VerifyResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.VERIFY);
      this.writeVerifyResponse(response);
    } else if (response instanceof msg.Nfsv4WriteResponse) {
      this.xdr.writeUnsignedInt(Nfsv4Op.WRITE);
      this.writeWriteResponse(response);
    } else {
      throw new Nfsv4EncodingError(`Unknown response type: ${response.constructor.name}`);
    }
  }

  private writeFh(fh: structs.Nfsv4Fh): void {
    this.xdr.writeVarlenOpaque(fh.data);
  }

  private writeVerifier(verifier: structs.Nfsv4Verifier): void {
    this.xdr.writeOpaque(verifier.data);
  }

  // TODO: Why is it not used? Is it a bug?
  private writeTime(time: structs.Nfsv4Time): void {
    const xdr = this.xdr;
    xdr.writeHyper(time.seconds);
    xdr.writeUnsignedInt(time.nseconds);
  }

  private writeStateid(stateid: structs.Nfsv4Stateid): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(stateid.seqid);
    xdr.writeOpaque(stateid.other);
  }

  private writeBitmap(bitmap: structs.Nfsv4Bitmap): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(bitmap.mask.length);
    for (const m of bitmap.mask) {
      xdr.writeUnsignedInt(m);
    }
  }

  private writeFattr(fattr: structs.Nfsv4Fattr): void {
    this.writeBitmap(fattr.attrmask);
    this.xdr.writeVarlenOpaque(fattr.attrVals);
  }

  private writeChangeInfo(changeInfo: structs.Nfsv4ChangeInfo): void {
    const xdr = this.xdr;
    xdr.writeBoolean(changeInfo.atomic);
    xdr.writeUnsignedHyper(changeInfo.before);
    xdr.writeUnsignedHyper(changeInfo.after);
  }

  private writeClientAddr(clientAddr: structs.Nfsv4ClientAddr): void {
    const xdr = this.xdr;
    xdr.writeStr(clientAddr.rNetid);
    xdr.writeStr(clientAddr.rAddr);
  }

  private writeCbClient(cbClient: structs.Nfsv4CbClient): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(cbClient.cbProgram);
    this.writeClientAddr(cbClient.cbLocation);
  }

  private writeClientId(clientId: structs.Nfsv4ClientId): void {
    this.writeVerifier(clientId.verifier);
    this.xdr.writeVarlenOpaque(clientId.id);
  }

  private writeOpenOwner(openOwner: structs.Nfsv4OpenOwner): void {
    const xdr = this.xdr;
    xdr.writeUnsignedHyper(openOwner.clientid);
    xdr.writeVarlenOpaque(openOwner.owner);
  }

  private writeLockOwner(lockOwner: structs.Nfsv4LockOwner): void {
    const xdr = this.xdr;
    xdr.writeUnsignedHyper(lockOwner.clientid);
    xdr.writeVarlenOpaque(lockOwner.owner);
  }

  private writeOpenToLockOwner(openToLockOwner: structs.Nfsv4OpenToLockOwner): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(openToLockOwner.openSeqid);
    this.writeStateid(openToLockOwner.openStateid);
    xdr.writeUnsignedInt(openToLockOwner.lockSeqid);
    this.writeLockOwner(openToLockOwner.lockOwner);
  }

  private writeExistingLockOwner(existingLockOwner: structs.Nfsv4LockExistingOwner): void {
    this.writeStateid(existingLockOwner.lockStateid);
    this.xdr.writeUnsignedInt(existingLockOwner.lockSeqid);
  }

  private writeOpenClaim(openClaim: structs.Nfsv4OpenClaim): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(openClaim.claimType);
    const claim = openClaim.claim;
    if (claim instanceof structs.Nfsv4OpenClaimNull) {
      xdr.writeStr(claim.file);
    } else if (claim instanceof structs.Nfsv4OpenClaimPrevious) {
      xdr.writeUnsignedInt(claim.delegateType);
    } else if (claim instanceof structs.Nfsv4OpenClaimDelegateCur) {
      this.writeStateid(claim.delegateStateid);
      xdr.writeStr(claim.file);
    } else if (claim instanceof structs.Nfsv4OpenClaimDelegatePrev) {
      xdr.writeStr(claim.file);
    }
  }

  private writeAccessResponse(res: msg.Nfsv4AccessResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      xdr.writeUnsignedInt(res.resok.supported);
      xdr.writeUnsignedInt(res.resok.access);
    }
  }

  private writeCloseResponse(res: msg.Nfsv4CloseResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeStateid(res.resok.openStateid);
    }
  }

  private writeCommitRequest(req: msg.Nfsv4CommitRequest): void {
    const xdr = this.xdr;
    xdr.writeUnsignedHyper(req.offset);
    xdr.writeUnsignedInt(req.count);
  }

  private writeCommitResponse(res: msg.Nfsv4CommitResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeVerifier(res.resok.writeverf);
    }
  }

  private writeCreateRequest(req: msg.Nfsv4CreateRequest): void {
    const xdr = this.xdr;
    const createType = req.objtype;
    xdr.writeUnsignedInt(createType.type);
    const objtype = createType.objtype;
    if (objtype instanceof structs.Nfsv4CreateTypeLink) {
      xdr.writeStr(objtype.linkdata);
    } else if (objtype instanceof structs.Nfsv4CreateTypeDevice) {
      xdr.writeUnsignedInt(objtype.devdata.specdata1);
      xdr.writeUnsignedInt(objtype.devdata.specdata2);
    }
    xdr.writeStr(req.objname);
    if (objtype instanceof structs.Nfsv4CreateTypeLink) {
      this.writeFattr(objtype.createattrs);
    } else if (objtype instanceof structs.Nfsv4CreateTypeDevice) {
      this.writeFattr(objtype.createattrs);
    } else if (objtype instanceof structs.Nfsv4CreateTypeOther) {
      this.writeFattr(objtype.createattrs);
    }
  }

  private writeCreateResponse(res: msg.Nfsv4CreateResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeChangeInfo(res.resok.cinfo);
      this.writeBitmap(res.resok.attrset);
    }
  }

  private writeDelegreturnRequest(req: msg.Nfsv4DelegreturnRequest): void {
    this.writeStateid(req.delegStateid);
  }

  private writeDelegreturnResponse(res: msg.Nfsv4DelegreturnResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeGetattrRequest(req: msg.Nfsv4GetattrRequest): void {
    this.writeBitmap(req.attrRequest);
  }

  private writeGetattrResponse(res: msg.Nfsv4GetattrResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeFattr(res.resok.objAttributes);
    }
  }

  private writeGetfhRequest(req: msg.Nfsv4GetfhRequest): void {
    // No arguments
  }

  private writeGetfhResponse(res: msg.Nfsv4GetfhResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeFh(res.resok.object);
    }
  }

  private writeLinkRequest(req: msg.Nfsv4LinkRequest): void {
    this.xdr.writeStr(req.newname);
  }

  private writeLinkResponse(res: msg.Nfsv4LinkResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeChangeInfo(res.resok.cinfo);
    }
  }

  private writeLockRequest(req: msg.Nfsv4LockRequest): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(req.locktype);
    xdr.writeBoolean(req.reclaim);
    xdr.writeUnsignedHyper(req.offset);
    xdr.writeUnsignedHyper(req.length);
    xdr.writeBoolean(req.locker.newLockOwner);
    const owner = req.locker.owner;
    if (owner instanceof structs.Nfsv4LockNewOwner) {
      this.writeOpenToLockOwner(owner.openToLockOwner);
    } else if (owner instanceof structs.Nfsv4LockExistingOwner) {
      this.writeExistingLockOwner(owner);
    }
  }

  private writeLockResponse(res: msg.Nfsv4LockResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeStateid(res.resok.lockStateid);
    } else if (res.denied) {
      xdr.writeUnsignedHyper(res.denied.offset);
      xdr.writeUnsignedHyper(res.denied.length);
      xdr.writeUnsignedInt(res.denied.locktype);
      this.writeLockOwner(res.denied.owner);
    }
  }

  private writeLocktRequest(req: msg.Nfsv4LocktRequest): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(req.locktype);
    xdr.writeUnsignedHyper(req.offset);
    xdr.writeUnsignedHyper(req.length);
    this.writeLockOwner(req.owner);
  }

  private writeLocktResponse(res: msg.Nfsv4LocktResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.denied) {
      xdr.writeUnsignedHyper(res.denied.offset);
      xdr.writeUnsignedHyper(res.denied.length);
      xdr.writeUnsignedInt(res.denied.locktype);
      this.writeLockOwner(res.denied.owner);
    }
  }

  private writeLockuRequest(req: msg.Nfsv4LockuRequest): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(req.locktype);
    xdr.writeUnsignedInt(req.seqid);
    this.writeStateid(req.lockStateid);
    xdr.writeUnsignedHyper(req.offset);
    xdr.writeUnsignedHyper(req.length);
  }

  private writeLockuResponse(res: msg.Nfsv4LockuResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeStateid(res.resok.lockStateid);
    }
  }

  private writeLookupRequest(req: msg.Nfsv4LookupRequest): void {
    this.xdr.writeStr(req.objname);
  }

  private writeLookupResponse(res: msg.Nfsv4LookupResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeLookuppRequest(req: msg.Nfsv4LookuppRequest): void {
    // No arguments
  }

  private writeLookuppResponse(res: msg.Nfsv4LookuppResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeNverifyRequest(req: msg.Nfsv4NverifyRequest): void {
    this.writeFattr(req.objAttributes);
  }

  private writeNverifyResponse(res: msg.Nfsv4NverifyResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeOpenRequest(req: msg.Nfsv4OpenRequest): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(req.seqid);
    xdr.writeUnsignedInt(req.shareAccess);
    xdr.writeUnsignedInt(req.shareDeny);
    this.writeOpenOwner(req.owner);
    xdr.writeUnsignedInt(req.openhow);
    this.writeOpenClaim(req.claim);
  }

  private writeOpenResponse(res: msg.Nfsv4OpenResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeStateid(res.resok.stateid);
      this.writeChangeInfo(res.resok.cinfo);
      xdr.writeUnsignedInt(res.resok.rflags);
      this.writeBitmap(res.resok.attrset);
      this.writeOpenDelegation(res.resok.delegation);
    }
  }

  private writeOpenDelegation(delegation: structs.Nfsv4OpenDelegation): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(delegation.delegationType);
    if (delegation.delegation) {
      const deleg = delegation.delegation;
      if (deleg instanceof structs.Nfsv4OpenReadDelegation) {
        this.writeStateid(deleg.stateid);
        xdr.writeBoolean(deleg.recall);
        xdr.writeUnsignedInt(deleg.permissions.length);
        for (const ace of deleg.permissions) {
          this.writeAce(ace);
        }
      } else if (deleg instanceof structs.Nfsv4OpenWriteDelegation) {
        this.writeStateid(deleg.stateid);
        xdr.writeBoolean(deleg.recall);
        xdr.writeUnsignedHyper(deleg.spaceLimit);
        xdr.writeUnsignedInt(deleg.permissions.length);
        for (const ace of deleg.permissions) {
          this.writeAce(ace);
        }
      }
    }
  }

  private writeAce(ace: structs.Nfsv4Ace): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(ace.type);
    xdr.writeUnsignedInt(ace.flag);
    xdr.writeUnsignedInt(ace.accessMask);
    xdr.writeStr(ace.who);
  }

  private writeOpenConfirmRequest(req: msg.Nfsv4OpenConfirmRequest): void {
    this.writeStateid(req.openStateid);
    this.xdr.writeUnsignedInt(req.seqid);
  }

  private writeOpenConfirmResponse(res: msg.Nfsv4OpenConfirmResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeStateid(res.resok.openStateid);
    }
  }

  private writeOpenDowngradeRequest(req: msg.Nfsv4OpenDowngradeRequest): void {
    const xdr = this.xdr;
    this.writeStateid(req.openStateid);
    xdr.writeUnsignedInt(req.seqid);
    xdr.writeUnsignedInt(req.shareAccess);
    xdr.writeUnsignedInt(req.shareDeny);
  }

  private writeOpenDowngradeResponse(res: msg.Nfsv4OpenDowngradeResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeStateid(res.resok.openStateid);
    }
  }

  private writePutfhRequest(req: msg.Nfsv4PutfhRequest): void {
    this.writeFh(req.object);
  }

  private writePutfhResponse(res: msg.Nfsv4PutfhResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writePutpubfhRequest(req: msg.Nfsv4PutpubfhRequest): void {
    // No arguments
  }

  private writePutpubfhResponse(res: msg.Nfsv4PutpubfhResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writePutrootfhRequest(req: msg.Nfsv4PutrootfhRequest): void {
    // No arguments
  }

  private writePutrootfhResponse(res: msg.Nfsv4PutrootfhResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeReadRequest(req: msg.Nfsv4ReadRequest): void {
    const xdr = this.xdr;
    this.writeStateid(req.stateid);
    xdr.writeUnsignedHyper(req.offset);
    xdr.writeUnsignedInt(req.count);
  }

  private writeReadResponse(res: msg.Nfsv4ReadResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      xdr.writeBoolean(res.resok.eof);
      xdr.writeVarlenOpaque(res.resok.data);
    }
  }

  private writeReaddirRequest(req: msg.Nfsv4ReaddirRequest): void {
    const xdr = this.xdr;
    xdr.writeUnsignedHyper(req.cookie);
    this.writeVerifier(req.cookieverf);
    xdr.writeUnsignedInt(req.dircount);
    xdr.writeUnsignedInt(req.maxcount);
    this.writeBitmap(req.attrRequest);
  }

  private writeReaddirResponse(res: msg.Nfsv4ReaddirResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeVerifier(res.resok.cookieverf);
      for (const entry of res.resok.entries) {
        xdr.writeBoolean(true);
        xdr.writeUnsignedHyper(entry.cookie);
        xdr.writeStr(entry.name);
        this.writeFattr(entry.attrs);
      }
      xdr.writeBoolean(false);
      xdr.writeBoolean(res.resok.eof);
    }
  }

  private writeReadlinkRequest(req: msg.Nfsv4ReadlinkRequest): void {
    // No arguments
  }

  private writeReadlinkResponse(res: msg.Nfsv4ReadlinkResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      xdr.writeStr(res.resok.link);
    }
  }

  private writeRemoveRequest(req: msg.Nfsv4RemoveRequest): void {
    this.xdr.writeStr(req.target);
  }

  private writeRemoveResponse(res: msg.Nfsv4RemoveResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeChangeInfo(res.resok.cinfo);
    }
  }

  private writeRenameRequest(req: msg.Nfsv4RenameRequest): void {
    const xdr = this.xdr;
    xdr.writeStr(req.oldname);
    xdr.writeStr(req.newname);
  }

  private writeRenameResponse(res: msg.Nfsv4RenameResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      this.writeChangeInfo(res.resok.sourceCinfo);
      this.writeChangeInfo(res.resok.targetCinfo);
    }
  }

  private writeRenewRequest(req: msg.Nfsv4RenewRequest): void {
    this.xdr.writeUnsignedHyper(req.clientid);
  }

  private writeRenewResponse(res: msg.Nfsv4RenewResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeRestorefhRequest(req: msg.Nfsv4RestorefhRequest): void {
    // No arguments
  }

  private writeRestorefhResponse(res: msg.Nfsv4RestorefhResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeSavefhRequest(req: msg.Nfsv4SavefhRequest): void {
    // No arguments
  }

  private writeSavefhResponse(res: msg.Nfsv4SavefhResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeSecinfoRequest(req: msg.Nfsv4SecinfoRequest): void {
    this.xdr.writeStr(req.name);
  }

  private writeSecinfoResponse(res: msg.Nfsv4SecinfoResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      xdr.writeUnsignedInt(res.resok.flavors.length);
      for (const flavor of res.resok.flavors) {
        xdr.writeUnsignedInt(flavor.flavor);
        if (flavor.flavorInfo) {
          xdr.writeVarlenOpaque(flavor.flavorInfo.oid);
          xdr.writeUnsignedInt(flavor.flavorInfo.qop);
          xdr.writeUnsignedInt(flavor.flavorInfo.service);
        }
      }
    }
  }

  private writeSetattrRequest(req: msg.Nfsv4SetattrRequest): void {
    this.writeStateid(req.stateid);
    this.writeFattr(req.objAttributes);
  }

  private writeSetattrResponse(res: msg.Nfsv4SetattrResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.resok) {
      this.writeBitmap(res.resok.attrsset);
    }
  }

  private writeSetclientidRequest(req: msg.Nfsv4SetclientidRequest): void {
    this.writeClientId(req.client);
    this.writeCbClient(req.callback);
    this.xdr.writeUnsignedInt(req.callbackIdent);
  }

  private writeSetclientidResponse(res: msg.Nfsv4SetclientidResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      xdr.writeUnsignedHyper(res.resok.clientid);
      this.writeVerifier(res.resok.setclientidConfirm);
    }
  }

  private writeSetclientidConfirmRequest(req: msg.Nfsv4SetclientidConfirmRequest): void {
    const xdr = this.xdr;
    xdr.writeUnsignedHyper(req.clientid);
    this.writeVerifier(req.setclientidConfirm);
  }

  private writeSetclientidConfirmResponse(res: msg.Nfsv4SetclientidConfirmResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeVerifyRequest(req: msg.Nfsv4VerifyRequest): void {
    this.writeFattr(req.objAttributes);
  }

  private writeVerifyResponse(res: msg.Nfsv4VerifyResponse): void {
    this.xdr.writeUnsignedInt(res.status);
  }

  private writeWriteRequest(req: msg.Nfsv4WriteRequest): void {
    const xdr = this.xdr;
    this.writeStateid(req.stateid);
    xdr.writeUnsignedHyper(req.offset);
    xdr.writeUnsignedInt(req.stable);
    xdr.writeVarlenOpaque(req.data);
  }

  private writeWriteResponse(res: msg.Nfsv4WriteResponse): void {
    const xdr = this.xdr;
    xdr.writeUnsignedInt(res.status);
    if (res.status === 0 && res.resok) {
      xdr.writeUnsignedInt(res.resok.count);
      xdr.writeUnsignedInt(res.resok.committed);
      this.writeVerifier(res.resok.writeverf);
    }
  }
}

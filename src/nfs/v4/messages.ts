import type {Reader} from '@jsonjoy.com/buffers/lib/Reader';
import type {Nfsv4Stat, Nfsv4LockType} from './constants';
import type * as structs from './structs';

export type Nfsv4Operation = Nfsv4Request | Nfsv4Response;

export type Nfsv4Request =
  | Nfsv4AccessRequest
  | Nfsv4CloseRequest
  | Nfsv4CommitRequest
  | Nfsv4CreateRequest
  | Nfsv4DelegpurgeRequest
  | Nfsv4DelegreturnRequest
  | Nfsv4GetattrRequest
  | Nfsv4GetfhRequest
  | Nfsv4LinkRequest
  | Nfsv4LockRequest
  | Nfsv4LocktRequest
  | Nfsv4LockuRequest
  | Nfsv4LookupRequest
  | Nfsv4LookuppRequest
  | Nfsv4NverifyRequest
  | Nfsv4OpenRequest
  | Nfsv4OpenattrRequest
  | Nfsv4OpenConfirmRequest
  | Nfsv4OpenDowngradeRequest
  | Nfsv4PutfhRequest
  | Nfsv4PutpubfhRequest
  | Nfsv4PutrootfhRequest
  | Nfsv4ReadRequest
  | Nfsv4ReaddirRequest
  | Nfsv4ReadlinkRequest
  | Nfsv4RemoveRequest
  | Nfsv4RenameRequest
  | Nfsv4RenewRequest
  | Nfsv4RestorefhRequest
  | Nfsv4SavefhRequest
  | Nfsv4SecinfoRequest
  | Nfsv4SetattrRequest
  | Nfsv4SetclientidRequest
  | Nfsv4SetclientidConfirmRequest
  | Nfsv4VerifyRequest
  | Nfsv4WriteRequest
  | Nfsv4ReleaseLockOwnerRequest
  | Nfsv4IllegalRequest;

export type Nfsv4Response =
  | Nfsv4AccessResponse
  | Nfsv4CloseResponse
  | Nfsv4CommitResponse
  | Nfsv4CreateResponse
  | Nfsv4DelegpurgeResponse
  | Nfsv4DelegreturnResponse
  | Nfsv4GetattrResponse
  | Nfsv4GetfhResponse
  | Nfsv4LinkResponse
  | Nfsv4LockResponse
  | Nfsv4LocktResponse
  | Nfsv4LockuResponse
  | Nfsv4LookupResponse
  | Nfsv4LookuppResponse
  | Nfsv4NverifyResponse
  | Nfsv4OpenResponse
  | Nfsv4OpenattrResponse
  | Nfsv4OpenConfirmResponse
  | Nfsv4OpenDowngradeResponse
  | Nfsv4PutfhResponse
  | Nfsv4PutpubfhResponse
  | Nfsv4PutrootfhResponse
  | Nfsv4ReadResponse
  | Nfsv4ReaddirResponse
  | Nfsv4ReadlinkResponse
  | Nfsv4RemoveResponse
  | Nfsv4RenameResponse
  | Nfsv4RenewResponse
  | Nfsv4RestorefhResponse
  | Nfsv4SavefhResponse
  | Nfsv4SecinfoResponse
  | Nfsv4SetattrResponse
  | Nfsv4SetclientidResponse
  | Nfsv4SetclientidConfirmResponse
  | Nfsv4VerifyResponse
  | Nfsv4WriteResponse
  | Nfsv4ReleaseLockOwnerResponse
  | Nfsv4IllegalResponse;

export class Nfsv4AccessRequest {
  constructor(public readonly access: number) {}
}

export class Nfsv4AccessResOk {
  constructor(
    public readonly supported: number,
    public readonly access: number,
  ) {}
}

export class Nfsv4AccessResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4AccessResOk,
  ) {}
}

export class Nfsv4CloseRequest {
  constructor(
    public readonly seqid: number,
    public readonly openStateid: structs.Nfsv4Stateid,
  ) {}
}

export class Nfsv4CloseResOk {
  constructor(public readonly openStateid: structs.Nfsv4Stateid) {}
}

export class Nfsv4CloseResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4CloseResOk,
  ) {}
}

export class Nfsv4CommitRequest {
  constructor(
    public readonly offset: bigint,
    public readonly count: number,
  ) {}
}

export class Nfsv4CommitResOk {
  constructor(public readonly writeverf: structs.Nfsv4Verifier) {}
}

export class Nfsv4CommitResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4CommitResOk,
  ) {}
}

export class Nfsv4CreateRequest {
  constructor(
    public readonly objtype: structs.Nfsv4CreateType,
    public readonly objname: string,
  ) {}
}

export class Nfsv4CreateResOk {
  constructor(
    public readonly cinfo: structs.Nfsv4ChangeInfo,
    public readonly attrset: structs.Nfsv4Bitmap,
  ) {}
}

export class Nfsv4CreateResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4CreateResOk,
  ) {}
}

export class Nfsv4DelegpurgeRequest {
  constructor(public readonly clientid: bigint) {}
}

export class Nfsv4DelegpurgeResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4DelegreturnRequest {
  constructor(public readonly delegStateid: structs.Nfsv4Stateid) {}
}

export class Nfsv4DelegreturnResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4GetattrRequest {
  constructor(public readonly attrRequest: structs.Nfsv4Bitmap) {}
}

export class Nfsv4GetattrResOk {
  constructor(public readonly objAttributes: structs.Nfsv4Fattr) {}
}

export class Nfsv4GetattrResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4GetattrResOk,
  ) {}
}

export class Nfsv4GetfhRequest {}

export class Nfsv4GetfhResOk {
  constructor(public readonly object: structs.Nfsv4Fh) {}
}

export class Nfsv4GetfhResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4GetfhResOk,
  ) {}
}

export class Nfsv4LinkRequest {
  constructor(public readonly newname: string) {}
}

export class Nfsv4LinkResOk {
  constructor(public readonly cinfo: structs.Nfsv4ChangeInfo) {}
}

export class Nfsv4LinkResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4LinkResOk,
  ) {}
}

export class Nfsv4LockRequest {
  constructor(
    public readonly locktype: Nfsv4LockType,
    public readonly reclaim: boolean,
    public readonly offset: bigint,
    public readonly length: bigint,
    public readonly locker: structs.Nfsv4LockOwnerInfo,
  ) {}
}

export class Nfsv4LockResOk {
  constructor(public readonly lockStateid: structs.Nfsv4Stateid) {}
}

export class Nfsv4LockResDenied {
  constructor(
    public readonly offset: bigint,
    public readonly length: bigint,
    public readonly locktype: Nfsv4LockType,
    public readonly owner: structs.Nfsv4LockOwner,
  ) {}
}

export class Nfsv4LockResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4LockResOk,
    public readonly denied?: Nfsv4LockResDenied,
  ) {}
}

export class Nfsv4LocktRequest {
  constructor(
    public readonly locktype: Nfsv4LockType,
    public readonly offset: bigint,
    public readonly length: bigint,
    public readonly owner: structs.Nfsv4LockOwner,
  ) {}
}

export class Nfsv4LocktResDenied {
  constructor(
    public readonly offset: bigint,
    public readonly length: bigint,
    public readonly locktype: Nfsv4LockType,
    public readonly owner: structs.Nfsv4LockOwner,
  ) {}
}

export class Nfsv4LocktResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly denied?: Nfsv4LocktResDenied,
  ) {}
}

export class Nfsv4LockuRequest {
  constructor(
    public readonly locktype: Nfsv4LockType,
    public readonly seqid: number,
    public readonly lockStateid: structs.Nfsv4Stateid,
    public readonly offset: bigint,
    public readonly length: bigint,
  ) {}
}

export class Nfsv4LockuResOk {
  constructor(public readonly lockStateid: structs.Nfsv4Stateid) {}
}

export class Nfsv4LockuResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4LockuResOk,
  ) {}
}

export class Nfsv4LookupRequest {
  constructor(public readonly objname: string) {}
}

export class Nfsv4LookupResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4LookuppRequest {}

export class Nfsv4LookuppResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4NverifyRequest {
  constructor(public readonly objAttributes: structs.Nfsv4Fattr) {}
}

export class Nfsv4NverifyResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4OpenRequest {
  constructor(
    public readonly seqid: number,
    public readonly shareAccess: number,
    public readonly shareDeny: number,
    public readonly owner: structs.Nfsv4OpenOwner,
    public readonly openhow: number,
    public readonly claim: structs.Nfsv4OpenClaim,
  ) {}
}

export class Nfsv4OpenResOk {
  constructor(
    public readonly stateid: structs.Nfsv4Stateid,
    public readonly cinfo: structs.Nfsv4ChangeInfo,
    public readonly rflags: number,
    public readonly attrset: structs.Nfsv4Bitmap,
    public readonly delegation: structs.Nfsv4OpenDelegation,
  ) {}
}

export class Nfsv4OpenResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4OpenResOk,
  ) {}
}

export class Nfsv4OpenattrRequest {
  constructor(public readonly createdir: boolean) {}
}

export class Nfsv4OpenattrResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4OpenConfirmRequest {
  constructor(
    public readonly openStateid: structs.Nfsv4Stateid,
    public readonly seqid: number,
  ) {}
}

export class Nfsv4OpenConfirmResOk {
  constructor(public readonly openStateid: structs.Nfsv4Stateid) {}
}

export class Nfsv4OpenConfirmResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4OpenConfirmResOk,
  ) {}
}

export class Nfsv4OpenDowngradeRequest {
  constructor(
    public readonly openStateid: structs.Nfsv4Stateid,
    public readonly seqid: number,
    public readonly shareAccess: number,
    public readonly shareDeny: number,
  ) {}
}

export class Nfsv4OpenDowngradeResOk {
  constructor(public readonly openStateid: structs.Nfsv4Stateid) {}
}

export class Nfsv4OpenDowngradeResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4OpenDowngradeResOk,
  ) {}
}

export class Nfsv4PutfhRequest {
  constructor(public readonly object: structs.Nfsv4Fh) {}
}

export class Nfsv4PutfhResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4PutpubfhRequest {}

export class Nfsv4PutpubfhResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4PutrootfhRequest {}

export class Nfsv4PutrootfhResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4ReadRequest {
  constructor(
    public readonly stateid: structs.Nfsv4Stateid,
    public readonly offset: bigint,
    public readonly count: number,
  ) {}
}

export class Nfsv4ReadResOk {
  constructor(
    public readonly eof: boolean,
    public readonly data: Reader,
  ) {}
}

export class Nfsv4ReadResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4ReadResOk,
  ) {}
}

export class Nfsv4ReaddirRequest {
  constructor(
    public readonly cookie: bigint,
    public readonly cookieverf: structs.Nfsv4Verifier,
    public readonly dircount: number,
    public readonly maxcount: number,
    public readonly attrRequest: structs.Nfsv4Bitmap,
  ) {}
}

export class Nfsv4ReaddirResOk {
  constructor(
    public readonly cookieverf: structs.Nfsv4Verifier,
    public readonly entries: structs.Nfsv4Entry[],
    public readonly eof: boolean,
  ) {}
}

export class Nfsv4ReaddirResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4ReaddirResOk,
  ) {}
}

export class Nfsv4ReadlinkRequest {}

export class Nfsv4ReadlinkResOk {
  constructor(public readonly link: string) {}
}

export class Nfsv4ReadlinkResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4ReadlinkResOk,
  ) {}
}

export class Nfsv4RemoveRequest {
  constructor(public readonly target: string) {}
}

export class Nfsv4RemoveResOk {
  constructor(public readonly cinfo: structs.Nfsv4ChangeInfo) {}
}

export class Nfsv4RemoveResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4RemoveResOk,
  ) {}
}

export class Nfsv4RenameRequest {
  constructor(
    public readonly oldname: string,
    public readonly newname: string,
  ) {}
}

export class Nfsv4RenameResOk {
  constructor(
    public readonly sourceCinfo: structs.Nfsv4ChangeInfo,
    public readonly targetCinfo: structs.Nfsv4ChangeInfo,
  ) {}
}

export class Nfsv4RenameResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4RenameResOk,
  ) {}
}

export class Nfsv4RenewRequest {
  constructor(public readonly clientid: bigint) {}
}

export class Nfsv4RenewResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4RestorefhRequest {}

export class Nfsv4RestorefhResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4SavefhRequest {}

export class Nfsv4SavefhResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4SecinfoRequest {
  constructor(public readonly name: string) {}
}

export class Nfsv4SecinfoResOk {
  constructor(public readonly flavors: structs.Nfsv4SecInfoFlavor[]) {}
}

export class Nfsv4SecinfoResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4SecinfoResOk,
  ) {}
}

export class Nfsv4SetattrRequest {
  constructor(
    public readonly stateid: structs.Nfsv4Stateid,
    public readonly objAttributes: structs.Nfsv4Fattr,
  ) {}
}

export class Nfsv4SetattrResOk {
  constructor(public readonly attrsset: structs.Nfsv4Bitmap) {}
}

export class Nfsv4SetattrResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4SetattrResOk,
  ) {}
}

export class Nfsv4SetclientidRequest {
  constructor(
    public readonly client: structs.Nfsv4ClientId,
    public readonly callback: structs.Nfsv4CbClient,
    public readonly callbackIdent: number,
  ) {}
}

export class Nfsv4SetclientidResOk {
  constructor(
    public readonly clientid: bigint,
    public readonly setclientidConfirm: structs.Nfsv4Verifier,
  ) {}
}

export class Nfsv4SetclientidResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4SetclientidResOk,
  ) {}
}

export class Nfsv4SetclientidConfirmRequest {
  constructor(
    public readonly clientid: bigint,
    public readonly setclientidConfirm: structs.Nfsv4Verifier,
  ) {}
}

export class Nfsv4SetclientidConfirmResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4VerifyRequest {
  constructor(public readonly objAttributes: structs.Nfsv4Fattr) {}
}

export class Nfsv4VerifyResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4WriteRequest {
  constructor(
    public readonly stateid: structs.Nfsv4Stateid,
    public readonly offset: bigint,
    public readonly stable: number,
    public readonly data: Reader,
  ) {}
}

export class Nfsv4WriteResOk {
  constructor(
    public readonly count: number,
    public readonly committed: number,
    public readonly writeverf: structs.Nfsv4Verifier,
  ) {}
}

export class Nfsv4WriteResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4WriteResOk,
  ) {}
}

export class Nfsv4ReleaseLockOwnerRequest {
  constructor(public readonly lockOwner: structs.Nfsv4LockOwner) {}
}

export class Nfsv4ReleaseLockOwnerResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4IllegalRequest {}

export class Nfsv4IllegalResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4CompoundRequest {
  constructor(
    public readonly tag: string,
    public readonly minorversion: number,
    public readonly argarray: Nfsv4Request[],
  ) {}
}

export class Nfsv4CompoundResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly tag: string,
    public readonly resarray: Nfsv4Response[],
  ) {}
}

export type Nfsv4CbOperation = Nfsv4CbRequest | Nfsv4CbResponse;

export type Nfsv4CbRequest = Nfsv4CbGetattrRequest | Nfsv4CbRecallRequest | Nfsv4CbIllegalRequest;

export type Nfsv4CbResponse = Nfsv4CbGetattrResponse | Nfsv4CbRecallResponse | Nfsv4CbIllegalResponse;

export class Nfsv4CbGetattrRequest {
  constructor(
    public readonly fh: structs.Nfsv4Fh,
    public readonly attrRequest: structs.Nfsv4Bitmap,
  ) {}
}

export class Nfsv4CbGetattrResOk {
  constructor(public readonly objAttributes: structs.Nfsv4Fattr) {}
}

export class Nfsv4CbGetattrResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly resok?: Nfsv4CbGetattrResOk,
  ) {}
}

export class Nfsv4CbRecallRequest {
  constructor(
    public readonly stateid: structs.Nfsv4Stateid,
    public readonly truncate: boolean,
    public readonly fh: structs.Nfsv4Fh,
  ) {}
}

export class Nfsv4CbRecallResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4CbIllegalRequest {}

export class Nfsv4CbIllegalResponse {
  constructor(public readonly status: Nfsv4Stat) {}
}

export class Nfsv4CbCompoundRequest {
  constructor(
    public readonly tag: string,
    public readonly minorversion: number,
    public readonly callbackIdent: number,
    public readonly argarray: Nfsv4CbRequest[],
  ) {}
}

export class Nfsv4CbCompoundResponse {
  constructor(
    public readonly status: Nfsv4Stat,
    public readonly tag: string,
    public readonly resarray: Nfsv4CbResponse[],
  ) {}
}

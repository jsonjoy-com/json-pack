import type {XdrEncoder, XdrType} from '../../xdr';
import type {Nfsv4FType, Nfsv4TimeHow, Nfsv4DelegType} from './constants';

/**
 * NFSv4 time structure (seconds and nanoseconds since epoch)
 */
export class Nfsv4Time {
  constructor(
    public readonly seconds: bigint,
    public readonly nseconds: number,
  ) {}
}

/**
 * Special device file data (major/minor device numbers)
 */
export class Nfsv4SpecData {
  constructor(
    public readonly specdata1: number,
    public readonly specdata2: number,
  ) {}
}

/**
 * NFSv4 file handle
 */
export class Nfsv4Fh {
  constructor(public readonly data: Uint8Array) {}
}

/**
 * NFSv4 verifier (8 bytes)
 */
export class Nfsv4Verifier {
  constructor(public readonly data: Uint8Array) {}
}

/**
 * File system identifier
 */
export class Nfsv4Fsid {
  constructor(
    public readonly major: bigint,
    public readonly minor: bigint,
  ) {}
}

/**
 * Stateid structure for state management
 */
export class Nfsv4Stateid implements XdrType {
  constructor(
    public readonly seqid: number,
    public readonly other: Uint8Array,
  ) {}

  encode(xdr: XdrEncoder): void {
    xdr.writeUnsignedInt(this.seqid);
    xdr.writeOpaque(this.other);
  }
}

/**
 * Change information for directory operations
 */
export class Nfsv4ChangeInfo {
  constructor(
    public readonly atomic: boolean,
    public readonly before: bigint,
    public readonly after: bigint,
  ) {}
}

/**
 * Set time discriminated union
 */
export class Nfsv4SetTime {
  constructor(
    public readonly how: Nfsv4TimeHow,
    public readonly time?: Nfsv4Time,
  ) {}
}

/**
 * Bitmap for attribute mask
 */
export class Nfsv4Bitmap {
  constructor(public readonly mask: number[]) {}
}

/**
 * File attributes structure
 */
export class Nfsv4Fattr {
  constructor(
    public readonly attrmask: Nfsv4Bitmap,
    public readonly attrVals: Uint8Array,
  ) {}
}

/**
 * Client address for callbacks
 */
export class Nfsv4ClientAddr {
  constructor(
    public readonly rNetid: string,
    public readonly rAddr: string,
  ) {}
}

/**
 * Callback client information
 */
export class Nfsv4CbClient {
  constructor(
    public readonly cbProgram: number,
    public readonly cbLocation: Nfsv4ClientAddr,
  ) {}
}

/**
 * NFS client identifier
 */
export class Nfsv4ClientId {
  constructor(
    public readonly verifier: Nfsv4Verifier,
    public readonly id: Uint8Array,
  ) {}
}

/**
 * Open owner identification
 */
export class Nfsv4OpenOwner {
  constructor(
    public readonly clientid: bigint,
    public readonly owner: Uint8Array,
  ) {}
}

/**
 * Lock owner identification
 */
export class Nfsv4LockOwner {
  constructor(
    public readonly clientid: bigint,
    public readonly owner: Uint8Array,
  ) {}
}

/**
 * Open to lock owner transition
 */
export class Nfsv4OpenToLockOwner {
  constructor(
    public readonly openSeqid: number,
    public readonly openStateid: Nfsv4Stateid,
    public readonly lockSeqid: number,
    public readonly lockOwner: Nfsv4LockOwner,
  ) {}
}

/**
 * File system location
 */
export class Nfsv4FsLocation {
  constructor(
    public readonly server: string[],
    public readonly rootpath: string[],
  ) {}
}

/**
 * File system locations for migration/replication
 */
export class Nfsv4FsLocations {
  constructor(
    public readonly fsRoot: string[],
    public readonly locations: Nfsv4FsLocation[],
  ) {}
}

/**
 * Access Control Entry (ACE)
 */
export class Nfsv4Ace {
  constructor(
    public readonly type: number,
    public readonly flag: number,
    public readonly accessMask: number,
    public readonly who: string,
  ) {}
}

/**
 * Access Control List
 */
export class Nfsv4Acl {
  constructor(public readonly aces: Nfsv4Ace[]) {}
}

/**
 * Security information
 */
export class Nfsv4SecInfo {
  constructor(
    public readonly flavor: number,
    public readonly flavorInfo?: Uint8Array,
  ) {}
}

/**
 * Open claim - claim file by name
 */
export class Nfsv4OpenClaimNull {
  constructor(public readonly file: string) {}
}

/**
 * Open claim - reclaim after server restart
 */
export class Nfsv4OpenClaimPrevious {
  constructor(public readonly delegateType: Nfsv4DelegType) {}
}

/**
 * Open claim - claim file delegated to client
 */
export class Nfsv4OpenClaimDelegateCur {
  constructor(
    public readonly delegateStateid: Nfsv4Stateid,
    public readonly file: string,
  ) {}
}

/**
 * Open claim - reclaim delegation after client restart
 */
export class Nfsv4OpenClaimDelegatePrev {
  constructor(public readonly file: string) {}
}

/**
 * Open claim discriminated union
 */
export class Nfsv4OpenClaim {
  constructor(
    public readonly claimType: number,
    public readonly claim:
      | Nfsv4OpenClaimNull
      | Nfsv4OpenClaimPrevious
      | Nfsv4OpenClaimDelegateCur
      | Nfsv4OpenClaimDelegatePrev,
  ) {}
}

/**
 * Read delegation
 */
export class Nfsv4OpenReadDelegation {
  constructor(
    public readonly stateid: Nfsv4Stateid,
    public readonly recall: boolean,
    public readonly permissions: Nfsv4Ace[],
  ) {}
}

/**
 * Write delegation
 */
export class Nfsv4OpenWriteDelegation {
  constructor(
    public readonly stateid: Nfsv4Stateid,
    public readonly recall: boolean,
    public readonly spaceLimit: bigint,
    public readonly permissions: Nfsv4Ace[],
  ) {}
}

/**
 * Open delegation discriminated union
 */
export class Nfsv4OpenDelegation {
  constructor(
    public readonly delegationType: Nfsv4DelegType,
    public readonly delegation?: Nfsv4OpenReadDelegation | Nfsv4OpenWriteDelegation,
  ) {}
}

/**
 * Directory entry for READDIR
 */
export class Nfsv4Entry {
  constructor(
    public readonly cookie: bigint,
    public readonly name: string,
    public readonly attrs: Nfsv4Fattr,
    public readonly nextEntry?: Nfsv4Entry,
  ) {}
}

/**
 * Lock request with new lock owner
 */
export class Nfsv4LockNewOwner {
  constructor(public readonly openToLockOwner: Nfsv4OpenToLockOwner) {}
}

/**
 * Lock request with existing lock owner
 */
export class Nfsv4LockExistingOwner {
  constructor(
    public readonly lockStateid: Nfsv4Stateid,
    public readonly lockSeqid: number,
  ) {}
}

/**
 * Lock owner discriminated union
 */
export class Nfsv4LockOwnerInfo {
  constructor(
    public readonly newLockOwner: boolean,
    public readonly owner: Nfsv4LockNewOwner | Nfsv4LockExistingOwner,
  ) {}
}

/**
 * Create type for regular file
 */
export class Nfsv4CreateTypeFile {
  constructor(public readonly createattrs: Nfsv4Fattr) {}
}

/**
 * Create type for symbolic link
 */
export class Nfsv4CreateTypeLink {
  constructor(
    public readonly linkdata: string,
    public readonly createattrs: Nfsv4Fattr,
  ) {}
}

/**
 * Create type for device files
 */
export class Nfsv4CreateTypeDevice {
  constructor(
    public readonly devdata: Nfsv4SpecData,
    public readonly createattrs: Nfsv4Fattr,
  ) {}
}

/**
 * Create type for other file types
 */
export class Nfsv4CreateTypeOther {
  constructor(public readonly createattrs: Nfsv4Fattr) {}
}

/**
 * Create type discriminated union
 */
export class Nfsv4CreateType {
  constructor(
    public readonly type: Nfsv4FType,
    public readonly objtype: Nfsv4CreateTypeFile | Nfsv4CreateTypeLink | Nfsv4CreateTypeDevice | Nfsv4CreateTypeOther,
  ) {}
}

/**
 * RPCSEC_GSS service
 */
export const enum Nfsv4RpcSecGssService {
  RPC_GSS_SVC_NONE = 1,
  RPC_GSS_SVC_INTEGRITY = 2,
  RPC_GSS_SVC_PRIVACY = 3,
}

/**
 * RPCSEC_GSS information
 */
export class Nfsv4RpcSecGssInfo {
  constructor(
    public readonly oid: Uint8Array,
    public readonly qop: number,
    public readonly service: Nfsv4RpcSecGssService,
  ) {}
}

/**
 * Security flavor info discriminated union
 */
export class Nfsv4SecInfoFlavor {
  constructor(
    public readonly flavor: number,
    public readonly flavorInfo?: Nfsv4RpcSecGssInfo,
  ) {}
}

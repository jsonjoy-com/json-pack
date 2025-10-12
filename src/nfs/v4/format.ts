import * as constants from './constants';
import * as structs from './structs';
import * as msg from './messages';
import {parseBitmask} from './attributes';

export const formatNfsv4Stat = (stat: constants.Nfsv4Stat): string => {
  switch (stat) {
    case constants.Nfsv4Stat.NFS4_OK:
      return 'NFS4_OK';
    case constants.Nfsv4Stat.NFS4ERR_PERM:
      return 'NFS4ERR_PERM';
    case constants.Nfsv4Stat.NFS4ERR_NOENT:
      return 'NFS4ERR_NOENT';
    case constants.Nfsv4Stat.NFS4ERR_IO:
      return 'NFS4ERR_IO';
    case constants.Nfsv4Stat.NFS4ERR_NXIO:
      return 'NFS4ERR_NXIO';
    case constants.Nfsv4Stat.NFS4ERR_ACCESS:
      return 'NFS4ERR_ACCESS';
    case constants.Nfsv4Stat.NFS4ERR_EXIST:
      return 'NFS4ERR_EXIST';
    case constants.Nfsv4Stat.NFS4ERR_XDEV:
      return 'NFS4ERR_XDEV';
    case constants.Nfsv4Stat.NFS4ERR_NOTDIR:
      return 'NFS4ERR_NOTDIR';
    case constants.Nfsv4Stat.NFS4ERR_ISDIR:
      return 'NFS4ERR_ISDIR';
    case constants.Nfsv4Stat.NFS4ERR_INVAL:
      return 'NFS4ERR_INVAL';
    case constants.Nfsv4Stat.NFS4ERR_FBIG:
      return 'NFS4ERR_FBIG';
    case constants.Nfsv4Stat.NFS4ERR_NOSPC:
      return 'NFS4ERR_NOSPC';
    case constants.Nfsv4Stat.NFS4ERR_ROFS:
      return 'NFS4ERR_ROFS';
    case constants.Nfsv4Stat.NFS4ERR_MLINK:
      return 'NFS4ERR_MLINK';
    case constants.Nfsv4Stat.NFS4ERR_NAMETOOLONG:
      return 'NFS4ERR_NAMETOOLONG';
    case constants.Nfsv4Stat.NFS4ERR_NOTEMPTY:
      return 'NFS4ERR_NOTEMPTY';
    case constants.Nfsv4Stat.NFS4ERR_DQUOT:
      return 'NFS4ERR_DQUOT';
    case constants.Nfsv4Stat.NFS4ERR_STALE:
      return 'NFS4ERR_STALE';
    case constants.Nfsv4Stat.NFS4ERR_BADHANDLE:
      return 'NFS4ERR_BADHANDLE';
    case constants.Nfsv4Stat.NFS4ERR_BAD_COOKIE:
      return 'NFS4ERR_BAD_COOKIE';
    case constants.Nfsv4Stat.NFS4ERR_NOTSUPP:
      return 'NFS4ERR_NOTSUPP';
    case constants.Nfsv4Stat.NFS4ERR_TOOSMALL:
      return 'NFS4ERR_TOOSMALL';
    case constants.Nfsv4Stat.NFS4ERR_SERVERFAULT:
      return 'NFS4ERR_SERVERFAULT';
    case constants.Nfsv4Stat.NFS4ERR_BADTYPE:
      return 'NFS4ERR_BADTYPE';
    case constants.Nfsv4Stat.NFS4ERR_DELAY:
      return 'NFS4ERR_DELAY';
    case constants.Nfsv4Stat.NFS4ERR_SAME:
      return 'NFS4ERR_SAME';
    case constants.Nfsv4Stat.NFS4ERR_DENIED:
      return 'NFS4ERR_DENIED';
    case constants.Nfsv4Stat.NFS4ERR_EXPIRED:
      return 'NFS4ERR_EXPIRED';
    case constants.Nfsv4Stat.NFS4ERR_LOCKED:
      return 'NFS4ERR_LOCKED';
    case constants.Nfsv4Stat.NFS4ERR_GRACE:
      return 'NFS4ERR_GRACE';
    case constants.Nfsv4Stat.NFS4ERR_FHEXPIRED:
      return 'NFS4ERR_FHEXPIRED';
    case constants.Nfsv4Stat.NFS4ERR_SHARE_DENIED:
      return 'NFS4ERR_SHARE_DENIED';
    case constants.Nfsv4Stat.NFS4ERR_WRONGSEC:
      return 'NFS4ERR_WRONGSEC';
    case constants.Nfsv4Stat.NFS4ERR_CLID_INUSE:
      return 'NFS4ERR_CLID_INUSE';
    case constants.Nfsv4Stat.NFS4ERR_RESOURCE:
      return 'NFS4ERR_RESOURCE';
    case constants.Nfsv4Stat.NFS4ERR_MOVED:
      return 'NFS4ERR_MOVED';
    case constants.Nfsv4Stat.NFS4ERR_NOFILEHANDLE:
      return 'NFS4ERR_NOFILEHANDLE';
    case constants.Nfsv4Stat.NFS4ERR_MINOR_VERS_MISMATCH:
      return 'NFS4ERR_MINOR_VERS_MISMATCH';
    case constants.Nfsv4Stat.NFS4ERR_STALE_CLIENTID:
      return 'NFS4ERR_STALE_CLIENTID';
    case constants.Nfsv4Stat.NFS4ERR_STALE_STATEID:
      return 'NFS4ERR_STALE_STATEID';
    case constants.Nfsv4Stat.NFS4ERR_OLD_STATEID:
      return 'NFS4ERR_OLD_STATEID';
    case constants.Nfsv4Stat.NFS4ERR_BAD_STATEID:
      return 'NFS4ERR_BAD_STATEID';
    case constants.Nfsv4Stat.NFS4ERR_BAD_SEQID:
      return 'NFS4ERR_BAD_SEQID';
    case constants.Nfsv4Stat.NFS4ERR_NOT_SAME:
      return 'NFS4ERR_NOT_SAME';
    case constants.Nfsv4Stat.NFS4ERR_LOCK_RANGE:
      return 'NFS4ERR_LOCK_RANGE';
    case constants.Nfsv4Stat.NFS4ERR_SYMLINK:
      return 'NFS4ERR_SYMLINK';
    case constants.Nfsv4Stat.NFS4ERR_RESTOREFH:
      return 'NFS4ERR_RESTOREFH';
    case constants.Nfsv4Stat.NFS4ERR_LEASE_MOVED:
      return 'NFS4ERR_LEASE_MOVED';
    case constants.Nfsv4Stat.NFS4ERR_ATTRNOTSUPP:
      return 'NFS4ERR_ATTRNOTSUPP';
    case constants.Nfsv4Stat.NFS4ERR_NO_GRACE:
      return 'NFS4ERR_NO_GRACE';
    case constants.Nfsv4Stat.NFS4ERR_RECLAIM_BAD:
      return 'NFS4ERR_RECLAIM_BAD';
    case constants.Nfsv4Stat.NFS4ERR_RECLAIM_CONFLICT:
      return 'NFS4ERR_RECLAIM_CONFLICT';
    case constants.Nfsv4Stat.NFS4ERR_BADXDR:
      return 'NFS4ERR_BADXDR';
    case constants.Nfsv4Stat.NFS4ERR_LOCKS_HELD:
      return 'NFS4ERR_LOCKS_HELD';
    case constants.Nfsv4Stat.NFS4ERR_OPENMODE:
      return 'NFS4ERR_OPENMODE';
    case constants.Nfsv4Stat.NFS4ERR_BADOWNER:
      return 'NFS4ERR_BADOWNER';
    case constants.Nfsv4Stat.NFS4ERR_BADCHAR:
      return 'NFS4ERR_BADCHAR';
    case constants.Nfsv4Stat.NFS4ERR_BADNAME:
      return 'NFS4ERR_BADNAME';
    case constants.Nfsv4Stat.NFS4ERR_BAD_RANGE:
      return 'NFS4ERR_BAD_RANGE';
    case constants.Nfsv4Stat.NFS4ERR_LOCK_NOTSUPP:
      return 'NFS4ERR_LOCK_NOTSUPP';
    case constants.Nfsv4Stat.NFS4ERR_OP_ILLEGAL:
      return 'NFS4ERR_OP_ILLEGAL';
    case constants.Nfsv4Stat.NFS4ERR_DEADLOCK:
      return 'NFS4ERR_DEADLOCK';
    case constants.Nfsv4Stat.NFS4ERR_FILE_OPEN:
      return 'NFS4ERR_FILE_OPEN';
    case constants.Nfsv4Stat.NFS4ERR_ADMIN_REVOKED:
      return 'NFS4ERR_ADMIN_REVOKED';
    case constants.Nfsv4Stat.NFS4ERR_CB_PATH_DOWN:
      return 'NFS4ERR_CB_PATH_DOWN';
    default:
      return `Unknown(${stat})`;
  }
};

export const formatNfsv4Op = (op: constants.Nfsv4Op): string => {
  switch (op) {
    case constants.Nfsv4Op.ACCESS:
      return 'ACCESS';
    case constants.Nfsv4Op.CLOSE:
      return 'CLOSE';
    case constants.Nfsv4Op.COMMIT:
      return 'COMMIT';
    case constants.Nfsv4Op.CREATE:
      return 'CREATE';
    case constants.Nfsv4Op.DELEGPURGE:
      return 'DELEGPURGE';
    case constants.Nfsv4Op.DELEGRETURN:
      return 'DELEGRETURN';
    case constants.Nfsv4Op.GETATTR:
      return 'GETATTR';
    case constants.Nfsv4Op.GETFH:
      return 'GETFH';
    case constants.Nfsv4Op.LINK:
      return 'LINK';
    case constants.Nfsv4Op.LOCK:
      return 'LOCK';
    case constants.Nfsv4Op.LOCKT:
      return 'LOCKT';
    case constants.Nfsv4Op.LOCKU:
      return 'LOCKU';
    case constants.Nfsv4Op.LOOKUP:
      return 'LOOKUP';
    case constants.Nfsv4Op.LOOKUPP:
      return 'LOOKUPP';
    case constants.Nfsv4Op.NVERIFY:
      return 'NVERIFY';
    case constants.Nfsv4Op.OPEN:
      return 'OPEN';
    case constants.Nfsv4Op.OPENATTR:
      return 'OPENATTR';
    case constants.Nfsv4Op.OPEN_CONFIRM:
      return 'OPEN_CONFIRM';
    case constants.Nfsv4Op.OPEN_DOWNGRADE:
      return 'OPEN_DOWNGRADE';
    case constants.Nfsv4Op.PUTFH:
      return 'PUTFH';
    case constants.Nfsv4Op.PUTPUBFH:
      return 'PUTPUBFH';
    case constants.Nfsv4Op.PUTROOTFH:
      return 'PUTROOTFH';
    case constants.Nfsv4Op.READ:
      return 'READ';
    case constants.Nfsv4Op.READDIR:
      return 'READDIR';
    case constants.Nfsv4Op.READLINK:
      return 'READLINK';
    case constants.Nfsv4Op.REMOVE:
      return 'REMOVE';
    case constants.Nfsv4Op.RENAME:
      return 'RENAME';
    case constants.Nfsv4Op.RENEW:
      return 'RENEW';
    case constants.Nfsv4Op.RESTOREFH:
      return 'RESTOREFH';
    case constants.Nfsv4Op.SAVEFH:
      return 'SAVEFH';
    case constants.Nfsv4Op.SECINFO:
      return 'SECINFO';
    case constants.Nfsv4Op.SETATTR:
      return 'SETATTR';
    case constants.Nfsv4Op.SETCLIENTID:
      return 'SETCLIENTID';
    case constants.Nfsv4Op.SETCLIENTID_CONFIRM:
      return 'SETCLIENTID_CONFIRM';
    case constants.Nfsv4Op.VERIFY:
      return 'VERIFY';
    case constants.Nfsv4Op.WRITE:
      return 'WRITE';
    case constants.Nfsv4Op.RELEASE_LOCKOWNER:
      return 'RELEASE_LOCKOWNER';
    case constants.Nfsv4Op.ILLEGAL:
      return 'ILLEGAL';
    default:
      return `Unknown(${op})`;
  }
};

export const formatNfsv4Attr = (attr: constants.Nfsv4Attr): string => {
  switch (attr) {
    case constants.Nfsv4Attr.FATTR4_SUPPORTED_ATTRS:
      return 'FATTR4_SUPPORTED_ATTRS';
    case constants.Nfsv4Attr.FATTR4_TYPE:
      return 'FATTR4_TYPE';
    case constants.Nfsv4Attr.FATTR4_FH_EXPIRE_TYPE:
      return 'FATTR4_FH_EXPIRE_TYPE';
    case constants.Nfsv4Attr.FATTR4_CHANGE:
      return 'FATTR4_CHANGE';
    case constants.Nfsv4Attr.FATTR4_SIZE:
      return 'FATTR4_SIZE';
    case constants.Nfsv4Attr.FATTR4_LINK_SUPPORT:
      return 'FATTR4_LINK_SUPPORT';
    case constants.Nfsv4Attr.FATTR4_SYMLINK_SUPPORT:
      return 'FATTR4_SYMLINK_SUPPORT';
    case constants.Nfsv4Attr.FATTR4_NAMED_ATTR:
      return 'FATTR4_NAMED_ATTR';
    case constants.Nfsv4Attr.FATTR4_FSID:
      return 'FATTR4_FSID';
    case constants.Nfsv4Attr.FATTR4_UNIQUE_HANDLES:
      return 'FATTR4_UNIQUE_HANDLES';
    case constants.Nfsv4Attr.FATTR4_LEASE_TIME:
      return 'FATTR4_LEASE_TIME';
    case constants.Nfsv4Attr.FATTR4_RDATTR_ERROR:
      return 'FATTR4_RDATTR_ERROR';
    case constants.Nfsv4Attr.FATTR4_ACL:
      return 'FATTR4_ACL';
    case constants.Nfsv4Attr.FATTR4_ACLSUPPORT:
      return 'FATTR4_ACLSUPPORT';
    case constants.Nfsv4Attr.FATTR4_ARCHIVE:
      return 'FATTR4_ARCHIVE';
    case constants.Nfsv4Attr.FATTR4_CANSETTIME:
      return 'FATTR4_CANSETTIME';
    case constants.Nfsv4Attr.FATTR4_CASE_INSENSITIVE:
      return 'FATTR4_CASE_INSENSITIVE';
    case constants.Nfsv4Attr.FATTR4_CASE_PRESERVING:
      return 'FATTR4_CASE_PRESERVING';
    case constants.Nfsv4Attr.FATTR4_CHOWN_RESTRICTED:
      return 'FATTR4_CHOWN_RESTRICTED';
    case constants.Nfsv4Attr.FATTR4_FILEHANDLE:
      return 'FATTR4_FILEHANDLE';
    case constants.Nfsv4Attr.FATTR4_FILEID:
      return 'FATTR4_FILEID';
    case constants.Nfsv4Attr.FATTR4_FILES_AVAIL:
      return 'FATTR4_FILES_AVAIL';
    case constants.Nfsv4Attr.FATTR4_FILES_FREE:
      return 'FATTR4_FILES_FREE';
    case constants.Nfsv4Attr.FATTR4_FILES_TOTAL:
      return 'FATTR4_FILES_TOTAL';
    case constants.Nfsv4Attr.FATTR4_FS_LOCATIONS:
      return 'FATTR4_FS_LOCATIONS';
    case constants.Nfsv4Attr.FATTR4_HIDDEN:
      return 'FATTR4_HIDDEN';
    case constants.Nfsv4Attr.FATTR4_HOMOGENEOUS:
      return 'FATTR4_HOMOGENEOUS';
    case constants.Nfsv4Attr.FATTR4_MAXFILESIZE:
      return 'FATTR4_MAXFILESIZE';
    case constants.Nfsv4Attr.FATTR4_MAXLINK:
      return 'FATTR4_MAXLINK';
    case constants.Nfsv4Attr.FATTR4_MAXNAME:
      return 'FATTR4_MAXNAME';
    case constants.Nfsv4Attr.FATTR4_MAXREAD:
      return 'FATTR4_MAXREAD';
    case constants.Nfsv4Attr.FATTR4_MAXWRITE:
      return 'FATTR4_MAXWRITE';
    case constants.Nfsv4Attr.FATTR4_MIMETYPE:
      return 'FATTR4_MIMETYPE';
    case constants.Nfsv4Attr.FATTR4_MODE:
      return 'FATTR4_MODE';
    case constants.Nfsv4Attr.FATTR4_NO_TRUNC:
      return 'FATTR4_NO_TRUNC';
    case constants.Nfsv4Attr.FATTR4_NUMLINKS:
      return 'FATTR4_NUMLINKS';
    case constants.Nfsv4Attr.FATTR4_OWNER:
      return 'FATTR4_OWNER';
    case constants.Nfsv4Attr.FATTR4_OWNER_GROUP:
      return 'FATTR4_OWNER_GROUP';
    case constants.Nfsv4Attr.FATTR4_QUOTA_AVAIL_HARD:
      return 'FATTR4_QUOTA_AVAIL_HARD';
    case constants.Nfsv4Attr.FATTR4_QUOTA_AVAIL_SOFT:
      return 'FATTR4_QUOTA_AVAIL_SOFT';
    case constants.Nfsv4Attr.FATTR4_QUOTA_USED:
      return 'FATTR4_QUOTA_USED';
    case constants.Nfsv4Attr.FATTR4_RAWDEV:
      return 'FATTR4_RAWDEV';
    case constants.Nfsv4Attr.FATTR4_SPACE_AVAIL:
      return 'FATTR4_SPACE_AVAIL';
    case constants.Nfsv4Attr.FATTR4_SPACE_FREE:
      return 'FATTR4_SPACE_FREE';
    case constants.Nfsv4Attr.FATTR4_SPACE_TOTAL:
      return 'FATTR4_SPACE_TOTAL';
    case constants.Nfsv4Attr.FATTR4_SPACE_USED:
      return 'FATTR4_SPACE_USED';
    case constants.Nfsv4Attr.FATTR4_SYSTEM:
      return 'FATTR4_SYSTEM';
    case constants.Nfsv4Attr.FATTR4_TIME_ACCESS:
      return 'FATTR4_TIME_ACCESS';
    case constants.Nfsv4Attr.FATTR4_TIME_ACCESS_SET:
      return 'FATTR4_TIME_ACCESS_SET';
    case constants.Nfsv4Attr.FATTR4_TIME_BACKUP:
      return 'FATTR4_TIME_BACKUP';
    case constants.Nfsv4Attr.FATTR4_TIME_CREATE:
      return 'FATTR4_TIME_CREATE';
    case constants.Nfsv4Attr.FATTR4_TIME_DELTA:
      return 'FATTR4_TIME_DELTA';
    case constants.Nfsv4Attr.FATTR4_TIME_METADATA:
      return 'FATTR4_TIME_METADATA';
    case constants.Nfsv4Attr.FATTR4_TIME_MODIFY:
      return 'FATTR4_TIME_MODIFY';
    case constants.Nfsv4Attr.FATTR4_TIME_MODIFY_SET:
      return 'FATTR4_TIME_MODIFY_SET';
    case constants.Nfsv4Attr.FATTR4_MOUNTED_ON_FILEID:
      return 'FATTR4_MOUNTED_ON_FILEID';
    default:
      return `Unknown(${attr})`;
  }
};

export const formatNfsv4FType = (ftype: constants.Nfsv4FType): string => {
  switch (ftype) {
    case constants.Nfsv4FType.NF4REG:
      return 'NF4REG';
    case constants.Nfsv4FType.NF4DIR:
      return 'NF4DIR';
    case constants.Nfsv4FType.NF4BLK:
      return 'NF4BLK';
    case constants.Nfsv4FType.NF4CHR:
      return 'NF4CHR';
    case constants.Nfsv4FType.NF4LNK:
      return 'NF4LNK';
    case constants.Nfsv4FType.NF4SOCK:
      return 'NF4SOCK';
    case constants.Nfsv4FType.NF4FIFO:
      return 'NF4FIFO';
    case constants.Nfsv4FType.NF4ATTRDIR:
      return 'NF4ATTRDIR';
    case constants.Nfsv4FType.NF4NAMEDATTR:
      return 'NF4NAMEDATTR';
    default:
      return `Unknown(${ftype})`;
  }
};

export const formatNfsv4TimeHow = (how: constants.Nfsv4TimeHow): string => {
  switch (how) {
    case constants.Nfsv4TimeHow.SET_TO_SERVER_TIME4:
      return 'SET_TO_SERVER_TIME4';
    case constants.Nfsv4TimeHow.SET_TO_CLIENT_TIME4:
      return 'SET_TO_CLIENT_TIME4';
    default:
      return `Unknown(${how})`;
  }
};

export const formatNfsv4StableHow = (stable: constants.Nfsv4StableHow): string => {
  switch (stable) {
    case constants.Nfsv4StableHow.UNSTABLE4:
      return 'UNSTABLE4';
    case constants.Nfsv4StableHow.DATA_SYNC4:
      return 'DATA_SYNC4';
    case constants.Nfsv4StableHow.FILE_SYNC4:
      return 'FILE_SYNC4';
    default:
      return `Unknown(${stable})`;
  }
};

export const formatNfsv4CreateMode = (mode: constants.Nfsv4CreateMode): string => {
  switch (mode) {
    case constants.Nfsv4CreateMode.UNCHECKED4:
      return 'UNCHECKED4';
    case constants.Nfsv4CreateMode.GUARDED4:
      return 'GUARDED4';
    case constants.Nfsv4CreateMode.EXCLUSIVE4:
      return 'EXCLUSIVE4';
    default:
      return `Unknown(${mode})`;
  }
};

export const formatNfsv4OpenFlags = (flags: constants.Nfsv4OpenFlags): string => {
  switch (flags) {
    case constants.Nfsv4OpenFlags.OPEN4_NOCREATE:
      return 'OPEN4_NOCREATE';
    case constants.Nfsv4OpenFlags.OPEN4_CREATE:
      return 'OPEN4_CREATE';
    default:
      return `Unknown(${flags})`;
  }
};

export const formatNfsv4OpenAccess = (access: constants.Nfsv4OpenAccess): string => {
  switch (access) {
    case constants.Nfsv4OpenAccess.OPEN4_SHARE_ACCESS_READ:
      return 'OPEN4_SHARE_ACCESS_READ';
    case constants.Nfsv4OpenAccess.OPEN4_SHARE_ACCESS_WRITE:
      return 'OPEN4_SHARE_ACCESS_WRITE';
    case constants.Nfsv4OpenAccess.OPEN4_SHARE_ACCESS_BOTH:
      return 'OPEN4_SHARE_ACCESS_BOTH';
    default:
      return `Unknown(${access})`;
  }
};

export const formatNfsv4OpenDeny = (deny: constants.Nfsv4OpenDeny): string => {
  switch (deny) {
    case constants.Nfsv4OpenDeny.OPEN4_SHARE_DENY_NONE:
      return 'OPEN4_SHARE_DENY_NONE';
    case constants.Nfsv4OpenDeny.OPEN4_SHARE_DENY_READ:
      return 'OPEN4_SHARE_DENY_READ';
    case constants.Nfsv4OpenDeny.OPEN4_SHARE_DENY_WRITE:
      return 'OPEN4_SHARE_DENY_WRITE';
    case constants.Nfsv4OpenDeny.OPEN4_SHARE_DENY_BOTH:
      return 'OPEN4_SHARE_DENY_BOTH';
    default:
      return `Unknown(${deny})`;
  }
};

export const formatNfsv4OpenClaimType = (claim: constants.Nfsv4OpenClaimType): string => {
  switch (claim) {
    case constants.Nfsv4OpenClaimType.CLAIM_NULL:
      return 'CLAIM_NULL';
    case constants.Nfsv4OpenClaimType.CLAIM_PREVIOUS:
      return 'CLAIM_PREVIOUS';
    case constants.Nfsv4OpenClaimType.CLAIM_DELEGATE_CUR:
      return 'CLAIM_DELEGATE_CUR';
    case constants.Nfsv4OpenClaimType.CLAIM_DELEGATE_PREV:
      return 'CLAIM_DELEGATE_PREV';
    default:
      return `Unknown(${claim})`;
  }
};

export const formatNfsv4DelegType = (deleg: constants.Nfsv4DelegType): string => {
  switch (deleg) {
    case constants.Nfsv4DelegType.OPEN_DELEGATE_NONE:
      return 'OPEN_DELEGATE_NONE';
    case constants.Nfsv4DelegType.OPEN_DELEGATE_READ:
      return 'OPEN_DELEGATE_READ';
    case constants.Nfsv4DelegType.OPEN_DELEGATE_WRITE:
      return 'OPEN_DELEGATE_WRITE';
    default:
      return `Unknown(${deleg})`;
  }
};

export const formatNfsv4LockType = (locktype: constants.Nfsv4LockType): string => {
  switch (locktype) {
    case constants.Nfsv4LockType.READ_LT:
      return 'READ_LT';
    case constants.Nfsv4LockType.WRITE_LT:
      return 'WRITE_LT';
    case constants.Nfsv4LockType.READW_LT:
      return 'READW_LT';
    case constants.Nfsv4LockType.WRITEW_LT:
      return 'WRITEW_LT';
    default:
      return `Unknown(${locktype})`;
  }
};

export const formatNfsv4Access = (access: number): string => {
  const flags: string[] = [];
  if (access & constants.Nfsv4Access.ACCESS4_READ) flags.push('READ');
  if (access & constants.Nfsv4Access.ACCESS4_LOOKUP) flags.push('LOOKUP');
  if (access & constants.Nfsv4Access.ACCESS4_MODIFY) flags.push('MODIFY');
  if (access & constants.Nfsv4Access.ACCESS4_EXTEND) flags.push('EXTEND');
  if (access & constants.Nfsv4Access.ACCESS4_DELETE) flags.push('DELETE');
  if (access & constants.Nfsv4Access.ACCESS4_EXECUTE) flags.push('EXECUTE');
  return flags.length > 0 ? flags.join('|') : `0x${access.toString(16)}`;
};

export const formatNfsv4Mode = (mode: number): string => {
  const flags: string[] = [];
  if (mode & constants.Nfsv4Mode.MODE4_SUID) flags.push('SUID');
  if (mode & constants.Nfsv4Mode.MODE4_SGID) flags.push('SGID');
  if (mode & constants.Nfsv4Mode.MODE4_SVTX) flags.push('SVTX');
  if (mode & constants.Nfsv4Mode.MODE4_RUSR) flags.push('RUSR');
  if (mode & constants.Nfsv4Mode.MODE4_WUSR) flags.push('WUSR');
  if (mode & constants.Nfsv4Mode.MODE4_XUSR) flags.push('XUSR');
  if (mode & constants.Nfsv4Mode.MODE4_RGRP) flags.push('RGRP');
  if (mode & constants.Nfsv4Mode.MODE4_WGRP) flags.push('WGRP');
  if (mode & constants.Nfsv4Mode.MODE4_XGRP) flags.push('XGRP');
  if (mode & constants.Nfsv4Mode.MODE4_ROTH) flags.push('ROTH');
  if (mode & constants.Nfsv4Mode.MODE4_WOTH) flags.push('WOTH');
  if (mode & constants.Nfsv4Mode.MODE4_XOTH) flags.push('XOTH');
  const octal = mode.toString(8).padStart(4, '0');
  return flags.length > 0 ? `${octal} (${flags.join('|')})` : octal;
};

export const formatNfsv4Bitmap = (bitmap: structs.Nfsv4Bitmap): string => {
  const attrs: string[] = [];
  const attrNums = parseBitmask(bitmap.mask);
  for (const num of attrNums) attrs.push(formatNfsv4Attr(num));
  return attrs.length > 0 ? `[${attrs.join(', ')}]` : '[]';
};

const formatBytes = (data: Uint8Array, maxLen = 32): string => {
  if (data.length === 0) return '[]';
  const hex = Array.from(data.slice(0, maxLen), (b) => b.toString(16).padStart(2, '0')).join(' ');
  return data.length > maxLen ? `[${hex}... (${data.length} bytes)]` : `[${hex}]`;
};

const formatStateid = (stateid: structs.Nfsv4Stateid): string => {
  return `{seqid: ${stateid.seqid}, other: ${formatBytes(stateid.other, 12)}}`;
};

const formatFileHandle = (fh: structs.Nfsv4Fh): string => {
  return formatBytes(fh.data, 16);
};

export const formatNfsv4Request = (req: msg.Nfsv4Request): string => {
  if (req instanceof msg.Nfsv4AccessRequest) {
    return `ACCESS(access: ${formatNfsv4Access(req.access)})`;
  } else if (req instanceof msg.Nfsv4CloseRequest) {
    return `CLOSE(seqid: ${req.seqid}, stateid: ${formatStateid(req.openStateid)})`;
  } else if (req instanceof msg.Nfsv4CommitRequest) {
    return `COMMIT(offset: ${req.offset}, count: ${req.count})`;
  } else if (req instanceof msg.Nfsv4CreateRequest) {
    return `CREATE(objtype: ${formatNfsv4FType(req.objtype.type)}, objname: "${req.objname}")`;
  } else if (req instanceof msg.Nfsv4DelegpurgeRequest) {
    return `DELEGPURGE(clientid: ${req.clientid})`;
  } else if (req instanceof msg.Nfsv4DelegreturnRequest) {
    return `DELEGRETURN(stateid: ${formatStateid(req.delegStateid)})`;
  } else if (req instanceof msg.Nfsv4GetattrRequest) {
    return `GETATTR(attrs: ${formatNfsv4Bitmap(req.attrRequest)})`;
  } else if (req instanceof msg.Nfsv4GetfhRequest) {
    return `GETFH()`;
  } else if (req instanceof msg.Nfsv4LinkRequest) {
    return `LINK(newname: "${req.newname}")`;
  } else if (req instanceof msg.Nfsv4LockRequest) {
    return `LOCK(locktype: ${formatNfsv4LockType(req.locktype)}, reclaim: ${req.reclaim}, offset: ${req.offset}, length: ${req.length})`;
  } else if (req instanceof msg.Nfsv4LocktRequest) {
    return `LOCKT(locktype: ${formatNfsv4LockType(req.locktype)}, offset: ${req.offset}, length: ${req.length})`;
  } else if (req instanceof msg.Nfsv4LockuRequest) {
    return `LOCKU(locktype: ${formatNfsv4LockType(req.locktype)}, seqid: ${req.seqid}, stateid: ${formatStateid(req.lockStateid)}, offset: ${req.offset}, length: ${req.length})`;
  } else if (req instanceof msg.Nfsv4LookupRequest) {
    return `LOOKUP(objname: "${req.objname}")`;
  } else if (req instanceof msg.Nfsv4LookuppRequest) {
    return `LOOKUPP()`;
  } else if (req instanceof msg.Nfsv4NverifyRequest) {
    return `NVERIFY(attrs: ${formatNfsv4Bitmap(req.objAttributes.attrmask)})`;
  } else if (req instanceof msg.Nfsv4OpenRequest) {
    return `OPEN(seqid: ${req.seqid}, claim: ${formatNfsv4OpenClaimType(req.claim.claimType)})`;
  } else if (req instanceof msg.Nfsv4OpenattrRequest) {
    return `OPENATTR(createdir: ${req.createdir})`;
  } else if (req instanceof msg.Nfsv4OpenConfirmRequest) {
    return `OPEN_CONFIRM(stateid: ${formatStateid(req.openStateid)}, seqid: ${req.seqid})`;
  } else if (req instanceof msg.Nfsv4OpenDowngradeRequest) {
    return `OPEN_DOWNGRADE(stateid: ${formatStateid(req.openStateid)}, seqid: ${req.seqid}, shareAccess: ${formatNfsv4OpenAccess(req.shareAccess)}, shareDeny: ${formatNfsv4OpenDeny(req.shareDeny)})`;
  } else if (req instanceof msg.Nfsv4PutfhRequest) {
    return `PUTFH(fh: ${formatFileHandle(req.object)})`;
  } else if (req instanceof msg.Nfsv4PutpubfhRequest) {
    return `PUTPUBFH()`;
  } else if (req instanceof msg.Nfsv4PutrootfhRequest) {
    return `PUTROOTFH()`;
  } else if (req instanceof msg.Nfsv4ReadRequest) {
    return `READ(stateid: ${formatStateid(req.stateid)}, offset: ${req.offset}, count: ${req.count})`;
  } else if (req instanceof msg.Nfsv4ReaddirRequest) {
    return `READDIR(cookie: ${req.cookie}, dircount: ${req.dircount}, maxcount: ${req.maxcount}, attrs: ${formatNfsv4Bitmap(req.attrRequest)})`;
  } else if (req instanceof msg.Nfsv4ReadlinkRequest) {
    return `READLINK()`;
  } else if (req instanceof msg.Nfsv4RemoveRequest) {
    return `REMOVE(target: "${req.target}")`;
  } else if (req instanceof msg.Nfsv4RenameRequest) {
    return `RENAME(oldname: "${req.oldname}", newname: "${req.newname}")`;
  } else if (req instanceof msg.Nfsv4RenewRequest) {
    return `RENEW(clientid: ${req.clientid})`;
  } else if (req instanceof msg.Nfsv4RestorefhRequest) {
    return `RESTOREFH()`;
  } else if (req instanceof msg.Nfsv4SavefhRequest) {
    return `SAVEFH()`;
  } else if (req instanceof msg.Nfsv4SecinfoRequest) {
    return `SECINFO(name: "${req.name}")`;
  } else if (req instanceof msg.Nfsv4SetattrRequest) {
    return `SETATTR(stateid: ${formatStateid(req.stateid)}, attrs: ${formatNfsv4Bitmap(req.objAttributes.attrmask)})`;
  } else if (req instanceof msg.Nfsv4SetclientidRequest) {
    return `SETCLIENTID(callbackIdent: ${req.callbackIdent})`;
  } else if (req instanceof msg.Nfsv4SetclientidConfirmRequest) {
    return `SETCLIENTID_CONFIRM(clientid: ${req.clientid})`;
  } else if (req instanceof msg.Nfsv4VerifyRequest) {
    return `VERIFY(attrs: ${formatNfsv4Bitmap(req.objAttributes.attrmask)})`;
  } else if (req instanceof msg.Nfsv4WriteRequest) {
    return `WRITE(stateid: ${formatStateid(req.stateid)}, offset: ${req.offset}, stable: ${formatNfsv4StableHow(req.stable)}, length: ${req.data.length})`;
  } else if (req instanceof msg.Nfsv4ReleaseLockOwnerRequest) {
    return `RELEASE_LOCKOWNER()`;
  } else if (req instanceof msg.Nfsv4IllegalRequest) {
    return `ILLEGAL()`;
  }
  return `Unknown Request`;
};

export const formatNfsv4Response = (res: msg.Nfsv4Response): string => {
  if (res instanceof msg.Nfsv4AccessResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, supported: ${formatNfsv4Access(res.resok.supported)}, access: ${formatNfsv4Access(res.resok.access)}`
        : '';
    return `ACCESS(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4CloseResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, stateid: ${formatStateid(res.resok.openStateid)}`
        : '';
    return `CLOSE(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4CommitResponse) {
    return `COMMIT(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4CreateResponse) {
    return `CREATE(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4DelegpurgeResponse) {
    return `DELEGPURGE(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4DelegreturnResponse) {
    return `DELEGRETURN(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4GetattrResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, attrs: ${formatNfsv4Bitmap(res.resok.objAttributes.attrmask)}`
        : '';
    return `GETATTR(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4GetfhResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok ? `, fh: ${formatFileHandle(res.resok.object)}` : '';
    return `GETFH(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4LinkResponse) {
    return `LINK(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4LockResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, stateid: ${formatStateid(res.resok.lockStateid)}`
        : '';
    return `LOCK(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4LocktResponse) {
    return `LOCKT(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4LockuResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, stateid: ${formatStateid(res.resok.lockStateid)}`
        : '';
    return `LOCKU(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4LookupResponse) {
    return `LOOKUP(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4LookuppResponse) {
    return `LOOKUPP(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4NverifyResponse) {
    return `NVERIFY(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4OpenResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok ? `, stateid: ${formatStateid(res.resok.stateid)}` : '';
    return `OPEN(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4OpenattrResponse) {
    return `OPENATTR(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4OpenConfirmResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, stateid: ${formatStateid(res.resok.openStateid)}`
        : '';
    return `OPEN_CONFIRM(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4OpenDowngradeResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, stateid: ${formatStateid(res.resok.openStateid)}`
        : '';
    return `OPEN_DOWNGRADE(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4PutfhResponse) {
    return `PUTFH(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4PutpubfhResponse) {
    return `PUTPUBFH(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4PutrootfhResponse) {
    return `PUTROOTFH(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4ReadResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, eof: ${res.resok.eof}, length: ${res.resok.data.length}`
        : '';
    return `READ(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4ReaddirResponse) {
    return `READDIR(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4ReadlinkResponse) {
    const okPart = res.status === constants.Nfsv4Stat.NFS4_OK && res.resok ? `, link: "${res.resok.link}"` : '';
    return `READLINK(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4RemoveResponse) {
    return `REMOVE(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4RenameResponse) {
    return `RENAME(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4RenewResponse) {
    return `RENEW(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4RestorefhResponse) {
    return `RESTOREFH(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4SavefhResponse) {
    return `SAVEFH(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4SecinfoResponse) {
    return `SECINFO(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4SetattrResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, attrsset: ${formatNfsv4Bitmap(res.resok.attrsset)}`
        : '';
    return `SETATTR(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4SetclientidResponse) {
    const okPart = res.status === constants.Nfsv4Stat.NFS4_OK && res.resok ? `, clientid: ${res.resok.clientid}` : '';
    return `SETCLIENTID(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4SetclientidConfirmResponse) {
    return `SETCLIENTID_CONFIRM(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4VerifyResponse) {
    return `VERIFY(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4WriteResponse) {
    const okPart =
      res.status === constants.Nfsv4Stat.NFS4_OK && res.resok
        ? `, count: ${res.resok.count}, committed: ${formatNfsv4StableHow(res.resok.committed)}`
        : '';
    return `WRITE(status: ${formatNfsv4Stat(res.status)}${okPart})`;
  } else if (res instanceof msg.Nfsv4ReleaseLockOwnerResponse) {
    return `RELEASE_LOCKOWNER(status: ${formatNfsv4Stat(res.status)})`;
  } else if (res instanceof msg.Nfsv4IllegalResponse) {
    return `ILLEGAL(status: ${formatNfsv4Stat(res.status)})`;
  }
  return `Unknown Response`;
};

export const formatNfsv4CompoundRequest = (req: msg.Nfsv4CompoundRequest): string => {
  const ops = req.argarray.map((op) => formatNfsv4Request(op)).join(', ');
  return `COMPOUND(tag: "${req.tag}", minorversion: ${req.minorversion}, ops: [${ops}])`;
};

export const formatNfsv4CompoundResponse = (res: msg.Nfsv4CompoundResponse): string => {
  const ops = res.resarray.map((op) => formatNfsv4Response(op)).join(', ');
  return `COMPOUND(status: ${formatNfsv4Stat(res.status)}, tag: "${res.tag}", ops: [${ops}])`;
};

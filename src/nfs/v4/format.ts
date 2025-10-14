import * as constants from './constants';
import * as structs from './structs';
import * as msg from './messages';
import {parseBitmask} from './attributes';
import {printTree} from 'tree-dump/lib/printTree';

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
      return 'supported_attrs';
    case constants.Nfsv4Attr.FATTR4_TYPE:
      return 'type';
    case constants.Nfsv4Attr.FATTR4_FH_EXPIRE_TYPE:
      return 'fh_expire_type';
    case constants.Nfsv4Attr.FATTR4_CHANGE:
      return 'change';
    case constants.Nfsv4Attr.FATTR4_SIZE:
      return 'size';
    case constants.Nfsv4Attr.FATTR4_LINK_SUPPORT:
      return 'link_support';
    case constants.Nfsv4Attr.FATTR4_SYMLINK_SUPPORT:
      return 'symlink_support';
    case constants.Nfsv4Attr.FATTR4_NAMED_ATTR:
      return 'named_attr';
    case constants.Nfsv4Attr.FATTR4_FSID:
      return 'fsid';
    case constants.Nfsv4Attr.FATTR4_UNIQUE_HANDLES:
      return 'unique_handles';
    case constants.Nfsv4Attr.FATTR4_LEASE_TIME:
      return 'lease_time';
    case constants.Nfsv4Attr.FATTR4_RDATTR_ERROR:
      return 'rdattr_error';
    case constants.Nfsv4Attr.FATTR4_ACL:
      return 'acl';
    case constants.Nfsv4Attr.FATTR4_ACLSUPPORT:
      return 'aclsupport';
    case constants.Nfsv4Attr.FATTR4_ARCHIVE:
      return 'archive';
    case constants.Nfsv4Attr.FATTR4_CANSETTIME:
      return 'can_set_time';
    case constants.Nfsv4Attr.FATTR4_CASE_INSENSITIVE:
      return 'case_insensitive';
    case constants.Nfsv4Attr.FATTR4_CASE_PRESERVING:
      return 'case_preserving';
    case constants.Nfsv4Attr.FATTR4_CHOWN_RESTRICTED:
      return 'chown_restricted';
    case constants.Nfsv4Attr.FATTR4_FILEHANDLE:
      return 'filehandle';
    case constants.Nfsv4Attr.FATTR4_FILEID:
      return 'fileid';
    case constants.Nfsv4Attr.FATTR4_FILES_AVAIL:
      return 'files_avail';
    case constants.Nfsv4Attr.FATTR4_FILES_FREE:
      return 'files_free';
    case constants.Nfsv4Attr.FATTR4_FILES_TOTAL:
      return 'files_total';
    case constants.Nfsv4Attr.FATTR4_FS_LOCATIONS:
      return 'fs_locations';
    case constants.Nfsv4Attr.FATTR4_HIDDEN:
      return 'hidden';
    case constants.Nfsv4Attr.FATTR4_HOMOGENEOUS:
      return 'homogeneous';
    case constants.Nfsv4Attr.FATTR4_MAXFILESIZE:
      return 'maxfilesize';
    case constants.Nfsv4Attr.FATTR4_MAXLINK:
      return 'maxlink';
    case constants.Nfsv4Attr.FATTR4_MAXNAME:
      return 'maxname';
    case constants.Nfsv4Attr.FATTR4_MAXREAD:
      return 'maxread';
    case constants.Nfsv4Attr.FATTR4_MAXWRITE:
      return 'maxwrite';
    case constants.Nfsv4Attr.FATTR4_MIMETYPE:
      return 'mimetype';
    case constants.Nfsv4Attr.FATTR4_MODE:
      return 'mode';
    case constants.Nfsv4Attr.FATTR4_NO_TRUNC:
      return 'no_trunc';
    case constants.Nfsv4Attr.FATTR4_NUMLINKS:
      return 'numlinks';
    case constants.Nfsv4Attr.FATTR4_OWNER:
      return 'owner';
    case constants.Nfsv4Attr.FATTR4_OWNER_GROUP:
      return 'owner_group';
    case constants.Nfsv4Attr.FATTR4_QUOTA_AVAIL_HARD:
      return 'quota_avail_hard';
    case constants.Nfsv4Attr.FATTR4_QUOTA_AVAIL_SOFT:
      return 'quota_avail_soft';
    case constants.Nfsv4Attr.FATTR4_QUOTA_USED:
      return 'quota_used';
    case constants.Nfsv4Attr.FATTR4_RAWDEV:
      return 'rawdev';
    case constants.Nfsv4Attr.FATTR4_SPACE_AVAIL:
      return 'space_avail';
    case constants.Nfsv4Attr.FATTR4_SPACE_FREE:
      return 'space_free';
    case constants.Nfsv4Attr.FATTR4_SPACE_TOTAL:
      return 'space_total';
    case constants.Nfsv4Attr.FATTR4_SPACE_USED:
      return 'space_used';
    case constants.Nfsv4Attr.FATTR4_SYSTEM:
      return 'system';
    case constants.Nfsv4Attr.FATTR4_TIME_ACCESS:
      return 'time_access';
    case constants.Nfsv4Attr.FATTR4_TIME_ACCESS_SET:
      return 'time_access_set';
    case constants.Nfsv4Attr.FATTR4_TIME_BACKUP:
      return 'time_backup';
    case constants.Nfsv4Attr.FATTR4_TIME_CREATE:
      return 'time_create';
    case constants.Nfsv4Attr.FATTR4_TIME_DELTA:
      return 'time_delta';
    case constants.Nfsv4Attr.FATTR4_TIME_METADATA:
      return 'time_metadata';
    case constants.Nfsv4Attr.FATTR4_TIME_MODIFY:
      return 'time_modify';
    case constants.Nfsv4Attr.FATTR4_TIME_MODIFY_SET:
      return 'time_modify_set';
    case constants.Nfsv4Attr.FATTR4_MOUNTED_ON_FILEID:
      return 'mounted_on_fileid';
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

const formatStateid = (stateid: structs.Nfsv4Stateid, tab: string = ''): string => {
  return (
    'Stateid' + printTree(tab, [(tab) => `seqid = ${stateid.seqid}`, (tab) => `other = ${formatBytes(stateid.other)}`])
  );
};

const formatFileHandle = (fh: structs.Nfsv4Fh): string => {
  return formatBytes(fh.data, 16);
};

export const formatNfsv4Request = (req: msg.Nfsv4Request, tab: string = ''): string => {
  if (req instanceof msg.Nfsv4AccessRequest) {
    return 'ACCESS' + printTree(tab, [(tab) => `access = ${formatNfsv4Access(req.access)}`]);
  } else if (req instanceof msg.Nfsv4CloseRequest) {
    return (
      'CLOSE' +
      printTree(tab, [(tab) => `seqid = ${req.seqid}`, (tab) => `stateid = ${formatStateid(req.openStateid, tab)}`])
    );
  } else if (req instanceof msg.Nfsv4CommitRequest) {
    return 'COMMIT' + printTree(tab, [(tab) => `offset = ${req.offset}`, (tab) => `count = ${req.count}`]);
  } else if (req instanceof msg.Nfsv4CreateRequest) {
    return (
      'CREATE' +
      printTree(tab, [
        (tab) => `objtype = ${formatNfsv4FType(req.objtype.type)}`,
        (tab) => `objname = "${req.objname}"`,
      ])
    );
  } else if (req instanceof msg.Nfsv4DelegpurgeRequest) {
    return 'DELEGPURGE' + printTree(tab, [(tab) => `clientid = ${req.clientid}`]);
  } else if (req instanceof msg.Nfsv4DelegreturnRequest) {
    return 'DELEGRETURN' + printTree(tab, [(tab) => `stateid = ${formatStateid(req.delegStateid, tab)}`]);
  } else if (req instanceof msg.Nfsv4GetattrRequest) {
    return 'GETATTR' + printTree(tab, [(tab) => `attrs = ${formatNfsv4Bitmap(req.attrRequest)}`]);
  } else if (req instanceof msg.Nfsv4GetfhRequest) {
    return 'GETFH';
  } else if (req instanceof msg.Nfsv4LinkRequest) {
    return 'LINK' + printTree(tab, [(tab) => `newname = "${req.newname}"`]);
  } else if (req instanceof msg.Nfsv4LockRequest) {
    return (
      'LOCK' +
      printTree(tab, [
        (tab) => `locktype = ${formatNfsv4LockType(req.locktype)}`,
        (tab) => `reclaim = ${req.reclaim}`,
        (tab) => `offset = ${req.offset}`,
        (tab) => `length = ${req.length}`,
      ])
    );
  } else if (req instanceof msg.Nfsv4LocktRequest) {
    return (
      'LOCKT' +
      printTree(tab, [
        (tab) => `locktype = ${formatNfsv4LockType(req.locktype)}`,
        (tab) => `offset = ${req.offset}`,
        (tab) => `length = ${req.length}`,
      ])
    );
  } else if (req instanceof msg.Nfsv4LockuRequest) {
    return (
      'LOCKU' +
      printTree(tab, [
        (tab) => `locktype = ${formatNfsv4LockType(req.locktype)}`,
        (tab) => `seqid = ${req.seqid}`,
        (tab) => `stateid = ${formatStateid(req.lockStateid, tab)}`,
        (tab) => `offset = ${req.offset}`,
        (tab) => `length = ${req.length}`,
      ])
    );
  } else if (req instanceof msg.Nfsv4LookupRequest) {
    return 'LOOKUP' + printTree(tab, [(tab) => `objname = "${req.objname}"`]);
  } else if (req instanceof msg.Nfsv4LookuppRequest) {
    return 'LOOKUPP';
  } else if (req instanceof msg.Nfsv4NverifyRequest) {
    return 'NVERIFY' + printTree(tab, [(tab) => `attrs = ${formatNfsv4Bitmap(req.objAttributes.attrmask)}`]);
  } else if (req instanceof msg.Nfsv4OpenRequest) {
    const items: Array<(tab: string) => string> = [
      (tab) => `seqid = ${req.seqid}`,
      (tab) => `shareAccess = ${formatNfsv4OpenAccess(req.shareAccess)}`,
      (tab) => `shareDeny = ${formatNfsv4OpenDeny(req.shareDeny)}`,
      (tab) => `opentype = ${formatNfsv4OpenFlags(req.openhow.opentype)}`,
    ];
    if (req.openhow.how) {
      items.push((tab) => `createmode = ${formatNfsv4CreateMode(req.openhow.how!.mode)}`);
    }
    items.push((tab) => `claim = ${formatNfsv4OpenClaimType(req.claim.claimType)}`);
    return 'OPEN' + printTree(tab, items);
  } else if (req instanceof msg.Nfsv4OpenattrRequest) {
    return 'OPENATTR' + printTree(tab, [(tab) => `createdir = ${req.createdir}`]);
  } else if (req instanceof msg.Nfsv4OpenConfirmRequest) {
    return (
      'OPEN_CONFIRM' +
      printTree(tab, [(tab) => `stateid = ${formatStateid(req.openStateid, tab)}`, (tab) => `seqid = ${req.seqid}`])
    );
  } else if (req instanceof msg.Nfsv4OpenDowngradeRequest) {
    return (
      'OPEN_DOWNGRADE' +
      printTree(tab, [
        (tab) => `stateid = ${formatStateid(req.openStateid, tab)}`,
        (tab) => `seqid = ${req.seqid}`,
        (tab) => `shareAccess = ${formatNfsv4OpenAccess(req.shareAccess)}`,
        (tab) => `shareDeny = ${formatNfsv4OpenDeny(req.shareDeny)}`,
      ])
    );
  } else if (req instanceof msg.Nfsv4PutfhRequest) {
    return 'PUTFH' + printTree(tab, [(tab) => `fh = ${formatFileHandle(req.object)}`]);
  } else if (req instanceof msg.Nfsv4PutpubfhRequest) {
    return 'PUTPUBFH';
  } else if (req instanceof msg.Nfsv4PutrootfhRequest) {
    return 'PUTROOTFH';
  } else if (req instanceof msg.Nfsv4ReadRequest) {
    return (
      'READ' +
      printTree(tab, [
        (tab) => `stateid = ${formatStateid(req.stateid, tab)}`,
        (tab) => `offset = ${req.offset}`,
        (tab) => `count = ${req.count}`,
      ])
    );
  } else if (req instanceof msg.Nfsv4ReaddirRequest) {
    return (
      'READDIR' +
      printTree(tab, [
        (tab) => `cookie = ${req.cookie}`,
        (tab) => `dircount = ${req.dircount}`,
        (tab) => `maxcount = ${req.maxcount}`,
        (tab) => `attrs = ${formatNfsv4Bitmap(req.attrRequest)}`,
      ])
    );
  } else if (req instanceof msg.Nfsv4ReadlinkRequest) {
    return 'READLINK';
  } else if (req instanceof msg.Nfsv4RemoveRequest) {
    return 'REMOVE' + printTree(tab, [(tab) => `target = "${req.target}"`]);
  } else if (req instanceof msg.Nfsv4RenameRequest) {
    return 'RENAME' + printTree(tab, [(tab) => `oldname = "${req.oldname}"`, (tab) => `newname = "${req.newname}"`]);
  } else if (req instanceof msg.Nfsv4RenewRequest) {
    return 'RENEW' + printTree(tab, [(tab) => `clientid = ${req.clientid}`]);
  } else if (req instanceof msg.Nfsv4RestorefhRequest) {
    return 'RESTOREFH';
  } else if (req instanceof msg.Nfsv4SavefhRequest) {
    return 'SAVEFH';
  } else if (req instanceof msg.Nfsv4SecinfoRequest) {
    return 'SECINFO' + printTree(tab, [(tab) => `name = "${req.name}"`]);
  } else if (req instanceof msg.Nfsv4SetattrRequest) {
    return (
      'SETATTR' +
      printTree(tab, [
        (tab) => `stateid = ${formatStateid(req.stateid, tab)}`,
        (tab) => `attrs = ${formatNfsv4Bitmap(req.objAttributes.attrmask)}`,
      ])
    );
  } else if (req instanceof msg.Nfsv4SetclientidRequest) {
    return 'SETCLIENTID' + printTree(tab, [(tab) => `callbackIdent = ${req.callbackIdent}`]);
  } else if (req instanceof msg.Nfsv4SetclientidConfirmRequest) {
    return 'SETCLIENTID_CONFIRM' + printTree(tab, [(tab) => `clientid = ${req.clientid}`]);
  } else if (req instanceof msg.Nfsv4VerifyRequest) {
    return 'VERIFY' + printTree(tab, [(tab) => `attrs = ${formatNfsv4Bitmap(req.objAttributes.attrmask)}`]);
  } else if (req instanceof msg.Nfsv4WriteRequest) {
    return (
      'WRITE' +
      printTree(tab, [
        (tab) => `stateid = ${formatStateid(req.stateid, tab)}`,
        (tab) => `offset = ${req.offset}`,
        (tab) => `stable = ${formatNfsv4StableHow(req.stable)}`,
        (tab) => `length = ${req.data.length}`,
      ])
    );
  } else if (req instanceof msg.Nfsv4ReleaseLockOwnerRequest) {
    return 'RELEASE_LOCKOWNER';
  } else if (req instanceof msg.Nfsv4IllegalRequest) {
    return 'ILLEGAL';
  }
  return 'Unknown Request';
};

export const formatNfsv4Response = (res: msg.Nfsv4Response, tab: string = ''): string => {
  if (res instanceof msg.Nfsv4AccessResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `supported = ${formatNfsv4Access(res.resok!.supported)}`);
      items.push((tab) => `access = ${formatNfsv4Access(res.resok!.access)}`);
    }
    return 'ACCESS' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4CloseResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `stateid = ${formatStateid(res.resok!.openStateid, tab)}`);
    }
    return 'CLOSE' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4CommitResponse) {
    return 'COMMIT' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4CreateResponse) {
    return 'CREATE' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4DelegpurgeResponse) {
    return 'DELEGPURGE' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4DelegreturnResponse) {
    return 'DELEGRETURN' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4GetattrResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `attrs = ${formatNfsv4Bitmap(res.resok!.objAttributes.attrmask)}`);
    }
    return 'GETATTR' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4GetfhResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `fh = ${formatFileHandle(res.resok!.object)}`);
    }
    return 'GETFH' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4LinkResponse) {
    return 'LINK' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4LockResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `stateid = ${formatStateid(res.resok!.lockStateid, tab)}`);
    }
    return 'LOCK' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4LocktResponse) {
    return 'LOCKT' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4LockuResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `stateid = ${formatStateid(res.resok!.lockStateid, tab)}`);
    }
    return 'LOCKU' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4LookupResponse) {
    return 'LOOKUP' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4LookuppResponse) {
    return 'LOOKUPP' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4NverifyResponse) {
    return 'NVERIFY' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4OpenResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `stateid = ${formatStateid(res.resok!.stateid, tab)}`);
    }
    return 'OPEN' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4OpenattrResponse) {
    return 'OPENATTR' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4OpenConfirmResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `stateid = ${formatStateid(res.resok!.openStateid, tab)}`);
    }
    return 'OPEN_CONFIRM' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4OpenDowngradeResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `stateid = ${formatStateid(res.resok!.openStateid, tab)}`);
    }
    return 'OPEN_DOWNGRADE' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4PutfhResponse) {
    return 'PUTFH' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4PutpubfhResponse) {
    return 'PUTPUBFH' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4PutrootfhResponse) {
    return 'PUTROOTFH' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4ReadResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `eof = ${res.resok!.eof}`);
      items.push((tab) => `length = ${res.resok!.data.length}`);
    }
    return 'READ' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4ReaddirResponse) {
    return 'READDIR' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4ReadlinkResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `link = "${res.resok!.link}"`);
    }
    return 'READLINK' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4RemoveResponse) {
    return 'REMOVE' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4RenameResponse) {
    return 'RENAME' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4RenewResponse) {
    return 'RENEW' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4RestorefhResponse) {
    return 'RESTOREFH' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4SavefhResponse) {
    return 'SAVEFH' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4SecinfoResponse) {
    return 'SECINFO' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4SetattrResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `attrsset = ${formatNfsv4Bitmap(res.resok!.attrsset)}`);
    }
    return 'SETATTR' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4SetclientidResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `clientid = ${res.resok!.clientid}`);
    }
    return 'SETCLIENTID' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4SetclientidConfirmResponse) {
    return 'SETCLIENTID_CONFIRM' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4VerifyResponse) {
    return 'VERIFY' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4WriteResponse) {
    const items: Array<(tab: string) => string> = [(tab) => `status = ${formatNfsv4Stat(res.status)}`];
    if (res.status === constants.Nfsv4Stat.NFS4_OK && res.resok) {
      items.push((tab) => `count = ${res.resok!.count}`);
      items.push((tab) => `committed = ${formatNfsv4StableHow(res.resok!.committed)}`);
    }
    return 'WRITE' + printTree(tab, items);
  } else if (res instanceof msg.Nfsv4ReleaseLockOwnerResponse) {
    return 'RELEASE_LOCKOWNER' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  } else if (res instanceof msg.Nfsv4IllegalResponse) {
    return 'ILLEGAL' + printTree(tab, [(tab) => `status = ${formatNfsv4Stat(res.status)}`]);
  }
  return 'Unknown Response';
};

export const formatNfsv4CompoundRequest = (req: msg.Nfsv4CompoundRequest, tab: string = ''): string => {
  const items: Array<(tab: string) => string> = [
    (tab) => `tag = "${req.tag}"`,
    (tab) => `minorversion = ${req.minorversion}`,
  ];
  req.argarray.forEach((op, i) => {
    items.push((tab) => `[${i}] ${formatNfsv4Request(op, tab)}`);
  });
  return 'COMPOUND' + printTree(tab, items);
};

export const formatNfsv4CompoundResponse = (res: msg.Nfsv4CompoundResponse, tab: string = ''): string => {
  const items: Array<(tab: string) => string> = [
    (tab) => `status = ${formatNfsv4Stat(res.status)}`,
    (tab) => `tag = "${res.tag}"`,
  ];
  res.resarray.forEach((op, i) => {
    items.push((tab) => `[${i}] ${formatNfsv4Response(op, tab)}`);
  });
  return 'COMPOUND' + printTree(tab, items);
};

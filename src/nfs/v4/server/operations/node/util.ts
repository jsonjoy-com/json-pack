import {Nfsv4Stat} from "../../..";

export const isErrCode = (code: unknown, error: unknown): boolean =>
  !!error && typeof error === 'object' && (error as any).code === code;

export const normalizeNodeFsError = (err: unknown): Nfsv4Stat => {
  if (isErrCode('ENOENT', err)) return Nfsv4Stat.NFS4ERR_NOENT;
  if (isErrCode('EACCES', err)) return Nfsv4Stat.NFS4ERR_ACCESS;
  return Nfsv4Stat.NFS4ERR_IO;
};

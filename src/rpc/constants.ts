export const enum RpcMsgType {
  CALL = 0,
  REPLY = 1,
}

export const enum RpcReplyStat {
  MSG_ACCEPTED = 0,
  MSG_DENIED = 1,
}

export const enum RpcAcceptStat {
  SUCCESS = 0,
  PROG_UNAVAIL = 1,
  PROG_MISMATCH = 2,
  PROC_UNAVAIL = 3,
  GARBAGE_ARGS = 4,
}

export const enum RpcRejectStat {
  RPC_MISMATCH = 0,
  AUTH_ERROR = 1,
}

export const enum RpcAuthStat {
  AUTH_BADCRED = 1,
  AUTH_REJECTEDCRED = 2,
  AUTH_BADVERF = 3,
  AUTH_REJECTEDVERF = 4,
  AUTH_TOOWEAK = 5,
}

export const enum RpcAuthFlavor {
  AUTH_NULL = 0,
  AUTH_UNIX = 1,
  AUTH_SHORT = 2,
  AUTH_DES = 3,
}

export const RPC_VERSION = 2;

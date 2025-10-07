import type {RpcAuthFlavor, RpcAcceptStat, RpcRejectStat, RpcAuthStat} from './constants';

export {RpcMsgType, RpcReplyStat, RpcAcceptStat, RpcRejectStat, RpcAuthStat, RpcAuthFlavor} from './constants';

export class RpcOpaqueAuth {
  constructor(
    public readonly flavor: RpcAuthFlavor,
    public readonly body: Uint8Array,
  ) {}
}

export class RpcCallBody {
  constructor(
    public readonly rpcvers: number,
    public readonly prog: number,
    public readonly vers: number,
    public readonly proc: number,
    public readonly cred: RpcOpaqueAuth,
    public readonly verf: RpcOpaqueAuth,
  ) {}
}

export class RpcMismatchInfo {
  constructor(
    public readonly low: number,
    public readonly high: number,
  ) {}
}

export class RpcAcceptedReply {
  constructor(
    public readonly verf: RpcOpaqueAuth,
    public readonly stat: RpcAcceptStat,
    public readonly mismatchInfo?: RpcMismatchInfo,
    public readonly results?: Uint8Array,
  ) {}
}

export class RpcRejectedReply {
  constructor(
    public readonly stat: RpcRejectStat,
    public readonly mismatchInfo?: RpcMismatchInfo,
    public readonly authStat?: RpcAuthStat,
  ) {}
}

export class RpcMessage {
  constructor(
    public readonly xid: number,
    public readonly body: RpcCallBody | RpcAcceptedReply | RpcRejectedReply,
  ) {}
}

export class RpcCallMessage extends RpcMessage {
  constructor(
    xid: number,
    public readonly call: RpcCallBody,
  ) {
    super(xid, call);
  }
}

export class RpcReplyMessage extends RpcMessage {
  constructor(
    xid: number,
    public readonly reply: RpcAcceptedReply | RpcRejectedReply,
  ) {
    super(xid, reply);
  }
}

import {StreamingReader} from '@jsonjoy.com/buffers/lib/StreamingReader';
import {RpcMsgType, RpcReplyStat, RpcAcceptStat, RpcRejectStat, RPC_VERSION} from './constants';
import {RpcDecodingError} from './errors';
import {RpcOpaqueAuth, RpcCallBody, RpcAcceptedReply, RpcRejectedReply, RpcMessage, RpcMismatchInfo} from './messages';

export class RpcMessageDecoder {
  public readonly reader = new StreamingReader();

  public push(uint8: Uint8Array): void {
    this.reader.push(uint8);
  }

  public readMessage(): RpcMessage | undefined {
    try {
      const reader = this.reader;
      if (reader.size() < 8) return undefined;
      const startPos = reader.x;
      const xid = reader.u32();
      const msgType = reader.u32();
      if (msgType === RpcMsgType.CALL) {
        const callBody = this.readCallBody();
        if (!callBody) {
          reader.x = startPos;
          return undefined;
        }
        return new RpcMessage(xid, callBody);
      } else if (msgType === RpcMsgType.REPLY) {
        if (reader.size() < 4) {
          reader.x = startPos;
          return undefined;
        }
        const replyStat = reader.u32();
        if (replyStat === RpcReplyStat.MSG_ACCEPTED) {
          const reply = this.readAcceptedReply();
          if (!reply) {
            reader.x = startPos;
            return undefined;
          }
          return new RpcMessage(xid, reply);
        } else if (replyStat === RpcReplyStat.MSG_DENIED) {
          const reply = this.readRejectedReply();
          if (!reply) {
            reader.x = startPos;
            return undefined;
          }
          return new RpcMessage(xid, reply);
        } else {
          throw new RpcDecodingError('Invalid reply_stat');
        }
      } else {
        throw new RpcDecodingError('Invalid msg_type');
      }
    } catch (err) {
      if (err instanceof RangeError) return undefined;
      throw err;
    }
  }

  private readCallBody(): RpcCallBody | undefined {
    const reader = this.reader;
    if (reader.size() < 20) return undefined;
    const startPos = reader.x;
    const rpcvers = reader.u32();
    if (rpcvers !== RPC_VERSION) {
      throw new RpcDecodingError(`Unsupported RPC version: ${rpcvers}`);
    }
    const prog = reader.u32();
    const vers = reader.u32();
    const proc = reader.u32();
    const cred = this.readOpaqueAuth();
    if (!cred) {
      reader.x = startPos;
      return undefined;
    }
    const verf = this.readOpaqueAuth();
    if (!verf) {
      reader.x = startPos;
      return undefined;
    }
    return new RpcCallBody(rpcvers, prog, vers, proc, cred, verf);
  }

  private readAcceptedReply(): RpcAcceptedReply | undefined {
    const reader = this.reader;
    const startPos = reader.x;
    const verf = this.readOpaqueAuth();
    if (!verf) {
      reader.x = startPos;
      return undefined;
    }
    if (reader.size() < 4) {
      reader.x = startPos;
      return undefined;
    }
    const acceptStat = reader.u32();
    let mismatchInfo: RpcMismatchInfo | undefined;
    let results: Uint8Array | undefined;
    if (acceptStat === RpcAcceptStat.PROG_MISMATCH) {
      if (reader.size() < 8) {
        reader.x = startPos;
        return undefined;
      }
      const low = reader.u32();
      const high = reader.u32();
      mismatchInfo = new RpcMismatchInfo(low, high);
    } else if (acceptStat === RpcAcceptStat.SUCCESS) {
      const remaining = reader.size();
      if (remaining > 0) {
        results = reader.buf(remaining);
      }
    }
    return new RpcAcceptedReply(verf, acceptStat, mismatchInfo, results);
  }

  private readRejectedReply(): RpcRejectedReply | undefined {
    const reader = this.reader;
    if (reader.size() < 4) return undefined;
    const startPos = reader.x;
    const rejectStat = reader.u32();
    let mismatchInfo: RpcMismatchInfo | undefined;
    let authStat: number | undefined;
    if (rejectStat === RpcRejectStat.RPC_MISMATCH) {
      if (reader.size() < 8) {
        reader.x = startPos;
        return undefined;
      }
      const low = reader.u32();
      const high = reader.u32();
      mismatchInfo = new RpcMismatchInfo(low, high);
    } else if (rejectStat === RpcRejectStat.AUTH_ERROR) {
      if (reader.size() < 4) {
        reader.x = startPos;
        return undefined;
      }
      authStat = reader.u32();
    }
    return new RpcRejectedReply(rejectStat, mismatchInfo, authStat);
  }

  private readOpaqueAuth(): RpcOpaqueAuth | undefined {
    const reader = this.reader;
    if (reader.size() < 8) return undefined;
    const startPos = reader.x;
    const flavor = reader.u32();
    const length = reader.u32();
    if (length > 400) {
      throw new RpcDecodingError('Auth body too large');
    }
    const paddedLength = (length + 3) & ~3;
    if (reader.size() < paddedLength) {
      reader.x = startPos;
      return undefined;
    }
    const body = length > 0 ? reader.buf(length) : new Uint8Array(0);
    const padding = paddedLength - length;
    if (padding > 0) {
      reader.skip(padding);
    }
    return new RpcOpaqueAuth(flavor, body);
  }
}

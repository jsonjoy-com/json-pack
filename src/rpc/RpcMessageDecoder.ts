import {Reader} from '@jsonjoy.com/buffers/lib/Reader';
import {RpcMsgType, RpcReplyStat, RpcAcceptStat, RpcRejectStat, RPC_VERSION} from './constants';
import {RpcDecodingError} from './errors';
import {RpcOpaqueAuth, RpcCallBody, RpcAcceptedReply, RpcRejectedReply, RpcMessage, RpcMismatchInfo} from './messages';

export class RpcMessageDecoder {
  public decodeMessage(reader: Reader): RpcMessage | undefined {
    const startPos = reader.x;
    try {
      if (reader.size() < 8) {
        reader.x = startPos;
        return undefined;
      }
      const xid = reader.u32();
      const msgType = reader.u32();
      let message: RpcMessage | undefined;
      if (msgType === RpcMsgType.CALL) {
        const callBody = this.readCallBody(reader);
        if (!callBody) {
          reader.x = startPos;
          return undefined;
        }
        const params = reader.size() > 0 ? reader.buf(reader.size()) : undefined;
        callBody.params = params;
        message = new RpcMessage(xid, callBody);
      } else if (msgType === RpcMsgType.REPLY) {
        if (reader.size() < 4) {
          reader.x = startPos;
          return undefined;
        }
        const replyStat = reader.u32();
        if (replyStat === RpcReplyStat.MSG_ACCEPTED) {
          const reply = this.readAcceptedReply(reader);
          if (!reply) {
            reader.x = startPos;
            return undefined;
          }
          const results = reader.size() > 0 ? reader.buf(reader.size()) : undefined;
          reply.results = results;
          message = new RpcMessage(xid, reply);
        } else if (replyStat === RpcReplyStat.MSG_DENIED) {
          const reply = this.readRejectedReply(reader);
          if (!reply) {
            reader.x = startPos;
            return undefined;
          }
          message = new RpcMessage(xid, reply);
        } else {
          throw new RpcDecodingError('Invalid reply_stat');
        }
      } else {
        throw new RpcDecodingError('Invalid msg_type');
      }
      reader.consume();
      return message;
    } catch (err) {
      if (err instanceof RangeError) {
        reader.x = startPos;
        return undefined;
      }
      throw err;
    }
  }

  private readCallBody(reader: StreamingReader): RpcCallBody | undefined {
    if (reader.size() < 20) return undefined;
    const rpcvers = reader.u32();
    if (rpcvers !== RPC_VERSION) {
      throw new RpcDecodingError(`Unsupported RPC version: ${rpcvers}`);
    }
    const prog = reader.u32();
    const vers = reader.u32();
    const proc = reader.u32();
    const cred = this.readOpaqueAuth(reader);
    if (!cred) return undefined;
    const verf = this.readOpaqueAuth(reader);
    if (!verf) return undefined;
    return new RpcCallBody(rpcvers, prog, vers, proc, cred, verf);
  }

  private readAcceptedReply(reader: StreamingReader): RpcAcceptedReply | undefined {
    const verf = this.readOpaqueAuth(reader);
    if (!verf) return undefined;
    if (reader.size() < 4) return undefined;
    const acceptStat = reader.u32();
    let mismatchInfo: RpcMismatchInfo | undefined;
    if (acceptStat === RpcAcceptStat.PROG_MISMATCH) {
      if (reader.size() < 8) return undefined;
      const low = reader.u32();
      const high = reader.u32();
      mismatchInfo = new RpcMismatchInfo(low, high);
    }
    return new RpcAcceptedReply(verf, acceptStat, mismatchInfo, undefined);
  }

  private readRejectedReply(reader: StreamingReader): RpcRejectedReply | undefined {
    if (reader.size() < 4) return undefined;
    const rejectStat = reader.u32();
    let mismatchInfo: RpcMismatchInfo | undefined;
    let authStat: number | undefined;
    if (rejectStat === RpcRejectStat.RPC_MISMATCH) {
      if (reader.size() < 8) return undefined;
      const low = reader.u32();
      const high = reader.u32();
      mismatchInfo = new RpcMismatchInfo(low, high);
    } else if (rejectStat === RpcRejectStat.AUTH_ERROR) {
      if (reader.size() < 4) return undefined;
      authStat = reader.u32();
    }
    return new RpcRejectedReply(rejectStat, mismatchInfo, authStat);
  }

  private readOpaqueAuth(reader: StreamingReader): RpcOpaqueAuth | undefined {
    if (reader.size() < 8) return undefined;
    const flavor = reader.u32();
    const length = reader.u32();
    if (length > 400) {
      throw new RpcDecodingError('Auth body too large');
    }
    const paddedLength = (length + 3) & ~3;
    if (reader.size() < paddedLength) return undefined;
    const body = length > 0 ? reader.buf(length) : new Uint8Array(0);
    const padding = paddedLength - length;
    if (padding > 0) {
      reader.skip(padding);
    }
    return new RpcOpaqueAuth(flavor, body);
  }
}

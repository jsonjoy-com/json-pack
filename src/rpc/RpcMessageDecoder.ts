import {StreamingReader} from '@jsonjoy.com/buffers/lib/StreamingReader';
import {RpcMsgType, RpcReplyStat, RpcAcceptStat, RpcRejectStat, RPC_VERSION} from './constants';
import {RpcDecodingError} from './errors';
import {RpcOpaqueAuth, RpcCallBody, RpcAcceptedReply, RpcRejectedReply, RpcMessage, RpcMismatchInfo} from './messages';

export class RpcMessageDecoder {
  public readonly reader = new StreamingReader();
  private fragmentBuffer: Uint8Array | null = null;
  private fragmentLength = 0;
  private fragmentReceived = 0;

  public push(uint8: Uint8Array): void {
    this.reader.push(uint8);
  }

  public readMessage(): RpcMessage | undefined {
    const reader = this.reader;
    const startPos = reader.x;
    try {
      if (!this.readRecordFragment()) {
        reader.x = startPos;
        return undefined;
      }
      if (!this.fragmentBuffer) {
        reader.x = startPos;
        return undefined;
      }
      const fragmentReader = new StreamingReader();
      fragmentReader.push(this.fragmentBuffer);
      if (fragmentReader.size() < 8) {
        this.fragmentBuffer = null;
        throw new RpcDecodingError('Fragment too small for RPC message');
      }
      const xid = fragmentReader.u32();
      const msgType = fragmentReader.u32();
      let message: RpcMessage | undefined;
      if (msgType === RpcMsgType.CALL) {
        const callBody = this.readCallBodyFromFragment(fragmentReader);
        if (!callBody) {
          this.fragmentBuffer = null;
          throw new RpcDecodingError('Invalid CALL message');
        }
        const params = fragmentReader.size() > 0 ? fragmentReader.buf(fragmentReader.size()) : undefined;
        callBody.params = params;
        message = new RpcMessage(xid, callBody);
      } else if (msgType === RpcMsgType.REPLY) {
        if (fragmentReader.size() < 4) {
          this.fragmentBuffer = null;
          throw new RpcDecodingError('Fragment too small for REPLY');
        }
        const replyStat = fragmentReader.u32();
        if (replyStat === RpcReplyStat.MSG_ACCEPTED) {
          const reply = this.readAcceptedReplyFromFragment(fragmentReader);
          if (!reply) {
            this.fragmentBuffer = null;
            throw new RpcDecodingError('Invalid ACCEPTED REPLY');
          }
          const results = fragmentReader.size() > 0 ? fragmentReader.buf(fragmentReader.size()) : undefined;
          reply.results = results;
          message = new RpcMessage(xid, reply);
        } else if (replyStat === RpcReplyStat.MSG_DENIED) {
          const reply = this.readRejectedReplyFromFragment(fragmentReader);
          if (!reply) {
            this.fragmentBuffer = null;
            throw new RpcDecodingError('Invalid REJECTED REPLY');
          }
          message = new RpcMessage(xid, reply);
        } else {
          this.fragmentBuffer = null;
          throw new RpcDecodingError('Invalid reply_stat');
        }
      } else {
        this.fragmentBuffer = null;
        throw new RpcDecodingError('Invalid msg_type');
      }
      this.fragmentBuffer = null;
      this.fragmentLength = 0;
      this.fragmentReceived = 0;
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

  private readRecordFragment(): boolean {
    const reader = this.reader;
    if (this.fragmentBuffer) {
      return true;
    }
    if (reader.size() < 4) return false;
    const header = reader.u32();
    const lastFragment = (header & 0x80000000) !== 0;
    const length = header & 0x7fffffff;
    if (length > 0x7fffffff) {
      throw new RpcDecodingError('Fragment length too large');
    }
    if (reader.size() < length) return false;
    const fragmentData = reader.buf(length);
    if (!lastFragment) {
      throw new RpcDecodingError('Multi-fragment messages not yet supported');
    }
    this.fragmentBuffer = fragmentData;
    this.fragmentLength = length;
    this.fragmentReceived = length;
    return true;
  }

  private readCallBodyFromFragment(reader: StreamingReader): RpcCallBody | undefined {
    if (reader.size() < 20) return undefined;
    const rpcvers = reader.u32();
    if (rpcvers !== RPC_VERSION) {
      throw new RpcDecodingError(`Unsupported RPC version: ${rpcvers}`);
    }
    const prog = reader.u32();
    const vers = reader.u32();
    const proc = reader.u32();
    const cred = this.readOpaqueAuthFromFragment(reader);
    if (!cred) return undefined;
    const verf = this.readOpaqueAuthFromFragment(reader);
    if (!verf) return undefined;
    return new RpcCallBody(rpcvers, prog, vers, proc, cred, verf);
  }

  private readAcceptedReplyFromFragment(reader: StreamingReader): RpcAcceptedReply | undefined {
    const verf = this.readOpaqueAuthFromFragment(reader);
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

  private readRejectedReplyFromFragment(reader: StreamingReader): RpcRejectedReply | undefined {
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

  private readOpaqueAuthFromFragment(reader: StreamingReader): RpcOpaqueAuth | undefined {
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

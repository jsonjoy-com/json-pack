import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';
import type {Reader} from '@jsonjoy.com/buffers/lib/Reader';
import {RpcMsgType, RpcReplyStat, RPC_VERSION} from './constants';
import {RpcEncodingError} from './errors';
import {
  RpcOpaqueAuth,
  RpcCallMessage,
  RpcAcceptedReplyMessage,
  RpcRejectedReplyMessage,
  RpcMessage,
} from './messages';

export class RpcMessageEncoder<W extends IWriter & IWriterGrowable = IWriter & IWriterGrowable> {
  constructor(public readonly writer: W = new Writer() as any) {}

  public encodeCall(
    xid: number,
    prog: number,
    vers: number,
    proc: number,
    cred: RpcOpaqueAuth,
    verf: RpcOpaqueAuth,
    params?: Reader | Uint8Array,
  ): Uint8Array {
    this.writeCall(xid, prog, vers, proc, cred, verf, params);
    return this.writer.flush();
  }

  public encodeAcceptedReply(
    xid: number,
    verf: RpcOpaqueAuth,
    acceptStat: number,
    mismatchInfo?: {low: number; high: number},
    results?: Reader | Uint8Array,
  ): Uint8Array {
    this.writeAcceptedReply(xid, verf, acceptStat, mismatchInfo, results);
    return this.writer.flush();
  }

  public encodeRejectedReply(
    xid: number,
    rejectStat: number,
    mismatchInfo?: {low: number; high: number},
    authStat?: number,
  ): Uint8Array {
    this.writeRejectedReply(xid, rejectStat, mismatchInfo, authStat);
    return this.writer.flush();
  }

  public encodeMessage(msg: RpcMessage): Uint8Array {
    this.writeMessage(msg);
    return this.writer.flush();
  }

  public writeMessage(msg: RpcMessage): void {
    if (msg instanceof RpcCallMessage) {
      this.writeCall(msg.xid, msg.prog, msg.vers, msg.proc, msg.cred, msg.verf, msg.params);
    } else if (msg instanceof RpcAcceptedReplyMessage) {
      this.writeAcceptedReply(msg.xid, msg.verf, msg.stat, msg.mismatchInfo, msg.results);
    } else if (msg instanceof RpcRejectedReplyMessage) {
      this.writeRejectedReply(msg.xid, msg.stat, msg.mismatchInfo, msg.authStat);
    }
  }

  public writeCall(
    xid: number,
    prog: number,
    vers: number,
    proc: number,
    cred: RpcOpaqueAuth,
    verf: RpcOpaqueAuth,
    params?: Reader | Uint8Array,
  ): void {
    const writer = this.writer;
    writer.u32(xid);
    writer.u32(RpcMsgType.CALL);
    writer.u32(RPC_VERSION);
    writer.u32(prog);
    writer.u32(vers);
    writer.u32(proc);
    this.writeOpaqueAuth(cred);
    this.writeOpaqueAuth(verf);
    if (params) {
      if (params instanceof Uint8Array) {
        if (params.length > 0) {
          writer.buf(params, params.length);
        }
      } else {
        const size = params.size();
        if (size > 0) {
          writer.buf(params.uint8, size);
        }
      }
    }
  }

  public writeAcceptedReply(
    xid: number,
    verf: RpcOpaqueAuth,
    acceptStat: number,
    mismatchInfo?: {low: number; high: number},
    results?: Reader | Uint8Array,
  ): void {
    const writer = this.writer;
    writer.u32(xid);
    writer.u32(RpcMsgType.REPLY);
    writer.u32(RpcReplyStat.MSG_ACCEPTED);
    this.writeOpaqueAuth(verf);
    writer.u32(acceptStat);
    if (mismatchInfo) {
      writer.u32(mismatchInfo.low);
      writer.u32(mismatchInfo.high);
    }
    if (results) {
      if (results instanceof Uint8Array) {
        if (results.length > 0) {
          writer.buf(results, results.length);
        }
      } else {
        const size = results.size();
        if (size > 0) {
          writer.buf(results.uint8, size);
        }
      }
    }
  }

  public writeRejectedReply(
    xid: number,
    rejectStat: number,
    mismatchInfo?: {low: number; high: number},
    authStat?: number,
  ): void {
    const writer = this.writer;
    writer.u32(xid);
    writer.u32(RpcMsgType.REPLY);
    writer.u32(RpcReplyStat.MSG_DENIED);
    writer.u32(rejectStat);
    if (mismatchInfo) {
      writer.u32(mismatchInfo.low);
      writer.u32(mismatchInfo.high);
    }
    if (authStat !== undefined) {
      writer.u32(authStat);
    }
  }

  private writeOpaqueAuth(auth: RpcOpaqueAuth): void {
    const writer = this.writer;
    writer.u32(auth.flavor);
    const length = auth.body.length;
    if (length > 400) throw new RpcEncodingError('Auth body too large');
    writer.u32(length);
    if (length > 0) {
      writer.buf(auth.body, length);
      const padding = (4 - (length % 4)) % 4;
      for (let i = 0; i < padding; i++) {
        writer.u8(0);
      }
    }
  }
}

import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';
import {RpcMsgType, RpcReplyStat, RPC_VERSION} from './constants';
import {RpcEncodingError} from './errors';
import {RpcOpaqueAuth, RpcCallBody, RpcAcceptedReply, RpcRejectedReply, RpcMessage} from './messages';

export class RpcMessageEncoder<W extends IWriter & IWriterGrowable = IWriter & IWriterGrowable> {
  constructor(public readonly writer: W = new Writer() as any) {}

  public encodeCall(
    xid: number,
    prog: number,
    vers: number,
    proc: number,
    cred: RpcOpaqueAuth,
    verf: RpcOpaqueAuth,
    params?: Uint8Array,
  ): Uint8Array {
    this.writeCall(xid, prog, vers, proc, cred, verf, params);
    return this.writer.flush();
  }

  public encodeAcceptedReply(
    xid: number,
    verf: RpcOpaqueAuth,
    acceptStat: number,
    mismatchInfo?: {low: number; high: number},
    results?: Uint8Array,
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
    const writer = this.writer;
    writer.u32(msg.xid);
    const body = msg.body;
    if (body instanceof RpcCallBody) {
      writer.u32(RpcMsgType.CALL);
      this.writeCallBody(body);
    } else if (body instanceof RpcAcceptedReply) {
      writer.u32(RpcMsgType.REPLY);
      writer.u32(RpcReplyStat.MSG_ACCEPTED);
      this.writeAcceptedReplyBody(body.verf, body.stat, body.mismatchInfo, body.results);
    } else if (body instanceof RpcRejectedReply) {
      writer.u32(RpcMsgType.REPLY);
      writer.u32(RpcReplyStat.MSG_DENIED);
      this.writeRejectedReplyBody(body.stat, body.mismatchInfo, body.authStat);
    }
  }

  public writeCall(
    xid: number,
    prog: number,
    vers: number,
    proc: number,
    cred: RpcOpaqueAuth,
    verf: RpcOpaqueAuth,
    params?: Uint8Array,
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
    if (params && params.length > 0) {
      writer.buf(params, params.length);
    }
  }

  private writeCallBody(body: RpcCallBody): void {
    const writer = this.writer;
    writer.u32(body.rpcvers);
    writer.u32(body.prog);
    writer.u32(body.vers);
    writer.u32(body.proc);
    this.writeOpaqueAuth(body.cred);
    this.writeOpaqueAuth(body.verf);
  }

  public writeAcceptedReply(
    xid: number,
    verf: RpcOpaqueAuth,
    acceptStat: number,
    mismatchInfo?: {low: number; high: number},
    results?: Uint8Array,
  ): void {
    const writer = this.writer;
    writer.u32(xid);
    writer.u32(RpcMsgType.REPLY);
    writer.u32(RpcReplyStat.MSG_ACCEPTED);
    this.writeAcceptedReplyBody(verf, acceptStat, mismatchInfo, results);
  }

  private writeAcceptedReplyBody(
    verf: RpcOpaqueAuth,
    acceptStat: number,
    mismatchInfo?: {low: number; high: number},
    results?: Uint8Array,
  ): void {
    const writer = this.writer;
    this.writeOpaqueAuth(verf);
    writer.u32(acceptStat);
    if (mismatchInfo) {
      writer.u32(mismatchInfo.low);
      writer.u32(mismatchInfo.high);
    }
    if (results && results.length > 0) {
      writer.buf(results, results.length);
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
    this.writeRejectedReplyBody(rejectStat, mismatchInfo, authStat);
  }

  private writeRejectedReplyBody(
    rejectStat: number,
    mismatchInfo?: {low: number; high: number},
    authStat?: number,
  ): void {
    const writer = this.writer;
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

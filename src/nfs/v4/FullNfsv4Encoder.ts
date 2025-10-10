import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {Nfsv4Encoder} from './Nfsv4Encoder';
import {RpcMessageEncoder} from '../../rpc/RpcMessageEncoder';
import {RmRecordEncoder} from '../../rm/RmRecordEncoder';
import {Nfsv4Proc, Nfsv4CbProc, Nfsv4Const} from './constants';
import {RpcOpaqueAuth} from '../../rpc/messages';
import {RpcAcceptStat} from '../../rpc/constants';
import type * as msg from './messages';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';

export class FullNfsv4Encoder<W extends IWriter & IWriterGrowable = IWriter & IWriterGrowable> {
  protected readonly nfsEncoder: Nfsv4Encoder<W>;
  protected readonly rpcEncoder: RpcMessageEncoder<W>;
  protected readonly rmEncoder: RmRecordEncoder<W>;

  constructor(
    public program: number = Nfsv4Const.PROGRAM,
    public readonly writer: W = new Writer() as any,
  ) {
    this.nfsEncoder = new Nfsv4Encoder(writer);
    this.rpcEncoder = new RpcMessageEncoder(writer);
    this.rmEncoder = new RmRecordEncoder(writer);
  }

  public encodeCall(
    xid: number,
    proc: Nfsv4Proc,
    cred: RpcOpaqueAuth,
    verf: RpcOpaqueAuth,
    request: msg.Nfsv4CompoundRequest,
  ): Uint8Array {
    this.writeCall(xid, proc, cred, verf, request);
    return this.writer.flush();
  }

  public writeCall(
    xid: number,
    proc: Nfsv4Proc,
    cred: RpcOpaqueAuth,
    verf: RpcOpaqueAuth,
    request: msg.Nfsv4CompoundRequest,
  ): void {
    const rm = this.rmEncoder;
    const state = rm.startRmRecord();
    this.rpcEncoder.writeCall(xid, Nfsv4Const.PROGRAM, Nfsv4Const.VERSION, proc, cred, verf);
    this.nfsEncoder.writeCompound(request, true);
    rm.endRmRecord(state);
  }

  public encodeAcceptedReply(
    xid: number,
    proc: Nfsv4Proc,
    verf: RpcOpaqueAuth,
    response: msg.Nfsv4CompoundResponse,
  ): Uint8Array {
    this.writeAcceptedReply(xid, proc, verf, response);
    return this.writer.flush();
  }

  public writeAcceptedReply(
    xid: number,
    proc: Nfsv4Proc,
    verf: RpcOpaqueAuth,
    response: msg.Nfsv4CompoundResponse,
  ): void {
    const rm = this.rmEncoder;
    const state = rm.startRmRecord();
    this.rpcEncoder.writeAcceptedReply(xid, verf, RpcAcceptStat.SUCCESS);
    this.nfsEncoder.writeCompound(response, false);
    rm.endRmRecord(state);
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

  public writeRejectedReply(
    xid: number,
    rejectStat: number,
    mismatchInfo?: {low: number; high: number},
    authStat?: number,
  ): void {
    const rm = this.rmEncoder;
    const state = rm.startRmRecord();
    this.rpcEncoder.writeRejectedReply(xid, rejectStat, mismatchInfo, authStat);
    rm.endRmRecord(state);
  }

  public encodeCbCall(
    xid: number,
    cbProgram: number,
    proc: Nfsv4CbProc,
    cred: RpcOpaqueAuth,
    verf: RpcOpaqueAuth,
    request: msg.Nfsv4CbCompoundRequest,
  ): Uint8Array {
    this.writeCbCall(xid, cbProgram, proc, cred, verf, request);
    return this.writer.flush();
  }

  public writeCbCall(
    xid: number,
    cbProgram: number,
    proc: Nfsv4CbProc,
    cred: RpcOpaqueAuth,
    verf: RpcOpaqueAuth,
    request: msg.Nfsv4CbCompoundRequest,
  ): void {
    const rm = this.rmEncoder;
    const state = rm.startRmRecord();
    this.rpcEncoder.writeCall(xid, cbProgram, Nfsv4Const.VERSION, proc, cred, verf);
    this.nfsEncoder.writeCbCompound(request, true);
    rm.endRmRecord(state);
  }

  public encodeCbAcceptedReply(
    xid: number,
    proc: Nfsv4CbProc,
    verf: RpcOpaqueAuth,
    response: msg.Nfsv4CbCompoundResponse,
  ): Uint8Array {
    this.writeCbAcceptedReply(xid, proc, verf, response);
    return this.writer.flush();
  }

  public writeCbAcceptedReply(
    xid: number,
    proc: Nfsv4CbProc,
    verf: RpcOpaqueAuth,
    response: msg.Nfsv4CbCompoundResponse,
  ): void {
    const rm = this.rmEncoder;
    const state = rm.startRmRecord();
    this.rpcEncoder.writeAcceptedReply(xid, verf, RpcAcceptStat.SUCCESS);
    this.nfsEncoder.writeCbCompound(response, false);
    rm.endRmRecord(state);
  }
}

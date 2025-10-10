import {Reader} from '@jsonjoy.com/buffers/lib/Reader';
import {Nfsv4Decoder} from './Nfsv4Decoder';
import {FullNfsv4Encoder} from './FullNfsv4Encoder';
import {RmRecordDecoder, RmRecordEncoder} from '../../rm';
import {RpcAcceptStat, RpcAuthFlavor, RpcCallMessage, RpcMessage, RpcMessageDecoder, RpcMessageEncoder, RpcOpaqueAuth} from '../../rpc';
import {EMPTY_READER, Nfsv4Proc} from './constants';
import {Nfsv4CompoundRequest} from './messages';
import {getOpNameFromRequest} from './util';
import type {Duplex} from 'node:stream';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/buffers/lib/types';

export interface Nfsv4ConnectionOpts {
  /**
   * Normally this is a TCP socket, but any Duplex stream will do.
   */
  duplex: Duplex;
  encoder?: FullNfsv4Encoder;
  decoder?: Nfsv4Decoder;
  debug?: boolean;
  logger?: Pick<typeof console, 'log' | 'error'>;
}

export class Nfsv4Connection {
  public closed = false;
  public maxIncomingMessage: number = 2 * 1024 * 1024;
  public maxBackpressure: number = 2 * 1024 * 1024;

  /** Last known RPC transaction ID. Used to emit fatal connection errors. */
  protected lastXid = 0;

  public readonly duplex: Duplex;

  protected readonly rmDecoder: RmRecordDecoder;
  protected readonly rpcDecoder: RpcMessageDecoder;
  protected readonly nfsDecoder: Nfsv4Decoder;
  protected readonly writer: IWriter & IWriterGrowable;
  protected readonly rmEncoder: RmRecordEncoder;
  protected readonly rpcEncoder: RpcMessageEncoder;
  protected readonly nfsEncoder: FullNfsv4Encoder;

  public debug: boolean;
  public logger: Pick<typeof console, 'log' | 'error'>;

  constructor(opts: Nfsv4ConnectionOpts) {
    this.debug = !!opts.debug;
    this.logger = opts.logger || console;
    const duplex = this.duplex = opts.duplex;
    this.rmDecoder = new RmRecordDecoder();
    this.rpcDecoder = new RpcMessageDecoder();
    this.nfsDecoder = new Nfsv4Decoder();
    const nfsEncoder = this.nfsEncoder = new FullNfsv4Encoder();
    this.writer = nfsEncoder.writer;
    this.rmEncoder = nfsEncoder.rmEncoder;
    this.rpcEncoder = nfsEncoder.rpcEncoder;
    duplex.on('data', this.onData.bind(this));
    duplex.on('timeout', () => this.close());
    duplex.on('close', (hadError: boolean): void => {
      this.close();
    });
    duplex.on('error', (err: Error) => {
      this.logger.error('SOCKET ERROR:', err);
      this.close();
    });
  }

  protected onData(data: Uint8Array): void {
    const {rmDecoder, rpcDecoder} = this;
    rmDecoder.push(data);
    let record = rmDecoder.readRecord();
    while (record) {
      if (record.size()) {
        const rpcMessage = rpcDecoder.decodeMessage(record);
        if (rpcMessage) this.onRpcMessage(rpcMessage);
        else {
          this.close();
          return;
        }
      }
      record = rmDecoder.readRecord();
    }
  }

  protected onRpcMessage(msg: RpcMessage): void {
    const debug = this.debug;
    if (msg instanceof RpcCallMessage) {
      const proc = msg.proc;
      switch (proc) {
        case Nfsv4Proc.NULL: {
          if (debug) this.logger.log('NULL procedure');
          const rmEncoder = this.rmEncoder;
          const state = rmEncoder.startRmRecord();
          this.rpcEncoder.writeAcceptedReply(
            msg.xid,
            new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NONE, EMPTY_READER),
            RpcAcceptStat.SUCCESS,
          );
          rmEncoder.endRmRecord(state);
          this.write(this.writer.flush());
          return;
        }
        case Nfsv4Proc.COMPOUND: {
          if (!(msg.params instanceof Reader)) return;
          const compound = this.nfsDecoder.decodeCompoundRequest(msg.params);
          if (compound instanceof Nfsv4CompoundRequest) {
            console.log('\nNFS COMPOUND Request:');
            console.log(`  Tag: "${compound.tag}"`);
            console.log(`  Minor Version: ${compound.minorversion}`);
            console.log(`  Operations (${compound.argarray.length}):`);
            compound.argarray.forEach((op: any, idx: number) => {
              console.log(`    [${idx}] ${getOpNameFromRequest(op)}`);
              console.log(`        ${JSON.stringify(op, null, 2).split('\n').slice(1).join('\n        ')}`);
            });
          } else {
            console.log('Could not decode COMPOUND request');
          }
          return;
        }
        default: {
          console.log(`Unknown procedure: ${proc}`);
        }
      }
    }
    throw new Error('Not implemented non-RPCCallMessage');
  }

  private closeWithError(error: RpcAcceptStat.PROG_UNAVAIL | RpcAcceptStat.PROC_UNAVAIL | RpcAcceptStat.GARBAGE_ARGS | RpcAcceptStat.SYSTEM_ERR): void {
    const xid = this.lastXid;
    if (xid) {
      const state = this.rmEncoder.startRmRecord();
      const verify = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NONE, EMPTY_READER);
      this.rpcEncoder.writeAcceptedReply(xid, verify, error);
      this.rmEncoder.endRmRecord(state);
      const bin = this.writer.flush();
      this.duplex.write(bin);
    }
    this.close();
  }

  private close(): void {
    if (this.closed) return;
    this.closed = true;
    clearImmediate(this.__uncorkTimer);
    this.__uncorkTimer = null;
    const duplex = this.duplex;
    duplex.removeAllListeners();
    if (!duplex.destroyed) duplex.destroy();
  }

  // ---------------------------------------------------------- Write to socket

  private __uncorkTimer: any = null;

  public write(buf: Uint8Array): void {
    if (this.closed) return;
    const duplex = this.duplex;
    if (duplex.writableLength > this.maxBackpressure) {
      this.closeWithError(RpcAcceptStat.SYSTEM_ERR);
      return;
    }
    const __uncorkTimer = this.__uncorkTimer;
    if (!__uncorkTimer) duplex.cork();
    duplex.write(buf);
    if (!__uncorkTimer) this.__uncorkTimer = setImmediate(() => {
      this.__uncorkTimer = null;
      duplex.uncork();
    });
  }

  // ------------------------------------------------- Write WebSocket messages

  // TODO: Execute NFS Callback...
  public send(): void {
    
  }
}

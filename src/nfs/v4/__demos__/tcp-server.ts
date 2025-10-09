import * as net from 'net';
import {RmRecordDecoder, RmRecordEncoder} from '../../../rm';
import {
  RpcMessageDecoder,
  RpcCallMessage,
  RpcAcceptStat,
  RpcMessageEncoder,
  RpcOpaqueAuth,
  RpcAuthFlavor,
} from '../../../rpc';
import {Nfsv4Decoder} from '../Nfsv4Decoder';
import * as msg from '../messages';
import {Reader} from '@jsonjoy.com/buffers/lib/Reader';

/* tslint:disable:no-console */

const PORT = Number(process.env.PORT) || 2049;
const HOST = '127.0.0.1';

const toHex = (buffer: Uint8Array | Buffer): string => {
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const getProcName = (proc: number): string => {
  const names: Record<number, string> = {
    0: 'NULL',
    1: 'COMPOUND',
  };
  return names[proc] || `UNKNOWN(${proc})`;
};

const getOpName = (op: any): string => {
  if (op instanceof msg.Nfsv4AccessRequest) return 'ACCESS';
  if (op instanceof msg.Nfsv4CloseRequest) return 'CLOSE';
  if (op instanceof msg.Nfsv4CommitRequest) return 'COMMIT';
  if (op instanceof msg.Nfsv4CreateRequest) return 'CREATE';
  if (op instanceof msg.Nfsv4DelegpurgeRequest) return 'DELEGPURGE';
  if (op instanceof msg.Nfsv4DelegreturnRequest) return 'DELEGRETURN';
  if (op instanceof msg.Nfsv4GetattrRequest) return 'GETATTR';
  if (op instanceof msg.Nfsv4GetfhRequest) return 'GETFH';
  if (op instanceof msg.Nfsv4LinkRequest) return 'LINK';
  if (op instanceof msg.Nfsv4LockRequest) return 'LOCK';
  if (op instanceof msg.Nfsv4LocktRequest) return 'LOCKT';
  if (op instanceof msg.Nfsv4LockuRequest) return 'LOCKU';
  if (op instanceof msg.Nfsv4LookupRequest) return 'LOOKUP';
  if (op instanceof msg.Nfsv4LookuppRequest) return 'LOOKUPP';
  if (op instanceof msg.Nfsv4NverifyRequest) return 'NVERIFY';
  if (op instanceof msg.Nfsv4OpenRequest) return 'OPEN';
  if (op instanceof msg.Nfsv4OpenattrRequest) return 'OPENATTR';
  if (op instanceof msg.Nfsv4OpenConfirmRequest) return 'OPEN_CONFIRM';
  if (op instanceof msg.Nfsv4OpenDowngradeRequest) return 'OPEN_DOWNGRADE';
  if (op instanceof msg.Nfsv4PutfhRequest) return 'PUTFH';
  if (op instanceof msg.Nfsv4PutpubfhRequest) return 'PUTPUBFH';
  if (op instanceof msg.Nfsv4PutrootfhRequest) return 'PUTROOTFH';
  if (op instanceof msg.Nfsv4ReadRequest) return 'READ';
  if (op instanceof msg.Nfsv4ReaddirRequest) return 'READDIR';
  if (op instanceof msg.Nfsv4ReadlinkRequest) return 'READLINK';
  if (op instanceof msg.Nfsv4RemoveRequest) return 'REMOVE';
  if (op instanceof msg.Nfsv4RenameRequest) return 'RENAME';
  if (op instanceof msg.Nfsv4RenewRequest) return 'RENEW';
  if (op instanceof msg.Nfsv4RestorefhRequest) return 'RESTOREFH';
  if (op instanceof msg.Nfsv4SavefhRequest) return 'SAVEFH';
  if (op instanceof msg.Nfsv4SecinfoRequest) return 'SECINFO';
  if (op instanceof msg.Nfsv4SetattrRequest) return 'SETATTR';
  if (op instanceof msg.Nfsv4SetclientidRequest) return 'SETCLIENTID';
  if (op instanceof msg.Nfsv4SetclientidConfirmRequest) return 'SETCLIENTID_CONFIRM';
  if (op instanceof msg.Nfsv4VerifyRequest) return 'VERIFY';
  if (op instanceof msg.Nfsv4WriteRequest) return 'WRITE';
  if (op instanceof msg.Nfsv4ReleaseLockOwnerRequest) return 'RELEASE_LOCKOWNER';
  if (op instanceof msg.Nfsv4IllegalRequest) return 'ILLEGAL';
  return 'UNKNOWN';
};

const server = net.createServer((socket) => {
  console.log(`[${new Date().toISOString()}] Client connected from ${socket.remoteAddress}:${socket.remotePort}`);
  const rmDecoder = new RmRecordDecoder();
  const rpcDecoder = new RpcMessageDecoder();
  const nfsDecoder = new Nfsv4Decoder();
  const rmEncoder = new RmRecordEncoder();
  const rpcEncoder = new RpcMessageEncoder();
  socket.on('data', (data) => {
    console.log('\n' + '='.repeat(80));
    console.log(`[${new Date().toISOString()}] Received ${data.length} bytes`);
    console.log('HEX:', toHex(data));
    console.log('-'.repeat(80));
    const uint8Data = new Uint8Array(data);
    rmDecoder.push(uint8Data);
    let record = rmDecoder.readRecord();
    while (record) {
      console.log(`\nRPC Record (${record.size()} bytes):`);
      console.log('HEX:', toHex(record.subarray()));
      const rpcMessage = rpcDecoder.decodeMessage(record);
      if (rpcMessage) {
        console.log('\nRPC Message:');
        console.log(rpcMessage);
        if (rpcMessage instanceof RpcCallMessage) {
          const proc = rpcMessage.proc;
          console.log(`\nNFS Procedure: ${getProcName(proc)}`);

          if (proc === 1 && rpcMessage.params) {
            const compound = nfsDecoder.decodeCompound(rpcMessage.params, true);
            if (compound && 'argarray' in compound) {
              console.log('\nNFS COMPOUND Request:');
              console.log(`  Tag: "${compound.tag}"`);
              console.log(`  Minor Version: ${compound.minorversion}`);
              console.log(`  Operations (${compound.argarray.length}):`);
              compound.argarray.forEach((op: any, idx: number) => {
                console.log(`    [${idx}] ${getOpName(op)}`);
                console.log(`        ${JSON.stringify(op, null, 2).split('\n').slice(1).join('\n        ')}`);
              });
            } else {
              console.log('Could not decode COMPOUND request');
            }
          } else if (proc === 0) {
            console.log('NULL procedure (no parameters)');
            const rpcReplyU8 = rpcEncoder.encodeAcceptedReply(
              rpcMessage.xid,
              new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NONE, new Reader(new Uint8Array(0))),
              RpcAcceptStat.SUCCESS,
            );
            const recordU8 = rmEncoder.encodeRecord(rpcReplyU8);
            console.log('\nSending RPC Accepted Reply for NULL:');
            console.log(`HEX: ${toHex(recordU8)}`);
            socket.write(recordU8);
          } else {
            console.log(`Unknown procedure: ${proc}`);
          }
        }
      } else {
        console.log('Could not decode RPC message');
      }
      record = rmDecoder.readRecord();
    }
    console.log('='.repeat(80) + '\n');
  });
  socket.on('end', () => {
    console.log(`[${new Date().toISOString()}] Client disconnected`);
  });
  socket.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Socket error:`, err.message);
  });
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`NFSv4 TCP Server listening on ${HOST}:${PORT}`);
  console.log('Waiting for connections...\n');
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

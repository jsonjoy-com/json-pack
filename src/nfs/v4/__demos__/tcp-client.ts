import * as net from 'net';
import {Reader} from '@jsonjoy.com/buffers/lib/Reader';
import {FullNfsv4Encoder} from '../FullNfsv4Encoder';
import {Nfsv4CompoundRequest, Nfsv4PutfhRequest, Nfsv4LookupRequest, Nfsv4GetfhRequest} from '../messages';
import {Nfsv4Fh} from '../structs';
import {Nfsv4Proc} from '../constants';

/* tslint:disable:no-console */

const PORT = Number(process.env.NFS_PORT) || Number(process.env.PORT) || 2049;
const HOST = process.env.NFS_HOST
  ? String(process.env.NFS_HOST)
  : process.env.HOST ? String(process.env.HOST) : '127.0.0.1';

const createTestCompoundRequest = (): Nfsv4CompoundRequest => {
  const fhData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const fh = new Nfsv4Fh(fhData);
  const putfh = new Nfsv4PutfhRequest(fh);
  const lookup = new Nfsv4LookupRequest('testfile.txt');
  const getfh = new Nfsv4GetfhRequest();
  return new Nfsv4CompoundRequest('nfs4_client', 0, [putfh, lookup, getfh]);
};

const createTestCred = () => {
  return {
    flavor: 0,
    body: new Reader(new Uint8Array()),
  };
};

const createTestVerf = () => {
  return {
    flavor: 0,
    body: new Reader(new Uint8Array()),
  };
};

console.log('Connecting to NFSv4 server...');

const client = net.connect({port: PORT, host: HOST}, () => {
  console.log(`Connected to ${HOST}:${PORT}`);
  console.log('Sending COMPOUND request (PUTFH + LOOKUP + GETFH)...\n');
  const encoder = new FullNfsv4Encoder();
  const request = createTestCompoundRequest();
  const xid = 0x1b8b45f2;
  const proc = Nfsv4Proc.COMPOUND;
  const cred = createTestCred();
  const verf = createTestVerf();
  const encoded = encoder.encodeCall(xid, proc, cred, verf, request);
  console.log(`Sending ${encoded.length} bytes`);
  console.log(
    'HEX:',
    Array.from(encoded)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' '),
  );
  console.log('');
  client.write(encoded);
  setTimeout(() => {
    console.log('Closing connection...');
    client.end();
  }, 100);
});

client.on('data', (data) => {
  console.log('Received response:', data.length, 'bytes');
  console.log('(This demo server does not send responses)');
});

client.on('end', () => {
  console.log('Connection closed');
  process.exit(0);
});

client.on('error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

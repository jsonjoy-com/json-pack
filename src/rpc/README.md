# RPC (Remote Procedure Call) Codec

This codec implements streaming encoder and decoder for (Sun Microsystems) RPC
protocol as described in RFC 1057.

## Note on Record Marking

This RPC codec handles only the RPC message encoding/decoding as specified in
RFC 1057. It does NOT include Record Marking (RM) which is used to frame
messages over byte streams like TCP.

For Record Marking support (as specified in RFC 1057 Section 10), use the
separate `rm` module. See `src/rm/README.md` for details.

## Usage

```typescript
import {RpcMessageEncoder, RpcMessageDecoder} from 'json-pack/rpc';
import {RmRecordEncoder, RmRecordDecoder} from 'json-pack/rm';

// Encoding an RPC message
const encoder = new RpcMessageEncoder();
const rpcMessage = encoder.encodeCall(xid, prog, vers, proc, cred, verf);

// For TCP transport, wrap with Record Marking
const rmEncoder = new RmRecordEncoder();
const framedMessage = rmEncoder.encodeRecord(rpcMessage);

// Decoding
const rmDecoder = new RmRecordDecoder();
const rpcDecoder = new RpcMessageDecoder();

// First extract the record from the byte stream (returns Reader)
rmDecoder.push(tcpData);
const record = rmDecoder.readRecord();

// Then decode the RPC message from the Reader
if (record) {
  const message = rpcDecoder.decodeMessage(record);
}
```

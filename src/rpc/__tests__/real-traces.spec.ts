import { RmRecordDecoder } from "../../rm";
import { RpcMessage } from "../messages";
import { RpcMessageDecoder } from "../RpcMessageDecoder";

const rmDecoder = new RmRecordDecoder();
const rpcDecoder = new RpcMessageDecoder();

const decode = (hex: string): RpcMessage | undefined => {
  const msg = Buffer.from(hex, 'hex');
  const u8 = new Uint8Array(msg);
  rmDecoder.push(u8);
  const record = rmDecoder.readRecord();
  if (record) {
    return rpcDecoder.decodeMessage(record);
  }
  return undefined;
};

test('RPC Call', () => {
  const hex = '80000090eb8a42cb0000000000000002000186a30000000300000003000000010000003c00490e680000001d455042594d494e573039333554312e6d696e736b2e6570616d2e636f6d000000000001f40000000a000000020000000a000001f400000000000000000000001c9725bb51046621880c000000a68c020078286c3e00000000000000000000000568656c6c6f000000';
  const msg = decode(hex)!;
  expect(msg.xid).toBe(0xeb8a42cb);
  console.log(msg);
});
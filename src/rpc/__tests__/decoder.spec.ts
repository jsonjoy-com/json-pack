import {RpcMessageDecoder} from '../RpcMessageDecoder';
import {RpcMsgType, RpcAuthFlavor, RpcAcceptStat, RpcRejectStat, RpcAuthStat, RPC_VERSION} from '../constants';
import {RpcCallBody, RpcAcceptedReply, RpcRejectedReply, RpcOpaqueAuth} from '../messages';

describe('RpcMessageDecoder', () => {
  describe('CALL messages', () => {
    test('can decode a simple CALL message with AUTH_NULL', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x01, // xid = 1
        0x00,
        0x00,
        0x00,
        0x00, // msg_type = CALL
        0x00,
        0x00,
        0x00,
        0x02, // rpcvers = 2
        0x00,
        0x00,
        0x01,
        0x86, // prog = 390 (NFS)
        0x00,
        0x00,
        0x00,
        0x02, // vers = 2
        0x00,
        0x00,
        0x00,
        0x00, // proc = 0 (NULL)
        0x00,
        0x00,
        0x00,
        0x00, // cred.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // cred.length = 0
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
      expect(msg.body).toBeInstanceOf(RpcCallBody);
      const call = msg.body as RpcCallBody;
      expect(call.rpcvers).toBe(RPC_VERSION);
      expect(call.prog).toBe(390);
      expect(call.vers).toBe(2);
      expect(call.proc).toBe(0);
      expect(call.cred.flavor).toBe(RpcAuthFlavor.AUTH_NULL);
      expect(call.cred.body.length).toBe(0);
      expect(call.verf.flavor).toBe(RpcAuthFlavor.AUTH_NULL);
      expect(call.verf.body.length).toBe(0);
    });

    test('can decode CALL message with opaque auth data', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x0a, // xid = 10
        0x00,
        0x00,
        0x00,
        0x00, // msg_type = CALL
        0x00,
        0x00,
        0x00,
        0x02, // rpcvers = 2
        0x00,
        0x00,
        0x00,
        0x64, // prog = 100
        0x00,
        0x00,
        0x00,
        0x01, // vers = 1
        0x00,
        0x00,
        0x00,
        0x01, // proc = 1
        0x00,
        0x00,
        0x00,
        0x01, // cred.flavor = AUTH_UNIX
        0x00,
        0x00,
        0x00,
        0x05, // cred.length = 5
        0x01,
        0x02,
        0x03,
        0x04,
        0x05, // cred.body
        0x00,
        0x00,
        0x00, // padding (3 bytes)
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(10);
      const call = msg.body as RpcCallBody;
      expect(call.cred.flavor).toBe(RpcAuthFlavor.AUTH_UNIX);
      expect(call.cred.body).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));
    });

    test('returns undefined when not enough data', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x01, // xid = 1
        0x00,
        0x00,
        0x00,
        0x00, // msg_type = CALL
        0x00,
        0x00,
        0x00,
        0x02, // rpcvers = 2
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage();
      expect(msg).toBeUndefined();
    });

    test('can decode message in chunks', () => {
      const decoder = new RpcMessageDecoder();
      const chunk1 = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x01, // xid = 1
        0x00,
        0x00,
        0x00,
        0x00, // msg_type = CALL
        0x00,
        0x00,
        0x00,
        0x02, // rpcvers = 2
        0x00,
        0x00,
        0x01,
        0x86, // prog = 390
      ]);
      const chunk2 = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x02, // vers = 2
        0x00,
        0x00,
        0x00,
        0x00, // proc = 0
        0x00,
        0x00,
        0x00,
        0x00, // cred.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // cred.length = 0
      ]);
      const chunk3 = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
      ]);
      decoder.push(chunk1);
      expect(decoder.readMessage()).toBeUndefined();
      decoder.push(chunk2);
      expect(decoder.readMessage()).toBeUndefined();
      decoder.push(chunk3);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
    });
  });

  describe('REPLY messages - MSG_ACCEPTED', () => {
    test('can decode SUCCESS reply', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x01, // xid = 1
        0x00,
        0x00,
        0x00,
        0x01, // msg_type = REPLY
        0x00,
        0x00,
        0x00,
        0x00, // reply_stat = MSG_ACCEPTED
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
        0x00,
        0x00,
        0x00,
        0x00, // accept_stat = SUCCESS
        0x00,
        0x00,
        0x00,
        0x2a, // results (example: 42)
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
      expect(msg.body).toBeInstanceOf(RpcAcceptedReply);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.SUCCESS);
      expect(reply.results).toBeDefined();
      expect(reply.results!.length).toBe(4);
    });

    test('can decode PROG_UNAVAIL reply', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x02, // xid = 2
        0x00,
        0x00,
        0x00,
        0x01, // msg_type = REPLY
        0x00,
        0x00,
        0x00,
        0x00, // reply_stat = MSG_ACCEPTED
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
        0x00,
        0x00,
        0x00,
        0x01, // accept_stat = PROG_UNAVAIL
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(2);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.PROG_UNAVAIL);
    });

    test('can decode PROG_MISMATCH reply', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x03, // xid = 3
        0x00,
        0x00,
        0x00,
        0x01, // msg_type = REPLY
        0x00,
        0x00,
        0x00,
        0x00, // reply_stat = MSG_ACCEPTED
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
        0x00,
        0x00,
        0x00,
        0x02, // accept_stat = PROG_MISMATCH
        0x00,
        0x00,
        0x00,
        0x01, // low = 1
        0x00,
        0x00,
        0x00,
        0x03, // high = 3
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(3);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.PROG_MISMATCH);
      expect(reply.mismatchInfo).toBeDefined();
      expect(reply.mismatchInfo!.low).toBe(1);
      expect(reply.mismatchInfo!.high).toBe(3);
    });

    test('can decode PROC_UNAVAIL reply', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x04, // xid = 4
        0x00,
        0x00,
        0x00,
        0x01, // msg_type = REPLY
        0x00,
        0x00,
        0x00,
        0x00, // reply_stat = MSG_ACCEPTED
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
        0x00,
        0x00,
        0x00,
        0x03, // accept_stat = PROC_UNAVAIL
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(4);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.PROC_UNAVAIL);
    });

    test('can decode GARBAGE_ARGS reply', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x05, // xid = 5
        0x00,
        0x00,
        0x00,
        0x01, // msg_type = REPLY
        0x00,
        0x00,
        0x00,
        0x00, // reply_stat = MSG_ACCEPTED
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
        0x00,
        0x00,
        0x00,
        0x04, // accept_stat = GARBAGE_ARGS
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(5);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.GARBAGE_ARGS);
    });
  });

  describe('REPLY messages - MSG_DENIED', () => {
    test('can decode RPC_MISMATCH reply', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x06, // xid = 6
        0x00,
        0x00,
        0x00,
        0x01, // msg_type = REPLY
        0x00,
        0x00,
        0x00,
        0x01, // reply_stat = MSG_DENIED
        0x00,
        0x00,
        0x00,
        0x00, // reject_stat = RPC_MISMATCH
        0x00,
        0x00,
        0x00,
        0x02, // low = 2
        0x00,
        0x00,
        0x00,
        0x02, // high = 2
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(6);
      expect(msg.body).toBeInstanceOf(RpcRejectedReply);
      const reply = msg.body as RpcRejectedReply;
      expect(reply.stat).toBe(RpcRejectStat.RPC_MISMATCH);
      expect(reply.mismatchInfo).toBeDefined();
      expect(reply.mismatchInfo!.low).toBe(2);
      expect(reply.mismatchInfo!.high).toBe(2);
    });

    test('can decode AUTH_ERROR reply', () => {
      const decoder = new RpcMessageDecoder();
      const buf = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x07, // xid = 7
        0x00,
        0x00,
        0x00,
        0x01, // msg_type = REPLY
        0x00,
        0x00,
        0x00,
        0x01, // reply_stat = MSG_DENIED
        0x00,
        0x00,
        0x00,
        0x01, // reject_stat = AUTH_ERROR
        0x00,
        0x00,
        0x00,
        0x01, // auth_stat = AUTH_BADCRED
      ]);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(7);
      const reply = msg.body as RpcRejectedReply;
      expect(reply.stat).toBe(RpcRejectStat.AUTH_ERROR);
      expect(reply.authStat).toBe(RpcAuthStat.AUTH_BADCRED);
    });
  });

  describe('multiple messages', () => {
    test('can decode multiple messages from stream', () => {
      const decoder = new RpcMessageDecoder();
      const msg1 = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x01, // xid = 1
        0x00,
        0x00,
        0x00,
        0x00, // msg_type = CALL
        0x00,
        0x00,
        0x00,
        0x02, // rpcvers = 2
        0x00,
        0x00,
        0x00,
        0x64, // prog = 100
        0x00,
        0x00,
        0x00,
        0x01, // vers = 1
        0x00,
        0x00,
        0x00,
        0x00, // proc = 0
        0x00,
        0x00,
        0x00,
        0x00, // cred.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // cred.length = 0
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
      ]);
      const msg2 = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x02, // xid = 2
        0x00,
        0x00,
        0x00,
        0x00, // msg_type = CALL
        0x00,
        0x00,
        0x00,
        0x02, // rpcvers = 2
        0x00,
        0x00,
        0x00,
        0xc8, // prog = 200
        0x00,
        0x00,
        0x00,
        0x01, // vers = 1
        0x00,
        0x00,
        0x00,
        0x01, // proc = 1
        0x00,
        0x00,
        0x00,
        0x00, // cred.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // cred.length = 0
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
      ]);
      const combined = new Uint8Array([...msg1, ...msg2]);
      decoder.push(combined);
      const message1 = decoder.readMessage()!;
      expect(message1).toBeDefined();
      expect(message1.xid).toBe(1);
      expect((message1.body as RpcCallBody).prog).toBe(100);
      const message2 = decoder.readMessage()!;
      expect(message2).toBeDefined();
      expect(message2.xid).toBe(2);
      expect((message2.body as RpcCallBody).prog).toBe(200);
      expect(decoder.readMessage()).toBeUndefined();
    });
  });
});

import {RpcMessageDecoder} from '../RpcMessageDecoder';
import {RpcAuthFlavor, RpcAcceptStat, RpcRejectStat, RpcAuthStat, RPC_VERSION} from '../constants';
import {RpcCallBody, RpcAcceptedReply, RpcRejectedReply} from '../messages';

describe('RpcMessageDecoder', () => {
  describe('CALL messages', () => {
    test('can decode a simple CALL message with AUTH_NULL', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
      decoder.push(payload);
      const msg = decoder.decodeMessage()!
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
      const payload = new Uint8Array([
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
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(10);
      const call = msg.body as RpcCallBody;
      expect(call.cred.flavor).toBe(RpcAuthFlavor.AUTH_UNIX);
      expect(call.cred.body).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));
    });

    test('returns undefined when not enough data', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
      
      decoder.push(payload.slice(0, 10));
      const msg = decoder.decodeMessage();
      expect(msg).toBeUndefined();
    });

    test('can decode message in chunks', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
        0x00,
        0x00,
        0x00,
        0x00, // verf.flavor = AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf.length = 0
      ]);
      
      const chunk1 = payload.slice(0, 20);
      const chunk2 = payload.slice(20, 36);
      const chunk3 = payload.slice(36);
      decoder.push(chunk1);
      expect(decoder.decodeMessage()).toBeUndefined();
      decoder.push(chunk2);
      expect(decoder.decodeMessage()).toBeUndefined();
      decoder.push(chunk3);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
    });
  });

  describe('REPLY messages - MSG_ACCEPTED', () => {
    test('can decode SUCCESS reply', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
      expect(msg.body).toBeInstanceOf(RpcAcceptedReply);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.SUCCESS);
    });

    test('can decode PROG_UNAVAIL reply', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(2);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.PROG_UNAVAIL);
    });

    test('can decode PROG_MISMATCH reply', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
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
      const payload = new Uint8Array([
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
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(4);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.PROC_UNAVAIL);
    });

    test('can decode GARBAGE_ARGS reply', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(5);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.GARBAGE_ARGS);
    });
  });

  describe('REPLY messages - MSG_DENIED', () => {
    test('can decode RPC_MISMATCH reply', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
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
      const payload = new Uint8Array([
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
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
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
      const payload1 = new Uint8Array([
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
      const payload2 = new Uint8Array([
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
      decoder.push(payload1);
      const message1 = decoder.decodeMessage()!;
      expect(message1).toBeDefined();
      expect(message1.xid).toBe(1);
      expect((message1.body as RpcCallBody).prog).toBe(100);
      decoder.push(payload2);
      const message2 = decoder.decodeMessage()!;
      expect(message2).toBeDefined();
      expect(message2.xid).toBe(2);
      expect((message2.body as RpcCallBody).prog).toBe(200);
      expect(decoder.decodeMessage()).toBeUndefined();
    });
  });

  describe('Payload Handling', () => {
    test('can decode CALL with procedure parameters', () => {
      const decoder = new RpcMessageDecoder();
      const params = new Uint8Array([0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x45]);
      const payload = new Uint8Array([
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
        ...params,
      ]);
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
      const call = msg.body as RpcCallBody;
      expect(call.proc).toBe(1);
      expect(call.params).toBeDefined();
      expect(call.params).toEqual(params);
    });

    test('can decode SUCCESS reply with result data', () => {
      const decoder = new RpcMessageDecoder();
      const results = new Uint8Array([0x00, 0x00, 0x00, 0x7b]);
      const payload = new Uint8Array([
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
        ...results,
      ]);
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.SUCCESS);
      expect(reply.results).toBeDefined();
      expect(reply.results).toEqual(results);
    });

    test('handles CALL with no parameters', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      const call = msg.body as RpcCallBody;
      expect(call.params).toBeUndefined();
    });

    test('handles REPLY with no result data', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array([
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
        0x01, // accept_stat = PROG_UNAVAIL
      ]);
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.results).toBeUndefined();
    });

    test('decodes PORTMAP_GETPORT with parameters correctly', () => {
      const decoder = new RpcMessageDecoder();
      const params = new Uint8Array([
        0x00,
        0x01,
        0x86,
        0xa3, // prog: 100003
        0x00,
        0x00,
        0x00,
        0x03, // vers: 3
        0x00,
        0x00,
        0x00,
        0x11, // protocol: 17 (UDP)
        0x00,
        0x00,
        0x00,
        0x00, // port: 0
      ]);
      const payload = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x9c, // XID: 156
        0x00,
        0x00,
        0x00,
        0x00, // msg_type: CALL (0)
        0x00,
        0x00,
        0x00,
        0x02, // rpcvers: 2
        0x00,
        0x01,
        0x86,
        0xa0, // prog: 100000 (PORTMAP)
        0x00,
        0x00,
        0x00,
        0x02, // vers: 2
        0x00,
        0x00,
        0x00,
        0x03, // proc: 3 (GETPORT)
        0x00,
        0x00,
        0x00,
        0x00, // cred: AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // cred length: 0
        0x00,
        0x00,
        0x00,
        0x00, // verf: AUTH_NULL
        0x00,
        0x00,
        0x00,
        0x00, // verf length: 0
        ...params,
      ]);
      
      decoder.push(payload);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(156);
      const call = msg.body as RpcCallBody;
      expect(call.prog).toBe(100000);
      expect(call.vers).toBe(2);
      expect(call.proc).toBe(3);
      expect(call.params).toBeDefined();
      expect(call.params).toEqual(params);
    });
  });
});

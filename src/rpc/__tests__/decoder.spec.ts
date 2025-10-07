import {RpcMessageDecoder} from '../RpcMessageDecoder';
import {RpcMsgType, RpcAuthFlavor, RpcAcceptStat, RpcRejectStat, RpcAuthStat, RPC_VERSION} from '../constants';
import {RpcCallBody, RpcAcceptedReply, RpcRejectedReply, RpcOpaqueAuth} from '../messages';

function addRecordMarking(payload: Uint8Array): Uint8Array {
  const length = payload.length;
  const header = 0x80000000 | length;
  const result = new Uint8Array(4 + length);
  const view = new DataView(result.buffer);
  view.setUint32(0, header, false);
  result.set(payload, 4);
  return result;
}

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
      const buf = addRecordMarking(payload);
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
      const buf = addRecordMarking(payload);
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
      const buf = addRecordMarking(payload);
      decoder.push(buf.slice(0, 10));
      const msg = decoder.readMessage();
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
      const buf = addRecordMarking(payload);
      const chunk1 = buf.slice(0, 20);
      const chunk2 = buf.slice(20, 36);
      const chunk3 = buf.slice(36);
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
      const buf = addRecordMarking(payload);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
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
      const buf = addRecordMarking(payload);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
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
      const buf = addRecordMarking(payload);
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
      const buf = addRecordMarking(payload);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
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
      const buf = addRecordMarking(payload);
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
      const buf = addRecordMarking(payload);
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
      const buf = addRecordMarking(payload);
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
      const msg1 = addRecordMarking(payload1);
      const msg2 = addRecordMarking(payload2);
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

  describe('Record Marking (RFC 1057 Section 10)', () => {
    test('can decode message with record marking', () => {
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
      const buf = addRecordMarking(payload);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
    });

    test('returns undefined when record fragment is incomplete', () => {
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
      const header = 0x80000000 | payload.length;
      const buf = new Uint8Array(4 + payload.length);
      new DataView(buf.buffer).setUint32(0, header, false);
      buf.set(payload, 4);
      decoder.push(buf.slice(0, 20));
      expect(decoder.readMessage()).toBeUndefined();
      decoder.push(buf.slice(20));
      const msg = decoder.readMessage();
      expect(msg).toBeDefined();
      expect(msg?.xid).toBe(1);
    });

    test('can decode multiple messages with record marking', () => {
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
      ]);
      const header1 = 0x80000000 | payload1.length;
      const msg1 = new Uint8Array(4 + payload1.length);
      new DataView(msg1.buffer).setUint32(0, header1, false);
      msg1.set(payload1, 4);
      const header2 = 0x80000000 | payload2.length;
      const msg2 = new Uint8Array(4 + payload2.length);
      new DataView(msg2.buffer).setUint32(0, header2, false);
      msg2.set(payload2, 4);
      const combined = new Uint8Array([...msg1, ...msg2]);
      decoder.push(combined);
      const message1 = decoder.readMessage()!;
      expect(message1).toBeDefined();
      expect(message1.xid).toBe(1);
      const message2 = decoder.readMessage()!;
      expect(message2).toBeDefined();
      expect(message2.xid).toBe(2);
    });

    test('rejects multi-fragment messages', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array(40);
      const header = 0x00000028;
      const buf = new Uint8Array(4 + payload.length);
      new DataView(buf.buffer).setUint32(0, header, false);
      buf.set(payload, 4);
      decoder.push(buf);
      expect(() => decoder.readMessage()).toThrow('Multi-fragment messages not yet supported');
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
      const buf = addRecordMarking(payload);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
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
      const buf = addRecordMarking(payload);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
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
      const buf = addRecordMarking(payload);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
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
      const buf = addRecordMarking(payload);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
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
      const buf = addRecordMarking(payload);
      decoder.push(buf);
      const msg = decoder.readMessage()!;
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

  describe('Streaming Edge Cases', () => {
    test('can decode when record header arrives in separate chunk', () => {
      const decoder = new RpcMessageDecoder();
      const payload = new Uint8Array(40).fill(0);
      payload[0] = 0x00;
      payload[1] = 0x00;
      payload[2] = 0x00;
      payload[3] = 0x01;
      payload[4] = 0x00;
      payload[5] = 0x00;
      payload[6] = 0x00;
      payload[7] = 0x00;
      payload[8] = 0x00;
      payload[9] = 0x00;
      payload[10] = 0x00;
      payload[11] = 0x02;
      payload[12] = 0x00;
      payload[13] = 0x00;
      payload[14] = 0x00;
      payload[15] = 0x64;
      payload[16] = 0x00;
      payload[17] = 0x00;
      payload[18] = 0x00;
      payload[19] = 0x01;
      payload[20] = 0x00;
      payload[21] = 0x00;
      payload[22] = 0x00;
      payload[23] = 0x00;
      payload[24] = 0x00;
      payload[25] = 0x00;
      payload[26] = 0x00;
      payload[27] = 0x00;
      payload[28] = 0x00;
      payload[29] = 0x00;
      payload[30] = 0x00;
      payload[31] = 0x00;
      payload[32] = 0x00;
      payload[33] = 0x00;
      payload[34] = 0x00;
      payload[35] = 0x00;
      payload[36] = 0x00;
      payload[37] = 0x00;
      payload[38] = 0x00;
      payload[39] = 0x00;
      const header = 0x80000000 | payload.length;
      const headerBytes = new Uint8Array(4);
      new DataView(headerBytes.buffer).setUint32(0, header, false);
      decoder.push(headerBytes.slice(0, 2));
      expect(decoder.readMessage()).toBeUndefined();
      decoder.push(headerBytes.slice(2));
      expect(decoder.readMessage()).toBeUndefined();
      decoder.push(payload);
      const msg = decoder.readMessage();
      expect(msg).toBeDefined();
    });
  });
});

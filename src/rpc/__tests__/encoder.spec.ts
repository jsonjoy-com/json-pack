import {RpcMessageEncoder} from '../RpcMessageEncoder';
import {RpcMessageDecoder} from '../RpcMessageDecoder';
import {RpcAuthFlavor, RpcAcceptStat, RpcRejectStat, RpcAuthStat, RPC_VERSION} from '../constants';
import {RpcOpaqueAuth, RpcCallBody, RpcAcceptedReply, RpcRejectedReply, RpcMessage} from '../messages';

describe('RpcMessageEncoder', () => {
  describe('CALL messages', () => {
    test('can encode a simple CALL message with AUTH_NULL', () => {
      const encoder = new RpcMessageEncoder();
      const cred = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const encoded = encoder.encodeCall(1, 100, 1, 0, cred, verf);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
      expect(msg.body).toBeInstanceOf(RpcCallBody);
      const call = msg.body as RpcCallBody;
      expect(call.rpcvers).toBe(RPC_VERSION);
      expect(call.prog).toBe(100);
      expect(call.vers).toBe(1);
      expect(call.proc).toBe(0);
      expect(call.cred.flavor).toBe(RpcAuthFlavor.AUTH_NULL);
      expect(call.verf.flavor).toBe(RpcAuthFlavor.AUTH_NULL);
    });

    test('can encode CALL message with opaque auth data', () => {
      const encoder = new RpcMessageEncoder();
      const credBody = new Uint8Array([1, 2, 3, 4, 5]);
      const cred = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_UNIX, credBody);
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const encoded = encoder.encodeCall(10, 200, 2, 5, cred, verf);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(10);
      const call = msg.body as RpcCallBody;
      expect(call.prog).toBe(200);
      expect(call.vers).toBe(2);
      expect(call.proc).toBe(5);
      expect(call.cred.flavor).toBe(RpcAuthFlavor.AUTH_UNIX);
      expect(call.cred.body).toEqual(credBody);
    });

    test('can encode CALL message with parameters', () => {
      const encoder = new RpcMessageEncoder();
      const cred = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const params = new Uint8Array([0, 0, 0, 42]);
      const encoded = encoder.encodeCall(15, 300, 1, 3, cred, verf, params);
      expect(encoded.length).toBeGreaterThan(40);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(15);
    });

    test('can encode CALL with RpcMessage object', () => {
      const encoder = new RpcMessageEncoder();
      const cred = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const callBody = new RpcCallBody(RPC_VERSION, 100, 1, 0, cred, verf);
      const msg = new RpcMessage(20, callBody);
      const encoded = encoder.encodeMessage(msg);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const decoded = decoder.decodeMessage()!;
      expect(decoded).toBeDefined();
      expect(decoded.xid).toBe(20);
      expect((decoded.body as RpcCallBody).prog).toBe(100);
    });
  });

  describe('REPLY messages - MSG_ACCEPTED', () => {
    test('can encode SUCCESS reply', () => {
      const encoder = new RpcMessageEncoder();
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const results = new Uint8Array([0, 0, 0, 42]);
      const encoded = encoder.encodeAcceptedReply(1, verf, RpcAcceptStat.SUCCESS, undefined, results);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(1);
      expect(msg.body).toBeInstanceOf(RpcAcceptedReply);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.SUCCESS);
    });

    test('can encode PROG_UNAVAIL reply', () => {
      const encoder = new RpcMessageEncoder();
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const encoded = encoder.encodeAcceptedReply(2, verf, RpcAcceptStat.PROG_UNAVAIL);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(2);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.PROG_UNAVAIL);
    });

    test('can encode PROG_MISMATCH reply', () => {
      const encoder = new RpcMessageEncoder();
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const mismatchInfo = {low: 1, high: 3};
      const encoded = encoder.encodeAcceptedReply(3, verf, RpcAcceptStat.PROG_MISMATCH, mismatchInfo);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(3);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.PROG_MISMATCH);
      expect(reply.mismatchInfo).toBeDefined();
      expect(reply.mismatchInfo!.low).toBe(1);
      expect(reply.mismatchInfo!.high).toBe(3);
    });

    test('can encode PROC_UNAVAIL reply', () => {
      const encoder = new RpcMessageEncoder();
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const encoded = encoder.encodeAcceptedReply(4, verf, RpcAcceptStat.PROC_UNAVAIL);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(4);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.PROC_UNAVAIL);
    });

    test('can encode GARBAGE_ARGS reply', () => {
      const encoder = new RpcMessageEncoder();
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const encoded = encoder.encodeAcceptedReply(5, verf, RpcAcceptStat.GARBAGE_ARGS);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(5);
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.GARBAGE_ARGS);
    });

    test('can encode AcceptedReply with RpcMessage object', () => {
      const encoder = new RpcMessageEncoder();
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const acceptedReply = new RpcAcceptedReply(verf, RpcAcceptStat.SUCCESS, undefined, new Uint8Array([1, 2, 3]));
      const msg = new RpcMessage(25, acceptedReply);
      const encoded = encoder.encodeMessage(msg);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const decoded = decoder.decodeMessage()!;
      expect(decoded).toBeDefined();
      expect(decoded.xid).toBe(25);
      expect((decoded.body as RpcAcceptedReply).stat).toBe(RpcAcceptStat.SUCCESS);
    });
  });

  describe('REPLY messages - MSG_DENIED', () => {
    test('can encode RPC_MISMATCH reply', () => {
      const encoder = new RpcMessageEncoder();
      const mismatchInfo = {low: 2, high: 2};
      const encoded = encoder.encodeRejectedReply(6, RpcRejectStat.RPC_MISMATCH, mismatchInfo);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
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

    test('can encode AUTH_ERROR reply', () => {
      const encoder = new RpcMessageEncoder();
      const encoded = encoder.encodeRejectedReply(7, RpcRejectStat.AUTH_ERROR, undefined, RpcAuthStat.AUTH_BADCRED);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      expect(msg.xid).toBe(7);
      const reply = msg.body as RpcRejectedReply;
      expect(reply.stat).toBe(RpcRejectStat.AUTH_ERROR);
      expect(reply.authStat).toBe(RpcAuthStat.AUTH_BADCRED);
    });

    test('can encode RejectedReply with RpcMessage object', () => {
      const encoder = new RpcMessageEncoder();
      const rejectedReply = new RpcRejectedReply(RpcRejectStat.AUTH_ERROR, undefined, RpcAuthStat.AUTH_TOOWEAK);
      const msg = new RpcMessage(30, rejectedReply);
      const encoded = encoder.encodeMessage(msg);
      const decoder = new RpcMessageDecoder();
      decoder.push(encoded);
      const decoded = decoder.decodeMessage()!;
      expect(decoded).toBeDefined();
      expect(decoded.xid).toBe(30);
      const reply = decoded.body as RpcRejectedReply;
      expect(reply.stat).toBe(RpcRejectStat.AUTH_ERROR);
      expect(reply.authStat).toBe(RpcAuthStat.AUTH_TOOWEAK);
    });
  });

  describe('round-trip encoding/decoding', () => {
    test('multiple messages can be encoded and decoded', () => {
      const encoder = new RpcMessageEncoder();
      const decoder = new RpcMessageDecoder();
      const cred = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const encoded1 = encoder.encodeCall(100, 1000, 1, 0, cred, verf);
      const encoded2 = encoder.encodeCall(101, 1001, 1, 1, cred, verf);
      const encoded3 = encoder.encodeAcceptedReply(100, verf, RpcAcceptStat.SUCCESS);
      decoder.push(encoded1);
      const msg1 = decoder.decodeMessage()!;
      expect(msg1.xid).toBe(100);
      expect((msg1.body as RpcCallBody).prog).toBe(1000);
      decoder.push(encoded2);
      const msg2 = decoder.decodeMessage()!;
      expect(msg2.xid).toBe(101);
      expect((msg2.body as RpcCallBody).prog).toBe(1001);
      decoder.push(encoded3);
      const msg3 = decoder.decodeMessage()!;
      expect(msg3.xid).toBe(100);
      expect((msg3.body as RpcAcceptedReply).stat).toBe(RpcAcceptStat.SUCCESS);
    });

    test('handles auth body padding correctly', () => {
      const encoder = new RpcMessageEncoder();
      const decoder = new RpcMessageDecoder();
      const credBody1 = new Uint8Array([1]);
      const credBody2 = new Uint8Array([1, 2]);
      const credBody3 = new Uint8Array([1, 2, 3]);
      const credBody4 = new Uint8Array([1, 2, 3, 4]);
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const testCred = (body: Uint8Array, xid: number) => {
        const cred = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_UNIX, body);
        const encoded = encoder.encodeCall(xid, 100, 1, 0, cred, verf);
        decoder.push(encoded);
        const msg = decoder.decodeMessage()!;
        expect(msg.xid).toBe(xid);
        expect((msg.body as RpcCallBody).cred.body).toEqual(body);
      };
      testCred(credBody1, 1);
      testCred(credBody2, 2);
      testCred(credBody3, 3);
      testCred(credBody4, 4);
    });
  });

  describe('Payload Encoding', () => {
    test('encodes CALL with procedure parameters', () => {
      const encoder = new RpcMessageEncoder();
      const decoder = new RpcMessageDecoder();
      const cred = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const params = new Uint8Array([0x00, 0x00, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x45]);
      const encoded = encoder.encodeCall(1, 100, 1, 1, cred, verf, params);
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      const call = msg.body as RpcCallBody;
      expect(call.params).toBeDefined();
      expect(call.params).toEqual(params);
    });

    test('encodes REPLY with result data', () => {
      const encoder = new RpcMessageEncoder();
      const decoder = new RpcMessageDecoder();
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const results = new Uint8Array([0x00, 0x00, 0x00, 0x7b]);
      const encoded = encoder.encodeAcceptedReply(1, verf, RpcAcceptStat.SUCCESS, undefined, results);
      decoder.push(encoded);
      const msg = decoder.decodeMessage()!;
      expect(msg).toBeDefined();
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.results).toBeDefined();
      expect(reply.results).toEqual(results);
    });

    test('encodes RpcCallBody with params field via encodeMessage', () => {
      const encoder = new RpcMessageEncoder();
      const decoder = new RpcMessageDecoder();
      const cred = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const params = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      const callBody = new RpcCallBody(RPC_VERSION, 100, 1, 1, cred, verf);
      callBody.params = params;
      const msg = new RpcMessage(1, callBody);
      const encoded = encoder.encodeMessage(msg);
      decoder.push(encoded);
      const decoded = decoder.decodeMessage()!;
      expect(decoded).toBeDefined();
      const decodedCall = decoded.body as RpcCallBody;
      expect(decodedCall.params).toEqual(params);
    });

    test('encodes RpcAcceptedReply with results field via encodeMessage', () => {
      const encoder = new RpcMessageEncoder();
      const decoder = new RpcMessageDecoder();
      const verf = new RpcOpaqueAuth(RpcAuthFlavor.AUTH_NULL, new Uint8Array(0));
      const results = new Uint8Array([0x00, 0x00, 0x01, 0x00]);
      const reply = new RpcAcceptedReply(verf, RpcAcceptStat.SUCCESS, undefined, results);
      const msg = new RpcMessage(1, reply);
      const encoded = encoder.encodeMessage(msg);
      decoder.push(encoded);
      const decoded = decoder.decodeMessage()!;
      expect(decoded).toBeDefined();
      const decodedReply = decoded.body as RpcAcceptedReply;
      expect(decodedReply.results).toEqual(results);
    });
  });
});

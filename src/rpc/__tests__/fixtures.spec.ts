import {RpcMessageDecoder} from '../RpcMessageDecoder';
import {RpcMessageEncoder} from '../RpcMessageEncoder';
import {RpcCallBody, RpcAcceptedReply, RpcRejectedReply} from '../messages';
import {RpcAcceptStat, RpcRejectStat} from '../constants';
import * as fixtures from './fixtures';

describe('RPC Real-world Fixtures', () => {
  describe('Decoding fixtures', () => {
    test.each(fixtures.ALL_FIXTURES)('$name - can decode byte-for-byte', (fixture) => {
      const decoder = new RpcMessageDecoder();
      decoder.push(fixture.bytes);
      const msg = decoder.readMessage();
      expect(msg).toBeDefined();
      expect(msg!.xid).toBe(fixture.expected.xid);
      if (fixture.expected.type === 'CALL') {
        expect(msg!.body).toBeInstanceOf(RpcCallBody);
        const call = msg!.body as RpcCallBody;
        if (fixture.expected.rpcvers !== undefined) {
          expect(call.rpcvers).toBe(fixture.expected.rpcvers);
        }
        if (fixture.expected.prog !== undefined) {
          expect(call.prog).toBe(fixture.expected.prog);
        }
        if (fixture.expected.vers !== undefined) {
          expect(call.vers).toBe(fixture.expected.vers);
        }
        if (fixture.expected.proc !== undefined) {
          expect(call.proc).toBe(fixture.expected.proc);
        }
        if (fixture.expected.credFlavor !== undefined) {
          expect(call.cred.flavor).toBe(fixture.expected.credFlavor);
        }
        if (fixture.expected.verfFlavor !== undefined) {
          expect(call.verf.flavor).toBe(fixture.expected.verfFlavor);
        }
        if (fixture.expected.credBodyLength !== undefined) {
          expect(call.cred.body.length).toBe(fixture.expected.credBodyLength);
        }
      } else if (fixture.expected.type === 'REPLY') {
        if (fixture.expected.replyStat === 'MSG_ACCEPTED') {
          expect(msg!.body).toBeInstanceOf(RpcAcceptedReply);
          const reply = msg!.body as RpcAcceptedReply;
          if (fixture.expected.acceptStat !== undefined) {
            expect(reply.stat).toBe(fixture.expected.acceptStat);
          }
          if (fixture.expected.verfFlavor !== undefined) {
            expect(reply.verf.flavor).toBe(fixture.expected.verfFlavor);
          }
          if (fixture.expected.mismatchLow !== undefined) {
            expect(reply.mismatchInfo).toBeDefined();
            expect(reply.mismatchInfo!.low).toBe(fixture.expected.mismatchLow);
            expect(reply.mismatchInfo!.high).toBe(fixture.expected.mismatchHigh);
          }
        } else if (fixture.expected.replyStat === 'MSG_DENIED') {
          expect(msg!.body).toBeInstanceOf(RpcRejectedReply);
          const reply = msg!.body as RpcRejectedReply;
          if (fixture.expected.rejectStat !== undefined) {
            expect(reply.stat).toBe(fixture.expected.rejectStat);
          }
          if (fixture.expected.mismatchLow !== undefined) {
            expect(reply.mismatchInfo).toBeDefined();
            expect(reply.mismatchInfo!.low).toBe(fixture.expected.mismatchLow);
            expect(reply.mismatchInfo!.high).toBe(fixture.expected.mismatchHigh);
          }
          if (fixture.expected.authStat !== undefined) {
            expect(reply.authStat).toBe(fixture.expected.authStat);
          }
        }
      }
    });
  });

  describe('Round-trip encoding/decoding', () => {
    test.each(fixtures.ALL_FIXTURES)('$name - round-trip preserves structure', (fixture) => {
      const decoder1 = new RpcMessageDecoder();
      const withRecordMarking = fixture.bytes;
      decoder1.push(withRecordMarking);
      const msg1 = decoder1.readMessage()!;
      expect(msg1).toBeDefined();
      const encoder = new RpcMessageEncoder();
      const encoded = encoder.encodeMessage(msg1);
      const decoder2 = new RpcMessageDecoder();
      decoder2.push(encoded);
      const msg2 = decoder2.readMessage()!;
      expect(msg2).toBeDefined();
      expect(msg2.xid).toBe(msg1.xid);
      if (msg1.body instanceof RpcCallBody) {
        expect(msg2.body).toBeInstanceOf(RpcCallBody);
        const call1 = msg1.body as RpcCallBody;
        const call2 = msg2.body as RpcCallBody;
        expect(call2.rpcvers).toBe(call1.rpcvers);
        expect(call2.prog).toBe(call1.prog);
        expect(call2.vers).toBe(call1.vers);
        expect(call2.proc).toBe(call1.proc);
        expect(call2.cred.flavor).toBe(call1.cred.flavor);
        expect(call2.cred.body).toEqual(call1.cred.body);
        expect(call2.verf.flavor).toBe(call1.verf.flavor);
        expect(call2.verf.body).toEqual(call1.verf.body);
      } else if (msg1.body instanceof RpcAcceptedReply) {
        expect(msg2.body).toBeInstanceOf(RpcAcceptedReply);
        const reply1 = msg1.body as RpcAcceptedReply;
        const reply2 = msg2.body as RpcAcceptedReply;
        expect(reply2.stat).toBe(reply1.stat);
        expect(reply2.verf.flavor).toBe(reply1.verf.flavor);
        if (reply1.mismatchInfo) {
          expect(reply2.mismatchInfo).toBeDefined();
          expect(reply2.mismatchInfo!.low).toBe(reply1.mismatchInfo.low);
          expect(reply2.mismatchInfo!.high).toBe(reply1.mismatchInfo.high);
        }
      } else if (msg1.body instanceof RpcRejectedReply) {
        expect(msg2.body).toBeInstanceOf(RpcRejectedReply);
        const reply1 = msg1.body as RpcRejectedReply;
        const reply2 = msg2.body as RpcRejectedReply;
        expect(reply2.stat).toBe(reply1.stat);
        if (reply1.mismatchInfo) {
          expect(reply2.mismatchInfo).toBeDefined();
          expect(reply2.mismatchInfo!.low).toBe(reply1.mismatchInfo.low);
          expect(reply2.mismatchInfo!.high).toBe(reply1.mismatchInfo.high);
        }
        if (reply1.authStat !== undefined) {
          expect(reply2.authStat).toBe(reply1.authStat);
        }
      }
    });
  });

  describe('Streaming decode', () => {
    test('can decode NFS NULL CALL in chunks', () => {
      const decoder = new RpcMessageDecoder();
      const bytes = fixtures.NFS_NULL_CALL.bytes;
      for (let i = 0; i < bytes.length; i += 4) {
        const chunk = bytes.slice(i, i + 4);
        decoder.push(chunk);
      }
      const msg = decoder.readMessage();
      expect(msg).toBeDefined();
      expect(msg!.xid).toBe(1);
    });

    test('can decode multiple messages from stream', () => {
      const decoder = new RpcMessageDecoder();
      decoder.push(fixtures.NFS_NULL_CALL.bytes);
      const msg1 = decoder.readMessage();
      expect(msg1).toBeDefined();
      expect(msg1!.xid).toBe(1);
      decoder.push(fixtures.SUCCESS_REPLY.bytes);
      const msg2 = decoder.readMessage();
      expect(msg2).toBeDefined();
      expect(msg2!.xid).toBe(156);
      decoder.push(fixtures.PROG_UNAVAIL_REPLY.bytes);
      const msg3 = decoder.readMessage();
      expect(msg3).toBeDefined();
      expect(msg3!.xid).toBe(66);
    });

    test('handles partial messages correctly', () => {
      const decoder = new RpcMessageDecoder();
      const bytes = fixtures.CALL_WITH_AUTH_UNIX.bytes;
      decoder.push(bytes.slice(0, 20));
      expect(decoder.readMessage()).toBeUndefined();
      decoder.push(bytes.slice(20));
      const msg = decoder.readMessage();
      expect(msg).toBeDefined();
      expect(msg!.xid).toBe(1234);
    });
  });

  describe('XDR padding validation', () => {
    test.each([fixtures.CALL_WITH_PADDING_1BYTE, fixtures.CALL_WITH_PADDING_2BYTE, fixtures.CALL_WITH_PADDING_3BYTE])(
      '$name - correctly handles padding',
      (fixture) => {
        const decoder = new RpcMessageDecoder();
        const withRecordMarking = fixture.bytes;
        decoder.push(withRecordMarking);
        const msg = decoder.readMessage()!;
        expect(msg).toBeDefined();
        const call = msg.body as RpcCallBody;
        expect(call.cred.body.length).toBe(fixture.expected.credBodyLength);
        const encoder = new RpcMessageEncoder();
        const encoded = encoder.encodeMessage(msg);
        expect(encoded.length % 4).toBe(0);
      },
    );
  });

  describe('Error handling', () => {
    test('handles invalid message type', () => {
      const decoder = new RpcMessageDecoder();
      const invalidBytes = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x01, // XID
        0x00,
        0x00,
        0x00,
        0x99, // Invalid msg_type
      ]);
      const withRecordMarking = invalidBytes;
      decoder.push(withRecordMarking);
      expect(() => decoder.readMessage()).toThrow();
    });

    test('handles invalid RPC version', () => {
      const decoder = new RpcMessageDecoder();
      const invalidBytes = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x01, // XID
        0x00,
        0x00,
        0x00,
        0x00, // CALL
        0x00,
        0x00,
        0x00,
        0x99, // Invalid RPC version
        0x00,
        0x00,
        0x00,
        0x01, // prog
        0x00,
        0x00,
        0x00,
        0x01, // vers
        0x00,
        0x00,
        0x00,
        0x00, // proc
        0x00,
        0x00,
        0x00,
        0x00, // cred flavor
        0x00,
        0x00,
        0x00,
        0x00, // cred length
        0x00,
        0x00,
        0x00,
        0x00, // verf flavor
        0x00,
        0x00,
        0x00,
        0x00, // verf length
      ]);
      const withRecordMarking = invalidBytes;
      decoder.push(withRecordMarking);
      expect(() => decoder.readMessage()).toThrow();
    });

    test('handles oversized auth body', () => {
      const decoder = new RpcMessageDecoder();
      const invalidBytes = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x01, // XID
        0x00,
        0x00,
        0x00,
        0x00, // CALL
        0x00,
        0x00,
        0x00,
        0x02, // RPC version
        0x00,
        0x00,
        0x00,
        0x01, // prog
        0x00,
        0x00,
        0x00,
        0x01, // vers
        0x00,
        0x00,
        0x00,
        0x00, // proc
        0x00,
        0x00,
        0x00,
        0x01, // cred flavor
        0xff,
        0xff,
        0xff,
        0xff, // oversized length
      ]);
      const withRecordMarking = invalidBytes;
      decoder.push(withRecordMarking);
      expect(() => decoder.readMessage()).toThrow();
    });

    test('handles invalid reply_stat', () => {
      const decoder = new RpcMessageDecoder();
      const invalidBytes = new Uint8Array([
        0x00,
        0x00,
        0x00,
        0x01, // XID
        0x00,
        0x00,
        0x00,
        0x01, // REPLY
        0x00,
        0x00,
        0x00,
        0x99, // Invalid reply_stat
      ]);
      const withRecordMarking = invalidBytes;
      decoder.push(withRecordMarking);
      expect(() => decoder.readMessage()).toThrow();
    });
  });

  describe('NFS-specific scenarios', () => {
    test('NFS NULL call should have no parameters', () => {
      const decoder = new RpcMessageDecoder();
      const withRecordMarking = fixtures.NFS_NULL_CALL.bytes;
      decoder.push(withRecordMarking);
      const msg = decoder.readMessage()!;
      const call = msg.body as RpcCallBody;
      expect(call.prog).toBe(100003);
      expect(call.proc).toBe(0);
      expect(call.cred.body.length).toBe(0);
      expect(call.verf.body.length).toBe(0);
    });

    test('GETPORT response format is valid', () => {
      const decoder = new RpcMessageDecoder();
      const withRecordMarking = fixtures.SUCCESS_REPLY.bytes;
      decoder.push(withRecordMarking);
      const msg = decoder.readMessage()!;
      const reply = msg.body as RpcAcceptedReply;
      expect(reply.stat).toBe(RpcAcceptStat.SUCCESS);
    });
  });

  describe('Performance tests', () => {
    test('can decode 1000 messages quickly', () => {
      const decoder = new RpcMessageDecoder();
      const withRecordMarking = fixtures.NFS_NULL_CALL.bytes;
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        decoder.push(withRecordMarking);
        const msg = decoder.readMessage();
        expect(msg).toBeDefined();
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    test('can encode 1000 messages quickly', () => {
      const encoder = new RpcMessageEncoder();
      const decoder = new RpcMessageDecoder();
      const withRecordMarking = fixtures.NFS_NULL_CALL.bytes;
      decoder.push(withRecordMarking);
      const template = decoder.readMessage()!;
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        const encoded = encoder.encodeMessage(template);
        expect(encoded).toBeDefined();
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });
  });
});

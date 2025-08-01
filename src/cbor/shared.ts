import {CborUint8Array} from './types';

export type {CborUint8Array};

// Utility to detect system endianness
export const isLittleEndian = (() => {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true);
  return new Int16Array(buffer)[0] === 256;
})();

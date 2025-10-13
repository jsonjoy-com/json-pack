import type {FsPromises} from 'memfs/lib/node/FsPromises';
import * as msg from '../messages';

export interface Nfsv4Client {
  compound(request: msg.Nfsv4CompoundRequest): Promise<msg.Nfsv4CompoundResponse>;
  compound(operations: msg.Nfsv4Request[], tag?: string, minorversion?: number): Promise<msg.Nfsv4CompoundResponse>;

  null(): Promise<void>;
}

export interface NfsFsClient {
  readFile: FsPromises['readFile'];
  writeFile: FsPromises['writeFile'];
}

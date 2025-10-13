import type {NfsFsClient, Nfsv4Client} from './types';
import * as misc from 'memfs/lib/node/types/misc';
import * as opts from 'memfs/lib/node/types/options';
import {nfs} from '../builder';

export class Nfsv4FsClient implements NfsFsClient {
  constructor(public readonly nfs: Nfsv4Client) {}

  public readonly readFile = async (
    id: misc.TFileHandle,
    options?: opts.IReadFileOptions | string,
  ): Promise<misc.TDataOut> => {
    // await this.nfs.compound([
      //   nfs.OPEN(),
      // ]);
      throw new Error('Method not implemented.');
  };

  public readonly writeFile = async (id: misc.TFileHandle, data: misc.TPromisesData, options?: opts.IWriteFileOptions): Promise<void> => {
    throw new Error('Method not implemented.');
  };
}

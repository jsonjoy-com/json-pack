import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {XdrEncoder} from '../../xdr/XdrEncoder';
import * as msg from './messages';
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/util/lib/buffers';

export class Nfsv4Encoder<W extends IWriter & IWriterGrowable = IWriter & IWriterGrowable> {
  protected readonly xdr: XdrEncoder;

  constructor(public readonly writer: W = new Writer() as any) {
    this.xdr = new XdrEncoder(writer);
  }

  public encodeCompound(
    compound: msg.Nfsv4CompoundRequest | msg.Nfsv4CompoundResponse,
    isRequest: boolean,
  ): Uint8Array {
    if (isRequest) this.writeCompoundRequest(compound as msg.Nfsv4CompoundRequest);
    else this.writeCompoundResponse(compound as msg.Nfsv4CompoundResponse);
    return this.writer.flush();
  }

  public writeCompound(compound: msg.Nfsv4CompoundRequest | msg.Nfsv4CompoundResponse, isRequest: boolean): void {
    if (isRequest) this.writeCompoundRequest(compound as msg.Nfsv4CompoundRequest);
    else this.writeCompoundResponse(compound as msg.Nfsv4CompoundResponse);
  }

  private writeCompoundRequest(request: msg.Nfsv4CompoundRequest): void {
    request.encode(this.xdr);
  }

  private writeCompoundResponse(response: msg.Nfsv4CompoundResponse): void {
    response.encode(this.xdr);
  }
}

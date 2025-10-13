import {setupNfsClientServerTestbed} from './setup';
import * as msg from '../../messages';
import * as structs from '../../structs';
import {Nfsv4Stat} from '../../constants';

describe('Nfsv4Connection with Nfsv4TcpClient over dual-Duplex', () => {
  test('NULL request returns success', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    expect(await client.null()).toBe(undefined);
    await stop();
  });

  test('PUTROOTFH + GETFH returns root filehandle', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const putrootfh = new msg.Nfsv4PutrootfhRequest();
    const getfh = new msg.Nfsv4GetfhRequest();
    const compound = new msg.Nfsv4CompoundRequest('', 0, [putrootfh, getfh]);
    const response = await client.compound(compound);
    expect(response.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(response.resarray).toHaveLength(2);
    expect(response.resarray[0]).toBeInstanceOf(msg.Nfsv4PutrootfhResponse);
    expect(response.resarray[1]).toBeInstanceOf(msg.Nfsv4GetfhResponse);
    const getfhRes = response.resarray[1] as msg.Nfsv4GetfhResponse;
    expect(getfhRes.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(getfhRes.resok).toBeDefined();
    expect(getfhRes.resok!.object.data).toBeDefined();
    await stop();
  });

  test('PUTROOTFH + LOOKUP + GETATTR returns file attributes', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const putrootfh = new msg.Nfsv4PutrootfhRequest();
    const lookup = new msg.Nfsv4LookupRequest('file.txt');
    const bitmap = new structs.Nfsv4Bitmap([0x00000001]); // FATTR4_SUPPORTED_ATTRS
    const getattr = new msg.Nfsv4GetattrRequest(bitmap);
    const compound = new msg.Nfsv4CompoundRequest('', 0, [putrootfh, lookup, getattr]);
    const response = await client.compound(compound);
    expect(response.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(response.resarray).toHaveLength(3);
    const lookupRes = response.resarray[1] as msg.Nfsv4LookupResponse;
    expect(lookupRes.status).toBe(Nfsv4Stat.NFS4_OK);
    const getattrRes = response.resarray[2] as msg.Nfsv4GetattrResponse;
    expect(getattrRes.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(getattrRes.resok).toBeDefined();
    await stop();
  });

  test('PUTROOTFH + LOOKUP non-existent file returns NFS4ERR_NOENT', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const putrootfh = new msg.Nfsv4PutrootfhRequest();
    const lookup = new msg.Nfsv4LookupRequest('nonexistent.txt');
    const compound = new msg.Nfsv4CompoundRequest('', 0, [putrootfh, lookup]);
    const response = await client.compound(compound);
    expect(response.status).not.toBe(Nfsv4Stat.NFS4_OK);
    expect(response.resarray).toHaveLength(2);
    const putrootfhRes = response.resarray[0] as msg.Nfsv4PutrootfhResponse;
    expect(putrootfhRes.status).toBe(Nfsv4Stat.NFS4_OK);
    const lookupRes = response.resarray[1] as msg.Nfsv4LookupResponse;
    expect(lookupRes.status).toBe(Nfsv4Stat.NFS4ERR_NOENT);
    await stop();
  });

  test('PUTROOTFH + READDIR returns directory entries', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const putrootfh = new msg.Nfsv4PutrootfhRequest();
    const bitmap = new structs.Nfsv4Bitmap([0x00000001]);
    const verifier = new structs.Nfsv4Verifier(new Uint8Array(8));
    const readdir = new msg.Nfsv4ReaddirRequest(BigInt(0), verifier, 1000, 8192, bitmap);
    const compound = new msg.Nfsv4CompoundRequest('', 0, [putrootfh, readdir]);
    const response = await client.compound(compound);
    expect(response.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(response.resarray).toHaveLength(2);
    const readdirRes = response.resarray[1] as msg.Nfsv4ReaddirResponse;
    expect(readdirRes.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(readdirRes.resok).toBeDefined();
    expect(readdirRes.resok!.entries).toBeDefined();
    expect(readdirRes.resok!.entries.length).toBeGreaterThan(0);
    await stop();
  });

  test('PUTROOTFH + LOOKUP subdir + LOOKUPP returns to parent', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const putrootfh = new msg.Nfsv4PutrootfhRequest();
    const lookup = new msg.Nfsv4LookupRequest('subdir');
    const lookupp = new msg.Nfsv4LookuppRequest();
    const getfh1 = new msg.Nfsv4GetfhRequest();
    const compound = new msg.Nfsv4CompoundRequest('', 0, [putrootfh, getfh1, lookup, lookupp]);
    const response = await client.compound(compound);
    expect(response.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(response.resarray).toHaveLength(4);
    const lookupRes = response.resarray[2] as msg.Nfsv4LookupResponse;
    expect(lookupRes.status).toBe(Nfsv4Stat.NFS4_OK);
    const lookuppRes = response.resarray[3] as msg.Nfsv4LookuppResponse;
    expect(lookuppRes.status).toBe(Nfsv4Stat.NFS4_OK);
    await stop();
  });

  test('PUTROOTFH + ACCESS checks permissions', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const putrootfh = new msg.Nfsv4PutrootfhRequest();
    const access = new msg.Nfsv4AccessRequest(0x0000003f); // All access bits
    const compound = new msg.Nfsv4CompoundRequest('', 0, [putrootfh, access]);
    const response = await client.compound(compound);
    expect(response.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(response.resarray).toHaveLength(2);
    const accessRes = response.resarray[1] as msg.Nfsv4AccessResponse;
    expect(accessRes.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(accessRes.resok).toBeDefined();
    expect(accessRes.resok!.supported).toBeDefined();
    expect(accessRes.resok!.access).toBeDefined();
    await stop();
  });

  test('Multiple concurrent COMPOUND requests are handled correctly', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const makeCompound = () => {
      const putrootfh = new msg.Nfsv4PutrootfhRequest();
      const getfh = new msg.Nfsv4GetfhRequest();
      return new msg.Nfsv4CompoundRequest('', 0, [putrootfh, getfh]);
    };
    const promises = [
      client.compound(makeCompound()),
      client.compound(makeCompound()),
      client.compound(makeCompound()),
      client.compound(makeCompound()),
      client.compound(makeCompound()),
    ];
    const responses = await Promise.all(promises);
    expect(responses).toHaveLength(5);
    responses.forEach((response) => {
      expect(response.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(response.resarray).toHaveLength(2);
    });
    await stop();
  });

  test('SAVEFH + RESTOREFH preserves filehandle', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const putrootfh = new msg.Nfsv4PutrootfhRequest();
    const lookup = new msg.Nfsv4LookupRequest('file.txt');
    const savefh = new msg.Nfsv4SavefhRequest();
    const putrootfh2 = new msg.Nfsv4PutrootfhRequest();
    const restorefh = new msg.Nfsv4RestorefhRequest();
    const getfh = new msg.Nfsv4GetfhRequest();
    const compound = new msg.Nfsv4CompoundRequest('', 0, [putrootfh, lookup, savefh, putrootfh2, restorefh, getfh]);
    const response = await client.compound(compound);
    expect(response.status).toBe(Nfsv4Stat.NFS4_OK);
    expect(response.resarray).toHaveLength(6);
    const savefhRes = response.resarray[2] as msg.Nfsv4SavefhResponse;
    expect(savefhRes.status).toBe(Nfsv4Stat.NFS4_OK);
    const restorefhRes = response.resarray[4] as msg.Nfsv4RestorefhResponse;
    expect(restorefhRes.status).toBe(Nfsv4Stat.NFS4_OK);
    const getfhRes = response.resarray[5] as msg.Nfsv4GetfhResponse;
    expect(getfhRes.status).toBe(Nfsv4Stat.NFS4_OK);
    await stop();
  });
});

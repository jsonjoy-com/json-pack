import {setupNfsClientServerTestbed} from '../../../__tests__/setup';
import {nfs} from '../../../../builder';
import {Nfsv4Stat} from '../../../../constants';

describe('RENAME operation', () => {
  test('rename a file succeeds', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    vol.writeFileSync('/export/oldname.txt', 'data');
    const res = await client.compound([nfs.PUTROOTFH(), nfs.RENAME('oldname.txt', 'newname.txt')]);
    expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
    await stop();
  });

  test('rename across devices returns XDEV (simulated by error)', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    // Simulate EXDEV by calling rename with invalid target outside export
    const res = await client.compound([nfs.PUTROOTFH(), nfs.RENAME('file.txt', '../outside.txt')]);
    expect(res.status).toBe(Nfsv4Stat.NFS4ERR_XDEV);
    await stop();
  });
});

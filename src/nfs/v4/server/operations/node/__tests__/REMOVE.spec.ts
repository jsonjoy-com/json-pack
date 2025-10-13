import {setupNfsClientServerTestbed} from '../../../__tests__/setup';
import {nfs} from '../../../../builder';
import {Nfsv4Stat} from '../../../../constants';

describe('REMOVE operation', () => {
  test('remove a file succeeds', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    // create a temp file
    vol.writeFileSync('/export/todelete.txt', 'temporary');
    const res = await client.compound([nfs.PUTROOTFH(), nfs.REMOVE('todelete.txt')]);
    expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
    await stop();
  });

  test('remove non-existent returns error', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const res = await client.compound([nfs.PUTROOTFH(), nfs.REMOVE('nope.txt')]);
    expect(res.status).not.toBe(Nfsv4Stat.NFS4_OK);
    await stop();
  });
});

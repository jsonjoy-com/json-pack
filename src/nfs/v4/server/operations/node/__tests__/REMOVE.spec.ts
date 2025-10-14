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

  describe('AppleDouble file handling', () => {
    test('removes AppleDouble file when removing main file', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      vol.writeFileSync('/export/test.txt', 'data');
      vol.writeFileSync('/export/._test.txt', 'xattr-data');
      const res = await client.compound([nfs.PUTROOTFH(), nfs.REMOVE('test.txt')]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/test.txt')).toBe(false);
      expect(vol.existsSync('/export/._test.txt')).toBe(false);
      await stop();
    });

    test('succeeds even if AppleDouble file does not exist', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      vol.writeFileSync('/export/test.txt', 'data');
      const res = await client.compound([nfs.PUTROOTFH(), nfs.REMOVE('test.txt')]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/test.txt')).toBe(false);
      await stop();
    });

    test('does not remove AppleDouble if it is a directory', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      vol.writeFileSync('/export/test.txt', 'data');
      vol.mkdirSync('/export/._test.txt');
      const res = await client.compound([nfs.PUTROOTFH(), nfs.REMOVE('test.txt')]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/test.txt')).toBe(false);
      expect(vol.existsSync('/export/._test.txt')).toBe(true);
      expect(vol.statSync('/export/._test.txt').isDirectory()).toBe(true);
      await stop();
    });

    test('removes directory without removing AppleDouble file', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      vol.mkdirSync('/export/testdir');
      vol.writeFileSync('/export/._testdir', 'xattr');
      const res = await client.compound([nfs.PUTROOTFH(), nfs.REMOVE('testdir')]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/testdir')).toBe(false);
      expect(vol.existsSync('/export/._testdir')).toBe(true);
      await stop();
    });
  });
});

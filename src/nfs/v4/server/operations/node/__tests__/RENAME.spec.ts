import {setupNfsClientServerTestbed} from '../../../__tests__/setup';
import {nfs} from '../../../../builder';
import {Nfsv4Stat} from '../../../../constants';
import * as msg from '../../../../messages';

describe('RENAME operation', () => {
  test('rename a file succeeds', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    vol.writeFileSync('/export/oldname.txt', 'data');
    const res = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME('oldname.txt', 'newname.txt')]);
    expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
    await stop();
  });

  test('rename across devices returns XDEV (simulated by error)', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    vol.writeFileSync('/export/file.txt', 'data');
    // Simulate EXDEV by calling rename with invalid target outside export
    const res = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME('file.txt', '../outside.txt')]);
    expect(res.status).toBe(Nfsv4Stat.NFS4ERR_NOENT);
    await stop();
  });

  test('file handle with ID-type remains valid after RENAME', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    // Create a file with a long enough name to force ID-type file handle
    const longName = 'a'.repeat(120);
    const newName = 'b'.repeat(120);
    vol.writeFileSync('/export/' + longName, 'test data');
    // Get file handle to the old name
    const lookupRes = await client.compound([nfs.PUTROOTFH(), nfs.LOOKUP(longName), nfs.GETFH()]);
    expect(lookupRes.status).toBe(Nfsv4Stat.NFS4_OK);
    const getfhRes = lookupRes.resarray[2] as msg.Nfsv4GetfhResponse;
    expect(getfhRes.status).toBe(Nfsv4Stat.NFS4_OK);
    const oldFh = getfhRes.resok!.object;
    // Verify it's ID-type (not PATH-type)
    expect(oldFh.data[0]).toBe(2); // FH_TYPE.ID
    // Rename the file
    const renameRes = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME(longName, newName)]);
    expect(renameRes.status).toBe(Nfsv4Stat.NFS4_OK);
    // Use the old file handle - it should still work
    const getAttrRes = await client.compound([nfs.PUTFH(oldFh), nfs.GETATTR([0x00000001])]);
    expect(getAttrRes.status).toBe(Nfsv4Stat.NFS4_OK);
    await stop();
  });

  test('multiple file handles to same file all remain valid after RENAME', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    const longName = 'z'.repeat(120);
    const newName = 'w'.repeat(120);
    vol.writeFileSync('/export/' + longName, 'test');
    // Get two file handles to the same file
    const lookup1 = await client.compound([nfs.PUTROOTFH(), nfs.LOOKUP(longName), nfs.GETFH()]);
    const fh1 = (lookup1.resarray[2] as msg.Nfsv4GetfhResponse).resok!.object;
    const lookup2 = await client.compound([nfs.PUTROOTFH(), nfs.LOOKUP(longName), nfs.GETFH()]);
    const fh2 = (lookup2.resarray[2] as msg.Nfsv4GetfhResponse).resok!.object;
    // Verify both are ID-type
    expect(fh1.data[0]).toBe(2); // FH_TYPE.ID
    expect(fh2.data[0]).toBe(2); // FH_TYPE.ID
    // Rename the file
    const renameRes = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME(longName, newName)]);
    expect(renameRes.status).toBe(Nfsv4Stat.NFS4_OK);
    // Both old file handles should still work
    const getAttr1 = await client.compound([nfs.PUTFH(fh1), nfs.GETATTR([0x00000001])]);
    expect(getAttr1.status).toBe(Nfsv4Stat.NFS4_OK);
    const getAttr2 = await client.compound([nfs.PUTFH(fh2), nfs.GETATTR([0x00000001])]);
    expect(getAttr2.status).toBe(Nfsv4Stat.NFS4_OK);
    await stop();
  });

  test('file handle remains valid after RENAME back and forth', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    const name1 = 'm'.repeat(120);
    const name2 = 'n'.repeat(120);
    vol.writeFileSync('/export/' + name1, 'test');
    // Get file handle
    const lookup = await client.compound([nfs.PUTROOTFH(), nfs.LOOKUP(name1), nfs.GETFH()]);
    const fh = (lookup.resarray[2] as msg.Nfsv4GetfhResponse).resok!.object;
    expect(fh.data[0]).toBe(2); // FH_TYPE.ID
    // Rename 1 -> 2
    const rename1 = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME(name1, name2)]);
    expect(rename1.status).toBe(Nfsv4Stat.NFS4_OK);
    // File handle should work
    const getAttr1 = await client.compound([nfs.PUTFH(fh), nfs.GETATTR([0x00000001])]);
    expect(getAttr1.status).toBe(Nfsv4Stat.NFS4_OK);
    // Rename 2 -> 1
    const rename2 = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME(name2, name1)]);
    expect(rename2.status).toBe(Nfsv4Stat.NFS4_OK);
    // File handle should still work
    const getAttr2 = await client.compound([nfs.PUTFH(fh), nfs.GETATTR([0x00000001])]);
    expect(getAttr2.status).toBe(Nfsv4Stat.NFS4_OK);
    await stop();
  });

  test('ID-type file handle with GETATTR after rename (critical test)', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    const oldName = 'q'.repeat(120);
    const newName = 'r'.repeat(120);
    vol.writeFileSync('/export/' + oldName, 'test content');
    // CRITICAL: Get file handle BEFORE rename
    const lookup = await client.compound([nfs.PUTROOTFH(), nfs.LOOKUP(oldName), nfs.GETFH()]);
    expect(lookup.status).toBe(Nfsv4Stat.NFS4_OK);
    const fh = (lookup.resarray[2] as msg.Nfsv4GetfhResponse).resok!.object;
    // Verify it's ID-type
    expect(fh.data[0]).toBe(2); // FH_TYPE.ID
    // Verify old file exists
    expect(vol.existsSync('/export/' + oldName)).toBe(true);
    expect(vol.existsSync('/export/' + newName)).toBe(false);
    // Perform RENAME
    const rename = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME(oldName, newName)]);
    expect(rename.status).toBe(Nfsv4Stat.NFS4_OK);
    // Verify filesystem state changed
    expect(vol.existsSync('/export/' + oldName)).toBe(false);
    expect(vol.existsSync('/export/' + newName)).toBe(true);
    // CRITICAL: Use the OLD file handle (obtained before rename) with GETATTR
    // Request attributes that REQUIRE lstat: size (0x00000020), time_modify (0x00100000)
    // Without fh.rename() fix, this will try to lstat the OLD path which no longer exists
    // and should fail with NFS4ERR_NOENT or NFS4ERR_FHEXPIRED
    const getattr = await client.compound([nfs.PUTFH(fh), nfs.GETATTR([0x00000020, 0x00100000])]);
    expect(getattr.status).toBe(Nfsv4Stat.NFS4_OK); // Must succeed with fix
    await stop();
  });

  describe('AppleDouble file handling', () => {
    test('renames AppleDouble file when renaming main file', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      vol.writeFileSync('/export/test.txt', 'data');
      vol.writeFileSync('/export/._test.txt', 'xattr-data');
      const res = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME('test.txt', 'new.txt')]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/new.txt')).toBe(true);
      expect(vol.existsSync('/export/._new.txt')).toBe(true);
      expect(vol.existsSync('/export/test.txt')).toBe(false);
      expect(vol.existsSync('/export/._test.txt')).toBe(false);
      await stop();
    });

    test('succeeds even if AppleDouble file does not exist', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      vol.writeFileSync('/export/test.txt', 'data');
      const res = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME('test.txt', 'new.txt')]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/new.txt')).toBe(true);
      expect(vol.existsSync('/export/._new.txt')).toBe(false);
      await stop();
    });

    test('renames AppleDouble file for TextEdit-style save workflow', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      vol.writeFileSync('/export/file.txt', 'original content');
      vol.writeFileSync('/export/file.txt.sb-temp-u9VvVu', 'new content');
      vol.writeFileSync('/export/._file.txt.sb-temp-u9VvVu', 'new xattr');
      const res = await client.compound([
        nfs.PUTROOTFH(),
        nfs.SAVEFH(),
        nfs.RENAME('file.txt.sb-temp-u9VvVu', 'file.txt'),
      ]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/file.txt')).toBe(true);
      expect(vol.existsSync('/export/._file.txt')).toBe(true);
      expect(vol.existsSync('/export/file.txt.sb-temp-u9VvVu')).toBe(false);
      expect(vol.existsSync('/export/._file.txt.sb-temp-u9VvVu')).toBe(false);
      expect(vol.readFileSync('/export/file.txt', 'utf8')).toBe('new content');
      expect(vol.readFileSync('/export/._file.txt', 'utf8')).toBe('new xattr');
      await stop();
    });

    test('handles AppleDouble file with long filenames (ID-type FH)', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      const oldName = 'long_filename_' + 'x'.repeat(100) + '.txt';
      const newName = 'long_filename_' + 'y'.repeat(100) + '.txt';
      vol.writeFileSync('/export/' + oldName, 'data');
      vol.writeFileSync('/export/._' + oldName, 'xattr');
      const res = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME(oldName, newName)]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/' + newName)).toBe(true);
      expect(vol.existsSync('/export/._' + newName)).toBe(true);
      expect(vol.existsSync('/export/' + oldName)).toBe(false);
      expect(vol.existsSync('/export/._' + oldName)).toBe(false);
      await stop();
    });

    test('AppleDouble file handle remains valid after rename', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      const oldName = 'original_' + 'a'.repeat(100) + '.txt';
      const newName = 'renamed_' + 'b'.repeat(100) + '.txt';
      vol.writeFileSync('/export/' + oldName, 'data');
      vol.writeFileSync('/export/._' + oldName, 'xattr');
      const lookupRes = await client.compound([nfs.PUTROOTFH(), nfs.LOOKUP('._' + oldName), nfs.GETFH()]);
      expect(lookupRes.status).toBe(Nfsv4Stat.NFS4_OK);
      const appleDoubleFh = (lookupRes.resarray[2] as msg.Nfsv4GetfhResponse).resok!.object;
      const renameRes = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME(oldName, newName)]);
      expect(renameRes.status).toBe(Nfsv4Stat.NFS4_OK);
      const getAttrRes = await client.compound([nfs.PUTFH(appleDoubleFh), nfs.GETATTR([0x00000020])]);
      expect(getAttrRes.status).toBe(Nfsv4Stat.NFS4_OK);
      await stop();
    });

    test('does not rename AppleDouble if it is a directory', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      vol.writeFileSync('/export/test.txt', 'data');
      vol.mkdirSync('/export/._test.txt');
      const res = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME('test.txt', 'new.txt')]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/new.txt')).toBe(true);
      expect(vol.existsSync('/export/._test.txt')).toBe(true);
      expect(vol.statSync('/export/._test.txt').isDirectory()).toBe(true);
      await stop();
    });

    test('handles case where main file starts with ._', async () => {
      const {client, stop, vol} = await setupNfsClientServerTestbed();
      vol.writeFileSync('/export/._special.txt', 'data');
      vol.writeFileSync('/export/._._special.txt', 'xattr');
      const res = await client.compound([nfs.PUTROOTFH(), nfs.SAVEFH(), nfs.RENAME('._special.txt', '._renamed.txt')]);
      expect(res.status).toBe(Nfsv4Stat.NFS4_OK);
      expect(vol.existsSync('/export/._renamed.txt')).toBe(true);
      expect(vol.existsSync('/export/._._renamed.txt')).toBe(true);
      expect(vol.existsSync('/export/._special.txt')).toBe(false);
      expect(vol.existsSync('/export/._._special.txt')).toBe(false);
      await stop();
    });
  });
});

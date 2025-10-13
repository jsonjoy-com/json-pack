import {setupNfsClientServerTestbed} from '../../server/__tests__/setup';
import {Nfsv4FsClient} from '../Nfsv4FsClient';

describe('.readFile()', () => {
  test('can read files as text', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const text = await fs.readFile('file.txt', 'utf8');
    expect(text).toBe('Hello, NFS v4!\n');;
    await stop();
  });

  test('can read files as buffer', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const buffer = await fs.readFile('file.txt');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString('utf8')).toBe('Hello, NFS v4!\n');
    await stop();
  });

  test('can read nested files', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const text = await fs.readFile('/subdir/nested.dat', 'utf8');
    expect(text).toBe('nested data');
    await stop();
  });
});

describe('.writeFile()', () => {
  test('can write text to file', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    await fs.writeFile('file.txt', 'New content!');
    const text = await fs.readFile('file.txt', 'utf8');
    expect(text).toBe('New content!');
    await stop();
  });

  test('can write buffer to file', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const data = Buffer.from('Binary data');
    await fs.writeFile('file.txt', data);
    const content = vol.readFileSync('/export/file.txt');
    expect(Buffer.from(content as any).toString()).toBe('Binary data');
    await stop();
  });

  test('can create a new file', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    await fs.writeFile('new_file.md', 'abc');
    const text = await fs.readFile('/new_file.md', 'utf8');
    expect(text).toBe('abc');
    await stop();
  });

  test('can write to nested file', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    await fs.writeFile('subdir/nested.dat', 'Updated nested');
    const content = vol.readFileSync('/export/subdir/nested.dat', 'utf8');
    expect(content).toBe('Updated nested');
    await stop();
  });
});

describe('.stat()', () => {
  test('can stat a file', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const stats = await fs.stat('file.txt');
    expect(stats.isFile()).toBe(true);
    expect(stats.isDirectory()).toBe(false);
    expect(stats.size).toBe(15);
    expect(stats.mode).toBeGreaterThan(0);
    expect(stats.nlink).toBeGreaterThan(0);
    await stop();
  });

  test('can stat a directory', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const stats = await fs.stat('subdir');
    expect(stats.isDirectory()).toBe(true);
    expect(stats.isFile()).toBe(false);
    await stop();
  });

  test('can stat nested file', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const stats = await fs.stat('subdir/nested.dat');
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBe(11);
    expect(stats.ctimeMs <= Date.now()).toBe(true);
    await stop();
  });
});

describe('.mkdir()', () => {
  test('can create a directory', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    await fs.mkdir('newdir');
    const stats = await fs.stat('newdir');
    expect(stats.isDirectory()).toBe(true);
    await stop();
  });

  test('can create nested directory', async () => {
    const {client, stop, vol} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    await fs.mkdir('subdir/newsubdir');
    const stats = await fs.stat('subdir/newsubdir');
    expect(stats.isDirectory()).toBe(true);
    await stop();
  });
});

describe('.readdir()', () => {
  test('can read directory entries', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const entries = await fs.readdir('/');
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries).toContain('file.txt');
    expect(entries).toContain('subdir');
    await stop();
  });

  test('does not create directories recursively', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    expect(fs.readdir('/subdir/a/b')).rejects.toThrow();
    await stop();
  });

  test('can read directory with file types', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const entries = await fs.readdir('/', {withFileTypes: true}) as any[];
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    const fileEntry = entries.find((e: any) => e.name === 'file.txt');
    expect(fileEntry).toBeDefined();
    expect(fileEntry.isFile()).toBe(true);
    expect(fileEntry.isDirectory()).toBe(false);
    const dirEntry = entries.find((e: any) => e.name === 'subdir');
    expect(dirEntry).toBeDefined();
    expect(dirEntry.isDirectory()).toBe(true);
    expect(dirEntry.isFile()).toBe(false);
    await stop();
  });

  test('can read nested directory', async () => {
    const {client, stop} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const entries = await fs.readdir('subdir');
    expect(Array.isArray(entries)).toBe(true);
    expect(entries).toContain('nested.dat');
    await stop();
  });
});

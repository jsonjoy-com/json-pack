import {setupNfsClientServerTestbed} from "../../server/__tests__/setup";
import {Nfsv4FsClient} from "../Nfsv4FsClient";

describe('.readFile()', () => {
  test('can read files as text', async () => {
    const {client} = await setupNfsClientServerTestbed();
    const fs = new Nfsv4FsClient(client);
    const text = await fs.readFile('/export/file.txt', 'utf8');
    expect(text).toBe('Hello, NFS v4!\n');
  });
});

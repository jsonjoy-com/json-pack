import {Nfsv4OperationsNode} from '../operations/node/Nfsv4OperationsNode';
import {Nfsv4TcpServer} from '../Nfsv4TcpServer';
import {fs, vol} from 'memfs';

vol.fromJSON({
  '/export': null,
  '/export/file.txt': 'Hello, NFS v4!\n',
});

// tslint:disable-next-line:no-console
console.log(vol.toJSON());

const ops = new Nfsv4OperationsNode({fs: <any>fs, dir: '/'});
Nfsv4TcpServer.start({ops, debug: true});

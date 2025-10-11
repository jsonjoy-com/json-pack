import {Nfsv4OperationsNode} from '../Nfsv4OperationsNode';
import {Nfsv4TcpServer} from '../Nfsv4TcpServer';
import {fs} from 'memfs';

const ops = new Nfsv4OperationsNode({fs: <any>fs, dir: '/'});
Nfsv4TcpServer.start({ops, debug: true});

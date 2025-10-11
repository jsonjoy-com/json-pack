import {Nfsv4OperationsNotImpl} from '../Nfsv4OperationsNotImpl';
import {Nfsv4TcpServer} from '../Nfsv4TcpServer';

const ops = new Nfsv4OperationsNotImpl();
Nfsv4TcpServer.start({ops, debug: true});

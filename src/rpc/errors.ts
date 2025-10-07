export class RpcDecodingError extends Error {
  constructor(message = 'RPC_DECODING') {
    super(message);
  }
}

export class RpcEncodingError extends Error {
  constructor(message = 'RPC_ENCODING') {
    super(message);
  }
}

# json-pack

High performance JSON serialization and deserialization library for JavaScript, Node.js, browser.

`json-pack` contains implementations of various JSON codecs into binary formats, such as MessagePack, CBOR and other formats.

## Supported Formats

This library implements the following serialization formats:

- **[MessagePack](./docs/msgpack.md)** - Fast and lean implementation of MessagePack codec
- **[CBOR](./docs/cbor.md)** - Concise Binary Object Representation codec
- **[UBJSON](./docs/ubjson.md)** - Universal Binary JSON codec  
- **[JSON](./docs/json.md)** - Enhanced JSON encoder/decoder with additional features
- **[JSON Binary](./docs/json-binary.md)** - JSON with binary data support using Uint8Array
- **[Amazon Ion](./docs/ion.md)** - Amazon's Ion data serialization format
- **[BSON](./docs/bson.md)** - Binary JSON format used by MongoDB
- **[RESP](./docs/resp.md)** - Redis Serialization Protocol (v2 and v3)
- **[Bencode](./docs/bencode.md)** - BitTorrent's encoding format

Each format comes with optimized encoders and decoders designed for maximum performance.

## Installation

```bash
npm install @jsonjoy.com/json-pack
```

## Quick Start

```ts
import {MessagePackEncoder, MessagePackDecoder} from '@jsonjoy.com/json-pack/lib/msgpack';

const encoder = new MessagePackEncoder();
const decoder = new MessagePackDecoder();

const data = {hello: 'world', numbers: [1, 2, 3]};
const binary = encoder.encode(data);
const restored = decoder.decode(binary);

console.log(restored); // {hello: 'world', numbers: [1, 2, 3]}
```

## Documentation

For detailed documentation on each codec, see the [docs/](./docs/) folder:

- [Complete documentation index](./docs/README.md)
- Individual codec documentation linked above in the "Supported Formats" section

## Benchmarks

For comprehensive performance benchmarks comparing `json-pack` with other serialization libraries, see:

- [📊 Complete Benchmark Results](./docs/benchmarks.md) - Detailed encoding, decoding, and performance comparisons
- [🚀 Benchmarking JSON Serialization Codecs](https://jsonjoy.com/blog/json-codec-benchmarks) - Analysis showing that `json-pack` is the fastest serialization library in the NPM ecosystem

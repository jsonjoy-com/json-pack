# json-pack

High performance JSON serialization and deserialization library for JavaScript, Node.js, browser.

`json-pack` contains implementations of various JSON codecs into binary formats, such as MessagePack, CBOR and other formats.

## Supported Formats

This library implements the following serialization formats:

- **[MessagePack](./src/msgpack/README.md)** - Fast and lean implementation of MessagePack codec
- **[CBOR](./src/cbor/README.md)** - Concise Binary Object Representation codec
- **[UBJSON](./src/ubjson/README.md)** - Universal Binary JSON codec  
- **[JSON](./src/json/README.md)** - Enhanced JSON encoder/decoder with additional features
- **[JSON Binary](./src/json-binary/README.md)** - JSON with binary data support using Uint8Array
- **[Amazon Ion](./src/ion/README.md)** - Amazon's Ion data serialization format
- **[BSON](./src/bson/README.md)** - Binary JSON format used by MongoDB
- **[RESP](./src/resp/README.md)** - Redis Serialization Protocol (v2 and v3)
- **[Bencode](./src/bencode/README.md)** - BitTorrent's encoding format

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

For detailed documentation on each codec, refer to the individual README files in their respective folders:

- Individual codec documentation is available in each `src/<codec>/README.md` file
- Each codec includes comprehensive usage examples, API documentation, and performance benchmarks

## Benchmarks

The `json-pack` library consistently demonstrates superior performance across various data types and sizes. For comprehensive performance benchmarks and detailed analysis, see:

- [🚀 Benchmarking JSON Serialization Codecs](https://jsonjoy.com/blog/json-codec-benchmarks) - Analysis showing that `json-pack` is the fastest serialization library in the NPM ecosystem

Each codec also includes specific benchmark results in their individual documentation files.

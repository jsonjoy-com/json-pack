# json-pack Documentation

Welcome to the `json-pack` documentation. This library provides high-performance implementations of various binary serialization formats for JavaScript.

## Available Codecs

### Binary Formats

- **[MessagePack](./msgpack.md)** - Fast and efficient binary serialization format
  - Compact binary representation
  - Support for binary data and extensions
  - Fastest JavaScript implementation

- **[CBOR](./cbor.md)** - Concise Binary Object Representation (RFC 7049)
  - Self-describing binary format
  - Rich data type support
  - DAG-CBOR variant available

- **[UBJSON](./ubjson.md)** - Universal Binary JSON
  - Binary JSON with type information
  - Fixed-length encoding for better performance
  - Support for typed arrays

- **[BSON](./bson.md)** - Binary JSON (MongoDB format)
  - Document-oriented binary format
  - Rich type system including dates and binary data
  - MongoDB-compatible implementation

### Protocol Formats

- **[RESP](./resp.md)** - Redis Serialization Protocol
  - RESP2 and RESP3 support
  - Streaming decoder available
  - Redis-compatible implementation

- **[Amazon Ion](./ion.md)** - Amazon's data format
  - Self-describing with rich type system
  - Binary and text representations
  - Symbol table support

### Network/Transfer Formats

- **[Bencode](./bencode.md)** - BitTorrent encoding format
  - Simple binary encoding
  - Dictionary ordering for reproducible output
  - Extensions for additional types

### Enhanced JSON

- **[JSON](./json.md)** - High-performance JSON encoder/decoder
  - Faster than native JSON in many cases
  - Optimized for repeated operations
  - Binary-safe implementation

- **[JSON Binary](./json-binary.md)** - JSON with binary data support
  - Uint8Array support via Base64 encoding
  - Drop-in replacement for JSON with binary data

## Performance

All codecs in this library are optimized for performance and typically outperform other JavaScript implementations. Each codec documentation includes detailed benchmarks comparing performance against popular alternatives.

## Usage Patterns

### Basic Usage

```ts
import {MessagePackEncoder, MessagePackDecoder} from 'json-pack/lib/msgpack';

const encoder = new MessagePackEncoder();
const decoder = new MessagePackDecoder();

const data = {hello: 'world', count: 42};
const encoded = encoder.encode(data);
const decoded = decoder.decode(encoded);
```

### Streaming Usage

Many codecs support streaming operations for handling large datasets:

```ts
import {RespStreamingDecoder} from 'json-pack/lib/resp';

const decoder = new RespStreamingDecoder();
// Process streaming data...
```

### Binary Data

Several codecs support efficient binary data handling:

```ts
import {MessagePackEncoderFull} from 'json-pack/lib/msgpack';

const encoder = new MessagePackEncoderFull();
const data = {
  text: 'hello',
  binary: new Uint8Array([1, 2, 3, 4])
};
const encoded = encoder.encode(data);
```

## Choosing a Format

- **MessagePack**: Best general-purpose binary format, fastest performance
- **CBOR**: Standards-compliant, rich type system, good for interoperability  
- **BSON**: When working with MongoDB or need document-oriented features
- **RESP**: For Redis protocol compatibility
- **Ion**: When you need Amazon Ion compatibility or rich type annotations
- **JSON**: When you need text format with better performance than native JSON
- **Bencode**: For BitTorrent protocol compatibility
- **UBJSON**: When you need typed binary JSON

Each format has its strengths - choose based on your specific requirements for performance, compatibility, and features.
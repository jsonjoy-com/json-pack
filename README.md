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

Encoding:

```
npx ts-node benchmarks/json-pack/bench.encoding.ts 
=============================================================================== Benchmark: Encoding
Warmup: 1000x , Node.js: v20.0.0 , Arch: arm64 , CPU: Apple M1
---------------------------------------------------------------------------- Small object, 44 bytes
🤞 json-pack JsonEncoder x 5,385,617 ops/sec ±0.53% (100 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 2,254,954 ops/sec ±0.83% (97 runs sampled)
🤞 json-pack CborEncoderFast x 5,953,159 ops/sec ±1.12% (92 runs sampled)
🤞 json-pack CborEncoder x 6,248,036 ops/sec ±0.29% (98 runs sampled)
🤞 json-pack MsgPackEncoderFast x 3,121,940 ops/sec ±0.16% (99 runs sampled)
🤞 JSON.stringify() x 3,866,116 ops/sec ±0.11% (101 runs sampled)
🤞 @msgpack/msgpack x 1,406,546 ops/sec ±0.94% (93 runs sampled)
🤞 msgpackr x 2,404,916 ops/sec ±3.22% (86 runs sampled)
🤞 cbor-x x 4,737,433 ops/sec ±1.00% (97 runs sampled)
🤞 msgpack-lite x 987,201 ops/sec ±2.84% (91 runs sampled)
🤞 msgpack5 x 197,867 ops/sec ±3.65% (84 runs sampled)
🤞 messagepack x 171,865 ops/sec ±4.44% (74 runs sampled)
Fastest is 🤞 json-pack CborEncoder
------------------------------------------------------------------------- Typical object, 993 bytes
🤞 json-pack JsonEncoder x 299,970 ops/sec ±0.30% (97 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 211,651 ops/sec ±0.18% (100 runs sampled)
🤞 json-pack CborEncoderFast x 429,535 ops/sec ±3.38% (93 runs sampled)
🤞 json-pack CborEncoder x 428,848 ops/sec ±0.71% (97 runs sampled)
🤞 json-pack MsgPackEncoderFast x 322,982 ops/sec ±0.67% (97 runs sampled)
🤞 JSON.stringify() x 306,828 ops/sec ±1.94% (90 runs sampled)
🤞 @msgpack/msgpack x 199,937 ops/sec ±5.52% (93 runs sampled)
🤞 msgpackr x 317,457 ops/sec ±2.18% (90 runs sampled)
🤞 cbor-x x 401,854 ops/sec ±3.20% (92 runs sampled)
🤞 msgpack-lite x 135,110 ops/sec ±1.29% (94 runs sampled)
🤞 msgpack5 x 15,217 ops/sec ±3.72% (85 runs sampled)
🤞 messagepack x 13,853 ops/sec ±4.73% (71 runs sampled)
Fastest is 🤞 json-pack CborEncoder
-------------------------------------------------------------------------- Large object, 3741 bytes
🤞 json-pack JsonEncoder x 87,312 ops/sec ±1.10% (96 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 64,718 ops/sec ±0.45% (96 runs sampled)
🤞 json-pack CborEncoderFast x 134,615 ops/sec ±0.19% (97 runs sampled)
🤞 json-pack CborEncoder x 128,975 ops/sec ±0.20% (98 runs sampled)
🤞 json-pack MsgPackEncoderFast x 103,325 ops/sec ±1.62% (98 runs sampled)
🤞 JSON.stringify() x 101,067 ops/sec ±1.36% (95 runs sampled)
🤞 @msgpack/msgpack x 61,715 ops/sec ±0.22% (98 runs sampled)
🤞 msgpackr x 95,175 ops/sec ±3.84% (95 runs sampled)
🤞 cbor-x x 111,658 ops/sec ±1.34% (95 runs sampled)
🤞 msgpack-lite x 41,364 ops/sec ±0.28% (100 runs sampled)
🤞 msgpack5 x 3,262 ops/sec ±4.32% (71 runs sampled)
🤞 messagepack x 4,167 ops/sec ±7.29% (65 runs sampled)
Fastest is 🤞 json-pack CborEncoderFast
-------------------------------------------------------------------- Very large object, 45750 bytes
🤞 json-pack JsonEncoder x 5,687 ops/sec ±1.92% (94 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 5,813 ops/sec ±2.51% (97 runs sampled)
🤞 json-pack CborEncoderFast x 5,749 ops/sec ±0.67% (98 runs sampled)
🤞 json-pack CborEncoder x 5,515 ops/sec ±0.70% (98 runs sampled)
🤞 json-pack MsgPackEncoderFast x 5,027 ops/sec ±0.19% (100 runs sampled)
🤞 JSON.stringify() x 7,687 ops/sec ±0.87% (99 runs sampled)
🤞 @msgpack/msgpack x 3,379 ops/sec ±2.20% (97 runs sampled)
🤞 msgpackr x 5,929 ops/sec ±15.26% (96 runs sampled)
🤞 cbor-x x 5,032 ops/sec ±5.17% (90 runs sampled)
🤞 msgpack-lite x 2,173 ops/sec ±1.17% (97 runs sampled)
🤞 msgpack5 x 179 ops/sec ±2.95% (68 runs sampled)
🤞 messagepack x 167 ops/sec ±1.09% (79 runs sampled)
Fastest is 🤞 JSON.stringify()
------------------------------------------------------------------ Object with many keys, 969 bytes
🤞 json-pack JsonEncoder x 213,447 ops/sec ±3.31% (95 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 168,303 ops/sec ±2.13% (95 runs sampled)
🤞 json-pack CborEncoderFast x 275,511 ops/sec ±0.40% (95 runs sampled)
🤞 json-pack CborEncoder x 270,949 ops/sec ±0.32% (97 runs sampled)
🤞 json-pack MsgPackEncoderFast x 210,525 ops/sec ±0.66% (99 runs sampled)
🤞 JSON.stringify() x 200,767 ops/sec ±0.19% (101 runs sampled)
🤞 @msgpack/msgpack x 163,665 ops/sec ±0.81% (98 runs sampled)
🤞 msgpackr x 151,889 ops/sec ±0.27% (96 runs sampled)
🤞 cbor-x x 191,010 ops/sec ±0.44% (96 runs sampled)
🤞 msgpack-lite x 93,537 ops/sec ±0.68% (99 runs sampled)
🤞 msgpack5 x 28,581 ops/sec ±1.74% (93 runs sampled)
🤞 messagepack x 8,330 ops/sec ±5.00% (61 runs sampled)
Fastest is 🤞 json-pack CborEncoderFast
------------------------------------------------------------------------- String ladder, 3398 bytes
🤞 json-pack JsonEncoder x 147,755 ops/sec ±0.23% (97 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 128,378 ops/sec ±0.15% (96 runs sampled)
🤞 json-pack CborEncoderFast x 298,037 ops/sec ±0.73% (98 runs sampled)
🤞 json-pack CborEncoder x 293,608 ops/sec ±0.22% (97 runs sampled)
🤞 json-pack MsgPackEncoderFast x 244,864 ops/sec ±3.92% (92 runs sampled)
🤞 JSON.stringify() x 165,819 ops/sec ±1.72% (94 runs sampled)
🤞 @msgpack/msgpack x 166,915 ops/sec ±0.79% (96 runs sampled)
🤞 msgpackr x 218,733 ops/sec ±0.24% (97 runs sampled)
🤞 cbor-x x 257,148 ops/sec ±0.79% (96 runs sampled)
🤞 msgpack-lite x 98,386 ops/sec ±0.31% (99 runs sampled)
🤞 msgpack5 x 23,063 ops/sec ±2.11% (92 runs sampled)
🤞 messagepack x 22,926 ops/sec ±1.93% (96 runs sampled)
Fastest is 🤞 json-pack CborEncoderFast
-------------------------------------------------------------------------- Long strings, 7011 bytes
🤞 json-pack JsonEncoder x 44,071 ops/sec ±0.17% (98 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 29,649 ops/sec ±0.15% (99 runs sampled)
🤞 json-pack CborEncoderFast x 394,582 ops/sec ±0.47% (96 runs sampled)
🤞 json-pack CborEncoder x 395,254 ops/sec ±0.51% (95 runs sampled)
🤞 json-pack MsgPackEncoderFast x 395,165 ops/sec ±0.46% (95 runs sampled)
🤞 JSON.stringify() x 31,269 ops/sec ±0.13% (96 runs sampled)
🤞 @msgpack/msgpack x 28,003 ops/sec ±0.17% (100 runs sampled)
🤞 msgpackr x 379,697 ops/sec ±0.22% (100 runs sampled)
🤞 cbor-x x 378,755 ops/sec ±0.24% (99 runs sampled)
🤞 msgpack-lite x 30,014 ops/sec ±0.27% (98 runs sampled)
🤞 msgpack5 x 8,728 ops/sec ±2.58% (87 runs sampled)
🤞 messagepack x 5,698 ops/sec ±1.52% (93 runs sampled)
Fastest is 🤞 json-pack CborEncoder
-------------------------------------------------------------------------- Short strings, 170 bytes
🤞 json-pack JsonEncoder x 1,596,816 ops/sec ±0.18% (98 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 1,000,770 ops/sec ±0.21% (99 runs sampled)
🤞 json-pack CborEncoderFast x 1,861,503 ops/sec ±0.19% (96 runs sampled)
🤞 json-pack CborEncoder x 1,837,269 ops/sec ±0.20% (96 runs sampled)
🤞 json-pack MsgPackEncoderFast x 1,653,764 ops/sec ±0.19% (98 runs sampled)
🤞 JSON.stringify() x 1,263,415 ops/sec ±0.18% (98 runs sampled)
🤞 @msgpack/msgpack x 859,458 ops/sec ±0.18% (97 runs sampled)
🤞 msgpackr x 1,519,094 ops/sec ±0.18% (99 runs sampled)
🤞 cbor-x x 1,506,899 ops/sec ±0.22% (98 runs sampled)
🤞 msgpack-lite x 670,264 ops/sec ±0.26% (98 runs sampled)
🤞 msgpack5 x 214,616 ops/sec ±3.42% (84 runs sampled)
🤞 messagepack x 190,509 ops/sec ±4.26% (80 runs sampled)
Fastest is 🤞 json-pack CborEncoderFast
-------------------------------------------------------------------------------- Numbers, 136 bytes
🤞 json-pack JsonEncoder x 1,706,331 ops/sec ±0.20% (95 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 1,218,204 ops/sec ±0.17% (98 runs sampled)
🤞 json-pack CborEncoderFast x 2,823,618 ops/sec ±0.16% (97 runs sampled)
🤞 json-pack CborEncoder x 3,108,652 ops/sec ±0.20% (97 runs sampled)
🤞 json-pack MsgPackEncoderFast x 2,918,919 ops/sec ±0.16% (99 runs sampled)
🤞 JSON.stringify() x 1,495,325 ops/sec ±0.24% (98 runs sampled)
🤞 @msgpack/msgpack x 1,090,049 ops/sec ±0.22% (95 runs sampled)
🤞 msgpackr x 2,273,659 ops/sec ±0.18% (97 runs sampled)
🤞 cbor-x x 2,214,015 ops/sec ±0.20% (96 runs sampled)
🤞 msgpack-lite x 754,726 ops/sec ±0.24% (97 runs sampled)
🤞 msgpack5 x 281,932 ops/sec ±2.38% (93 runs sampled)
🤞 messagepack x 236,081 ops/sec ±3.84% (77 runs sampled)
Fastest is 🤞 json-pack CborEncoder
--------------------------------------------------------------------------------- Tokens, 308 bytes
🤞 json-pack JsonEncoder x 1,406,862 ops/sec ±0.24% (95 runs sampled)
🤞 Buffer.from(JSON.stringify()) x 1,095,439 ops/sec ±0.17% (100 runs sampled)
🤞 json-pack CborEncoderFast x 1,359,989 ops/sec ±0.21% (96 runs sampled)
🤞 json-pack CborEncoder x 1,366,892 ops/sec ±0.19% (99 runs sampled)
🤞 json-pack MsgPackEncoderFast x 1,751,776 ops/sec ±0.17% (99 runs sampled)
🤞 JSON.stringify() x 1,309,064 ops/sec ±0.21% (98 runs sampled)
🤞 @msgpack/msgpack x 876,712 ops/sec ±0.20% (97 runs sampled)
🤞 msgpackr x 1,463,658 ops/sec ±0.17% (99 runs sampled)
🤞 cbor-x x 1,379,536 ops/sec ±0.20% (97 runs sampled)
🤞 msgpack-lite x 596,536 ops/sec ±0.23% (97 runs sampled)
🤞 msgpack5 x 181,745 ops/sec ±3.37% (82 runs sampled)
🤞 messagepack x 146,090 ops/sec ±4.36% (80 runs sampled)
Fastest is 🤞 json-pack MsgPackEncoderFast
```

Each codec also includes specific benchmark results in their individual documentation files.

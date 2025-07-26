# Bencode Codec

Implements [Bencode][bencode] encoder and decoder.

[bencode]: https://en.wikipedia.org/wiki/Bencode

## Features

- High-performance Bencode encoding and decoding
- Support for all standard Bencode types
- Extensions for additional JavaScript types
- BitTorrent-compatible implementation

## Basic Usage

```ts
import {BencodeEncoder, BencodeDecoder} from '@jsonjoy.com/json-pack/lib/bencode';

const encoder = new BencodeEncoder();
const decoder = new BencodeDecoder();

const data = {
  name: 'example.torrent',
  length: 1024,
  files: ['file1.txt', 'file2.txt']
};

const encoded = encoder.encode(data);
const decoded = decoder.decode(encoded);

console.log(decoded); // Original data structure
```

## Type Coercion

- Strings and `Uint8Array` are encoded as Bencode byte strings, decoded as `Uint8Array`.
- `Object` and `Map` are encoded as Bencode dictionaries, decoded as `Object`.
- `Array` and `Set` are encoded as Bencode lists, decoded as `Array`.
- `number` and `bigint` are encoded as Bencode integers, decoded as `number`.
- Float `number` are rounded and encoded as Bencode integers, decoded as `number`.

## Extensions

This codec extends the Bencode specification to support the following types:

- `null` (encoded as `n`)
- `undefined` (encoded as `u`)
- `boolean` (encoded as `t` for `true` and `f` for `false`)

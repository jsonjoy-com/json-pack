## Benchmarks

Encoding:

```
npx ts-node benchmarks/json-pack/bench.ion.encoding.ts
=============================================================================== Benchmark: Encoding
Warmup: 1000x , Node.js: v18.16.0 , Arch: arm64 , CPU: Apple M1 Max
---------------------------------------------------------------------------- Small object, 44 bytes
👍 json-joy/json-pack IonEncoderFast x 1,021,876 ops/sec ±0.47% (99 runs sampled)
👍 ion-js x 27,391 ops/sec ±2.69% (68 runs sampled)
👍 Buffer.from(JSON.stringify()) x 2,269,009 ops/sec ±0.40% (99 runs sampled)
Fastest is 👍 Buffer.from(JSON.stringify())
------------------------------------------------------------------------- Typical object, 993 bytes
👍 json-joy/json-pack IonEncoderFast x 69,443 ops/sec ±0.35% (99 runs sampled)
👎 ion-js x 3,723 ops/sec ±3.07% (53 runs sampled)
👎 Buffer.from(JSON.stringify()) x 214,308 ops/sec ±0.34% (98 runs sampled)
Fastest is 👎 Buffer.from(JSON.stringify())
-------------------------------------------------------------------------- Large object, 3741 bytes
👍 json-joy/json-pack IonEncoderFast x 11,696 ops/sec ±0.33% (101 runs sampled)
👎 ion-js x 1,213 ops/sec ±2.93% (62 runs sampled)
👎 Buffer.from(JSON.stringify()) x 67,074 ops/sec ±0.35% (96 runs sampled)
Fastest is 👎 Buffer.from(JSON.stringify())
-------------------------------------------------------------------- Very large object, 45750 bytes
👍 json-joy/json-pack IonEncoderFast x 1,892 ops/sec ±0.43% (100 runs sampled)
👍 ion-js x 65.56 ops/sec ±3.14% (58 runs sampled)
👍 Buffer.from(JSON.stringify()) x 5,957 ops/sec ±0.36% (97 runs sampled)
Fastest is 👍 Buffer.from(JSON.stringify())
------------------------------------------------------------------ Object with many keys, 969 bytes
👍 json-joy/json-pack IonEncoderFast x 64,855 ops/sec ±0.32% (96 runs sampled)
👎 ion-js x 2,299 ops/sec ±4.32% (51 runs sampled)
👎 Buffer.from(JSON.stringify()) x 174,044 ops/sec ±0.32% (97 runs sampled)
Fastest is 👎 Buffer.from(JSON.stringify())
------------------------------------------------------------------------- String ladder, 3398 bytes
👍 json-joy/json-pack IonEncoderFast x 26,020 ops/sec ±0.33% (99 runs sampled)
👍 ion-js x 10,668 ops/sec ±5.02% (80 runs sampled)
👍 Buffer.from(JSON.stringify()) x 129,722 ops/sec ±0.35% (96 runs sampled)
Fastest is 👍 Buffer.from(JSON.stringify())
-------------------------------------------------------------------------- Long strings, 7011 bytes
👎 json-joy/json-pack IonEncoderFast x 11,837 ops/sec ±0.49% (96 runs sampled)
👍 ion-js x 8,749 ops/sec ±3.80% (85 runs sampled)
👍 Buffer.from(JSON.stringify()) x 29,769 ops/sec ±0.36% (101 runs sampled)
Fastest is 👍 Buffer.from(JSON.stringify())
-------------------------------------------------------------------------- Short strings, 170 bytes
👍 json-joy/json-pack IonEncoderFast x 435,230 ops/sec ±0.39% (96 runs sampled)
👍 ion-js x 42,636 ops/sec ±8.11% (66 runs sampled)
👍 Buffer.from(JSON.stringify()) x 1,013,889 ops/sec ±0.46% (96 runs sampled)
Fastest is 👍 Buffer.from(JSON.stringify())
-------------------------------------------------------------------------------- Numbers, 136 bytes
👍 json-joy/json-pack IonEncoderFast x 484,353 ops/sec ±0.41% (97 runs sampled)
👍 ion-js x 17,032 ops/sec ±14.67% (70 runs sampled)
👍 Buffer.from(JSON.stringify()) x 1,196,228 ops/sec ±0.40% (99 runs sampled)
Fastest is 👍 Buffer.from(JSON.stringify())
--------------------------------------------------------------------------------- Tokens, 308 bytes
👍 json-joy/json-pack IonEncoderFast x 328,346 ops/sec ±0.45% (96 runs sampled)
👍 ion-js x 55,922 ops/sec ±4.56% (79 runs sampled)
👍 Buffer.from(JSON.stringify()) x 991,593 ops/sec ±0.45% (97 runs sampled)
Fastest is 👍 Buffer.from(JSON.stringify())
```

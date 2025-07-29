# Smile Codec

A high-performance JavaScript implementation of the Smile binary format, compatible with the JSON data model.

## Overview

Smile is an efficient JSON-compatible binary data format developed by the Jackson JSON processor project team. It provides significant space and parsing efficiency improvements over JSON while maintaining full compatibility with the JSON data model.

## Features

- **Full Smile Format Support**: Implements Smile format specification v1.0.6
- **High Performance**: Optimized encoder and decoder for maximum throughput
- **Shared String Optimization**: Automatic deduplication of repeated strings and property names
- **Safe Binary Encoding**: 7-bit encoding to avoid reserved byte values
- **Comprehensive Type Support**: All JavaScript types including binary data
- **Round-trip Integrity**: Perfect fidelity for all supported data types

## Usage

### Basic Encoding/Decoding

```typescript
import {SmileEncoder, SmileDecoder} from '@jsonjoy.com/json-pack/smile';

// Encode JavaScript value to Smile binary format
const encoder = SmileEncoder.create();
const encoded = encoder.encode({name: 'John', age: 30});

// Decode Smile binary format back to JavaScript value
const decoder = SmileDecoder.create(encoded);
const decoded = decoder.decode();
console.log(decoded); // {name: 'John', age: 30}
```

### Configuration Options

```typescript
// Encoder options
const encoder = SmileEncoder.create({
  sharedStringValues: true,    // Enable shared value string optimization
  sharedPropertyNames: true,   // Enable shared property name optimization  
  rawBinaryEnabled: false      // Allow raw binary data (may contain reserved bytes)
});

// Decoder options
const decoder = SmileDecoder.create(encoded, {
  maxSharedReferences: 1024    // Maximum size for shared string tables
});
```

## Data Type Support

| JavaScript Type | Smile Encoding | Notes |
|-----------------|----------------|-------|
| `null` | Null token | Single byte |
| `boolean` | Boolean tokens | Single byte each |
| `number` (integer) | Variable-length integer | ZigZag encoded, 1-10 bytes |
| `number` (float) | IEEE 754 float/double | 7-bit encoded, 5/10 bytes |
| `string` | UTF-8 with length prefix | Optimized for ASCII, shared references |
| `Array` | Structure markers + elements | Nested encoding |
| `Object` | Structure markers + key/value pairs | Shared property names |
| `Uint8Array` | Safe binary encoding | 7-bit encoding by default |

## Performance Characteristics

- **Small Integers (-16 to +15)**: Single byte encoding
- **ASCII Strings (1-64 chars)**: Length-prefixed, no end markers
- **Shared Strings**: Automatic deduplication reduces size
- **Binary Data**: Safe 7-bit encoding avoids parsing issues

## Format Details

Smile format uses a 4-byte header followed by token-based encoding:

```
Header: 0x3A 0x29 0x0A [config byte]
        :    )    \n   version + flags
```

The format distinguishes between:
- **Value Mode**: For encoding data values
- **Key Mode**: For encoding object property names

## Limitations

- Very large integers beyond JavaScript's safe integer range are converted to strings
- Maximum shared reference table size is 1024 entries
- Some byte values (0xFE, 0xFF) are avoided in shared references as per specification

## Specification Compliance

This implementation follows the official Smile format specification v1.0.6, including:
- Proper header validation and version checking
- Correct token encoding for all value types  
- Shared string reference management with table rotation
- Safe binary encoding to avoid reserved byte values
- Long string handling with end markers

## Testing

The implementation includes comprehensive tests:
- Round-trip integrity tests
- Fuzzing tests with random data structures
- Edge case handling for large numbers and Unicode
- Shared string optimization verification
- Binary data encoding/decoding validation
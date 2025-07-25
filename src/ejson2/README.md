# EJSON v2 (MongoDB Extended JSON) Codec

This directory contains the implementation of MongoDB Extended JSON v2 codec, providing encoding and decoding functionality for BSON types in JSON format.

## Features

- **Canonical Mode**: Preserves all type information using explicit type wrapper objects
- **Relaxed Mode**: Uses native JSON types where possible for better readability
- **Full BSON Type Support**: Supports all BSON types as per MongoDB Extended JSON v2 specification
- **Strict Validation**: Prevents malformed type wrappers and provides clear error messages
- **Shared Value Classes**: Reuses BSON value classes from the existing `src/bson` module

## Usage

### Basic Example

```typescript
import { EjsonEncoder, EjsonDecoder, BsonObjectId, BsonInt64 } from '@jsonjoy.com/json-pack';

// Create sample data
const data = {
  _id: new BsonObjectId(0x507f1f77, 0xbcf86cd799, 0x439011),
  count: new BsonInt64(9223372036854775807),
  created: new Date('2023-01-15T10:30:00.000Z'),
  active: true
};

// Canonical mode (preserves all type information)
const canonicalEncoder = new EjsonEncoder({ canonical: true });
const canonicalJson = canonicalEncoder.encode(data);
console.log(canonicalJson);
// Output: {"_id":{"$oid":"507f1f77bcf86cd799439011"},"count":{"$numberLong":"9223372036854775807"},"created":{"$date":{"$numberLong":"1673778600000"}},"active":true}

// Relaxed mode (more readable)
const relaxedEncoder = new EjsonEncoder({ canonical: false });
const relaxedJson = relaxedEncoder.encode(data);
console.log(relaxedJson);
// Output: {"_id":{"$oid":"507f1f77bcf86cd799439011"},"count":9223372036854775807,"created":{"$date":"2023-01-15T10:30:00.000Z"},"active":true}

// Decoding
const decoder = new EjsonDecoder();
const decoded = decoder.decode(canonicalJson);
console.log(decoded._id instanceof BsonObjectId); // true
```

### Supported BSON Types

| BSON Type | Canonical Format | Relaxed Format |
|-----------|------------------|----------------|
| ObjectId | `{"$oid": "hex-string"}` | Same as canonical |
| Int32 | `{"$numberInt": "string"}` | Native JSON number |
| Int64 | `{"$numberLong": "string"}` | Native JSON number |
| Double | `{"$numberDouble": "string"}` | Native JSON number (except non-finite) |
| Decimal128 | `{"$numberDecimal": "string"}` | Same as canonical |
| Binary | `{"$binary": {"base64": "string", "subType": "hex"}}` | Same as canonical |
| UUID | `{"$uuid": "canonical-uuid-string"}` | Same as canonical |
| Code | `{"$code": "string"}` | Same as canonical |
| CodeWScope | `{"$code": "string", "$scope": object}` | Same as canonical |
| Symbol | `{"$symbol": "string"}` | Same as canonical |
| RegExp | `{"$regularExpression": {"pattern": "string", "options": "string"}}` | Same as canonical |
| Date | `{"$date": {"$numberLong": "timestamp"}}` | `{"$date": "ISO-8601"}` (years 1970-9999) |
| Timestamp | `{"$timestamp": {"t": number, "i": number}}` | Same as canonical |
| DBPointer | `{"$dbPointer": {"$ref": "string", "$id": ObjectId}}` | Same as canonical |
| MinKey | `{"$minKey": 1}` | Same as canonical |
| MaxKey | `{"$maxKey": 1}` | Same as canonical |
| Undefined | `{"$undefined": true}` | Same as canonical |

### Error Handling

The decoder performs strict validation and throws descriptive errors for malformed input:

```typescript
const decoder = new EjsonDecoder();

// Invalid ObjectId
try {
  decoder.decode('{"$oid": "invalid"}');
} catch (error) {
  console.log(error.message); // "Invalid ObjectId format"
}

// Type wrapper with extra fields
try {
  decoder.decode('{"$numberInt": "42", "extra": "field"}');
} catch (error) {
  console.log(error.message); // "Invalid Int32 format: extra keys not allowed"
}
```

## API Reference

### EjsonEncoder

```typescript
class EjsonEncoder {
  constructor(options?: EjsonEncoderOptions);
  encode(value: unknown): string;
}

interface EjsonEncoderOptions {
  canonical?: boolean; // Default: false (relaxed mode)
}
```

### EjsonDecoder

```typescript
class EjsonDecoder {
  constructor(options?: EjsonDecoderOptions);
  decode(json: string): unknown;
}

interface EjsonDecoderOptions {
  legacy?: boolean; // Default: false (strict mode)
}
```

## Specification Compliance

This implementation follows the [MongoDB Extended JSON v2 specification](https://github.com/mongodb/specifications/blob/master/source/extended-json.rst), ensuring compatibility with MongoDB tools and drivers.

## Testing

The implementation includes comprehensive tests covering:

- All BSON type encoding and decoding
- Both canonical and relaxed modes
- Round-trip compatibility
- Error handling and validation
- Edge cases and special values

Run tests with:
```bash
npm test src/ejson2
```
# CSON Codec

CSON (CoffeeScript Object Notation) codec for the json-pack library. CSON is a more human-readable alternative to JSON that supports comments, unquoted keys, and a more relaxed syntax.

## Features

- **Comments**: Support for single-line (`#`) and multi-line (`###`) comments
- **Unquoted keys**: Valid identifiers don't need quotes
- **Flexible arrays**: Arrays can be written without commas between elements
- **Multi-line strings**: Support for triple-quoted multi-line strings
- **Trailing commas**: Commas are optional in many contexts

## Usage

```typescript
import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {CsonEncoder, CsonDecoder} from '@jsonjoy.com/json-pack/lib/cson';

// Create encoder and decoder
const writer = new Writer();
const encoder = new CsonEncoder(writer);
const decoder = new CsonDecoder();

// Example data
const data = {
  name: 'json-pack',
  version: '1.0.0',
  features: ['fast', 'lightweight', 'flexible'],
  config: {
    debug: true,
    timeout: 5000
  }
};

// Encode to CSON
const encoded = encoder.encode(data);
const csonString = new TextDecoder().decode(encoded);
console.log(csonString);

// Decode from CSON
const decoded = decoder.decode(encoded);
console.log(decoded);
```

## CSON vs JSON

### JSON
```json
{
  "name": "example",
  "values": [1, 2, 3],
  "config": {
    "enabled": true
  }
}
```

### CSON
```coffeescript
# This is a comment
name: 'example'
values: [
  1
  2  
  3
]
config:
  enabled: true
```

## Multi-line Strings

CSON supports multi-line strings using triple quotes:

```coffeescript
description: '''
  This is a multi-line string
  that spans several lines
  and preserves formatting
'''
```

## Options

The `CsonEncoder` supports several options:

```typescript
const encoder = new CsonEncoder(writer, {
  indent: 4,              // Number of spaces for indentation (default: 2)
  includeComments: false  // Whether to include comments (default: false)
});
```

## Limitations

- Binary data is encoded as Buffer expressions (Node.js specific)
- The decoder requires the `cson-parser` library for parsing
- Some advanced CoffeeScript features are not supported in encoding
- Undefined values are serialized as the string "undefined"

## Performance

CSON is a text-based format, so it's generally slower than binary formats like MessagePack or CBOR, but it's more human-readable and editable. It's ideal for configuration files and data that needs to be manually edited.

## Examples

### Basic Values
```coffeescript
# CSON supports various data types
name: 'json-pack'
version: 1.0
active: true
data: null
```

### Complex Structures
```coffeescript
# Nested objects and arrays
config:
  database:
    host: 'localhost'
    port: 5432
    credentials:
      username: 'admin'
      password: 'secret'
      
  features: [
    'logging'
    'caching'  
    'monitoring'
  ]
  
  # Multi-line configuration
  description: '''
    This is the main configuration
    for the application server
  '''
```

### Arrays Without Commas
```coffeescript
# CSON allows arrays without commas
fruits: [
  'apple'
  'banana'
  'orange'
]

# Traditional comma-separated arrays also work
colors: ['red', 'green', 'blue']
```

For more information about CSON syntax, see the [CSON project](https://github.com/bevry/cson).
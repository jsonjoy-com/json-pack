import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {CsonEncoder, CsonDecoder} from '../';

// Example usage of CSON codec
const demoData = {
  name: 'json-pack-cson-demo',
  version: '1.0.0',
  config: {
    server: {
      host: 'localhost',
      port: 8080,
      ssl: true
    },
    database: {
      type: 'mongodb',
      uri: 'mongodb://localhost:27017/myapp'
    }
  },
  features: ['logging', 'monitoring', 'caching'],
  metadata: {
    'creation-date': '2023-12-01',
    'last-modified': '2023-12-25',
    tags: ['demo', 'example', 'cson'],
    description: 'A demonstration of CSON encoding and decoding capabilities'
  }
};

// Initialize encoder and decoder
const writer = new Writer();
const encoder = new CsonEncoder(writer, {
  indent: 2,
  includeComments: false
});
const decoder = new CsonDecoder();

// Encode to CSON
console.log('Original data:');
console.log(JSON.stringify(demoData, null, 2));

const encoded = encoder.encode(demoData);
const csonText = new TextDecoder().decode(encoded);

console.log('\nEncoded CSON:');
console.log(csonText);

// Decode back to JavaScript
const decoded = decoder.decode(encoded);

console.log('\nDecoded data:');
console.log(JSON.stringify(decoded, null, 2));

console.log('\nRound-trip successful:', JSON.stringify(demoData) === JSON.stringify(decoded));

// Demonstrate CSON-specific features
const csonWithComments = `
# Application Configuration
name: 'my-awesome-app'

# Server settings
server:
  host: 'localhost'
  port: 3000
  # Enable development mode
  debug: true

# Database configuration
database:
  type: 'postgresql'
  connection:
    host: 'db.example.com'
    port: 5432
    
# Feature list (no commas needed!)
features: [
  'authentication'
  'authorization'
  'logging'
  'monitoring'
]

# Multi-line description
description: '''
  This is a multi-line string
  that demonstrates CSON's support
  for readable text content.
'''
`;

console.log('\nDecoding CSON with comments and special features:');
const csonBytes = new TextEncoder().encode(csonWithComments);
const parsedCson = decoder.decode(csonBytes);
console.log(JSON.stringify(parsedCson, null, 2));

export {demoData, encoder, decoder};
import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {CsonEncoder, CsonDecoder} from '../';

describe('CSON Integration', () => {
  describe('codec integration', () => {
    it('should work as a standalone codec', () => {
      const writer = new Writer();
      const encoder = new CsonEncoder(writer);
      const decoder = new CsonDecoder();

      const originalData = {
        name: 'json-pack-cson',
        version: '1.0.0',
        features: ['comments', 'unquoted-keys', 'multiline-strings'],
        config: {
          debug: true,
          timeout: 5000,
          retries: 3
        },
        metadata: {
          'creation-date': '2023-12-01',
          description: 'A CSON codec implementation',
          tags: ['serialization', 'coffeescript', 'parsing']
        }
      };

      // Encode to CSON
      const encoded = encoder.encode(originalData);
      const csonText = new TextDecoder().decode(encoded);

      // Verify CSON output characteristics
      expect(csonText).toContain('name: ');
      expect(csonText).toContain('features: [');
      expect(csonText).toContain('config:');
      expect(csonText).toContain('debug: true');
      
      // Should use unquoted keys for valid identifiers
      expect(csonText).toContain('name: ');
      expect(csonText).not.toContain("'name':");
      
      // Should quote invalid identifier keys
      expect(csonText).toContain("'creation-date':");

      // Decode back to JavaScript
      const decoded = decoder.decode(encoded);

      // Verify round-trip
      expect(decoded).toEqual(originalData);
    });

    it('should handle complex CSON features during decode', () => {
      const complexCson = `
        # Configuration file
        name: 'my-app'
        
        # Server settings
        server:
          host: 'localhost'
          port: 3000
          # Enable SSL
          ssl: true
          
        # Database configuration  
        database:
          type: 'postgresql'
          connection:
            host: 'db.example.com'
            port: 5432
            
        # Multi-line description
        description: '''
          This is a complex application
          with multiple configuration options
          and detailed documentation.
        '''
        
        # Feature flags (array without commas)
        features: [
          'logging'
          'monitoring'
          'analytics'
          'caching'
        ]
        
        # Environment variables
        env:
          NODE_ENV: 'production'
          DEBUG: false
          'API_KEY': 'secret-key-value'
      `;

      const decoder = new CsonDecoder();
      const encoded = new TextEncoder().encode(complexCson);
      const result = decoder.decode(encoded) as any;

      expect(result).toHaveProperty('name', 'my-app');
      expect(result).toHaveProperty('server');
      expect(result.server).toHaveProperty('host', 'localhost');
      expect(result.server).toHaveProperty('port', 3000);
      expect(result.server).toHaveProperty('ssl', true);
      
      expect(result).toHaveProperty('database');
      expect(result.database).toHaveProperty('type', 'postgresql');
      expect(result.database.connection).toHaveProperty('host', 'db.example.com');
      
      expect(result).toHaveProperty('description');
      expect(result.description).toContain('complex application');
      expect(result.description).toContain('multiple configuration');
      
      expect(result).toHaveProperty('features');
      expect(result.features).toEqual(['logging', 'monitoring', 'analytics', 'caching']);
      
      expect(result).toHaveProperty('env');
      expect(result.env).toHaveProperty('NODE_ENV', 'production');
      expect(result.env).toHaveProperty('DEBUG', false);
      expect(result.env).toHaveProperty('API_KEY', 'secret-key-value');
    });

    it('should be compatible with the library architecture', () => {
      const writer = new Writer();
      const encoder = new CsonEncoder(writer);
      const decoder = new CsonDecoder();

      // Test all required interface methods
      expect(typeof encoder.encode).toBe('function');
      expect(typeof encoder.writeAny).toBe('function');
      expect(typeof encoder.writeNull).toBe('function');
      expect(typeof encoder.writeBoolean).toBe('function');
      expect(typeof encoder.writeNumber).toBe('function');
      expect(typeof encoder.writeInteger).toBe('function');
      expect(typeof encoder.writeUInteger).toBe('function');
      expect(typeof encoder.writeFloat).toBe('function');
      expect(typeof encoder.writeBin).toBe('function');
      expect(typeof encoder.writeAsciiStr).toBe('function');
      expect(typeof encoder.writeStr).toBe('function');
      expect(typeof encoder.writeArr).toBe('function');
      expect(typeof encoder.writeObj).toBe('function');

      expect(typeof decoder.decode).toBe('function');
      expect(typeof decoder.read).toBe('function');
      expect(decoder.reader).toBeDefined();

      // Test that encoder has writer property as required by interface
      expect(encoder.writer).toBe(writer);
    });

    it('should handle edge cases gracefully', () => {
      const writer = new Writer();
      const encoder = new CsonEncoder(writer);
      const decoder = new CsonDecoder();

      const edgeCases = [
        // Empty structures
        {},
        [],
        
        // Nested empty structures
        { empty: {}, arr: [] },
        
        // Special strings
        { quote: "it's working", doubleQuote: 'say "hello"' },
        
        // Numbers
        { int: 42, float: 3.14159, negative: -123, zero: 0 },
        
        // Mixed arrays
        [null, true, false, 0, '', {}, []],
        
        // Special keys
        { 'special-key': 'value', '123numeric': 'start', 'key with spaces': true }
      ];

      edgeCases.forEach((testCase, index) => {
        const encoded = encoder.encode(testCase);
        const decoded = decoder.decode(encoded);
        expect(decoded).toEqual(testCase);
      });
    });
  });
});
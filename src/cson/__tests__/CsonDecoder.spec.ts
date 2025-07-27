import {CsonDecoder} from '../CsonDecoder';

describe('CsonDecoder', () => {
  let decoder: CsonDecoder;

  beforeEach(() => {
    decoder = new CsonDecoder();
  });

  describe('basic values', () => {
    it('should decode null', () => {
      const csonText = 'null';
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded);
      expect(result).toBe(null);
    });

    it('should decode boolean values', () => {
      const trueText = 'true';
      const falseText = 'false';
      
      const trueEncoded = new TextEncoder().encode(trueText);
      const falseEncoded = new TextEncoder().encode(falseText);
      
      expect(decoder.decode(trueEncoded)).toBe(true);
      expect(decoder.decode(falseEncoded)).toBe(false);
    });

    it('should decode numbers', () => {
      const intText = '42';
      const floatText = '3.14';
      
      const intEncoded = new TextEncoder().encode(intText);
      const floatEncoded = new TextEncoder().encode(floatText);
      
      expect(decoder.decode(intEncoded)).toBe(42);
      expect(decoder.decode(floatEncoded)).toBe(3.14);
    });

    it('should decode strings', () => {
      const singleQuoteText = "'hello world'";
      const doubleQuoteText = '"hello world"';
      
      const singleEncoded = new TextEncoder().encode(singleQuoteText);
      const doubleEncoded = new TextEncoder().encode(doubleQuoteText);
      
      expect(decoder.decode(singleEncoded)).toBe('hello world');
      expect(decoder.decode(doubleEncoded)).toBe('hello world');
    });
  });

  describe('arrays', () => {
    it('should decode empty array', () => {
      const csonText = '[]';
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded);
      expect(result).toEqual([]);
    });

    it('should decode CSON array without commas', () => {
      const csonText = `[
        'a'
        'b'
        'c'
      ]`;
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should decode traditional JSON array with commas', () => {
      const csonText = "['a', 'b', 'c']";
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('objects', () => {
    it('should decode empty object', () => {
      const csonText = '{}';
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded);
      expect(result).toEqual({});
    });

    it('should decode CSON object without braces', () => {
      const csonText = `
        abc: ['a', 'b', 'c']
        a:
          b: 'c'
      `;
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded);
      expect(result).toEqual({
        abc: ['a', 'b', 'c'],
        a: { b: 'c' }
      });
    });

    it('should decode object with quoted keys', () => {
      const csonText = `{
        'invalid-key': 'value'
        '123key': 'value2'
      }`;
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded);
      expect(result).toEqual({
        'invalid-key': 'value',
        '123key': 'value2'
      });
    });
  });

  describe('CSON features', () => {
    it('should handle comments', () => {
      const csonText = `
        # This is a comment
        key: 'value'
        # Another comment
        num: 42
      `;
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded);
      expect(result).toEqual({
        key: 'value',
        num: 42
      });
    });

    it('should handle multi-line strings', () => {
      const csonText = `
        text: '''
          This is a
          multi-line string
          with multiple lines
        '''
      `;
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded) as {text: string};
      expect(result.text).toContain('This is a');
      expect(result.text).toContain('multi-line string');
      expect(result.text).toContain('with multiple lines');
    });

    it('should decode complex CSON from bevry/cson examples', () => {
      const csonText = `
        # Comments!!!
        
        # An Array with no commas!
        greatDocumentaries: [
          'earthlings.com'
          'forksoverknives.com'
          'cowspiracy.com'
        ]
        
        # An Object without braces!
        importantFacts:
          emissions: 'Livestock accounts for 51% of worldwide greenhouse gas emissions'
          landuse: 'Livestock covers 45% of the earth\\'s total land'
          more: 'http://cowspiracy.com/facts'
      `;
      
      const encoded = new TextEncoder().encode(csonText);
      const result = decoder.decode(encoded) as any;
      
      expect(result).toHaveProperty('greatDocumentaries');
      expect(result.greatDocumentaries).toEqual([
        'earthlings.com',
        'forksoverknives.com', 
        'cowspiracy.com'
      ]);
      
      expect(result).toHaveProperty('importantFacts');
      expect(result.importantFacts).toHaveProperty('emissions');
      expect(result.importantFacts).toHaveProperty('landuse');
      expect(result.importantFacts).toHaveProperty('more');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid CSON', () => {
      const invalidCsonText = `{
        key: invalid_value_without_quotes
      }`;
      const encoded = new TextEncoder().encode(invalidCsonText);
      
      expect(() => {
        decoder.decode(encoded);
      }).toThrow('CSON parsing error');
    });
  });
});
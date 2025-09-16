/**
 * Tests for XDR types and type guards
 */

import {
  XdrSchema,
  XdrIntSchema,
  XdrStringSchema,
  XdrStructSchema,
  XdrEnumSchema,
  XdrUnionSchema,
  XdrVoidSchema,
  XdrBooleanSchema,
  XdrFixedArraySchema,
  isXdrPrimitiveSchema,
  isXdrCompositeSchema,
  isXdrNamedSchema,
  XDR_BLOCK_SIZE,
  XDR_MAX_STRING_LENGTH,
  XDR_MAX_ARRAY_LENGTH
} from '../types';

describe('XDR Types', () => {
  describe('primitive schemas', () => {
    it('creates valid void schema', () => {
      const voidSchema: XdrVoidSchema = {
        type: 'void',
        doc: 'No data'
      };
      expect(voidSchema.type).toBe('void');
      expect(isXdrPrimitiveSchema(voidSchema)).toBe(true);
      expect(isXdrCompositeSchema(voidSchema)).toBe(false);
    });

    it('creates valid boolean schema', () => {
      const boolSchema: XdrBooleanSchema = {
        type: 'boolean'
      };
      expect(boolSchema.type).toBe('boolean');
      expect(isXdrPrimitiveSchema(boolSchema)).toBe(true);
    });

    it('creates valid int schema', () => {
      const intSchema: XdrIntSchema = {
        type: 'int',
        doc: 'A 32-bit signed integer'
      };
      expect(intSchema.type).toBe('int');
      expect(intSchema.doc).toBe('A 32-bit signed integer');
      expect(isXdrPrimitiveSchema(intSchema)).toBe(true);
    });

    it('creates valid enum schema', () => {
      const enumSchema: XdrEnumSchema = {
        type: 'enum',
        name: 'Color',
        values: {
          RED: 0,
          GREEN: 1,
          BLUE: 2
        }
      };
      expect(enumSchema.type).toBe('enum');
      expect(enumSchema.name).toBe('Color');
      expect(enumSchema.values.RED).toBe(0);
      expect(isXdrPrimitiveSchema(enumSchema)).toBe(true);
      expect(isXdrNamedSchema(enumSchema)).toBe(true);
    });
  });

  describe('composite schemas', () => {
    it('creates valid string schema', () => {
      const stringSchema: XdrStringSchema = {
        type: 'string',
        maxLength: 255
      };
      expect(stringSchema.type).toBe('string');
      expect(stringSchema.maxLength).toBe(255);
      expect(isXdrCompositeSchema(stringSchema)).toBe(true);
      expect(isXdrPrimitiveSchema(stringSchema)).toBe(false);
    });

    it('creates valid fixed array schema', () => {
      const arraySchema: XdrFixedArraySchema = {
        type: 'fixed_array',
        elements: { type: 'int' },
        length: 10
      };
      expect(arraySchema.type).toBe('fixed_array');
      expect(arraySchema.length).toBe(10);
      expect(isXdrCompositeSchema(arraySchema)).toBe(true);
    });

    it('creates valid struct schema', () => {
      const structSchema: XdrStructSchema = {
        type: 'struct',
        name: 'Person',
        fields: [
          {
            name: 'id',
            type: { type: 'int' },
            doc: 'Unique identifier'
          },
          {
            name: 'name',
            type: { type: 'string' }
          }
        ]
      };
      expect(structSchema.type).toBe('struct');
      expect(structSchema.name).toBe('Person');
      expect(structSchema.fields).toHaveLength(2);
      expect(structSchema.fields[0].name).toBe('id');
      expect(isXdrCompositeSchema(structSchema)).toBe(true);
      expect(isXdrNamedSchema(structSchema)).toBe(true);
    });

    it('creates valid union schema', () => {
      const unionSchema: XdrUnionSchema = {
        type: 'union',
        name: 'Result',
        discriminant: { type: 'int' },
        cases: [
          {
            value: 0,
            type: { type: 'void' }
          },
          {
            value: 1,
            type: { type: 'string' }
          }
        ]
      };
      expect(unionSchema.type).toBe('union');
      expect(unionSchema.name).toBe('Result');
      expect(unionSchema.cases).toHaveLength(2);
      expect(isXdrCompositeSchema(unionSchema)).toBe(true);
      expect(isXdrNamedSchema(unionSchema)).toBe(true);
    });
  });

  describe('type guards', () => {
    it('correctly identifies primitive schemas', () => {
      expect(isXdrPrimitiveSchema({ type: 'int' })).toBe(true);
      expect(isXdrPrimitiveSchema({ type: 'boolean' })).toBe(true);
      expect(isXdrPrimitiveSchema({ type: 'float' })).toBe(true);
      expect(isXdrPrimitiveSchema({ type: 'string' })).toBe(false);
      expect(isXdrPrimitiveSchema('int')).toBe(false);
    });

    it('correctly identifies composite schemas', () => {
      expect(isXdrCompositeSchema({ type: 'string' })).toBe(true);
      expect(isXdrCompositeSchema({ type: 'struct', name: 'Test', fields: [] })).toBe(true);
      expect(isXdrCompositeSchema({ type: 'int' })).toBe(false);
      expect(isXdrCompositeSchema('string')).toBe(false);
    });

    it('correctly identifies named schemas', () => {
      expect(isXdrNamedSchema({ type: 'struct', name: 'Test', fields: [] })).toBe(true);
      expect(isXdrNamedSchema({ type: 'enum', name: 'Test', values: {} })).toBe(true);
      expect(isXdrNamedSchema({ type: 'union', name: 'Test', discriminant: { type: 'int' }, cases: [] })).toBe(true);
      expect(isXdrNamedSchema({ type: 'string' })).toBe(false);
      expect(isXdrNamedSchema('struct')).toBe(false);
    });
  });

  describe('constants', () => {
    it('defines correct XDR constants', () => {
      expect(XDR_BLOCK_SIZE).toBe(4);
      expect(XDR_MAX_STRING_LENGTH).toBe(2 ** 32 - 1);
      expect(XDR_MAX_ARRAY_LENGTH).toBe(2 ** 32 - 1);
    });
  });

  describe('schema arrays', () => {
    it('accepts mixed schema types', () => {
      const schemas: XdrSchema[] = [
        { type: 'int' },
        { type: 'string' },
        'int',
        { type: 'struct', name: 'Test', fields: [] }
      ];
      expect(schemas).toHaveLength(4);
    });
  });
});
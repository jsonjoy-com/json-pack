/**
 * Examples demonstrating XDR schema definitions
 * 
 * These examples show how to use the XDR type interfaces to define
 * schemas for various data structures following RFC 4506.
 */

import {
  XdrIntSchema,
  XdrStringSchema,
  XdrStructSchema,
  XdrEnumSchema,
  XdrUnionSchema,
  XdrFixedArraySchema,
  XdrVariableArraySchema,
  XdrOptionalSchema
} from './types';

// Basic primitive schemas
export const intSchema: XdrIntSchema = {
  type: 'int',
  doc: 'A 32-bit signed integer'
};

export const stringSchema: XdrStringSchema = {
  type: 'string',
  maxLength: 255,
  doc: 'A variable-length string with max 255 characters'
};

// Enumeration example
export const colorEnum: XdrEnumSchema = {
  type: 'enum',
  name: 'Color',
  doc: 'RGB color values',
  values: {
    RED: 0,
    GREEN: 1,
    BLUE: 2
  }
};

// Structure example
export const personStruct: XdrStructSchema = {
  type: 'struct',
  name: 'Person',
  doc: 'A person record',
  fields: [
    {
      name: 'id',
      type: intSchema,
      doc: 'Unique person identifier'
    },
    {
      name: 'name',
      type: stringSchema,
      doc: 'Person full name'
    },
    {
      name: 'age',
      type: { type: 'unsigned_int' },
      doc: 'Person age in years'
    }
  ]
};

// Array examples
export const intArray: XdrFixedArraySchema = {
  type: 'fixed_array',
  elements: intSchema,
  length: 10,
  doc: 'Fixed array of 10 integers'
};

export const dynamicStringArray: XdrVariableArraySchema = {
  type: 'variable_array',
  elements: stringSchema,
  maxLength: 100,
  doc: 'Variable-length array of strings'
};

// Optional type example
export const optionalString: XdrOptionalSchema = {
  type: 'optional',
  value: stringSchema,
  doc: 'An optional string value'
};

// Union example (discriminated union)
export const resultUnion: XdrUnionSchema = {
  type: 'union',
  name: 'Result',
  doc: 'A result that can be either success (string) or error (int)',
  discriminant: intSchema,
  cases: [
    {
      value: 0,
      type: stringSchema,
      doc: 'Success case with message'
    },
    {
      value: 1,
      type: intSchema,
      doc: 'Error case with error code'
    }
  ]
};

// Complex nested structure
export const nestedStruct: XdrStructSchema = {
  type: 'struct',
  name: 'ComplexData',
  doc: 'Example of complex nested XDR structure',
  fields: [
    {
      name: 'header',
      type: {
        type: 'struct',
        name: 'Header',
        fields: [
          { name: 'version', type: { type: 'int' } },
          { name: 'timestamp', type: { type: 'hyper' } }
        ]
      }
    },
    {
      name: 'people',
      type: {
        type: 'variable_array',
        elements: personStruct,
        maxLength: 1000
      }
    },
    {
      name: 'result',
      type: resultUnion
    }
  ]
};
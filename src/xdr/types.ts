/**
 * XDR (External Data Representation Standard) schema type definitions
 * based on RFC 4506 specification.
 * Specification: https://datatracker.ietf.org/doc/html/rfc4506
 */

// Base schema interface with common properties
export interface XdrBaseSchema {
  /** The schema type */
  type: string;
  /** Optional documentation for the schema */
  doc?: string;
  /** Optional JSON object of string-valued properties */
  [key: string]: any;
}

// Primitive type schemas

/** XDR void type - represents no data */
export interface XdrVoidSchema extends XdrBaseSchema {
  type: 'void';
}

/** XDR boolean type - single-byte boolean value */
export interface XdrBooleanSchema extends XdrBaseSchema {
  type: 'boolean';
}

/** XDR int type - 32-bit signed integer */
export interface XdrIntSchema extends XdrBaseSchema {
  type: 'int';
}

/** XDR unsigned int type - 32-bit unsigned integer */
export interface XdrUnsignedIntSchema extends XdrBaseSchema {
  type: 'unsigned_int';
}

/** XDR hyper type - 64-bit signed integer */
export interface XdrHyperSchema extends XdrBaseSchema {
  type: 'hyper';
}

/** XDR unsigned hyper type - 64-bit unsigned integer */
export interface XdrUnsignedHyperSchema extends XdrBaseSchema {
  type: 'unsigned_hyper';
}

/** XDR float type - 32-bit IEEE 754 floating point */
export interface XdrFloatSchema extends XdrBaseSchema {
  type: 'float';
}

/** XDR double type - 64-bit IEEE 754 floating point */
export interface XdrDoubleSchema extends XdrBaseSchema {
  type: 'double';
}

/** XDR enumeration type - named integer constants */
export interface XdrEnumSchema extends XdrBaseSchema {
  type: 'enum';
  /** Name of the enumeration */
  name: string;
  /** Enumeration value mappings */
  values: Record<string, number>;
}

// Composite type schemas

/** XDR string type - variable-length character string */
export interface XdrStringSchema extends XdrBaseSchema {
  type: 'string';
  /** Optional maximum length constraint */
  maxLength?: number;
}

/** XDR fixed-length opaque data */
export interface XdrFixedOpaqueSchema extends XdrBaseSchema {
  type: 'fixed_opaque';
  /** Fixed size in bytes */
  size: number;
}

/** XDR variable-length opaque data */
export interface XdrVariableOpaqueSchema extends XdrBaseSchema {
  type: 'variable_opaque';
  /** Optional maximum length constraint */
  maxLength?: number;
}

/** XDR fixed-length array */
export interface XdrFixedArraySchema extends XdrBaseSchema {
  type: 'fixed_array';
  /** Schema of array elements */
  elements: XdrSchema;
  /** Fixed number of elements */
  length: number;
}

/** XDR variable-length array */
export interface XdrVariableArraySchema extends XdrBaseSchema {
  type: 'variable_array';
  /** Schema of array elements */
  elements: XdrSchema;
  /** Optional maximum length constraint */
  maxLength?: number;
}

/** XDR structure field definition */
export interface XdrStructField {
  /** Name of the field */
  name: string;
  /** Schema of the field */
  type: XdrSchema;
  /** Optional documentation for the field */
  doc?: string;
}

/** XDR structure type - ordered collection of fields */
export interface XdrStructSchema extends XdrBaseSchema {
  type: 'struct';
  /** Name of the structure */
  name: string;
  /** Array of field definitions */
  fields: XdrStructField[];
}

/** XDR discriminated union case */
export interface XdrUnionCase {
  /** Discriminant value */
  value: number | string;
  /** Schema for this case */
  type: XdrSchema;
  /** Optional documentation for this case */
  doc?: string;
}

/** XDR discriminated union type */
export interface XdrUnionSchema extends XdrBaseSchema {
  type: 'union';
  /** Name of the union */
  name: string;
  /** Schema for the discriminant */
  discriminant: XdrSchema;
  /** Array of union cases */
  cases: XdrUnionCase[];
  /** Optional default case for unmatched discriminants */
  default?: XdrSchema;
}

/** XDR optional type - either void or the specified type */
export interface XdrOptionalSchema extends XdrBaseSchema {
  type: 'optional';
  /** Schema of the optional value */
  value: XdrSchema;
}

// Union of all primitive schemas
export type XdrPrimitiveSchema =
  | XdrVoidSchema
  | XdrBooleanSchema
  | XdrIntSchema
  | XdrUnsignedIntSchema
  | XdrHyperSchema
  | XdrUnsignedHyperSchema
  | XdrFloatSchema
  | XdrDoubleSchema
  | XdrEnumSchema;

// Union of all composite schemas
export type XdrCompositeSchema =
  | XdrStringSchema
  | XdrFixedOpaqueSchema
  | XdrVariableOpaqueSchema
  | XdrFixedArraySchema
  | XdrVariableArraySchema
  | XdrStructSchema
  | XdrUnionSchema
  | XdrOptionalSchema;

// Union of all schema types
export type XdrSchema = XdrPrimitiveSchema | XdrCompositeSchema | string;

// Named schemas (struct, enum, union)
export type XdrNamedSchema = XdrStructSchema | XdrEnumSchema | XdrUnionSchema;

// Type guards for runtime type checking
export function isXdrPrimitiveSchema(schema: XdrSchema): schema is XdrPrimitiveSchema {
  if (typeof schema === 'string') return false;
  const primitiveTypes = ['void', 'boolean', 'int', 'unsigned_int', 'hyper', 'unsigned_hyper', 'float', 'double', 'enum'];
  return primitiveTypes.includes(schema.type);
}

export function isXdrCompositeSchema(schema: XdrSchema): schema is XdrCompositeSchema {
  if (typeof schema === 'string') return false;
  const compositeTypes = ['string', 'fixed_opaque', 'variable_opaque', 'fixed_array', 'variable_array', 'struct', 'union', 'optional'];
  return compositeTypes.includes(schema.type);
}

export function isXdrNamedSchema(schema: XdrSchema): schema is XdrNamedSchema {
  if (typeof schema === 'string') return false;
  const namedTypes = ['struct', 'enum', 'union'];
  return namedTypes.includes(schema.type);
}

// Constants for XDR block alignment
export const XDR_BLOCK_SIZE = 4; // All XDR data must be aligned to 4-byte boundaries
export const XDR_MAX_STRING_LENGTH = 2 ** 32 - 1; // Maximum string length
export const XDR_MAX_ARRAY_LENGTH = 2 ** 32 - 1; // Maximum array length
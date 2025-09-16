/**
 * XDR (External Data Representation Standard) schema type definitions
 * based on RFC 4506 specification.
 * Specification: https://datatracker.ietf.org/doc/html/rfc4506
 */
export type XdrSchema =
  | XdrPrimitiveSchema
  | XdrWidePrimitiveSchema
  | XdrCompositeSchema;

// Primitive type schemas

export type XdrPrimitiveSchema =
  | XdrVoidSchema
  | XdrIntSchema
  | XdrUnsignedIntSchema
  | XdrEnumSchema
  | XdrBooleanSchema
  | XdrHyperSchema
  | XdrUnsignedHyperSchema
  | XdrFloatSchema
  | XdrDoubleSchema
  | XdrQuadrupleSchema;

export type XdrVoidSchema = XdrBaseSchema<'void'>;
export type XdrIntSchema = XdrBaseSchema<'int'>;
export type XdrUnsignedIntSchema = XdrBaseSchema<'unsigned_int'>;
export interface XdrEnumSchema extends XdrBaseSchema<'enum'> {
  values: Record<string, number>;
}
export type XdrBooleanSchema = XdrBaseSchema<'boolean'>;
export type XdrHyperSchema = XdrBaseSchema<'hyper'>;
export type XdrUnsignedHyperSchema = XdrBaseSchema<'unsigned_hyper'>;
export type XdrFloatSchema = XdrBaseSchema<'float'>;
export type XdrDoubleSchema = XdrBaseSchema<'double'>;
export type XdrQuadrupleSchema = XdrBaseSchema<'quadruple'>;

// Wide primitive type schemas

export type XdrWidePrimitiveSchema =
  | XdrOpaqueSchema
  | XdrVarlenOpaqueSchema
  | XdrStringSchema;

export interface XdrOpaqueSchema extends XdrBaseSchema<'opaque'> {
  size: number;
}

export interface XdrVarlenOpaqueSchema extends XdrBaseSchema<'vopaque'> {
  size?: number;
}

export interface XdrStringSchema extends XdrBaseSchema<'string'> {
  size?: number;
}

// Composite type schemas

export type XdrCompositeSchema =
  | XdrArraySchema
  | XdrVarlenArraySchema
  | XdrStructSchema
  | XdrUnionSchema;

export interface XdrArraySchema extends XdrBaseSchema<'array'> {
  /** Schema of array elements */
  elements: XdrSchema;
  /** Fixed number of elements */
  size: number;
}

export interface XdrVarlenArraySchema extends XdrBaseSchema<'varray'> {
  /** Schema of array elements */
  elements: XdrSchema;
  /** Optional maximum length constraint */
  size?: number;
}

/**
 * The components of the structure are encoded in the order of their
 * declaration in the structure.  Each component's size is a multiple of
 * four bytes, though the components may be different sizes.
 */
export interface XdrStructSchema extends XdrBaseSchema<'struct'> {
  /** Array of field definitions */
  fields: [schema: XdrSchema, name: string][];
}

/**
 * A discriminated union is a type composed of a discriminant followed
 * by a type selected from a set of prearranged types according to the
 * value of the discriminant.  The type of discriminant is either "int",
 * "unsigned int", or an enumerated type, such as "bool".  The component
 * types are called "arms" of the union and are preceded by the value of
 * the discriminant that implies their encoding.
 */
export interface XdrUnionSchema extends XdrBaseSchema<'union'> {
  type: 'union';
  arms: [discriminant: number | string | boolean, schema: XdrSchema][];
  default?: XdrSchema;
}

// Base schema

export interface XdrBaseSchema<Type extends string> {
  /** The schema type */
  type: Type;
}

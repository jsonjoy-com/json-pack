/**
 * Apache Avro schema type definitions based on Avro 1.12.0 specification.
 * Specification: https://avro.apache.org/docs/1.12.0/specification/
 */

// Base schema interface with common properties
export interface AvroBaseSchema {
  /** The schema type */
  type: string;
  /** Optional documentation for the schema */
  doc?: string;
  /** Optional JSON object of string-valued properties */
  [key: string]: any;
}

// Primitive type schemas
export interface AvroNullSchema extends AvroBaseSchema {
  type: 'null';
}

export interface AvroBooleanSchema extends AvroBaseSchema {
  type: 'boolean';
}

export interface AvroIntSchema extends AvroBaseSchema {
  type: 'int';
}

export interface AvroLongSchema extends AvroBaseSchema {
  type: 'long';
}

export interface AvroFloatSchema extends AvroBaseSchema {
  type: 'float';
}

export interface AvroDoubleSchema extends AvroBaseSchema {
  type: 'double';
}

export interface AvroBytesSchema extends AvroBaseSchema {
  type: 'bytes';
}

export interface AvroStringSchema extends AvroBaseSchema {
  type: 'string';
}

// Complex type schemas

export interface AvroRecordField {
  /** Name of the field */
  name: string;
  /** Schema of the field */
  type: AvroSchema;
  /** Optional documentation for the field */
  doc?: string;
  /** Optional default value for the field */
  default?: any;
  /** Optional ordering for the field */
  order?: 'ascending' | 'descending' | 'ignore';
  /** Optional aliases for the field */
  aliases?: string[];
}

export interface AvroRecordSchema extends AvroBaseSchema {
  type: 'record';
  /** Name of the record schema */
  name: string;
  /** Optional namespace for the record */
  namespace?: string;
  /** Array of field definitions */
  fields: AvroRecordField[];
  /** Optional aliases for the record */
  aliases?: string[];
}

export interface AvroEnumSchema extends AvroBaseSchema {
  type: 'enum';
  /** Name of the enum schema */
  name: string;
  /** Optional namespace for the enum */
  namespace?: string;
  /** Array of symbols in the enum */
  symbols: string[];
  /** Optional default symbol */
  default?: string;
  /** Optional aliases for the enum */
  aliases?: string[];
}

export interface AvroArraySchema extends AvroBaseSchema {
  type: 'array';
  /** Schema of the array items */
  items: AvroSchema;
}

export interface AvroMapSchema extends AvroBaseSchema {
  type: 'map';
  /** Schema of the map values */
  values: AvroSchema;
}

export interface AvroUnionSchema extends Array<AvroSchema> {
  /** Union schemas are represented as JSON arrays */
}

export interface AvroFixedSchema extends AvroBaseSchema {
  type: 'fixed';
  /** Name of the fixed schema */
  name: string;
  /** Optional namespace for the fixed */
  namespace?: string;
  /** Size of the fixed-length data in bytes */
  size: number;
  /** Optional aliases for the fixed */
  aliases?: string[];
}

// Union of all primitive schemas
export type AvroPrimitiveSchema =
  | AvroNullSchema
  | AvroBooleanSchema
  | AvroIntSchema
  | AvroLongSchema
  | AvroFloatSchema
  | AvroDoubleSchema
  | AvroBytesSchema
  | AvroStringSchema;

// Union of all complex schemas
export type AvroComplexSchema =
  | AvroRecordSchema
  | AvroEnumSchema
  | AvroArraySchema
  | AvroMapSchema
  | AvroUnionSchema
  | AvroFixedSchema;

// Union of all schema types
export type AvroSchema = AvroPrimitiveSchema | AvroComplexSchema | string;

// Named schemas (record, enum, fixed)
export type AvroNamedSchema = AvroRecordSchema | AvroEnumSchema | AvroFixedSchema;

// Logical types - extensions to primitive types
export interface AvroLogicalTypeSchema extends AvroBaseSchema {
  /** The logical type name */
  logicalType: string;
}

export interface AvroDecimalLogicalType extends AvroLogicalTypeSchema {
  logicalType: 'decimal';
  /** The maximum number of digits in the decimal */
  precision: number;
  /** The number of digits to the right of the decimal point */
  scale?: number;
}

export interface AvroUuidLogicalType extends AvroStringSchema {
  logicalType: 'uuid';
}

export interface AvroDateLogicalType extends AvroIntSchema {
  logicalType: 'date';
}

export interface AvroTimeMillisLogicalType extends AvroIntSchema {
  logicalType: 'time-millis';
}

export interface AvroTimeMicrosLogicalType extends AvroLongSchema {
  logicalType: 'time-micros';
}

export interface AvroTimestampMillisLogicalType extends AvroLongSchema {
  logicalType: 'timestamp-millis';
}

export interface AvroTimestampMicrosLogicalType extends AvroLongSchema {
  logicalType: 'timestamp-micros';
}

export interface AvroLocalTimestampMillisLogicalType extends AvroLongSchema {
  logicalType: 'local-timestamp-millis';
}

export interface AvroLocalTimestampMicrosLogicalType extends AvroLongSchema {
  logicalType: 'local-timestamp-micros';
}

export interface AvroDurationLogicalType extends AvroFixedSchema {
  logicalType: 'duration';
  size: 12;
}

// Type guard functions for schema type checking
export function isAvroNullSchema(schema: AvroSchema): schema is AvroNullSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'null';
}

export function isAvroBooleanSchema(schema: AvroSchema): schema is AvroBooleanSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'boolean';
}

export function isAvroIntSchema(schema: AvroSchema): schema is AvroIntSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'int';
}

export function isAvroLongSchema(schema: AvroSchema): schema is AvroLongSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'long';
}

export function isAvroFloatSchema(schema: AvroSchema): schema is AvroFloatSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'float';
}

export function isAvroDoubleSchema(schema: AvroSchema): schema is AvroDoubleSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'double';
}

export function isAvroBytesSchema(schema: AvroSchema): schema is AvroBytesSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'bytes';
}

export function isAvroStringSchema(schema: AvroSchema): schema is AvroStringSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'string';
}

export function isAvroRecordSchema(schema: AvroSchema): schema is AvroRecordSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'record';
}

export function isAvroEnumSchema(schema: AvroSchema): schema is AvroEnumSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'enum';
}

export function isAvroArraySchema(schema: AvroSchema): schema is AvroArraySchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'array';
}

export function isAvroMapSchema(schema: AvroSchema): schema is AvroMapSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'map';
}

export function isAvroUnionSchema(schema: AvroSchema): schema is AvroUnionSchema {
  return Array.isArray(schema);
}

export function isAvroFixedSchema(schema: AvroSchema): schema is AvroFixedSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && schema.type === 'fixed';
}

export function isAvroPrimitiveSchema(schema: AvroSchema): schema is AvroPrimitiveSchema {
  if (typeof schema === 'string') return true;
  if (typeof schema !== 'object' || Array.isArray(schema)) return false;
  return ['null', 'boolean', 'int', 'long', 'float', 'double', 'bytes', 'string'].includes(schema.type);
}

export function isAvroComplexSchema(schema: AvroSchema): schema is AvroComplexSchema {
  if (Array.isArray(schema)) return true;
  if (typeof schema !== 'object') return false;
  return ['record', 'enum', 'array', 'map', 'fixed'].includes(schema.type);
}

export function isAvroNamedSchema(schema: AvroSchema): schema is AvroNamedSchema {
  return typeof schema === 'object' && !Array.isArray(schema) && ['record', 'enum', 'fixed'].includes(schema.type);
}
import type {IWriter, IWriterGrowable} from '@jsonjoy.com/buffers/lib';
import {XdrEncoder} from './XdrEncoder';
import {XdrSchemaValidator} from './XdrSchemaValidator';
import type {
  XdrSchema,
  XdrEnumSchema,
  XdrOpaqueSchema,
  XdrVarlenOpaqueSchema,
  XdrStringSchema,
  XdrArraySchema,
  XdrVarlenArraySchema,
  XdrStructSchema,
  XdrUnionSchema,
} from './types';

/**
 * XDR binary encoder with schema validation and encoding.
 * Encodes values according to provided XDR schemas with proper validation.
 * Based on RFC 4506 specification.
 */
export class XdrSchemaEncoder {
  private encoder: XdrEncoder;
  private validator: XdrSchemaValidator;

  constructor(public readonly writer: IWriter & IWriterGrowable) {
    this.encoder = new XdrEncoder(writer);
    this.validator = new XdrSchemaValidator();
  }

  /**
   * Encodes a value according to the provided schema.
   */
  public encode(value: unknown, schema: XdrSchema): Uint8Array {
    this.writer.reset();

    // Validate schema first
    if (!this.validator.validateSchema(schema)) {
      throw new Error('Invalid XDR schema');
    }

    // Validate value against schema
    if (!this.validator.validateValue(value, schema)) {
      throw new Error('Value does not conform to schema');
    }

    this.writeValue(value, schema);
    return this.writer.flush();
  }

  /**
   * Writes a void value with schema validation.
   */
  public writeVoid(schema: XdrSchema): void {
    this.validateSchemaType(schema, 'void');
    this.encoder.writeVoid();
  }

  /**
   * Writes an int value with schema validation.
   */
  public writeInt(value: number, schema: XdrSchema): void {
    this.validateSchemaType(schema, 'int');
    if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) {
      throw new Error('Value is not a valid 32-bit signed integer');
    }
    this.encoder.writeInt(value);
  }

  /**
   * Writes an unsigned int value with schema validation.
   */
  public writeUnsignedInt(value: number, schema: XdrSchema): void {
    this.validateSchemaType(schema, 'unsigned_int');
    if (!Number.isInteger(value) || value < 0 || value > 4294967295) {
      throw new Error('Value is not a valid 32-bit unsigned integer');
    }
    this.encoder.writeUnsignedInt(value);
  }

  /**
   * Writes a boolean value with schema validation.
   */
  public writeBoolean(value: boolean, schema: XdrSchema): void {
    this.validateSchemaType(schema, 'boolean');
    this.encoder.writeBoolean(value);
  }

  /**
   * Writes a hyper value with schema validation.
   */
  public writeHyper(value: number | bigint, schema: XdrSchema): void {
    this.validateSchemaType(schema, 'hyper');
    this.encoder.writeHyper(value);
  }

  /**
   * Writes an unsigned hyper value with schema validation.
   */
  public writeUnsignedHyper(value: number | bigint, schema: XdrSchema): void {
    this.validateSchemaType(schema, 'unsigned_hyper');
    if ((typeof value === 'number' && value < 0) || (typeof value === 'bigint' && value < BigInt(0))) {
      throw new Error('Value is not a valid unsigned integer');
    }
    this.encoder.writeUnsignedHyper(value);
  }

  /**
   * Writes a float value with schema validation.
   */
  public writeFloat(value: number, schema: XdrSchema): void {
    this.validateSchemaType(schema, 'float');
    this.encoder.writeFloat(value);
  }

  /**
   * Writes a double value with schema validation.
   */
  public writeDouble(value: number, schema: XdrSchema): void {
    this.validateSchemaType(schema, 'double');
    this.encoder.writeDouble(value);
  }

  /**
   * Writes a quadruple value with schema validation.
   */
  public writeQuadruple(value: number, schema: XdrSchema): void {
    this.validateSchemaType(schema, 'quadruple');
    this.encoder.writeQuadruple(value);
  }

  /**
   * Writes an enum value with schema validation.
   */
  public writeEnum(value: string, schema: XdrEnumSchema): void {
    if (schema.type !== 'enum') {
      throw new Error('Schema is not an enum schema');
    }

    if (!(value in schema.values)) {
      throw new Error(`Invalid enum value: ${value}`);
    }

    this.encoder.writeInt(schema.values[value]);
  }

  /**
   * Writes opaque data with schema validation.
   */
  public writeOpaque(value: Uint8Array, schema: XdrOpaqueSchema): void {
    if (schema.type !== 'opaque') {
      throw new Error('Schema is not an opaque schema');
    }

    if (value.length !== schema.size) {
      throw new Error(`Opaque data length ${value.length} does not match schema size ${schema.size}`);
    }

    this.encoder.writeOpaque(value, schema.size);
  }

  /**
   * Writes variable-length opaque data with schema validation.
   */
  public writeVarlenOpaque(value: Uint8Array, schema: XdrVarlenOpaqueSchema): void {
    if (schema.type !== 'vopaque') {
      throw new Error('Schema is not a variable-length opaque schema');
    }

    if (schema.size !== undefined && value.length > schema.size) {
      throw new Error(`Opaque data length ${value.length} exceeds maximum size ${schema.size}`);
    }

    this.encoder.writeVarlenOpaque(value);
  }

  /**
   * Writes a string value with schema validation.
   */
  public writeString(value: string, schema: XdrStringSchema): void {
    if (schema.type !== 'string') {
      throw new Error('Schema is not a string schema');
    }

    if (schema.size !== undefined && value.length > schema.size) {
      throw new Error(`String length ${value.length} exceeds maximum size ${schema.size}`);
    }

    this.encoder.writeStr(value);
  }

  /**
   * Writes an array value with schema validation.
   */
  public writeArray(value: unknown[], schema: XdrArraySchema): void {
    if (schema.type !== 'array') {
      throw new Error('Schema is not an array schema');
    }

    if (value.length !== schema.size) {
      throw new Error(`Array length ${value.length} does not match schema size ${schema.size}`);
    }

    // Write array elements without length prefix (fixed-size array)
    for (const item of value) {
      this.writeValue(item, schema.elements);
    }
  }

  /**
   * Writes a variable-length array value with schema validation.
   */
  public writeVarlenArray(value: unknown[], schema: XdrVarlenArraySchema): void {
    if (schema.type !== 'varray') {
      throw new Error('Schema is not a variable-length array schema');
    }

    if (schema.size !== undefined && value.length > schema.size) {
      throw new Error(`Array length ${value.length} exceeds maximum size ${schema.size}`);
    }

    // Write array length followed by elements
    this.encoder.writeUnsignedInt(value.length);
    for (const item of value) {
      this.writeValue(item, schema.elements);
    }
  }

  /**
   * Writes a struct value with schema validation.
   */
  public writeStruct(value: Record<string, unknown>, schema: XdrStructSchema): void {
    if (schema.type !== 'struct') {
      throw new Error('Schema is not a struct schema');
    }

    // Write struct fields in order
    for (const [fieldSchema, fieldName] of schema.fields) {
      if (!(fieldName in value)) {
        throw new Error(`Missing required field: ${fieldName}`);
      }
      this.writeValue(value[fieldName], fieldSchema);
    }
  }

  /**
   * Writes a union value with schema validation.
   */
  public writeUnion(value: unknown, schema: XdrUnionSchema, discriminant: number | string | boolean): void {
    if (schema.type !== 'union') {
      throw new Error('Schema is not a union schema');
    }

    // Find the matching arm
    const arm = schema.arms.find(([armDiscriminant]) => armDiscriminant === discriminant);
    if (!arm) {
      if (schema.default) {
        // Write discriminant and default value
        this.writeDiscriminant(discriminant);
        this.writeValue(value, schema.default);
      } else {
        throw new Error(`No matching arm found for discriminant: ${discriminant}`);
      }
    } else {
      // Write discriminant and value according to the arm schema
      this.writeDiscriminant(discriminant);
      this.writeValue(value, arm[1]);
    }
  }

  /**
   * Generic number writing with schema validation.
   */
  public writeNumber(value: number, schema: XdrSchema): void {
    switch (schema.type) {
      case 'int':
        this.writeInt(value, schema);
        break;
      case 'unsigned_int':
        this.writeUnsignedInt(value, schema);
        break;
      case 'hyper':
        this.writeHyper(value, schema);
        break;
      case 'unsigned_hyper':
        this.writeUnsignedHyper(value, schema);
        break;
      case 'float':
        this.writeFloat(value, schema);
        break;
      case 'double':
        this.writeDouble(value, schema);
        break;
      case 'quadruple':
        this.writeQuadruple(value, schema);
        break;
      default:
        throw new Error(`Schema type ${schema.type} is not a numeric type`);
    }
  }

  /**
   * Writes a value according to its schema.
   */
  private writeValue(value: unknown, schema: XdrSchema): void {
    switch (schema.type) {
      case 'void':
        this.encoder.writeVoid();
        break;
      case 'int':
        this.encoder.writeInt(value as number);
        break;
      case 'unsigned_int':
        this.encoder.writeUnsignedInt(value as number);
        break;
      case 'boolean':
        this.encoder.writeBoolean(value as boolean);
        break;
      case 'hyper':
        this.encoder.writeHyper(value as number | bigint);
        break;
      case 'unsigned_hyper':
        this.encoder.writeUnsignedHyper(value as number | bigint);
        break;
      case 'float':
        this.encoder.writeFloat(value as number);
        break;
      case 'double':
        this.encoder.writeDouble(value as number);
        break;
      case 'quadruple':
        this.encoder.writeQuadruple(value as number);
        break;
      case 'enum':
        this.writeEnum(value as string, schema as XdrEnumSchema);
        break;
      case 'opaque':
        this.writeOpaque(value as Uint8Array, schema as XdrOpaqueSchema);
        break;
      case 'vopaque':
        this.writeVarlenOpaque(value as Uint8Array, schema as XdrVarlenOpaqueSchema);
        break;
      case 'string':
        this.writeString(value as string, schema as XdrStringSchema);
        break;
      case 'array':
        this.writeArray(value as unknown[], schema as XdrArraySchema);
        break;
      case 'varray':
        this.writeVarlenArray(value as unknown[], schema as XdrVarlenArraySchema);
        break;
      case 'struct':
        this.writeStruct(value as Record<string, unknown>, schema as XdrStructSchema);
        break;
      case 'union':
        // For unions, we need additional context about the discriminant
        // This is a simplified implementation
        throw new Error('Union encoding requires explicit discriminant. Use writeUnion method instead.');
      default:
        throw new Error(`Unknown schema type: ${(schema as any).type}`);
    }
  }

  private validateSchemaType(schema: XdrSchema, expectedType: string): void {
    if (schema.type !== expectedType) {
      throw new Error(`Expected schema type ${expectedType}, got ${schema.type}`);
    }
  }

  private writeDiscriminant(discriminant: number | string | boolean): void {
    if (typeof discriminant === 'number') {
      this.encoder.writeInt(discriminant);
    } else if (typeof discriminant === 'boolean') {
      this.encoder.writeBoolean(discriminant);
    } else {
      // For string discriminants, we need to know the enum mapping
      // This is a simplified implementation
      throw new Error('String discriminants require enum schema context');
    }
  }
}
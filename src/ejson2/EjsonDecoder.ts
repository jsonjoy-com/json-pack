import {
  BsonBinary,
  BsonDbPointer,
  BsonDecimal128,
  BsonFloat,
  BsonInt32,
  BsonInt64,
  BsonJavascriptCode,
  BsonJavascriptCodeWithScope,
  BsonMaxKey,
  BsonMinKey,
  BsonObjectId,
  BsonSymbol,
  BsonTimestamp,
} from '../bson/values';

export interface EjsonDecoderOptions {
  /** Whether to parse legacy Extended JSON formats */
  legacy?: boolean;
}

export class EjsonDecoder {
  constructor(private options: EjsonDecoderOptions = {}) {}

  public decode(json: string): unknown {
    const parsed = JSON.parse(json);
    return this.transform(parsed);
  }

  private transform(value: unknown): unknown {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }

    // Check for Extended JSON type wrappers
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    // Helper function to validate exact key match
    const hasExactKeys = (expectedKeys: string[]): boolean => {
      if (keys.length !== expectedKeys.length) return false;
      return expectedKeys.every(key => keys.includes(key));
    };

    // Check if object has any special $ keys that indicate a type wrapper
    const specialKeys = keys.filter(key => key.startsWith('$'));
    
    if (specialKeys.length > 0) {
      // ObjectId
      if (specialKeys.includes('$oid')) {
        if (!hasExactKeys(['$oid'])) {
          throw new Error('Invalid ObjectId format: extra keys not allowed');
        }
        const oidStr = obj.$oid as string;
        if (typeof oidStr === 'string' && /^[0-9a-fA-F]{24}$/.test(oidStr)) {
          return this.parseObjectId(oidStr);
        }
        throw new Error('Invalid ObjectId format');
      }

      // Int32
      if (specialKeys.includes('$numberInt')) {
        if (!hasExactKeys(['$numberInt'])) {
          throw new Error('Invalid Int32 format: extra keys not allowed');
        }
        const intStr = obj.$numberInt as string;
        if (typeof intStr === 'string') {
          const value = parseInt(intStr, 10);
          if (!isNaN(value) && value >= -2147483648 && value <= 2147483647) {
            return new BsonInt32(value);
          }
        }
        throw new Error('Invalid Int32 format');
      }

      // Int64
      if (specialKeys.includes('$numberLong')) {
        if (!hasExactKeys(['$numberLong'])) {
          throw new Error('Invalid Int64 format: extra keys not allowed');
        }
        const longStr = obj.$numberLong as string;
        if (typeof longStr === 'string') {
          const value = parseFloat(longStr); // Use parseFloat to handle large numbers better
          if (!isNaN(value)) {
            return new BsonInt64(value);
          }
        }
        throw new Error('Invalid Int64 format');
      }

      // Double
      if (specialKeys.includes('$numberDouble')) {
        if (!hasExactKeys(['$numberDouble'])) {
          throw new Error('Invalid Double format: extra keys not allowed');
        }
        const doubleStr = obj.$numberDouble as string;
        if (typeof doubleStr === 'string') {
          if (doubleStr === 'Infinity') return new BsonFloat(Infinity);
          if (doubleStr === '-Infinity') return new BsonFloat(-Infinity);
          if (doubleStr === 'NaN') return new BsonFloat(NaN);
          const value = parseFloat(doubleStr);
          if (!isNaN(value)) {
            return new BsonFloat(value);
          }
        }
        throw new Error('Invalid Double format');
      }

      // Decimal128
      if (specialKeys.includes('$numberDecimal')) {
        if (!hasExactKeys(['$numberDecimal'])) {
          throw new Error('Invalid Decimal128 format: extra keys not allowed');
        }
        const decimalStr = obj.$numberDecimal as string;
        if (typeof decimalStr === 'string') {
          return new BsonDecimal128(new Uint8Array(16));
        }
        throw new Error('Invalid Decimal128 format');
      }

      // Binary
      if (specialKeys.includes('$binary')) {
        if (!hasExactKeys(['$binary'])) {
          throw new Error('Invalid Binary format: extra keys not allowed');
        }
        const binaryObj = obj.$binary as Record<string, unknown>;
        if (typeof binaryObj === 'object' && binaryObj !== null) {
          const binaryKeys = Object.keys(binaryObj);
          if (binaryKeys.length === 2 && binaryKeys.includes('base64') && binaryKeys.includes('subType')) {
            const base64 = binaryObj.base64 as string;
            const subType = binaryObj.subType as string;
            if (typeof base64 === 'string' && typeof subType === 'string') {
              const data = this.base64ToUint8Array(base64);
              const subtype = parseInt(subType, 16);
              return new BsonBinary(subtype, data);
            }
          }
        }
        throw new Error('Invalid Binary format');
      }

      // UUID (special case of Binary)
      if (specialKeys.includes('$uuid')) {
        if (!hasExactKeys(['$uuid'])) {
          throw new Error('Invalid UUID format: extra keys not allowed');
        }
        const uuidStr = obj.$uuid as string;
        if (typeof uuidStr === 'string' && this.isValidUuid(uuidStr)) {
          const data = this.uuidToBytes(uuidStr);
          return new BsonBinary(4, data); // Subtype 4 for UUID
        }
        throw new Error('Invalid UUID format');
      }

      // Code
      if (specialKeys.includes('$code') && !specialKeys.includes('$scope')) {
        if (!hasExactKeys(['$code'])) {
          throw new Error('Invalid Code format: extra keys not allowed');
        }
        const code = obj.$code as string;
        if (typeof code === 'string') {
          return new BsonJavascriptCode(code);
        }
        throw new Error('Invalid Code format');
      }

      // CodeWScope
      if (specialKeys.includes('$code') && specialKeys.includes('$scope')) {
        if (!hasExactKeys(['$code', '$scope'])) {
          throw new Error('Invalid CodeWScope format: extra keys not allowed');
        }
        const code = obj.$code as string;
        const scope = obj.$scope;
        if (typeof code === 'string' && typeof scope === 'object' && scope !== null) {
          return new BsonJavascriptCodeWithScope(code, this.transform(scope) as Record<string, unknown>);
        }
        throw new Error('Invalid CodeWScope format');
      }

      // Symbol
      if (specialKeys.includes('$symbol')) {
        if (!hasExactKeys(['$symbol'])) {
          throw new Error('Invalid Symbol format: extra keys not allowed');
        }
        const symbol = obj.$symbol as string;
        if (typeof symbol === 'string') {
          return new BsonSymbol(symbol);
        }
        throw new Error('Invalid Symbol format');
      }

      // Timestamp
      if (specialKeys.includes('$timestamp')) {
        if (!hasExactKeys(['$timestamp'])) {
          throw new Error('Invalid Timestamp format: extra keys not allowed');
        }
        const timestampObj = obj.$timestamp as Record<string, unknown>;
        if (typeof timestampObj === 'object' && timestampObj !== null) {
          const timestampKeys = Object.keys(timestampObj);
          if (timestampKeys.length === 2 && timestampKeys.includes('t') && timestampKeys.includes('i')) {
            const t = timestampObj.t as number;
            const i = timestampObj.i as number;
            if (typeof t === 'number' && typeof i === 'number' && t >= 0 && i >= 0) {
              return new BsonTimestamp(i, t);
            }
          }
        }
        throw new Error('Invalid Timestamp format');
      }

      // Regular Expression
      if (specialKeys.includes('$regularExpression')) {
        if (!hasExactKeys(['$regularExpression'])) {
          throw new Error('Invalid RegularExpression format: extra keys not allowed');
        }
        const regexObj = obj.$regularExpression as Record<string, unknown>;
        if (typeof regexObj === 'object' && regexObj !== null) {
          const regexKeys = Object.keys(regexObj);
          if (regexKeys.length === 2 && regexKeys.includes('pattern') && regexKeys.includes('options')) {
            const pattern = regexObj.pattern as string;
            const options = regexObj.options as string;
            if (typeof pattern === 'string' && typeof options === 'string') {
              return new RegExp(pattern, options);
            }
          }
        }
        throw new Error('Invalid RegularExpression format');
      }

      // DBPointer
      if (specialKeys.includes('$dbPointer')) {
        if (!hasExactKeys(['$dbPointer'])) {
          throw new Error('Invalid DBPointer format: extra keys not allowed');
        }
        const dbPointerObj = obj.$dbPointer as Record<string, unknown>;
        if (typeof dbPointerObj === 'object' && dbPointerObj !== null) {
          const dbPointerKeys = Object.keys(dbPointerObj);
          if (dbPointerKeys.length === 2 && dbPointerKeys.includes('$ref') && dbPointerKeys.includes('$id')) {
            const ref = dbPointerObj.$ref as string;
            const id = dbPointerObj.$id;
            if (typeof ref === 'string' && id !== undefined) {
              const transformedId = this.transform(id) as BsonObjectId;
              if (transformedId instanceof BsonObjectId) {
                return new BsonDbPointer(ref, transformedId);
              }
            }
          }
        }
        throw new Error('Invalid DBPointer format');
      }

      // Date
      if (specialKeys.includes('$date')) {
        if (!hasExactKeys(['$date'])) {
          throw new Error('Invalid Date format: extra keys not allowed');
        }
        const dateValue = obj.$date;
        if (typeof dateValue === 'string') {
          // ISO-8601 format (relaxed)
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } else if (typeof dateValue === 'object' && dateValue !== null) {
          // Canonical format with $numberLong
          const longObj = dateValue as Record<string, unknown>;
          const longKeys = Object.keys(longObj);
          if (longKeys.length === 1 && longKeys[0] === '$numberLong' && typeof longObj.$numberLong === 'string') {
            const timestamp = parseFloat(longObj.$numberLong);
            if (!isNaN(timestamp)) {
              return new Date(timestamp);
            }
          }
        }
        throw new Error('Invalid Date format');
      }

      // MinKey
      if (specialKeys.includes('$minKey')) {
        if (!hasExactKeys(['$minKey'])) {
          throw new Error('Invalid MinKey format: extra keys not allowed');
        }
        if (obj.$minKey === 1) {
          return new BsonMinKey();
        }
        throw new Error('Invalid MinKey format');
      }

      // MaxKey
      if (specialKeys.includes('$maxKey')) {
        if (!hasExactKeys(['$maxKey'])) {
          throw new Error('Invalid MaxKey format: extra keys not allowed');
        }
        if (obj.$maxKey === 1) {
          return new BsonMaxKey();
        }
        throw new Error('Invalid MaxKey format');
      }

      // Undefined
      if (specialKeys.includes('$undefined')) {
        if (!hasExactKeys(['$undefined'])) {
          throw new Error('Invalid Undefined format: extra keys not allowed');
        }
        if (obj.$undefined === true) {
          return undefined;
        }
        throw new Error('Invalid Undefined format');
      }
    }

    // DBRef (not a BSON type, but a convention) - special case, can have additional fields
    if (keys.includes('$ref') && keys.includes('$id')) {
      const ref = obj.$ref as string;
      const id = this.transform(obj.$id);
      const result: Record<string, unknown> = {$ref: ref, $id: id};
      
      if (keys.includes('$db')) {
        result.$db = obj.$db;
      }
      
      // Add any other fields
      for (const key of keys) {
        if (key !== '$ref' && key !== '$id' && key !== '$db') {
          result[key] = this.transform(obj[key]);
        }
      }
      
      return result;
    }

    // Regular object - transform all properties
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = this.transform(val);
    }
    return result;
  }

  private parseObjectId(hex: string): BsonObjectId {
    // Parse 24-character hex string into ObjectId components
    const timestamp = parseInt(hex.slice(0, 8), 16);
    const process = parseInt(hex.slice(8, 18), 16);
    const counter = parseInt(hex.slice(18, 24), 16);
    return new BsonObjectId(timestamp, process, counter);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    // Convert base64 string to Uint8Array
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private isValidUuid(uuid: string): boolean {
    // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidPattern.test(uuid);
  }

  private uuidToBytes(uuid: string): Uint8Array {
    // Convert UUID string to 16-byte array
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }
}
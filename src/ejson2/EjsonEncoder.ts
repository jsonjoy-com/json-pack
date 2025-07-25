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
import {fromBase64} from '@jsonjoy.com/base64';

export interface EjsonEncoderOptions {
  /** Use canonical format (preserves all type information) or relaxed format (more readable) */
  canonical?: boolean;
}

export class EjsonEncoder {
  constructor(private options: EjsonEncoderOptions = {}) {}

  public encode(value: unknown): string {
    return JSON.stringify(this.transform(value));
  }

  private transform(value: unknown): unknown {
    if (value === null || value === undefined) {
      if (value === undefined) {
        return {$undefined: true};
      }
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      if (this.options.canonical) {
        if (Number.isInteger(value)) {
          // Determine if it fits in Int32 or needs Int64
          if (value >= -2147483648 && value <= 2147483647) {
            return {$numberInt: value.toString()};
          } else {
            return {$numberLong: value.toString()};
          }
        } else {
          if (!isFinite(value)) {
            return {$numberDouble: this.formatNonFinite(value)};
          }
          return {$numberDouble: value.toString()};
        }
      } else {
        // Relaxed format
        if (!isFinite(value)) {
          return {$numberDouble: this.formatNonFinite(value)};
        }
        return value;
      }
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }

    if (value instanceof Date) {
      const timestamp = value.getTime();
      // Check if date is valid
      if (isNaN(timestamp)) {
        throw new Error('Invalid Date');
      }
      
      if (this.options.canonical) {
        return {$date: {$numberLong: timestamp.toString()}};
      } else {
        // Use ISO format for dates between 1970-9999 in relaxed mode
        const year = value.getFullYear();
        if (year >= 1970 && year <= 9999) {
          return {$date: value.toISOString()};
        } else {
          return {$date: {$numberLong: timestamp.toString()}};
        }
      }
    }

    if (value instanceof RegExp) {
      return {
        $regularExpression: {
          pattern: value.source,
          options: this.getRegExpOptions(value),
        },
      };
    }

    // Handle BSON value classes
    if (value instanceof BsonObjectId) {
      return {$oid: this.objectIdToHex(value)};
    }

    if (value instanceof BsonInt32) {
      if (this.options.canonical) {
        return {$numberInt: value.value.toString()};
      } else {
        return value.value;
      }
    }

    if (value instanceof BsonInt64) {
      if (this.options.canonical) {
        return {$numberLong: value.value.toString()};
      } else {
        return value.value;
      }
    }

    if (value instanceof BsonFloat) {
      if (this.options.canonical) {
        if (!isFinite(value.value)) {
          return {$numberDouble: this.formatNonFinite(value.value)};
        }
        return {$numberDouble: value.value.toString()};
      } else {
        if (!isFinite(value.value)) {
          return {$numberDouble: this.formatNonFinite(value.value)};
        }
        return value.value;
      }
    }

    if (value instanceof BsonDecimal128) {
      // Convert bytes to decimal string representation
      return {$numberDecimal: this.decimal128ToString(value.data)};
    }

    if (value instanceof BsonBinary) {
      const base64 = this.uint8ArrayToBase64(value.data);
      const subType = value.subtype.toString(16).padStart(2, '0');
      return {
        $binary: {
          base64,
          subType,
        },
      };
    }

    if (value instanceof BsonJavascriptCode) {
      return {$code: value.code};
    }

    if (value instanceof BsonJavascriptCodeWithScope) {
      return {
        $code: value.code,
        $scope: this.transform(value.scope),
      };
    }

    if (value instanceof BsonSymbol) {
      return {$symbol: value.symbol};
    }

    if (value instanceof BsonTimestamp) {
      return {
        $timestamp: {
          t: value.timestamp,
          i: value.increment,
        },
      };
    }

    if (value instanceof BsonDbPointer) {
      return {
        $dbPointer: {
          $ref: value.name,
          $id: this.transform(value.id),
        },
      };
    }

    if (value instanceof BsonMinKey) {
      return {$minKey: 1};
    }

    if (value instanceof BsonMaxKey) {
      return {$maxKey: 1};
    }

    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.transform(val);
      }
      return result;
    }

    // Fallback for unknown types
    return value;
  }

  private formatNonFinite(value: number): string {
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';
    return 'NaN';
  }

  private getRegExpOptions(regex: RegExp): string {
    // Use JavaScript's normalized flags property
    return regex.flags;
  }

  private objectIdToHex(objectId: BsonObjectId): string {
    // Convert ObjectId components to 24-character hex string
    const timestamp = objectId.timestamp.toString(16).padStart(8, '0');
    const process = objectId.process.toString(16).padStart(10, '0');
    const counter = objectId.counter.toString(16).padStart(6, '0');
    return timestamp + process + counter;
  }

  private uint8ArrayToBase64(data: Uint8Array): string {
    // Convert Uint8Array to base64 string
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  private decimal128ToString(data: Uint8Array): string {
    // This is a simplified implementation
    // In a real implementation, you'd need to parse the IEEE 754-2008 decimal128 format
    // For now, return a placeholder that indicates the format
    return '0'; // TODO: Implement proper decimal128 to string conversion
  }
}
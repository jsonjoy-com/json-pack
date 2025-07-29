import {JsonPackExtension} from '../JsonPackExtension';
import {JsonPackValue} from '../JsonPackValue';

export interface EdnOptions {
  /** Show encoding indicators (e.g., _1, _2, _3, _i, _) */
  showEncodingIndicators?: boolean;
  /** Custom formatting options */
  customFormatters?: Map<Function, (value: any) => string>;
}

/**
 * CBOR Extended Diagnostic Notation (EDN) formatter.
 * Converts JavaScript values to EDN string representation according to RFC specification.
 */
export class CborEdn {
  private options: EdnOptions;

  constructor(options: EdnOptions = {}) {
    this.options = {
      showEncodingIndicators: false,
      ...options
    };
  }

  /**
   * Convert a value to CBOR Extended Diagnostic Notation string.
   * @param value The value to convert to EDN format
   * @returns EDN string representation
   */
  public encode(value: unknown): string {
    return this.formatValue(value);
  }

  /**
   * Create a formatted EDN string from CBOR encoded data.
   * This method decodes CBOR data and formats it as EDN.
   * @param cborData The CBOR encoded data
   * @param decoder Optional CBOR decoder to use
   * @returns EDN string representation
   */
  public formatCbor(cborData: Uint8Array, decoder?: {decode: (data: Uint8Array) => unknown}): string {
    if (!decoder) {
      throw new Error('CBOR decoder is required to format CBOR data');
    }
    const decoded = decoder.decode(cborData);
    return this.formatValue(decoded);
  }

  /**
   * Create an EDN string with encoding indicators showing how values would be encoded.
   * @param value The value to format
   * @returns EDN string with encoding indicators
   */
  public encodeWithIndicators(value: unknown): string {
    const oldOptions = this.options.showEncodingIndicators;
    this.options.showEncodingIndicators = true;
    try {
      return this.formatValue(value);
    } finally {
      this.options.showEncodingIndicators = oldOptions;
    }
  }

  /**
   * Format any value to its EDN representation.
   */
  private formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (value === true) return 'true';
    if (value === false) return 'false';

    if (typeof value === 'number') {
      return this.formatNumber(value);
    }

    if (typeof value === 'bigint') {
      return this.formatBigInt(value);
    }

    if (typeof value === 'string') {
      return this.formatString(value);
    }

    if (value instanceof Uint8Array) {
      return this.formatByteString(value);
    }

    if (Array.isArray(value)) {
      return this.formatArray(value);
    }

    if (value instanceof Map) {
      return this.formatMap(value);
    }

    if (value instanceof JsonPackExtension) {
      return this.formatTag(value);
    }

    if (value instanceof JsonPackValue) {
      return this.formatSimpleValue(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.formatObject(value as Record<string, unknown>);
    }

    // Fallback for unknown types
    return String(value);
  }

  /**
   * Format a number to EDN representation.
   */
  private formatNumber(value: number): string {
    if (Number.isNaN(value)) return 'NaN';
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';
    if (Object.is(value, -0)) return '-0.0';
    
    // Check if it's an integer
    if (Number.isInteger(value)) {
      return value.toString();
    }
    
    // Floating point number
    return value.toString();
  }

  /**
   * Format a bigint to EDN representation.
   */
  private formatBigInt(value: bigint): string {
    return value.toString();
  }

  /**
   * Format a string to EDN text string representation.
   */
  private formatString(value: string): string {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r/g, '') // Remove carriage returns as per spec
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\u0008/g, '\\b') // backspace character
      .replace(/\f/g, '\\f');
    
    return `"${escaped}"`;
  }

  /**
   * Format a byte string (Uint8Array) to EDN representation.
   */
  private formatByteString(value: Uint8Array): string {
    // Convert to hex representation
    const hex = Array.from(value)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `h'${hex}'`;
  }

  /**
   * Format an array to EDN representation.
   */
  private formatArray(value: unknown[]): string {
    if (value.length === 0) return '[]';
    
    const items = value.map(item => this.formatValue(item));
    return `[${items.join(', ')}]`;
  }

  /**
   * Format a Map to EDN representation.
   */
  private formatMap(value: Map<unknown, unknown>): string {
    if (value.size === 0) return '{}';
    
    const entries: string[] = [];
    for (const [key, val] of value) {
      const keyStr = this.formatValue(key);
      const valStr = this.formatValue(val);
      entries.push(`${keyStr}: ${valStr}`);
    }
    
    return `{${entries.join(', ')}}`;
  }

  /**
   * Format a plain object to EDN representation.
   */
  private formatObject(value: Record<string, unknown>): string {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    
    const entries = keys.map(key => {
      const keyStr = this.formatString(key);
      const valStr = this.formatValue(value[key]);
      return `${keyStr}: ${valStr}`;
    });
    
    return `{${entries.join(', ')}}`;
  }

  /**
   * Format a CBOR tag to EDN representation.
   */
  private formatTag(value: JsonPackExtension<unknown>): string {
    const tagNum = value.tag;
    const content = this.formatValue(value.val);
    return `${tagNum}(${content})`;
  }

  /**
   * Format a CBOR simple value to EDN representation.
   */
  private formatSimpleValue(value: JsonPackValue<number>): string {
    const num = value.val;
    
    // Handle well-known simple values
    switch (num) {
      case 20: return 'false';
      case 21: return 'true';
      case 22: return 'null';
      case 23: return 'undefined';
      default:
        return `simple(${num})`;
    }
  }
}
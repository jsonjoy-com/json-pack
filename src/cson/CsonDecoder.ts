import {Reader} from '@jsonjoy.com/util/lib/buffers/Reader';
import {decodeUtf8} from '@jsonjoy.com/util/lib/buffers/utf8/decodeUtf8';
import {fromBase64Bin} from '@jsonjoy.com/base64/lib/fromBase64Bin';
import type {BinaryJsonDecoder, PackValue} from '../types';

const fromCharCode = String.fromCharCode;

/**
 * CSON (CoffeeScript Object Notation) decoder that parses directly from Uint8Array
 * Supports CSON-specific features like comments, unquoted keys, and flexible syntax
 */
export class CsonDecoder implements BinaryJsonDecoder {
  public reader = new Reader();

  public read(uint8: Uint8Array): unknown {
    this.reader.reset(uint8);
    return this.readAny();
  }

  public decode(uint8: Uint8Array): unknown {
    this.reader.reset(uint8);
    try {
      return this.readAny();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`CSON parsing error: ${errorMessage}`);
    }
  }

  public readAny(): unknown {
    this.skipWhitespaceAndComments();

    if (this.reader.x >= this.reader.uint8.length) {
      throw new Error('Unexpected end of input');
    }

    // Check if this looks like a bare object (no opening brace)
    if (this.looksLikeBareObject()) {
      return this.readObject(false, 0);
    }

    return this.readValue();
  }

  private looksLikeBareObject(): boolean {
    const saved = this.reader.x;
    try {
      // Look for key: value pattern
      this.skipWhitespaceAndComments();
      if (this.reader.x >= this.reader.uint8.length) return false;

      // Try to parse a key (either quoted or unquoted identifier)
      const uint8 = this.reader.uint8;
      let x = this.reader.x;
      let foundKey = false;

      // Check for quoted key
      if (uint8[x] === 0x22 /* " */ || uint8[x] === 0x27 /* ' */) {
        const quote = uint8[x];
        x++;
        while (x < uint8.length && uint8[x] !== quote) {
          if (uint8[x] === 0x5c /* \ */) x++; // Skip escaped chars
          x++;
        }
        if (x < uint8.length && uint8[x] === quote) {
          x++;
          foundKey = true;
        }
      } else {
        // Check for unquoted identifier key
        if (this.isIdentifierStart(uint8[x])) {
          x++;
          while (x < uint8.length && this.isIdentifierChar(uint8[x])) {
            x++;
          }
          foundKey = true;
        }
      }

      if (!foundKey) return false;

      this.reader.x = x;
      this.skipWhitespaceAndComments();
      return this.reader.x < this.reader.uint8.length && this.reader.uint8[this.reader.x] === 0x3a /* : */;
    } catch {
      return false;
    } finally {
      this.reader.x = saved;
    }
  }

  private readValue(): unknown {
    this.skipWhitespaceAndComments();

    if (this.reader.x >= this.reader.uint8.length) {
      throw new Error('Unexpected end of input');
    }

    const uint8 = this.reader.uint8;
    const ch = uint8[this.reader.x];

    switch (ch) {
      case 0x6e: // 'n'
        return this.readNull();
      case 0x74: // 't'
      case 0x66: // 'f'
        return this.readBoolean();
      case 0x22: // '"'
      case 0x27: // "'"
        return this.readString();
      case 0x5b: // '['
        return this.readArray();
      case 0x7b: // '{'
        return this.readObject(true, 0);
      case 0x2d: // '-'
      case 0x30: // '0'
      case 0x31: // '1'
      case 0x32: // '2'
      case 0x33: // '3'
      case 0x34: // '4'
      case 0x35: // '5'
      case 0x36: // '6'
      case 0x37: // '7'
      case 0x38: // '8'
      case 0x39: // '9'
        return this.readNumber();
      default:
        throw new Error(`Unexpected character '${fromCharCode(ch)}' at position ${this.reader.x}`);
    }
  }

  private readNull(): null {
    const uint8 = this.reader.uint8;
    const x = this.reader.x;
    if (
      x + 4 <= uint8.length &&
      uint8[x] === 0x6e && // 'n'
      uint8[x + 1] === 0x75 && // 'u'
      uint8[x + 2] === 0x6c && // 'l'
      uint8[x + 3] === 0x6c // 'l'
    ) {
      this.reader.x += 4;
      return null;
    }
    throw new Error(`Expected 'null' at position ${this.reader.x}`);
  }

  private readBoolean(): boolean {
    const uint8 = this.reader.uint8;
    const x = this.reader.x;

    if (
      x + 4 <= uint8.length &&
      uint8[x] === 0x74 && // 't'
      uint8[x + 1] === 0x72 && // 'r'
      uint8[x + 2] === 0x75 && // 'u'
      uint8[x + 3] === 0x65 // 'e'
    ) {
      this.reader.x += 4;
      return true;
    }

    if (
      x + 5 <= uint8.length &&
      uint8[x] === 0x66 && // 'f'
      uint8[x + 1] === 0x61 && // 'a'
      uint8[x + 2] === 0x6c && // 'l'
      uint8[x + 3] === 0x73 && // 's'
      uint8[x + 4] === 0x65 // 'e'
    ) {
      this.reader.x += 5;
      return false;
    }

    throw new Error(`Expected boolean at position ${this.reader.x}`);
  }

  private readNumber(): number {
    const uint8 = this.reader.uint8;
    const start = this.reader.x;
    let x = this.reader.x;

    // Handle negative sign
    if (uint8[x] === 0x2d /* - */) {
      x++;
    }

    // Parse integer part
    if (uint8[x] === 0x30 /* 0 */) {
      x++;
    } else if (uint8[x] >= 0x31 /* 1 */ && uint8[x] <= 0x39 /* 9 */) {
      x++;
      while (x < uint8.length && uint8[x] >= 0x30 /* 0 */ && uint8[x] <= 0x39 /* 9 */) {
        x++;
      }
    } else {
      throw new Error(`Invalid number at position ${this.reader.x}`);
    }

    // Parse decimal part
    if (x < uint8.length && uint8[x] === 0x2e /* . */) {
      x++;
      if (x >= uint8.length || uint8[x] < 0x30 /* 0 */ || uint8[x] > 0x39 /* 9 */) {
        throw new Error(`Invalid number at position ${this.reader.x}`);
      }
      while (x < uint8.length && uint8[x] >= 0x30 /* 0 */ && uint8[x] <= 0x39 /* 9 */) {
        x++;
      }
    }

    // Parse exponent part
    if (x < uint8.length && (uint8[x] === 0x65 /* e */ || uint8[x] === 0x45) /* E */) {
      x++;
      if (x < uint8.length && (uint8[x] === 0x2b /* + */ || uint8[x] === 0x2d) /* - */) {
        x++;
      }
      if (x >= uint8.length || uint8[x] < 0x30 /* 0 */ || uint8[x] > 0x39 /* 9 */) {
        throw new Error(`Invalid number at position ${this.reader.x}`);
      }
      while (x < uint8.length && uint8[x] >= 0x30 /* 0 */ && uint8[x] <= 0x39 /* 9 */) {
        x++;
      }
    }

    const numberStr = decodeUtf8(uint8, start, x - start);
    this.reader.x = x;
    return parseFloat(numberStr);
  }

  private readString(): string {
    const uint8 = this.reader.uint8;
    const quote = uint8[this.reader.x];
    this.reader.x++;

    // Handle triple-quoted multi-line strings
    if (this.reader.x < uint8.length - 1 && uint8[this.reader.x] === quote && uint8[this.reader.x + 1] === quote) {
      this.reader.x += 2; // Skip the next two quotes
      return this.readMultiLineString(quote);
    }

    const start = this.reader.x;
    let hasEscapes = false;

    while (this.reader.x < uint8.length && uint8[this.reader.x] !== quote) {
      if (uint8[this.reader.x] === 0x5c /* \ */) {
        hasEscapes = true;
        this.reader.x++; // Skip escape character
        if (this.reader.x >= uint8.length) {
          throw new Error('Unexpected end of string');
        }
      }
      this.reader.x++;
    }

    if (this.reader.x >= uint8.length) {
      throw new Error('Unterminated string');
    }

    let result = decodeUtf8(uint8, start, this.reader.x - start);
    this.reader.x++; // Skip closing quote

    if (hasEscapes) {
      result = this.unescapeString(result);
    }

    return result;
  }

  private readMultiLineString(quote: number): string {
    const uint8 = this.reader.uint8;
    const start = this.reader.x;

    while (this.reader.x < uint8.length - 2) {
      if (uint8[this.reader.x] === quote && uint8[this.reader.x + 1] === quote && uint8[this.reader.x + 2] === quote) {
        const result = decodeUtf8(uint8, start, this.reader.x - start);
        this.reader.x += 3;
        // Trim leading/trailing whitespace from each line
        return result
          .split('\n')
          .map((line) => line.trim())
          .join('\n')
          .trim();
      }
      this.reader.x++;
    }

    throw new Error('Unterminated multi-line string');
  }

  private unescapeString(str: string): string {
    return str.replace(/\\(.)/g, (match, char) => {
      switch (char) {
        case '"':
        case "'":
        case '\\':
        case '/':
          return char;
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'u':
          // Unicode escape should be handled more carefully, but this is a basic implementation
          return char;
        default:
          return char;
      }
    });
  }

  private readArray(): unknown[] {
    this.reader.x++; // Skip '['
    const result: unknown[] = [];

    this.skipWhitespaceAndComments();

    if (this.reader.x < this.reader.uint8.length && this.reader.uint8[this.reader.x] === 0x5d /* ] */) {
      this.reader.x++;
      return result;
    }

    while (this.reader.x < this.reader.uint8.length) {
      result.push(this.readValue());
      this.skipWhitespaceAndComments();

      if (this.reader.x >= this.reader.uint8.length) {
        throw new Error('Unterminated array');
      }

      if (this.reader.uint8[this.reader.x] === 0x5d /* ] */) {
        this.reader.x++;
        break;
      }

      // Skip optional comma
      if (this.reader.uint8[this.reader.x] === 0x2c /* , */) {
        this.reader.x++;
        this.skipWhitespaceAndComments();
      }

      // Check for closing bracket after optional comma
      if (this.reader.x < this.reader.uint8.length && this.reader.uint8[this.reader.x] === 0x5d /* ] */) {
        this.reader.x++;
        break;
      }
    }

    return result;
  }

  private readObject(expectBraces: boolean, baseIndent: number = 0): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (expectBraces) {
      this.reader.x++; // Skip '{'
      this.skipWhitespaceAndComments();

      if (this.reader.x < this.reader.uint8.length && this.reader.uint8[this.reader.x] === 0x7d /* } */) {
        this.reader.x++;
        return result;
      }
    } else {
      // For bare objects, we need to skip to the first indented key
      this.skipWhitespaceAndComments();
    }

    while (this.reader.x < this.reader.uint8.length) {
      this.skipWhitespaceAndComments();

      if (
        expectBraces &&
        this.reader.x < this.reader.uint8.length &&
        this.reader.uint8[this.reader.x] === 0x7d /* } */
      ) {
        this.reader.x++;
        break;
      }

      if (this.reader.x >= this.reader.uint8.length) {
        if (expectBraces) {
          throw new Error('Unterminated object');
        }
        break;
      }

      // For bare objects, check if we've reached a key at the base indentation level or lower
      if (!expectBraces && baseIndent > 0) {
        const currentIndent = this.getCurrentIndentation();
        if (currentIndent < baseIndent) {
          // We've reached a key at a lower indentation level, stop parsing this object
          break;
        }
      }

      // Parse key
      const key = this.readKey();

      this.skipWhitespaceAndComments();

      if (this.reader.x >= this.reader.uint8.length || this.reader.uint8[this.reader.x] !== 0x3a /* : */) {
        throw new Error(`Expected ':' after key at position ${this.reader.x}`);
      }

      this.reader.x++; // Skip ':'

      // Parse value
      const value = this.readObjectValue(baseIndent);
      result[key] = value;

      this.skipWhitespaceAndComments();

      if (
        expectBraces &&
        this.reader.x < this.reader.uint8.length &&
        this.reader.uint8[this.reader.x] === 0x7d /* } */
      ) {
        this.reader.x++;
        break;
      }

      // Skip optional comma or newline
      if (this.reader.x < this.reader.uint8.length && this.reader.uint8[this.reader.x] === 0x2c /* , */) {
        this.reader.x++;
      }
    }

    return result;
  }

  private readObjectValue(baseIndent: number = 0): unknown {
    // Don't skip whitespace here - we need it to detect nested objects
    if (this.reader.x >= this.reader.uint8.length) {
      throw new Error('Expected value');
    }

    // Check if this is a nested object without braces
    if (this.looksLikeNestedObject()) {
      // Skip to the next line where the nested object starts
      this.skipToNextIndentedLine();
      const nestedIndent = this.getCurrentIndentation();
      return this.readObject(false, nestedIndent);
    }

    // Only skip whitespace if it's not a nested object
    this.skipWhitespaceAndComments();
    return this.readValue();
  }

  private looksLikeNestedObject(): boolean {
    const saved = this.reader.x;
    try {
      const uint8 = this.reader.uint8;
      // First, skip any leading whitespace (but not newlines)
      let tempX = this.reader.x;
      while (tempX < uint8.length && (uint8[tempX] === 0x20 /* space */ || uint8[tempX] === 0x09) /* tab */) {
        tempX++;
      }

      // If we find a valid JSON value character, this is not a nested object
      if (tempX < uint8.length) {
        const ch = uint8[tempX];
        if (
          ch === 0x7b /* { */ ||
          ch === 0x5b /* [ */ ||
          ch === 0x22 /* " */ ||
          ch === 0x27 /* ' */ ||
          ch === 0x74 /* t */ ||
          ch === 0x66 /* f */ ||
          ch === 0x6e /* n */ ||
          (ch >= 0x30 /* 0 */ && ch <= 0x39) /* 9 */ ||
          ch === 0x2d /* - */
        ) {
          return false;
        }
      }

      // Look ahead to see if we have a key:value pattern after a newline
      tempX = this.reader.x;

      // Skip current line
      while (tempX < uint8.length && uint8[tempX] !== 0x0a /* \n */) {
        tempX++;
      }

      if (tempX >= uint8.length) {
        return false;
      }

      tempX++; // Skip newline

      // Skip whitespace and check for indented key
      const indent = this.countIndent(tempX);
      if (indent === 0) {
        return false;
      }

      tempX += indent;

      // Check for key pattern
      const start = tempX;
      while (tempX < uint8.length && this.isIdentifierChar(uint8[tempX])) {
        tempX++;
      }

      if (tempX === start) {
        return false;
      }

      while (tempX < uint8.length && this.isWhitespace(uint8[tempX]) && uint8[tempX] !== 0x0a /* \n */) {
        tempX++;
      }

      return tempX < uint8.length && uint8[tempX] === 0x3a /* : */;
    } catch {
      return false;
    } finally {
      this.reader.x = saved;
    }
  }

  private countIndent(pos: number): number {
    const uint8 = this.reader.uint8;
    let count = 0;
    while (pos < uint8.length && (uint8[pos] === 0x20 /* space */ || uint8[pos] === 0x09) /* tab */) {
      count++;
      pos++;
    }
    return count;
  }

  private readKey(): string {
    this.skipWhitespaceAndComments();

    if (this.reader.x >= this.reader.uint8.length) {
      throw new Error('Expected key');
    }

    const uint8 = this.reader.uint8;
    // Quoted key
    if (uint8[this.reader.x] === 0x22 /* " */ || uint8[this.reader.x] === 0x27 /* ' */) {
      return this.readString();
    }

    // Unquoted key (identifier)
    const start = this.reader.x;
    if (!this.isIdentifierStart(uint8[this.reader.x])) {
      throw new Error(`Invalid key character at position ${this.reader.x}`);
    }

    this.reader.x++;
    while (this.reader.x < uint8.length && this.isIdentifierChar(uint8[this.reader.x])) {
      this.reader.x++;
    }

    return decodeUtf8(uint8, start, this.reader.x - start);
  }

  private getCurrentIndentation(): number {
    const uint8 = this.reader.uint8;
    // Find the start of the current line
    let lineStart = this.reader.x;
    while (lineStart > 0 && uint8[lineStart - 1] !== 0x0a /* \n */) {
      lineStart--;
    }

    // Count indentation from start of line
    let indent = 0;
    let pos = lineStart;
    while (pos < uint8.length && (uint8[pos] === 0x20 /* space */ || uint8[pos] === 0x09) /* tab */) {
      indent++;
      pos++;
    }

    return indent;
  }

  private skipToNextIndentedLine(): void {
    const uint8 = this.reader.uint8;
    // Skip to next newline
    while (this.reader.x < uint8.length && uint8[this.reader.x] !== 0x0a /* \n */) {
      this.reader.x++;
    }

    if (this.reader.x < uint8.length && uint8[this.reader.x] === 0x0a /* \n */) {
      this.reader.x++; // Skip the newline
    }

    // Skip indentation to get to the actual key
    while (
      this.reader.x < uint8.length &&
      (uint8[this.reader.x] === 0x20 /* space */ || uint8[this.reader.x] === 0x09) /* tab */
    ) {
      this.reader.x++;
    }
  }

  private skipWhitespaceAndComments(): void {
    const uint8 = this.reader.uint8;
    while (this.reader.x < uint8.length) {
      const ch = uint8[this.reader.x];

      if (this.isWhitespace(ch)) {
        this.reader.x++;
      } else if (ch === 0x23 /* # */) {
        // Single-line comment
        this.skipToEndOfLine();
      } else {
        break;
      }
    }
  }

  private skipToEndOfLine(): void {
    const uint8 = this.reader.uint8;
    while (this.reader.x < uint8.length && uint8[this.reader.x] !== 0x0a /* \n */) {
      this.reader.x++;
    }
    if (this.reader.x < uint8.length && uint8[this.reader.x] === 0x0a /* \n */) {
      this.reader.x++;
    }
  }

  private isWhitespace(ch: number): boolean {
    return ch === 0x20 /* space */ || ch === 0x09 /* tab */ || ch === 0x0a /* \n */ || ch === 0x0d /* \r */;
  }

  private isIdentifierStart(ch: number): boolean {
    return (
      (ch >= 0x41 /* A */ && ch <= 0x5a) /* Z */ ||
      (ch >= 0x61 /* a */ && ch <= 0x7a) /* z */ ||
      ch === 0x5f /* _ */ ||
      ch === 0x24 /* $ */
    );
  }

  private isIdentifierChar(ch: number): boolean {
    return this.isIdentifierStart(ch) || (ch >= 0x30 /* 0 */ && ch <= 0x39) /* 9 */;
  }
}

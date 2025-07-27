/**
 * CSON (CoffeeScript Object Notation) parser implementation from scratch
 * Supports CSON-specific features like comments, unquoted keys, and flexible syntax
 */

export class CsonParser {
  private input: string = '';
  private pos: number = 0;
  private len: number = 0;

  parse(text: string): unknown {
    this.input = text;
    this.pos = 0;
    this.len = text.length;

    this.skipWhitespaceAndComments();

    if (this.pos >= this.len) {
      throw new Error('Unexpected end of input');
    }

    // Check if this looks like a bare object (no opening brace)
    if (this.looksLikeBareObject()) {
      return this.parseObject(false, 0);
    }

    return this.parseValue();
  }

  private looksLikeBareObject(): boolean {
    const saved = this.pos;
    try {
      // Look for key: value pattern
      this.skipWhitespaceAndComments();
      if (this.pos >= this.len) return false;

      // Try to parse a key (either quoted or unquoted identifier)
      const keyStart = this.pos;
      let foundKey = false;

      // Check for quoted key
      if (this.input[this.pos] === '"' || this.input[this.pos] === "'") {
        const quote = this.input[this.pos];
        this.pos++;
        while (this.pos < this.len && this.input[this.pos] !== quote) {
          if (this.input[this.pos] === '\\') this.pos++; // Skip escaped chars
          this.pos++;
        }
        if (this.pos < this.len && this.input[this.pos] === quote) {
          this.pos++;
          foundKey = true;
        }
      } else {
        // Check for unquoted identifier key
        if (/[a-zA-Z_$]/.test(this.input[this.pos])) {
          this.pos++;
          while (this.pos < this.len && /[a-zA-Z0-9_$]/.test(this.input[this.pos])) {
            this.pos++;
          }
          foundKey = true;
        }
      }

      if (!foundKey) return false;

      this.skipWhitespaceAndComments();
      return this.pos < this.len && this.input[this.pos] === ':';
    } catch {
      return false;
    } finally {
      this.pos = saved;
    }
  }

  private tryParseKey(): string | null {
    const saved = this.pos;
    try {
      this.skipWhitespaceAndComments();

      // Quoted key
      if (this.pos < this.len && (this.input[this.pos] === '"' || this.input[this.pos] === "'")) {
        return this.parseString();
      }

      // Unquoted key (identifier)
      const start = this.pos;
      while (this.pos < this.len) {
        const ch = this.input[this.pos];
        if (/[a-zA-Z_$][a-zA-Z0-9_$]*/.test(this.input.slice(start, this.pos + 1))) {
          this.pos++;
        } else {
          break;
        }
      }

      if (this.pos > start) {
        return this.input.slice(start, this.pos);
      }

      return null;
    } catch {
      this.pos = saved;
      return null;
    }
  }

  private parseValue(): unknown {
    this.skipWhitespaceAndComments();

    if (this.pos >= this.len) {
      throw new Error('Unexpected end of input');
    }

    const ch = this.input[this.pos];

    switch (ch) {
      case 'n':
        return this.parseNull();
      case 't':
      case 'f':
        return this.parseBoolean();
      case '"':
      case "'":
        return this.parseString();
      case '[':
        return this.parseArray();
      case '{':
        return this.parseObject(true, 0);
      case '-':
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        return this.parseNumber();
      default:
        throw new Error(`Unexpected character '${ch}' at position ${this.pos}`);
    }
  }

  private parseNull(): null {
    if (this.input.slice(this.pos, this.pos + 4) === 'null') {
      this.pos += 4;
      return null;
    }
    throw new Error(`Expected 'null' at position ${this.pos}`);
  }

  private parseBoolean(): boolean {
    if (this.input.slice(this.pos, this.pos + 4) === 'true') {
      this.pos += 4;
      return true;
    }
    if (this.input.slice(this.pos, this.pos + 5) === 'false') {
      this.pos += 5;
      return false;
    }
    throw new Error(`Expected boolean at position ${this.pos}`);
  }

  private parseNumber(): number {
    const start = this.pos;

    // Handle negative sign
    if (this.input[this.pos] === '-') {
      this.pos++;
    }

    // Parse integer part
    if (this.input[this.pos] === '0') {
      this.pos++;
    } else if (this.input[this.pos] >= '1' && this.input[this.pos] <= '9') {
      this.pos++;
      while (this.pos < this.len && this.input[this.pos] >= '0' && this.input[this.pos] <= '9') {
        this.pos++;
      }
    } else {
      throw new Error(`Invalid number at position ${this.pos}`);
    }

    // Parse decimal part
    if (this.pos < this.len && this.input[this.pos] === '.') {
      this.pos++;
      if (this.pos >= this.len || this.input[this.pos] < '0' || this.input[this.pos] > '9') {
        throw new Error(`Invalid number at position ${this.pos}`);
      }
      while (this.pos < this.len && this.input[this.pos] >= '0' && this.input[this.pos] <= '9') {
        this.pos++;
      }
    }

    // Parse exponent part
    if (this.pos < this.len && (this.input[this.pos] === 'e' || this.input[this.pos] === 'E')) {
      this.pos++;
      if (this.pos < this.len && (this.input[this.pos] === '+' || this.input[this.pos] === '-')) {
        this.pos++;
      }
      if (this.pos >= this.len || this.input[this.pos] < '0' || this.input[this.pos] > '9') {
        throw new Error(`Invalid number at position ${this.pos}`);
      }
      while (this.pos < this.len && this.input[this.pos] >= '0' && this.input[this.pos] <= '9') {
        this.pos++;
      }
    }

    const numberStr = this.input.slice(start, this.pos);
    return parseFloat(numberStr);
  }

  private parseString(): string {
    const quote = this.input[this.pos];
    this.pos++;

    // Handle triple-quoted multi-line strings
    if (this.pos < this.len - 1 && this.input[this.pos] === quote && this.input[this.pos + 1] === quote) {
      this.pos += 2; // Skip the next two quotes
      return this.parseMultiLineString(quote);
    }

    let result = '';
    while (this.pos < this.len && this.input[this.pos] !== quote) {
      if (this.input[this.pos] === '\\') {
        this.pos++;
        if (this.pos >= this.len) {
          throw new Error('Unexpected end of string');
        }

        const escaped = this.input[this.pos];
        switch (escaped) {
          case '"':
          case "'":
          case '\\':
          case '/':
            result += escaped;
            break;
          case 'b':
            result += '\b';
            break;
          case 'f':
            result += '\f';
            break;
          case 'n':
            result += '\n';
            break;
          case 'r':
            result += '\r';
            break;
          case 't':
            result += '\t';
            break;
          case 'u':
            // Unicode escape
            if (this.pos + 4 >= this.len) {
              throw new Error('Invalid unicode escape');
            }
            const hexStr = this.input.slice(this.pos + 1, this.pos + 5);
            result += String.fromCharCode(parseInt(hexStr, 16));
            this.pos += 4;
            break;
          default:
            result += escaped;
            break;
        }
      } else {
        result += this.input[this.pos];
      }
      this.pos++;
    }

    if (this.pos >= this.len) {
      throw new Error('Unterminated string');
    }

    this.pos++; // Skip closing quote
    return result;
  }

  private parseMultiLineString(quote: string): string {
    let result = '';
    const tripleQuote = quote + quote + quote;

    while (this.pos < this.len - 2) {
      if (this.input.slice(this.pos, this.pos + 3) === tripleQuote) {
        this.pos += 3;
        // Trim leading/trailing whitespace from each line
        return result
          .split('\n')
          .map((line) => line.trim())
          .join('\n')
          .trim();
      }
      result += this.input[this.pos];
      this.pos++;
    }

    throw new Error('Unterminated multi-line string');
  }

  private parseArray(): unknown[] {
    this.pos++; // Skip '['
    const result: unknown[] = [];

    this.skipWhitespaceAndComments();

    if (this.pos < this.len && this.input[this.pos] === ']') {
      this.pos++;
      return result;
    }

    while (this.pos < this.len) {
      result.push(this.parseValue());
      this.skipWhitespaceAndComments();

      if (this.pos >= this.len) {
        throw new Error('Unterminated array');
      }

      if (this.input[this.pos] === ']') {
        this.pos++;
        break;
      }

      // Skip optional comma
      if (this.input[this.pos] === ',') {
        this.pos++;
        this.skipWhitespaceAndComments();
      }

      // Check for closing bracket after optional comma
      if (this.pos < this.len && this.input[this.pos] === ']') {
        this.pos++;
        break;
      }
    }

    return result;
  }

  private parseObject(expectBraces: boolean, baseIndent: number = 0): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (expectBraces) {
      this.pos++; // Skip '{'
      this.skipWhitespaceAndComments();

      if (this.pos < this.len && this.input[this.pos] === '}') {
        this.pos++;
        return result;
      }
    } else {
      // For bare objects, we need to skip to the first indented key
      this.skipWhitespaceAndComments();
    }

    while (this.pos < this.len) {
      this.skipWhitespaceAndComments();

      if (expectBraces && this.pos < this.len && this.input[this.pos] === '}') {
        this.pos++;
        break;
      }

      if (this.pos >= this.len) {
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
      const key = this.parseKey();

      this.skipWhitespaceAndComments();

      if (this.pos >= this.len || this.input[this.pos] !== ':') {
        throw new Error(`Expected ':' after key at position ${this.pos}`);
      }

      this.pos++; // Skip ':'

      // Parse value
      const value = this.parseObjectValue(baseIndent);
      result[key] = value;

      this.skipWhitespaceAndComments();

      if (expectBraces && this.pos < this.len && this.input[this.pos] === '}') {
        this.pos++;
        break;
      }

      // Skip optional comma or newline
      if (this.pos < this.len && this.input[this.pos] === ',') {
        this.pos++;
      }
    }

    return result;
  }

  private parseObjectValue(baseIndent: number = 0): unknown {
    // Don't skip whitespace here - we need it to detect nested objects
    if (this.pos >= this.len) {
      throw new Error('Expected value');
    }

    // Check if this is a nested object without braces
    if (this.looksLikeNestedObject()) {
      // Skip to the next line where the nested object starts
      this.skipToNextIndentedLine();
      const nestedIndent = this.getCurrentIndentation();
      return this.parseObject(false, nestedIndent);
    }

    // Only skip whitespace if it's not a nested object
    this.skipWhitespaceAndComments();
    return this.parseValue();
  }

  private looksLikeNestedObject(): boolean {
    const saved = this.pos;
    try {
      // First, skip any leading whitespace (but not newlines)
      let tempPos = this.pos;
      while (tempPos < this.len && (this.input[tempPos] === ' ' || this.input[tempPos] === '\t')) {
        tempPos++;
      }

      // If we find a valid JSON value character, this is not a nested object
      if (tempPos < this.len) {
        const ch = this.input[tempPos];
        if (
          ch === '{' ||
          ch === '[' ||
          ch === '"' ||
          ch === "'" ||
          ch === 't' ||
          ch === 'f' ||
          ch === 'n' ||
          /[0-9-]/.test(ch)
        ) {
          return false;
        }
      }

      // Look ahead to see if we have a key:value pattern after a newline
      tempPos = this.pos;

      // Skip current line
      while (tempPos < this.len && this.input[tempPos] !== '\n') {
        tempPos++;
      }

      if (tempPos >= this.len) {
        return false;
      }

      tempPos++; // Skip newline

      // Skip whitespace and check for indented key
      const indent = this.countIndent(tempPos);
      if (indent === 0) {
        return false;
      }

      tempPos += indent;

      // Check for key pattern
      const start = tempPos;
      while (tempPos < this.len && /[a-zA-Z_$0-9]/.test(this.input[tempPos])) {
        tempPos++;
      }

      if (tempPos === start) {
        return false;
      }

      while (tempPos < this.len && /\s/.test(this.input[tempPos]) && this.input[tempPos] !== '\n') {
        tempPos++;
      }

      return tempPos < this.len && this.input[tempPos] === ':';
    } catch {
      return false;
    } finally {
      this.pos = saved;
    }
  }

  private countIndent(pos: number): number {
    let count = 0;
    while (pos < this.len && (this.input[pos] === ' ' || this.input[pos] === '\t')) {
      count++;
      pos++;
    }
    return count;
  }

  private parseKey(): string {
    this.skipWhitespaceAndComments();

    if (this.pos >= this.len) {
      throw new Error('Expected key');
    }

    // Quoted key
    if (this.input[this.pos] === '"' || this.input[this.pos] === "'") {
      return this.parseString();
    }

    // Unquoted key (identifier)
    const start = this.pos;
    if (!/[a-zA-Z_$]/.test(this.input[this.pos])) {
      throw new Error(`Invalid key character at position ${this.pos}`);
    }

    this.pos++;
    while (this.pos < this.len && /[a-zA-Z0-9_$]/.test(this.input[this.pos])) {
      this.pos++;
    }

    return this.input.slice(start, this.pos);
  }

  private getCurrentIndentation(): number {
    // Find the start of the current line
    let lineStart = this.pos;
    while (lineStart > 0 && this.input[lineStart - 1] !== '\n') {
      lineStart--;
    }

    // Count indentation from start of line
    let indent = 0;
    let pos = lineStart;
    while (pos < this.len && (this.input[pos] === ' ' || this.input[pos] === '\t')) {
      indent++;
      pos++;
    }

    return indent;
  }

  private skipToNextIndentedLine(): void {
    // Skip to next newline
    while (this.pos < this.len && this.input[this.pos] !== '\n') {
      this.pos++;
    }

    if (this.pos < this.len && this.input[this.pos] === '\n') {
      this.pos++; // Skip the newline
    }

    // Skip indentation to get to the actual key
    while (this.pos < this.len && (this.input[this.pos] === ' ' || this.input[this.pos] === '\t')) {
      this.pos++;
    }
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.len) {
      const ch = this.input[this.pos];

      if (/\s/.test(ch)) {
        this.pos++;
      } else if (ch === '#') {
        // Single-line comment
        this.skipToEndOfLine();
      } else {
        break;
      }
    }
  }

  private skipToEndOfLine(): void {
    while (this.pos < this.len && this.input[this.pos] !== '\n') {
      this.pos++;
    }
    if (this.pos < this.len && this.input[this.pos] === '\n') {
      this.pos++;
    }
  }
}

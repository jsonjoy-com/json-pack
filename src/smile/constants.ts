// Smile format constants based on specification v1.0.6

// Header constants
export const HEADER = {
  BYTE_0: 0x3a, // ASCII ':'
  BYTE_1: 0x29, // ASCII ')'
  BYTE_2: 0x0a, // ASCII '\n'
  VERSION_MASK: 0xf0, // Bits 4-7 for version
  VERSION_CURRENT: 0x00, // Current version
  RESERVED_BIT: 0x08, // Bit 3 reserved
  RAW_BINARY_ENABLED: 0x04, // Bit 2
  SHARED_STRING_VALUES: 0x02, // Bit 1
  SHARED_PROPERTY_NAMES: 0x01, // Bit 0
} as const;

// Token value ranges for value mode
export const VALUE_MODE = {
  // Short Shared Value String reference (0x01 - 0x1F)
  SHORT_SHARED_VALUE_MIN: 0x01,
  SHORT_SHARED_VALUE_MAX: 0x1f,

  // Simple literals, numbers (0x20 - 0x3F)
  EMPTY_STRING: 0x20,
  NULL: 0x21,
  FALSE: 0x22,
  TRUE: 0x23,
  INT_32: 0x24,
  INT_64: 0x25,
  BIG_INTEGER: 0x26,
  RESERVED_INT: 0x27,
  FLOAT_32: 0x28,
  FLOAT_64: 0x29,
  BIG_DECIMAL: 0x2a,
  RESERVED_FLOAT: 0x2b,

  // Tiny ASCII (0x40 - 0x5F)
  TINY_ASCII_MIN: 0x40,
  TINY_ASCII_MAX: 0x5f,

  // Short ASCII (0x60 - 0x7F)
  SHORT_ASCII_MIN: 0x60,
  SHORT_ASCII_MAX: 0x7f,

  // Tiny Unicode (0x80 - 0x9F)
  TINY_UNICODE_MIN: 0x80,
  TINY_UNICODE_MAX: 0x9f,

  // Short Unicode (0xA0 - 0xBF)
  SHORT_UNICODE_MIN: 0xa0,
  SHORT_UNICODE_MAX: 0xbf,

  // Small integers (0xC0 - 0xDF)
  SMALL_INT_MIN: 0xc0,
  SMALL_INT_MAX: 0xdf,

  // Misc / binary / text / structure markers
  LONG_ASCII_TEXT: 0xe0,
  LONG_UNICODE_TEXT: 0xe4,
  BINARY_7BIT: 0xe8,
  SHARED_STRING_LONG: 0xec,

  // Structural markers
  START_ARRAY: 0xf8,
  END_ARRAY: 0xf9,
  START_OBJECT: 0xfa,
  END_OBJECT: 0xfb, // Only in key mode

  // Special markers
  END_STRING_MARKER: 0xfc,
  BINARY_RAW: 0xfd,
  RESERVED_FE: 0xfe,
  END_CONTENT: 0xff,
} as const;

// Token value ranges for key mode
export const KEY_MODE = {
  // Empty string name
  EMPTY_STRING: 0x20,

  // Long shared key name reference (0x30 - 0x33)
  LONG_SHARED_MIN: 0x30,
  LONG_SHARED_MAX: 0x33,

  // Long Unicode name
  LONG_UNICODE_NAME: 0x34,

  // Short shared key name reference (0x40 - 0x7F)
  SHORT_SHARED_MIN: 0x40,
  SHORT_SHARED_MAX: 0x7f,

  // Short ASCII names (0x80 - 0xBF)
  SHORT_ASCII_MIN: 0x80,
  SHORT_ASCII_MAX: 0xbf,

  // Short Unicode names (0xC0 - 0xF7)
  SHORT_UNICODE_MIN: 0xc0,
  SHORT_UNICODE_MAX: 0xf7,

  // End object marker
  END_OBJECT: 0xfb,
} as const;

// Constants for shared string tables
export const SHARED = {
  MAX_REFERENCES: 1024,
  MAX_SHORT_REFERENCE: 31, // Indices 0-30 use short references (tokens 0x01-0x1F)
  MIN_LONG_REFERENCE: 31, // Indices 31+ use long references
  MAX_STRING_LENGTH: 64, // Only strings <= 64 bytes can be shared
  AVOIDED_REFERENCES: [0xfe, 0xff], // These must be avoided in long references
} as const;

// Encoding constants
export const ENCODING = {
  SMALL_INT_BIAS: 16, // Small integers are biased by 16 (-16 to +15)
  VINT_CONTINUATION_BIT: 0x80, // MSB set for all but last byte
  VINT_END_BIT: 0x80, // MSB set for last byte
  VINT_DATA_MASK: 0x7f, // 7 bits of data per byte
  SAFE_BINARY_MASK: 0x7f, // 7 bits used in safe binary encoding
} as const;

// Error messages
export const ERROR = {
  INVALID_HEADER: 'Invalid Smile header',
  UNEXPECTED_END: 'Unexpected end of input',
  INVALID_TOKEN: 'Invalid token',
  INVALID_REFERENCE: 'Invalid shared string reference',
  UNSUPPORTED_VERSION: 'Unsupported Smile format version',
  MALFORMED_VINT: 'Malformed variable-length integer',
  STRING_TOO_LONG: 'String too long for shared reference',
  INVALID_FLOAT: 'Invalid floating point encoding',
} as const;
export const enum MAJOR {
  UIN = 0b000,
  NIN = 0b001,
  BIN = 0b010,
  STR = 0b011,
  ARR = 0b100,
  MAP = 0b101,
  TAG = 0b110,
  TKN = 0b111,
}

export const enum MAJOR_OVERLAY {
  UIN = 0b000_00000,
  NIN = 0b001_00000,
  BIN = 0b010_00000,
  STR = 0b011_00000,
  ARR = 0b100_00000,
  MAP = 0b101_00000,
  TAG = 0b110_00000,
  TKN = 0b111_00000,
}

export const enum CONST {
  MINOR_MASK = 0b11111,
  MAX_UINT = 9007199254740991,
  END = 0xff,
}

export const enum ERROR {
  UNEXPECTED_MAJOR,
  UNEXPECTED_MINOR,
  UNEXPECTED_BIN_CHUNK_MAJOR,
  UNEXPECTED_BIN_CHUNK_MINOR,
  UNEXPECTED_STR_CHUNK_MAJOR,
  UNEXPECTED_STR_CHUNK_MINOR,
  UNEXPECTED_OBJ_KEY,
  UNEXPECTED_OBJ_BREAK,
  INVALID_SIZE,
  KEY_NOT_FOUND,
  INDEX_OUT_OF_BOUNDS,
  UNEXPECTED_STR_MAJOR,
}

// RFC 8746 CBOR Typed Array Tags
export const enum TYPED_ARRAY_TAG {
  // Unsigned integers - big endian
  UINT8 = 64,
  UINT16_BE = 65,
  UINT32_BE = 66,
  UINT64_BE = 67,
  // uint8 clamped arithmetic
  UINT8_CLAMPED = 68,
  // Unsigned integers - little endian
  UINT16_LE = 69,
  UINT32_LE = 70,
  UINT64_LE = 71,
  // Signed integers - big endian
  SINT8 = 72,
  SINT16_BE = 73,
  SINT32_BE = 74,
  SINT64_BE = 75,
  // Tag 76 is reserved
  // Signed integers - little endian
  SINT16_LE = 77,
  SINT32_LE = 78,
  SINT64_LE = 79,
  // IEEE 754 floats - big endian
  FLOAT16_BE = 80,
  FLOAT32_BE = 81,
  FLOAT64_BE = 82,
  FLOAT128_BE = 83,
  // IEEE 754 floats - little endian
  FLOAT16_LE = 84,
  FLOAT32_LE = 85,
  FLOAT64_LE = 86,
  FLOAT128_LE = 87,
}

// Additional array tags from RFC 8746
export const enum ARRAY_TAG {
  MULTI_DIM_ROW_MAJOR = 40,
  HOMOGENEOUS = 41,
  MULTI_DIM_COLUMN_MAJOR = 1040,
}

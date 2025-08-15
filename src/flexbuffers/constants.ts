// FlexBuffers type constants based on the specification
// https://raw.githubusercontent.com/google/flatbuffers/refs/heads/master/include/flatbuffers/flexbuffers.h

// Type flags - 6 bits for type, 2 bits for bit width
export const enum FlexBufferType {
  // Scalar types
  NULL = 0,
  INT = 1,
  UINT = 2,
  FLOAT = 3,
  // Deprecated, use UINT.
  // BOOL = 4,
  KEY = 5,
  STRING = 6,
  // Array types
  INDIRECT_INT = 7,
  INDIRECT_UINT = 8,
  INDIRECT_FLOAT = 9,
  MAP = 10,
  VECTOR = 11,
  // Typed array types
  VECTOR_INT = 12,
  VECTOR_UINT = 13,
  VECTOR_FLOAT = 14,
  VECTOR_KEY = 15,
  VECTOR_STRING = 16,
  // Fixed length vector types
  VECTOR_INT2 = 17,
  VECTOR_UINT2 = 18,
  VECTOR_FLOAT2 = 19,
  VECTOR_INT3 = 20,
  VECTOR_UINT3 = 21,
  VECTOR_FLOAT3 = 22,
  VECTOR_INT4 = 23,
  VECTOR_UINT4 = 24,
  VECTOR_FLOAT4 = 25,
  BLOB = 26,
  BOOL = 27,
}

// Bit width constants for the lower 2 bits
export const enum BitWidth {
  W8 = 0,   // 8-bit
  W16 = 1,  // 16-bit
  W32 = 2,  // 32-bit
  W64 = 3,  // 64-bit
}

// Helper functions for type manipulation
export const packType = (type: FlexBufferType, bitWidth: BitWidth): number => {
  return (type << 2) | bitWidth;
};

export const unpackType = (packed: number): FlexBufferType => {
  return (packed >> 2) as FlexBufferType;
};

export const unpackBitWidth = (packed: number): BitWidth => {
  return (packed & 3) as BitWidth;
};

export const bitWidthToByteSize = (bitWidth: BitWidth): number => {
  return 1 << bitWidth;
};

export const getNullBitWidth = (parentBitWidth: BitWidth): BitWidth => {
  return parentBitWidth;
};

export const getBoolBitWidth = (parentBitWidth: BitWidth): BitWidth => {
  return parentBitWidth;  
};

// Constants for alignment and limits
export const FLEXBUFFERS_MAX_BYTE_WIDTH = 8;
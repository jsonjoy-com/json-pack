export * from './types';
export * from './CborEncoderFast';
export * from './CborEncoder';
export * from './CborEncoderStable';
export * from './CborEncoderDag';
export * from './CborDecoderBase';
export * from './CborDecoder';
export * from './CborDecoderDag';

// Helper functions for creating RFC 8746 compliant structures
export function createMultiDimensionalArray(
  dimensions: number[], 
  elements: unknown, 
  rowMajor: boolean = true
): import('./CborEncoder').CborMultiDimensionalArray {
  return {
    __cbor_multi_dim__: true,
    dimensions,
    elements,
    rowMajor
  };
}

export function createHomogeneousArray(elements: unknown[]): import('./CborEncoder').CborHomogeneousArray {
  return {
    __cbor_homogeneous__: true,
    elements
  };
}

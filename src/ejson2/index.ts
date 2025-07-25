import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {EjsonEncoder, EjsonEncoderOptions} from './EjsonEncoder';
import {EjsonDecoder, EjsonDecoderOptions} from './EjsonDecoder';

export {EjsonEncoder, type EjsonEncoderOptions} from './EjsonEncoder';
export {EjsonDecoder, type EjsonDecoderOptions} from './EjsonDecoder';

// Create default instances for easier usage
export const createEjsonEncoder = (options?: EjsonEncoderOptions) => 
  new EjsonEncoder(new Writer(), options);

export const createEjsonDecoder = (options?: EjsonDecoderOptions) => 
  new EjsonDecoder(options);

// Re-export shared BSON value classes for convenience
export {
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
import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {EjsonEncoder, EjsonEncoderOptions} from './EjsonEncoder';
import {EjsonDecoder, EjsonDecoderOptions} from './EjsonDecoder';

export {EjsonEncoder, type EjsonEncoderOptions} from './EjsonEncoder';
export {EjsonDecoder, type EjsonDecoderOptions} from './EjsonDecoder';

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

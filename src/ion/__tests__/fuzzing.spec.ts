import {RandomJson} from '@jsonjoy.com/util/lib/json-random';
import {IonEncoderFast} from '../IonEncoderFast';
import {IonDecoder} from '../IonDecoder';

const encoder = new IonEncoderFast();
const decoder = new IonDecoder();

describe('fuzzing', () => {
  test('CborEncoderFast', () => {
    for (let i = 0; i < 2000; i++) {
      const value = JSON.parse(JSON.stringify(RandomJson.generate()));
      const encoded = encoder.encode(value);
      const decoded = decoder.decode(encoded);
      expect(decoded).toStrictEqual(value);
    }
  });
});

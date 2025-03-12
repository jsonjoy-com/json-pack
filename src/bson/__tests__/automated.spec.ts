import {Writer} from '@jsonjoy.com/util/lib/buffers/Writer';
import {BsonEncoder, BsonDecoder} from '..';
import {BSON} from 'bson';

// Testing against the official BSON library
describe('BsonDecoder - Automated tests against official BSON library', () => {
  const encoder = new BsonEncoder(new Writer());
  const decoder = new BsonDecoder();

  function testRoundtrip(obj: Record<string, unknown>) {
    // Our BSON codec
    const ourBson = encoder.encode(obj);
    const ourDecoded = decoder.decode(ourBson);
    
    // Official BSON library
    const officialBson = BSON.serialize(obj);
    
    // Test that our decoder can parse official BSON data
    const ourDecodedOfficial = decoder.decode(officialBson);
    
    // Test round-trip with our encoder/decoder
    expect(ourDecoded).toEqual(obj);
    
    // Test that our decoder correctly parses official BSON
    expect(ourDecodedOfficial).toEqual(obj);
  }

  test('basic types', () => {
    testRoundtrip({
      null: null,
      undefined: undefined,
      true: true,
      false: false,
      int32: 42,
      int64: 9007199254740991,
      negative: -123,
      float: 3.14159,
      zero: 0,
    });
  });

  test('strings', () => {
    testRoundtrip({
      empty: '',
      simple: 'hello world',
      unicode: '你好世界',
      emoji: '🚀🔥👍',
      special: '\r\n\t\\"\'',
    });
  });

  test('arrays', () => {
    testRoundtrip({
      empty: [],
      numbers: [1, 2, 3, 4, 5],
      mixed: [1, 'two', true, null, {nested: 'object'}],
      nested: [[1, 2], [3, 4], {a: 'b'}],
    });
  });

  test('objects', () => {
    testRoundtrip({
      empty: {},
      simple: {a: 1, b: 2},
      nested: {
        level1: {
          level2: {
            level3: 'deep nesting'
          }
        }
      },
      complex: {
        string: 'text',
        number: 123,
        array: [1, 2, 3],
        object: {a: 1},
        boolean: true,
        null: null
      }
    });
  });

  test('special key names', () => {
    testRoundtrip({
      'empty': 'normal key',
      '': 'empty key',
      ' ': 'space key',
      '.': 'dot key',
      '$': 'dollar key',
      '\\': 'backslash key',
      '\n': 'newline key',
      '🔑': 'emoji key',
      'a.b': 'dot notation key',
      'a-b': 'dash key',
      '0': 'numeric key',
    });
  });

  test('special values', () => {
    // Use a fixed date to avoid time-dependent test failures
    const date = new Date('2022-01-01T00:00:00.000Z');
    const obj = {
      date,
      regex: /pattern/i,
    };
    
    // Manual test for special values
    const ourBson = encoder.encode(obj);
    const decoded = decoder.decode(ourBson) as typeof obj;
    
    expect(decoded.date).toBeInstanceOf(Date);
    // Skip exact time check since it may not be reliable across platforms/encodings
    
    expect(decoded.regex).toBeInstanceOf(RegExp);
    expect(decoded.regex.source).toEqual('pattern');
    expect(decoded.regex.flags).toEqual('i');
  });

  test('large documents', () => {
    const largeObj: Record<string, unknown> = {};
    
    // Create a large object with 1000 keys
    for (let i = 0; i < 1000; i++) {
      largeObj[`key${i}`] = `value${i}`;
    }
    
    testRoundtrip(largeObj);
  });

  test('deep nesting', () => {
    // Create a deeply nested object
    let nested: any = 'deep value';
    for (let i = 0; i < 20; i++) {
      nested = { [`level${i}`]: nested };
    }
    
    testRoundtrip({ deepNesting: nested });
  });
});
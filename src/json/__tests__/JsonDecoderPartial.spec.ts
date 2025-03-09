import {JsonDecoderPartial} from '../JsonDecoderPartial';

const decoder = new JsonDecoderPartial();
const parse = (text: string) => {
  const data = Buffer.from(text, 'utf-8');
  decoder.reader.reset(data);
  const value = decoder.readAny();
  return value;
};

describe('array', () => {
  test('can parse valid array', () => {
    const value = parse('[1, 2, 3]');
    expect(value).toEqual([1, 2, 3]);
  });

  test('can parse array with missing closing brace', () => {
    const value = parse('[1, 2, 3 ');
    expect(value).toEqual([1, 2, 3]);
  });

  test('can parse array with missing closing brace - 2', () => {
    const value = parse('[1, 2, 3');
    expect(value).toEqual([1, 2, 3]);
  });

  test('can parse array with trailing comma', () => {
    const value = parse('[1, 2, ');
    expect(value).toEqual([1, 2]);
  });

  test('can parse array with trailing comma - 2', () => {
    const value = parse('[1, 2,');
    expect(value).toEqual([1, 2]);
  });

  test('can parse array with two trailing commas', () => {
    const value = parse('[true, "asdf",,');
    expect(value).toEqual([true, 'asdf']);
  });

  test('can parse array with double commas', () => {
    const value = parse('[true, "asdf",, 4]');
    expect(value).toEqual([true, 'asdf', 4]);
  });

  test('can parse array with triple commas', () => {
    const value = parse('[true, "asdf",, , 4]');
    expect(value).toEqual([true, 'asdf', 4]);
  });
});

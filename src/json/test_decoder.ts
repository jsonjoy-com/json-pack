import {JsonDecoder} from './JsonDecoder';

const decoder = new JsonDecoder();

const testCases = [
  '1.7976931348623157e+308',
  '1.7976931348623157E+308',
  '1.7976931348623157e308',
  '1.7976931348623157E308',
  '1e+308',
  '2e+308', // This should be Infinity
  '1.2345e+50',
  '1.2345e-50',
  '1.2345E-50',
  '5e-324', // Smallest positive number
  '4.9e-324',
  '2.2250738585072014e-308' // Smallest normal positive number
];

console.log('Testing JsonDecoder with scientific notation:');
testCases.forEach(testCase => {
  try {
    const data = Buffer.from(testCase, 'utf-8');
    decoder.reader.reset(data);
    const result = decoder.readAny();
    const expected = +testCase;
    console.log(`${testCase} -> ${result} (expected: ${expected}, match: ${result === expected})`);
  } catch (e: any) {
    console.log(`${testCase} -> ERROR: ${e.message}`);
  }
});

// Test in JSON context
console.log('\nTesting in JSON arrays and objects:');
const jsonTestCases = [
  `[1.7976931348623157e+308]`,
  `{"value": 1.7976931348623157e+308}`,
  `[1.7976931348623157e+308, 2e+308, 1.2345e-50]`
];

jsonTestCases.forEach(testCase => {
  try {
    const data = Buffer.from(testCase, 'utf-8');
    decoder.reader.reset(data);
    const result = decoder.readAny();
    const expected = JSON.parse(testCase);
    console.log(`${testCase} -> ${JSON.stringify(result)} (expected: ${JSON.stringify(expected)})`);
  } catch (e: any) {
    console.log(`${testCase} -> ERROR: ${e.message}`);
  }
});
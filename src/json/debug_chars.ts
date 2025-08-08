// Let's trace through the problematic number parsing
const testNum = '1.7976931348623157e+308';
const charCodes = [];
for (let i = 0; i < testNum.length; i++) {
  const char = testNum[i];
  const code = char.charCodeAt(0);
  charCodes.push({char, code, 
    isValidRange: code >= 45 && code <= 57,
    isPlus: code === 43,
    isE: code === 69,
    ise: code === 101,
    isValidChar: (code >= 45 && code <= 57) || code === 43 || code === 69 || code === 101
  });
}

console.log('Character analysis for:', testNum);
console.table(charCodes);

// Check where the issue occurs
const eIndex = testNum.indexOf('e+');
console.log('\nProblematic section:', testNum.substring(eIndex));
console.log('Characters at e+:', {
  e: testNum[eIndex], eCode: testNum.charCodeAt(eIndex),
  plus: testNum[eIndex + 1], plusCode: testNum.charCodeAt(eIndex + 1)
});
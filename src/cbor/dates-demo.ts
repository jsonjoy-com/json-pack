// Demo of CBOR date functionality
import {encode, decode} from './shared';

console.log('CBOR Date Tags Demo (RFC 8943)');
console.log('================================');

// Test with individual dates
const testDates = [
  new Date(1970, 0, 1),    // Epoch date
  new Date(1940, 9, 9),    // John Lennon birth - RFC 8943 example
  new Date(1980, 11, 8),   // John Lennon death - RFC 8943 example
  new Date(2023, 4, 15),   // Modern date
  new Date(1969, 11, 31),  // Before epoch
];

console.log('\n1. Individual Date Encoding/Decoding:');
testDates.forEach((date, index) => {
  const encoded = encode(date);
  const decoded = decode(encoded) as Date;
  
  console.log(`  Date ${index + 1}:`);
  console.log(`    Original: ${date.toDateString()}`);
  console.log(`    Encoded size: ${encoded.length} bytes`);
  console.log(`    Decoded: ${decoded.toDateString()}`);
  console.log(`    Match: ${date.toDateString() === decoded.toDateString()}`);
  console.log('');
});

// Test with complex object
const person = {
  name: 'John Lennon',
  birth: new Date(1940, 9, 9),
  death: new Date(1980, 11, 8),
  albums: [
    { name: 'Imagine', released: new Date(1971, 8, 9) },
    { name: 'Double Fantasy', released: new Date(1980, 10, 17) }
  ],
  metadata: {
    created: new Date(),
    tags: ['musician', 'songwriter', 'peace activist']
  }
};

console.log('2. Complex Object with Nested Dates:');
console.log('   Original object:');
console.log(`     Name: ${person.name}`);
console.log(`     Birth: ${person.birth.toDateString()}`);
console.log(`     Death: ${person.death.toDateString()}`);
console.log(`     Albums: ${person.albums.length}`);

const encodedPerson = encode(person);
const decodedPerson = decode(encodedPerson) as typeof person;

console.log(`   Encoded size: ${encodedPerson.length} bytes`);
console.log('   Decoded object:');
console.log(`     Name: ${decodedPerson.name}`);
console.log(`     Birth: ${decodedPerson.birth.toDateString()}`);
console.log(`     Death: ${decodedPerson.death.toDateString()}`);
console.log(`     Albums: ${decodedPerson.albums.length}`);
console.log(`     First album: ${decodedPerson.albums[0].name} (${decodedPerson.albums[0].released.toDateString()})`);

console.log('\n3. Verification:');
console.log(`   Name match: ${person.name === decodedPerson.name}`);
console.log(`   Birth match: ${person.birth.toDateString() === decodedPerson.birth.toDateString()}`);
console.log(`   Death match: ${person.death.toDateString() === decodedPerson.death.toDateString()}`);
console.log(`   Albums match: ${person.albums.length === decodedPerson.albums.length}`);

console.log('\nDemo completed successfully! 🎉');
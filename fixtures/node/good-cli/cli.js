const command = process.argv[2];
if (command === 'test' || command === 'demo') {
  console.log(`good-cli ${command} ok`);
  process.exit(0);
}
console.log('usage: node cli.js test|demo');

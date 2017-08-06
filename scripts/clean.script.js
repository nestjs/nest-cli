require('ts-node/register');
const cleanModule = require('./lib/clean');

console.log('Start to clean...');
cleanModule.Clean.execute(process.argv)
  .then(() => {
    console.log('Succeed to clean');
  })
  .catch(error => {
    console.log('Failed to clean with error\n', error);
  });
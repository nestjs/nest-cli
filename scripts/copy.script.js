require('ts-node/register');
const copyModule = require('./lib/copy');

console.log('Start to copy...');
copyModule.Copy.execute(process.argv)
  .then(() => {
    console.log('Succeed to copy');
  })
  .catch(error => {
    console.log('Failed to copy with error\n', error);
  });

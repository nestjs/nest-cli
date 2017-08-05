import {Copy} from './lib/copy';

console.log('Start to copy...');
Copy.execute(process.argv)
  .then(() => {
    console.log('Succeed to copy');
  })
  .catch(error => {
    console.log('Failed to copy with error\n', error);
  });

import {Clean} from './lib/clean';

console.log('Start to clean...');
Clean.execute(process.argv)
  .then(() => {
    console.log('Succeed to clean');
  })
  .catch(error => {
    console.log('Failed to clean with error\n', error);
  });
module.exports = (program) => {
  program
    .command('new')
    .alias('n')
    .argument('[name]', 'The NestJS application name.')
    .argument('[description]', 'The NestJS application description.')
    .argument('[version]', 'The NesJS application version.')
    .argument('[author]', 'The NestJS application author.')
    .option('--dry-run', 'allow to test changes before execute command.')
    .action(require('../actions/new'));
};

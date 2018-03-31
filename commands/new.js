module.exports = (program) => {
  program
    .command('new')
    .alias('n')
    .argument('<name>', 'The NestJS application name.')
    .option('--dry-run', 'allow to test changes before execute command.')
    .action(require('../actions/new'));
};

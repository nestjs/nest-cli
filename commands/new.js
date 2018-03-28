module.exports = (program) => {
  program
    .command('new')
    .alias('n')
    .argument('<directory>', 'directory where Nestjs application will be created')
    .option('--dry-run', 'allow to test changes before execute command')
    .action(require('../actions/new'));
};

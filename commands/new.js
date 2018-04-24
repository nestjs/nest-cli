module.exports = (program) => {
  program
    .command('new')
    .alias('n')
    .argument('[name]', 'The Nest application name.')
    .argument('[description]', 'The Nest application description.')
    .argument('[version]', 'The Nest application version.')
    .argument('[author]', 'The Nest application author.')
    .option('--dry-run', 'allow to test changes before execute command.')
    .action(require('../actions/new'));
};

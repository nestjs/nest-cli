module.exports = (program) => {
  program
    .command('info', 'Display Nest CLI information.')
    .alias('i')
    .action(require('../actions/info'));
};

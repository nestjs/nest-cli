module.exports = (program) => {
  program
    .command('info', 'Display Nest CLI information.')
    .action(require('../actions/info'));
};

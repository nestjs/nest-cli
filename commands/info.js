module.exports = (program) => {
  program
    .command('info', 'Display Nest CLI details')
    .alias('i')
    .action(require('../actions/info'));
};

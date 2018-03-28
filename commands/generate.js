module.exports = (program) => {
  program
    .command('generate')
    .alias('g')
    .argument('<schematic>', 'Nestjs framework asset type')
    .argument('<name>', 'Asset name or path')
    .argument('[path]', 'Path to generate the asset')
    .option('--dry-run', 'allow to test changes before execute command')
    .action(require('../actions/generate'));
};

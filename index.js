#!/usr/bin/env node
const configurationLoader = require('./bin/configuration/configuration.loader').ConfigurationLoader;
async function bootstrap () {
  const program = require('caporal');
  program
    .version(require('./package.json').version)
    .help('Nest.js CLI');
  require('./bin/create/index')(program);
  require('./bin/serve/index')(program);
  require('./bin/info/index')(program);
  require('./bin/generate/index')(program);
  require('./bin/update/index')(program);
  try {
    await configurationLoader.load();
  } catch (error) {
    process.stderr.write('[ WARN ] - Can\'t execute generate and serve commands since a project is not initialized\n');
    process.exit(1);
  }
  program.parse(process.argv);
}
return bootstrap();

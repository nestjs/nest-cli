#!/usr/bin/env node
const configurationLoader = require('./bin/configuration/configuration.loader').ConfigurationLoader;
async function bootstrap () {
  const program = require('caporal');
  program
    .version(require('./package.json').version)
    .help('Nest.js CLI');
  require('./bin/create/command')(program);
  require('./bin/serve/command')(program);
  require('./bin/info/command')(program);
  require('./bin/generate/command')(program);
  require('./bin/update/command')(program);
  try {
    await configurationLoader.load();
  } catch (error) {
    process.stderr.write('[ WARN ] - Can\'t execute generate and serve commands since a project is not initialized\n');
  } finally {
    program.parse(process.argv);
  }
}
return bootstrap();

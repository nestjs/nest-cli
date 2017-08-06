#!/usr/bin/env node
const packageJson = require('./package.json');
const cli = require('./bin/nest-cli.application');
cli.NestCliApplication.run(packageJson.version);
#!/usr/bin/env node
const VERSION = require('./package.json').version;
require('./bin/index').NestCliApplication.start(VERSION);

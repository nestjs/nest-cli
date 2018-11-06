#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander = require("commander");
const commands_1 = require("../commands");
const bootstrap = () => {
    const program = commander;
    program.version(require('../package.json').version);
    commands_1.CommandLoader.load(program);
    commander.parse(process.argv);
};
bootstrap();
